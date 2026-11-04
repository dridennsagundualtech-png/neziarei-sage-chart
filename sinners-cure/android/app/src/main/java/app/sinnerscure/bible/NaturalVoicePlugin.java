package app.sinnerscure.bible;

import android.content.res.AssetManager;
import android.media.AudioAttributes;
import android.media.AudioFormat;
import android.media.AudioTrack;
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.k2fsa.sherpa.onnx.GeneratedAudio;
import com.k2fsa.sherpa.onnx.OfflineTts;
import com.k2fsa.sherpa.onnx.OfflineTtsConfig;
import com.k2fsa.sherpa.onnx.OfflineTtsModelConfig;
import com.k2fsa.sherpa.onnx.OfflineTtsSupertonicModelConfig;
import com.k2fsa.sherpa.onnx.OfflineTtsVitsModelConfig;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

/**
 * Offline neural read-aloud voices (sherpa-onnx), bundled in assets/voices/ by the CI build:
 *   alan/        Piper "en_GB-alan-medium" (voice "alan": male, UK)
 *   supertonic/  Supertonic 3 (voices "grace" = style F1, female, and "gabriel" = style M5, male;
 *                natural and about ten times faster than Kokoro on a phone)
 *   espeak-ng-data/  English pronunciation data for Piper
 *
 * speak({ chunks, voice, speed }) generates each chunk (about one sentence) on one thread while
 * another plays the audio. Playback starts only once enough audio is buffered for the measured
 * speed of this phone (see readyToStart), so a long sentence after a short one does not leave a
 * gap. While preparing it sends "loading" events { tag, done } (share of the text made, 0-1); while
 * playing it sends "progress" events { tag, chunk, pos, dur } (chunk index, seconds into
 * it, its length) for read-along. Resolves with { completed, rtf, underruns, startMs } when the
 * audio ends or is stopped;
 * rtf = seconds of work per second of speech on this phone (below 1 keeps up).
 * prefetch({ chunks, voice, speed }) generates audio ahead (e.g. the next Rosary prayer) into a
 * small cache that speak() uses.
 *
 * Do not use OfflineTts.generateWithCallback from Java: its native code looks up the callback's
 * method by the Kotlin-only signature invoke([F)Ljava/lang/Integer;, which a Java lambda does not
 * have, and leaves the NoSuchMethodError pending, which makes ART abort the app.
 */
@CapacitorPlugin(name = "NaturalVoice")
public class NaturalVoicePlugin extends Plugin {
    private static final String TAG = "NaturalVoice";
    private static final String ESPEAK_VERSION = "en-1";
    private static final Piece END = new Piece(-1, new float[0]);
    /**
     * Safety limit on the buffer (seconds of audio) we wait for before speaking. The app waits
     * ("Loading voice…") until the reading can play with no lags; this only stops a slow phone
     * from waiting forever on a very long chapter.
     */
    private static final double MAX_LEAD = 240.0;
    /** Cache limit, in samples (about three minutes of speech). */
    private static final long CACHE_SAMPLES = 24000L * 180;

    private final ExecutorService generator = Executors.newSingleThreadExecutor();
    private final Object lock = new Object();
    private volatile int session = 0;
    private volatile int prefetchGen = 0;
    private OfflineTts tts;
    private String loadedEngine;
    private AudioTrack track;
    private final LinkedHashMap<String, float[]> cache = new LinkedHashMap<>(32, 0.75f, true);
    private long cachedSamples = 0;

    /** Audio for one chunk. */
    private static final class Piece {
        final int idx;
        final float[] samples;

        Piece(int idx, float[] samples) {
            this.idx = idx;
            this.samples = samples;
        }
    }

    /** Where a chunk sits in the audio sent to the speaker. */
    private static final class Segment {
        final int idx;
        final long startFrame;
        final long frames;

        Segment(int idx, long startFrame, long frames) {
            this.idx = idx;
            this.startFrame = startFrame;
            this.frames = frames;
        }
    }

    /** Voice name to engine ("alan" = Piper; "grace" / "gabriel" = Supertonic styles). */
    private static String engineOf(String voice) {
        return "alan".equals(voice) ? "alan" : "supertonic";
    }

    private static int sidOf(String voice) {
        return "gabriel".equals(voice) ? 9 : 0; // Supertonic: 0-4 = F1-F5, 5-9 = M1-M5
    }

    /** Supertonic's natural pace is 1.05; the app's speeds are relative to normal = 1. */
    private static float engineSpeed(String voice, float speed) {
        return "alan".equals(voice) ? speed : speed * 1.05f;
    }

    /** One speak() call, shared by the generator and the player. */
    private static final class Job {
        final int id;
        final String tag;
        final int[] lens; // characters per chunk
        final int totalChars;
        volatile int doneCount = 0; // chunks generated so far
        volatile long chunkStartNs = System.nanoTime(); // when the chunk now generating began
        final BlockingQueue<Piece> queue = new LinkedBlockingQueue<>();
        final List<Segment> segments = new CopyOnWriteArrayList<>();
        volatile int doneChars = 0;
        volatile double audioSec = 0; // all audio produced so far
        volatile double bufferedSec = 0; // produced but not yet handed to the speaker
        volatile double workSec = 0; // time spent generating (not counting cache hits)
        volatile double workAudioSec = 0; // audio produced by that work
        volatile boolean genDone = false;
        final long startNs = System.nanoTime();

        Job(int id, String tag, List<String> chunks) {
            this.id = id;
            this.tag = tag;
            lens = new int[chunks.size()];
            int sum = 0;
            for (int i = 0; i < lens.length; i++) sum += (lens[i] = chunks.get(i).length());
            totalChars = Math.max(1, sum);
        }

        synchronized void addBuffered(double sec) {
            bufferedSec += sec;
        }

        double rtf() {
            return workAudioSec > 0 ? workSec / workAudioSec : 0;
        }
    }

    private boolean hasAsset(String dir, String name) {
        try {
            String[] list = getContext().getAssets().list(dir);
            return list != null && Arrays.asList(list).contains(name);
        } catch (IOException e) {
            return false;
        }
    }

    @PluginMethod
    public void available(PluginCall call) {
        JSObject r = new JSObject();
        boolean st = hasAsset("voices/supertonic", "vocoder.int8.onnx");
        r.put("alan", hasAsset("voices/alan", "model.onnx"));
        r.put("grace", st);
        r.put("gabriel", st);
        call.resolve(r);
    }

    /** Loads a voice ahead of time so the first sentence starts sooner. */
    @PluginMethod
    public void prepare(PluginCall call) {
        final String voice = call.getString("voice", "alan");
        generator.execute(() -> {
            try {
                ensure(voice);
                call.resolve();
            } catch (Throwable e) {
                call.reject(String.valueOf(e.getMessage()));
            }
        });
    }

    @PluginMethod
    public void stop(PluginCall call) {
        session++;
        haltTrack();
        call.resolve();
    }

    private static List<String> chunksOf(PluginCall call) throws Exception {
        List<String> chunks = new ArrayList<>();
        JSArray arr = call.getArray("chunks");
        if (arr != null) for (Object o : arr.toList()) chunks.add(String.valueOf(o));
        return chunks;
    }

    private static String key(String voice, float speed, String text) {
        return voice + "|" + speed + "|" + text;
    }

    private float[] cacheGet(String k) {
        synchronized (cache) {
            return cache.get(k);
        }
    }

    private void cachePut(String k, float[] s) {
        synchronized (cache) {
            if (cache.containsKey(k)) return;
            cache.put(k, s);
            cachedSamples += s.length;
            Iterator<Map.Entry<String, float[]>> it = cache.entrySet().iterator();
            while (cachedSamples > CACHE_SAMPLES && it.hasNext()) {
                Map.Entry<String, float[]> e = it.next();
                if (e.getKey().equals(k)) continue;
                cachedSamples -= e.getValue().length;
                it.remove();
            }
        }
    }

    /** Generates audio ahead into the cache (e.g. the next prayer). A newer prefetch replaces it. */
    @PluginMethod
    public void prefetch(PluginCall call) {
        final String voice = call.getString("voice", "alan");
        final float speed = call.getFloat("speed", 1.0f);
        final List<String> chunks;
        try {
            chunks = chunksOf(call);
        } catch (Exception e) {
            call.reject("Bad chunks");
            return;
        }
        final int my = ++prefetchGen;
        call.resolve();
        generator.execute(() -> {
            try {
                OfflineTts engine = ensure(voice);
                int sid = sidOf(voice);
                float es = engineSpeed(voice, speed);
                for (String text : chunks) {
                    if (my != prefetchGen) return;
                    if (text.trim().isEmpty()) continue;
                    String k = key(voice, speed, text);
                    if (cacheGet(k) != null) continue;
                    GeneratedAudio a = engine.generate(text, sid, es);
                    if (a != null && a.getSamples().length > 0) cachePut(k, a.getSamples());
                }
            } catch (Throwable e) {
                Log.w(TAG, "prefetch", e);
            }
        });
    }

    @PluginMethod
    public void speak(final PluginCall call) {
        final String voice = call.getString("voice", "alan");
        final float speed = call.getFloat("speed", 1.0f);
        final List<String> chunks;
        try {
            chunks = chunksOf(call);
        } catch (Exception e) {
            call.reject("Bad chunks");
            return;
        }
        final Job job = new Job(++session, call.getString("tag", ""), chunks);
        haltTrack();

        generator.execute(() -> {
            if (job.id != session) {
                finish(call, job, false, 0);
                return;
            }
            OfflineTts engine;
            try {
                engine = ensure(voice);
            } catch (Throwable e) {
                Log.e(TAG, "load failed", e);
                call.reject("Voice could not load: " + e.getMessage());
                return;
            }
            final int sid = sidOf(voice);
            final float es = engineSpeed(voice, speed);
            final int rate = engine.sampleRate();
            startPlayer(call, job, rate, voice);
            try {
                for (int idx = 0; idx < chunks.size(); idx++) {
                    String text = chunks.get(idx);
                    if (job.id != session) break;
                    job.chunkStartNs = System.nanoTime();
                    if (text.trim().isEmpty()) {
                        job.doneCount++;
                        continue;
                    }
                    String k = key(voice, speed, text);
                    float[] samples = cacheGet(k);
                    if (samples == null) {
                        long t0 = System.nanoTime();
                        GeneratedAudio a = engine.generate(text, sid, es);
                        samples = a != null ? a.getSamples() : null;
                        if (samples != null && samples.length > 0) {
                            job.workSec += (System.nanoTime() - t0) / 1e9;
                            job.workAudioSec += samples.length / (double) rate;
                            cachePut(k, samples);
                        }
                    }
                    job.doneChars += text.length();
                    job.doneCount++;
                    if (job.id != session) break;
                    if (samples != null && samples.length > 0) {
                        double sec = samples.length / (double) rate;
                        job.audioSec += sec;
                        job.addBuffered(sec);
                        job.queue.offer(new Piece(idx, samples));
                    }
                }
            } catch (Throwable e) {
                Log.e(TAG, "generate failed", e);
            }
            job.genDone = true;
            job.queue.offer(END);
        });
    }

    /** Speed measured on the last job, per voice, used before a new job has its own measure. */
    private static final Map<String, Double> lastRtf = new java.util.concurrent.ConcurrentHashMap<>();

    /**
     * Start speaking as soon as the rest can be generated before it is needed: estimate each
     * remaining chunk's length from its characters and this phone's measured speed (rtf), and
     * check no chunk would be ready later than its turn to play (capped at MAX_LEAD seconds of
     * buffered audio).
     */
    private static boolean readyToStart(Job job, String voice) {
        if (job.genDone) return true;
        int done = job.doneCount;
        if (job.audioSec <= 0 || done == 0) return false;
        double rtf = job.rtf();
        if (rtf <= 0) rtf = lastRtf.containsKey(voice) ? lastRtf.get(voice) : 0;
        if (rtf <= 0) return true;
        if (job.bufferedSec >= MAX_LEAD) return true;
        double secPerChar = job.audioSec / Math.max(1, job.doneChars);
        double inProgress = (System.nanoTime() - job.chunkStartNs) / 1e9;
        double play = job.bufferedSec; // seconds of speech ready to play from now
        double gen = 0; // seconds from now until each remaining chunk is ready
        for (int j = done; j < job.lens.length; j++) {
            double d = job.lens[j] * secPerChar;
            double work = d * rtf;
            if (j == done) work = Math.max(0, work - inProgress);
            gen += work;
            if (gen * 1.15 > play) return false; // 15% margin for estimate error
            play += d;
        }
        return true;
    }

    private void startPlayer(PluginCall call, Job job, int rate, String voice) {
        new Thread(() -> {
            AudioTrack t;
            try {
                int min = AudioTrack.getMinBufferSize(rate, AudioFormat.CHANNEL_OUT_MONO, AudioFormat.ENCODING_PCM_FLOAT);
                t = new AudioTrack.Builder()
                    .setAudioAttributes(new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                        .build())
                    .setAudioFormat(new AudioFormat.Builder()
                        .setEncoding(AudioFormat.ENCODING_PCM_FLOAT)
                        .setSampleRate(rate)
                        .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                        .build())
                    .setBufferSizeInBytes(Math.max(min, rate * 4 / 2))
                    .setTransferMode(AudioTrack.MODE_STREAM)
                    .build();
            } catch (Throwable e) {
                Log.e(TAG, "audio output failed", e);
                session++;
                call.reject("Audio output failed: " + e.getMessage());
                return;
            }
            synchronized (lock) {
                track = t;
            }
            long written = 0;
            long startMs = 0;
            Thread reporter = null;
            try {
                long lastReport = 0;
                while (job.id == session && !readyToStart(job, voice)) {
                    long now = System.nanoTime();
                    if (now - lastReport > 250_000_000L) {
                        JSObject e = new JSObject();
                        e.put("tag", job.tag);
                        e.put("done", job.doneChars / (double) job.totalChars);
                        notifyListeners("loading", e);
                        lastReport = now;
                    }
                    Thread.sleep(40);
                }
                startMs = (System.nanoTime() - job.startNs) / 1_000_000;
                t.play();
                reporter = startReporter(job, t, rate);
                while (job.id == session) {
                    Piece piece = job.queue.poll(200, TimeUnit.MILLISECONDS);
                    if (piece == null) continue;
                    if (piece == END) break;
                    float[] s = piece.samples;
                    job.addBuffered(-s.length / (double) rate);
                    job.segments.add(new Segment(piece.idx, written, s.length));
                    int off = 0;
                    while (off < s.length && job.id == session) {
                        int n = t.write(s, off, s.length - off, AudioTrack.WRITE_BLOCKING);
                        if (n <= 0) break;
                        off += n;
                    }
                    written += off;
                }
                // Let the last buffered audio play out.
                while (job.id == session && t.getPlaybackHeadPosition() < written) Thread.sleep(40);
            } catch (Throwable e) {
                Log.w(TAG, "playback", e);
            }
            if (reporter != null) reporter.interrupt();
            int underruns = 0;
            try {
                underruns = t.getUnderrunCount();
            } catch (Throwable ignored) {
            }
            synchronized (lock) {
                if (track == t) track = null;
            }
            try {
                t.stop();
            } catch (Exception ignored) {
            }
            t.release();
            if (job.rtf() > 0) lastRtf.put(voice, job.rtf());
            Log.i(TAG, "rtf=" + job.rtf() + " start=" + startMs + "ms underruns=" + underruns);
            JSObject r = new JSObject();
            r.put("completed", job.id == session);
            r.put("rtf", job.rtf());
            r.put("underruns", underruns);
            r.put("startMs", startMs);
            call.resolve(r);
        }, "NaturalVoicePlayer").start();
    }

    /** Tells the app which chunk is playing and how far into it, about ten times a second. */
    private Thread startReporter(Job job, AudioTrack t, int rate) {
        Thread th = new Thread(() -> {
            int lastIdx = -2;
            long lastMs = -1;
            try {
                while (job.id == session && !Thread.currentThread().isInterrupted()) {
                    long head = t.getPlaybackHeadPosition() & 0xffffffffL;
                    Segment cur = null;
                    for (Segment g : job.segments) {
                        if (head >= g.startFrame && head < g.startFrame + g.frames) {
                            cur = g;
                            break;
                        }
                    }
                    if (cur != null) {
                        long posMs = (head - cur.startFrame) * 1000L / rate;
                        if (cur.idx != lastIdx || Math.abs(posMs - lastMs) >= 60) {
                            JSObject e = new JSObject();
                            e.put("tag", job.tag);
                            e.put("chunk", cur.idx);
                            e.put("pos", posMs / 1000.0);
                            e.put("dur", cur.frames / (double) rate);
                            notifyListeners("progress", e);
                            lastIdx = cur.idx;
                            lastMs = posMs;
                        }
                    }
                    Thread.sleep(90);
                }
            } catch (InterruptedException ignored) {
            } catch (Throwable e) {
                Log.w(TAG, "progress", e);
            }
        }, "NaturalVoiceProgress");
        th.start();
        return th;
    }

    private void finish(PluginCall call, Job job, boolean completed, long startMs) {
        JSObject r = new JSObject();
        r.put("completed", completed);
        r.put("rtf", job.rtf());
        r.put("underruns", 0);
        r.put("startMs", startMs);
        call.resolve(r);
    }

    private void haltTrack() {
        synchronized (lock) {
            if (track != null) {
                try {
                    track.pause();
                    track.flush();
                } catch (Exception ignored) {
                }
            }
        }
    }

    /** Runs on the generator thread only. Keeps one engine in memory at a time. */
    private OfflineTts ensure(String voice) throws IOException {
        String engine = engineOf(voice);
        if (tts != null && engine.equals(loadedEngine)) return tts;
        if (tts != null) {
            tts.release();
            tts = null;
            loadedEngine = null;
        }
        OfflineTtsModelConfig model = new OfflineTtsModelConfig();
        int cores = Runtime.getRuntime().availableProcessors();
        model.setNumThreads(Math.max(1, Math.min(4, cores)));
        if ("supertonic".equals(engine)) {
            String d = "voices/supertonic/";
            OfflineTtsSupertonicModelConfig st = new OfflineTtsSupertonicModelConfig();
            st.setDurationPredictor(d + "duration_predictor.int8.onnx");
            st.setTextEncoder(d + "text_encoder.int8.onnx");
            st.setVectorEstimator(d + "vector_estimator.int8.onnx");
            st.setVocoder(d + "vocoder.int8.onnx");
            st.setTtsJson(d + "tts.json");
            st.setUnicodeIndexer(d + "unicode_indexer.bin");
            st.setVoiceStyle(d + "voice.bin");
            model.setSupertonic(st);
        } else {
            OfflineTtsVitsModelConfig v = new OfflineTtsVitsModelConfig();
            v.setModel("voices/alan/model.onnx");
            v.setTokens("voices/alan/tokens.txt");
            v.setDataDir(copyEspeak());
            model.setVits(v);
        }
        OfflineTtsConfig config = new OfflineTtsConfig();
        config.setModel(model);
        config.setMaxNumSentences(1);
        tts = new OfflineTts(getContext().getAssets(), config);
        loadedEngine = engine;
        return tts;
    }

    /** espeak-ng reads from real files, so copy its data out of the APK once. */
    private String copyEspeak() throws IOException {
        File root = new File(getContext().getFilesDir(), "espeak-ng-data");
        File marker = new File(root, ".version-" + ESPEAK_VERSION);
        if (!marker.exists()) {
            copyAssetDir(getContext().getAssets(), "voices/espeak-ng-data", root);
            //noinspection ResultOfMethodCallIgnored
            marker.createNewFile();
        }
        return root.getAbsolutePath();
    }

    private static void copyAssetDir(AssetManager am, String from, File to) throws IOException {
        String[] items = am.list(from);
        if (items == null || items.length == 0) {
            // A file.
            File parent = to.getParentFile();
            if (parent != null) //noinspection ResultOfMethodCallIgnored
                parent.mkdirs();
            try (InputStream in = am.open(from); OutputStream out = new FileOutputStream(to)) {
                byte[] buf = new byte[16384];
                int n;
                while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
            }
            return;
        }
        //noinspection ResultOfMethodCallIgnored
        to.mkdirs();
        for (String item : items) copyAssetDir(am, from + "/" + item, new File(to, item));
    }
}

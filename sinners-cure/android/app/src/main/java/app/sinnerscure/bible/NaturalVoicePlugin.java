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
import com.k2fsa.sherpa.onnx.OfflineTts;
import com.k2fsa.sherpa.onnx.OfflineTtsConfig;
import com.k2fsa.sherpa.onnx.OfflineTtsKokoroModelConfig;
import com.k2fsa.sherpa.onnx.OfflineTtsModelConfig;
import com.k2fsa.sherpa.onnx.OfflineTtsVitsModelConfig;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

/**
 * Offline neural read-aloud voices (sherpa-onnx), bundled in assets/voices/ by the CI build:
 *   alan/  Piper "en_GB-alan-medium" (male, UK; fast on any phone)
 *   bella/ Kokoro "af_bella" (female, US; most natural, needs a fast phone)
 *   espeak-ng-data/  shared English pronunciation data
 * speak({ chunks, voice, speed }) generates each chunk on one thread while another plays the
 * audio, so the next sentence is ready by the time the current one ends. Resolves when the
 * audio has finished or was stopped ({ completed }).
 */
@CapacitorPlugin(name = "NaturalVoice")
public class NaturalVoicePlugin extends Plugin {
    private static final String TAG = "NaturalVoice";
    private static final String ESPEAK_VERSION = "en-1";
    private static final float[] END = new float[0];

    private final ExecutorService generator = Executors.newSingleThreadExecutor();
    private final Object lock = new Object();
    private volatile int session = 0;
    private OfflineTts tts;
    private String loadedVoice;
    private AudioTrack track;

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
        r.put("alan", hasAsset("voices/alan", "model.onnx"));
        r.put("bella", hasAsset("voices/bella", "model.int8.onnx"));
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

    @PluginMethod
    public void speak(final PluginCall call) {
        final String voice = call.getString("voice", "alan");
        final float speed = call.getFloat("speed", 1.0f);
        final List<String> chunks = new ArrayList<>();
        try {
            JSArray arr = call.getArray("chunks");
            if (arr != null) for (Object o : arr.toList()) chunks.add(String.valueOf(o));
        } catch (Exception e) {
            call.reject("Bad chunks");
            return;
        }
        final int my = ++session;
        haltTrack();
        final BlockingQueue<float[]> queue = new LinkedBlockingQueue<>();

        generator.execute(() -> {
            if (my != session) {
                finish(call, false);
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
            final int sid = "bella".equals(voice) ? 1 : 0;
            startPlayer(call, my, queue, engine.sampleRate());
            try {
                for (String text : chunks) {
                    if (my != session) break;
                    if (text.trim().isEmpty()) continue;
                    engine.generateWithCallback(text, sid, speed, samples -> {
                        if (my != session) return 0;
                        queue.offer(samples.clone());
                        return 1;
                    });
                }
            } catch (Throwable e) {
                Log.e(TAG, "generate failed", e);
            }
            queue.offer(END);
        });
    }

    private void startPlayer(PluginCall call, int my, BlockingQueue<float[]> queue, int rate) {
        new Thread(() -> {
            int min = AudioTrack.getMinBufferSize(rate, AudioFormat.CHANNEL_OUT_MONO, AudioFormat.ENCODING_PCM_FLOAT);
            AudioTrack t = new AudioTrack.Builder()
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
            synchronized (lock) {
                track = t;
            }
            long written = 0;
            try {
                t.play();
                while (my == session) {
                    float[] s = queue.poll(200, TimeUnit.MILLISECONDS);
                    if (s == null) continue;
                    if (s == END) break;
                    int off = 0;
                    while (off < s.length && my == session) {
                        int n = t.write(s, off, s.length - off, AudioTrack.WRITE_BLOCKING);
                        if (n <= 0) break;
                        off += n;
                    }
                    written += off;
                }
                // Let the last buffered audio play out.
                while (my == session && t.getPlaybackHeadPosition() < written) Thread.sleep(40);
            } catch (Exception e) {
                Log.w(TAG, "playback", e);
            } finally {
                synchronized (lock) {
                    if (track == t) track = null;
                }
                try {
                    t.stop();
                } catch (Exception ignored) {
                }
                t.release();
            }
            finish(call, my == session);
        }, "NaturalVoicePlayer").start();
    }

    private void finish(PluginCall call, boolean completed) {
        JSObject r = new JSObject();
        r.put("completed", completed);
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

    /** Runs on the generator thread only. Keeps one voice in memory at a time. */
    private OfflineTts ensure(String voice) throws IOException {
        if (tts != null && voice.equals(loadedVoice)) return tts;
        if (tts != null) {
            tts.release();
            tts = null;
            loadedVoice = null;
        }
        String dataDir = copyEspeak();
        OfflineTtsModelConfig model = new OfflineTtsModelConfig();
        int cores = Runtime.getRuntime().availableProcessors();
        if ("bella".equals(voice)) {
            OfflineTtsKokoroModelConfig k = new OfflineTtsKokoroModelConfig();
            k.setModel("voices/bella/model.int8.onnx");
            k.setVoices("voices/bella/voices.bin");
            k.setTokens("voices/bella/tokens.txt");
            k.setDataDir(dataDir);
            model.setKokoro(k);
            model.setNumThreads(Math.max(1, Math.min(4, cores - 1)));
        } else {
            OfflineTtsVitsModelConfig v = new OfflineTtsVitsModelConfig();
            v.setModel("voices/alan/model.onnx");
            v.setTokens("voices/alan/tokens.txt");
            v.setDataDir(dataDir);
            model.setVits(v);
            model.setNumThreads(Math.max(1, Math.min(2, cores)));
        }
        OfflineTtsConfig config = new OfflineTtsConfig();
        config.setModel(model);
        config.setMaxNumSentences(1);
        tts = new OfflineTts(getContext().getAssets(), config);
        loadedVoice = voice;
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

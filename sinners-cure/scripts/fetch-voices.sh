#!/usr/bin/env bash
# Downloads the offline read-aloud voice engine (sherpa-onnx AAR) and the neural voices into
# the Android project. Run before building the APK (the CI workflow does this).
#   alan            = Piper en_GB-alan-medium (male, UK)          -> assets/voices/alan
#   grace / gabriel = Supertonic 3 int8, styles F1 / M5 (one model) -> assets/voices/supertonic
# Piper's espeak-ng pronunciation data is trimmed to English only.
set -euo pipefail
cd "$(dirname "$0")/.."

SHERPA=1.13.8
APP=android/app
VOICES=$APP/src/main/assets/voices
MODELS=https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models

mkdir -p "$APP/libs"
curl -fsSL --retry 3 -o "$APP/libs/sherpa-onnx.aar" \
  "https://github.com/k2-fsa/sherpa-onnx/releases/download/v$SHERPA/sherpa-onnx-$SHERPA.aar"

tmp=$(mktemp -d)
curl -fsSL --retry 3 "$MODELS/vits-piper-en_GB-alan-medium.tar.bz2" | tar xj -C "$tmp"
curl -fsSL --retry 3 "$MODELS/sherpa-onnx-supertonic-3-tts-int8-2026-05-11.tar.bz2" | tar xj -C "$tmp"

rm -rf "$VOICES"
mkdir -p "$VOICES/alan" "$VOICES/supertonic"
cp "$tmp/vits-piper-en_GB-alan-medium/en_GB-alan-medium.onnx" "$VOICES/alan/model.onnx"
cp "$tmp/vits-piper-en_GB-alan-medium/tokens.txt" "$VOICES/alan/tokens.txt"
ST="$tmp/sherpa-onnx-supertonic-3-tts-int8-2026-05-11"
for f in duration_predictor.int8.onnx text_encoder.int8.onnx vector_estimator.int8.onnx \
  vocoder.int8.onnx tts.json unicode_indexer.bin voice.bin LICENSE; do
  cp "$ST/$f" "$VOICES/supertonic/$f"
done
cp -r "$tmp/vits-piper-en_GB-alan-medium/espeak-ng-data" "$VOICES/espeak-ng-data"
find "$VOICES/espeak-ng-data" -maxdepth 1 -name '*_dict' ! -name en_dict -delete
rm -rf "$tmp"

unzip -l "$APP/libs/sherpa-onnx.aar" | grep -q "jni/arm64-v8a/libsherpa-onnx-jni.so"
du -sh "$APP/libs/sherpa-onnx.aar" "$VOICES"/*

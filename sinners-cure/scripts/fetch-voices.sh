#!/usr/bin/env bash
# Downloads the offline read-aloud voice engine (sherpa-onnx AAR) and the two neural voices
# into the Android project. Run before building the APK (the CI workflow does this).
#   alan  = Piper en_GB-alan-medium (male, UK)      -> assets/voices/alan
#   bella = Kokoro v0.19 int8, speaker af_bella     -> assets/voices/bella
# The shared espeak-ng pronunciation data is trimmed to English only.
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
curl -fsSL --retry 3 "$MODELS/kokoro-int8-en-v0_19.tar.bz2" | tar xj -C "$tmp"

rm -rf "$VOICES"
mkdir -p "$VOICES/alan" "$VOICES/bella"
cp "$tmp/vits-piper-en_GB-alan-medium/en_GB-alan-medium.onnx" "$VOICES/alan/model.onnx"
cp "$tmp/vits-piper-en_GB-alan-medium/tokens.txt" "$VOICES/alan/tokens.txt"
cp "$tmp/kokoro-int8-en-v0_19/model.int8.onnx" "$VOICES/bella/model.int8.onnx"
cp "$tmp/kokoro-int8-en-v0_19/voices.bin" "$VOICES/bella/voices.bin"
cp "$tmp/kokoro-int8-en-v0_19/tokens.txt" "$VOICES/bella/tokens.txt"
cp -r "$tmp/kokoro-int8-en-v0_19/espeak-ng-data" "$VOICES/espeak-ng-data"
find "$VOICES/espeak-ng-data" -maxdepth 1 -name '*_dict' ! -name en_dict -delete
rm -rf "$tmp"

unzip -l "$APP/libs/sherpa-onnx.aar" | grep -q "jni/arm64-v8a/libsherpa-onnx-jni.so"
du -sh "$APP/libs/sherpa-onnx.aar" "$VOICES"/*

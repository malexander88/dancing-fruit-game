#!/bin/sh
# Rebuilds index.html from src/ and the embedded music file.
cd "$(dirname "$0")"
{ printf '<script>window.__MUSIC_B64="'; base64 -w0 music/electrodoodle-kevin-macleod-ccby4.mp3; printf '";</script>\n'; } > src/00_music.part
{ sed '/<canvas id="c"><\/canvas>/r src/00_music.part' src/01_head.html; for f in src/0[2-7]*.js; do cat "$f"; done; } > index.html

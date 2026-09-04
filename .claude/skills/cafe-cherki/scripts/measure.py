"""Derive an EDL trim from measured speech in a rendered clip.

usage: python3 measure.py clip.mp4 [more.mp4 ...]
prints: <file> <start> <dur>   (0.30 s pre-roll before the first word, 0.50 s after the last)
Requires faster-whisper (preinstalled in the Higgsfield sandbox). Uses the `small` model:
`base` mis-hears accents.
"""
import sys
from faster_whisper import WhisperModel

PRE, POST = 0.30, 0.50
model = WhisperModel("small", compute_type="int8")
for path in sys.argv[1:]:
    segments, _ = model.transcribe(path, word_timestamps=True)
    words = [w for s in segments for w in s.words]
    if not words:
        print(f"{path} NO_SPEECH")
        continue
    start = max(0.0, words[0].start - PRE)
    end = words[-1].end + POST
    text = " ".join(w.word.strip() for w in words)
    print(f"{path} {start:.2f} {end - start:.2f}   # {text}")

---
name: cafe-cherki
description: Production pipeline for the Café Cherki claymation Reels series on Higgsfield. Use for any episode, teaser, still, voice line, clip, or assembly under content/cafe-cherki — it carries every locked ID, model rule and hard-won constraint so nothing is re-learned at credit cost.
---

# Café Cherki production skill

Everything learned building Episode 1 and the Episode 2 teaser. Read this before touching
a prompt. The series bible, voice bible and asset manifests under `content/cafe-cherki/`
are the source of truth for IDs; this file is the method.

## Non-negotiables

- **The script is the script.** Use the owner's exact lines. Accent goes in through the
  performance tag and eye-dialect only. Flag a line that will not work; never rewrite it.
- **No voice cloning of real people.** Preset voices only, locked per character.
- **DripMap overlay on every frame**, built from `public/logo-dark.jpg`, never redrawn.
- **Every episode:** cold open → 2 s ident with the bumper sting → story → end card.
- **Report only real URLs.** A clip that has not rendered has no link. Never invent a CDN
  URL. Read the `result_url` back from `jobs_wait` and paste that.
- **One correct path.** No fallback chains inside a prompt. If a model fails a shot twice
  in the same way, change the shot or the model, do not re-roll a third time.

## Order of operations (per shot with dialogue)

1. Voice line first. Generate, then **transcribe it** (faster-whisper `small`, word
   timestamps) before spending a video credit. A take that transcribes wrong is wrong.
2. Pad the audio: ~1.0 s lead, small tail. Cut the clip to audio length + ~2 s.
   Dead air makes Wan invent mouth movement.
3. Still. `nano_banana_pro`, 9:16, character sheet(s) as `image_references`, set plate
   too when there is one. Owner approves the still before video.
4. Video from the approved still with the audio as `audio_references`.
5. Measure speech in the rendered clip and derive the trim (0.30 s pre-roll, 0.50 s tail).
6. Assemble with `scripts/build.sh`. Overlay last. Upload, confirm, give the link.

Silent shots skip 1, 2 and 4's audio; Kling supplies foley.

## Model rules

| Model | Use | Rules |
|---|---|---|
| `nano_banana_pro` | all stills and character sheets | pass sheets via `image_references`; 9:16 for shots, 16:9 for sheets |
| `wan2_7` | dialogue clips | one `audio_references`; 720p; lip-syncs the **dominant** face only, so frame the speaker as the subject. 429 rate limits: submit 1–2 at a time |
| `seedance_2_5` | dialogue clips when Wan fails sync | `mode: "omni_reference"` with the still as `start_image`. "omni_reference" is a mode, not a media role |
| `kling3_0` | silent / foley shots | its own audio cannot be directed. When the sound has to do something specific (engine cutting out), replace the clip audio with a `mirelo_text_to_audio` effect |
| `seed_audio` | most voices | bracketed tag at the front; **cannot speak French**; a comma becomes a pause; needs a sigh/yawn to reach minimum length on short lines (trim it in ffmpeg after); sometimes leaks tag words into speech |
| `text2speech_v2` variant `elevenlabs` | native-accent voices, any French line | drops the final word on short lines: pad with a trailing break and verify |
| `sonilo_music` | bumper only (locked, never re-scored) | |
| `mirelo_text_to_audio` | SFX | |

Always add `declined_preset_id: 24bae836-2c4a-48e0-89b6-49fcc0b21612` on video prompts.

## Prompt rules that cost credits to learn

- Say **"no duplicate people"**. Never "exactly one person": it deletes characters the
  scene needs.
- The image filter refuses "snatch / steal / grab / rob" together with a masked rider.
  Describe postures and objects ("bag held from the top", "rider leaning forward").
- Video models cannot stage a hand-to-hand grab from a moving vehicle. Cut around it:
  handover → rider → reaction → rider with object. The audience does the action.
- Enumerate props every time (six spotlights, five mirror stalks, fox tail). Anything not
  named drops out.
- A tilt or pan that leaves the approved framing reveals whatever the model invents there.
  Keep the camera on what the still shows.
- Costume changes must be re-sheeted. A new top means a new character sheet, not a prompt
  note.
- Static set elements (corkboard, sign) float in video unless the prompt says "wall-mounted,
  static, does not move".

## Audio rules

- Short lines: no internal punctuation, "one breath, no pause between the words".
- Pitch-shift a shared preset to make a second character (Liam = Callum at −2 semitones,
  duration preserved). Never reuse a preset flat for two characters.
- Reusing an old, failed or very short take as `audio_references` fails the video job.
  Regenerate.
- Bumper levels: sting −14 LUFS, bed −20 LUFS. Dialogue clips normalise to −16 LUFS.

## Sandbox rules (`sandbox_exec`)

- It is discarded ~10 s after a call unless a `background: true` job holds the 15-minute
  lease. Long builds run in the background; poll `build.log`.
- **Never run two builds against the same directory at once.**
- `-nostdin` on every ffmpeg call inside a `while read` loop, or ffmpeg eats the loop.
- No `bc`; use awk.
- Accented characters in drawtext go through `textfile=`; inline `é` breaks escaping.
- Files get in via CDN `curl` inside the sandbox. Files get out by calling `media_upload`
  **first**, then `curl -X PUT --upload-file` from the sandbox, then `media_confirm` after
  HTTP 200. The local environment can also PUT to the upload URL but cannot read the CDN.
- Faster-whisper `small` beats `base` on accents. Use `small`.
- Fonts live under `/usr/share/fonts/truetype/higgsfield/` (Montserrat, Metropolis). Find them with `fc-list`.

## Assembly

`scripts/build.sh` reads `edl.txt` rows of `file start dur kind` (kind = `clip` or `sfx`,
where `sfx` replaces the clip's audio with `sfx<row>.mp3`), normalises every segment to
1080x1920 / 30 fps / −16 LUFS with 60 ms / 80 ms edge fades, appends the ident tail with
its subline from `sub.txt`, concatenates, burns the overlay, and writes `final.mp4` with
faststart. `scripts/measure.py` produces the trims from a rendered clip.

Never adjust a trim by eye. Re-measure.

## Delivery

Two files per episode: the full-quality master and a ≤16 MB mobile encode. Owner downloads
from the CDN link. Commit the manifests (`HIGGSFIELD_ASSETS.md`, episode file) with every
new locked ID, noting superseded IDs rather than deleting them.

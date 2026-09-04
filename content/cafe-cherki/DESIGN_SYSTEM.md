# Café Cherki — Design System

The visual rules that make every still, clip, card and post read as one show. The series
bible says what the show is; this says what it looks like. Anything not here is not locked.

## 1. Look

**Hyperreal claymation.** Plasticine skin with fingerprints and tool marks, real-fabric
costumes with visible weave, glass eyes with a wet highlight, hair sculpted in strands.
Realistic proportions, never chibi. Sets are miniatures: tilt-shift depth, slightly
oversized textures, practical lamps as the light source. Motion has a 12 fps stop-motion
feel even when rendered at 30.

Reference for the look is the locked Cherki sheet `66f3e55f…`. Every new character sheet
is generated with it as the style reference so the clay, lighting and layout match.

## 2. Frame

| Item | Spec |
|---|---|
| Delivery | 1080 × 1920, 9:16, 30 fps, H.264, −16 LUFS dialogue |
| Character sheets | 16:9, four views: front, three-quarter, back, head close-up, warm off-white studio |
| Safe zones | top 250 px (IG header), right 130 px (action rail), bottom 420 px (caption) |
| Overlay | DripMap lockup 400 px wide at (48, 252), 4 px soft shadow, every frame |
| Dialogue framing | the speaker is the dominant face. A second character sits smaller and behind |
| Captions | bottom third above the caption zone, Montserrat SemiBold, cream `#F3EAD8` on `#2B1E16` at 80 % |

## 3. Colour

| Token | Hex | Where |
|---|---|---|
| Matcha | `#7BA05B` | Café Cherki interior accents, ident, Saka Matcha neon |
| Matcha deep | `#3F5A32` | shadows on matcha, end card ground |
| Cream | `#F3EAD8` | caption text, Café Cherki walls, Cherki's knit |
| Coffee dark | `#2B1E16` | caption box, Nan's woodwork, night exteriors |
| Nan's rose | `#C98A8A` | Nan's wallpaper, doilies, biscuit tins |
| Volt | `#C8F542` | DripMap mark only. Never used in sets or costumes |
| Foden orange | `#FF6A1F` | e-moto rims, Cherki's shades. The two rivals share it |

Manchester scenes are cool and wet: sodium orange lamps on blue-grey brick. London scenes
are warmer and cleaner: white stone, glass, gold light on water. Café Cherki is the only
interior lit flat and bright; every other shop is warm and low.

## 4. Typography

- **Ident:** clay letterforms, hand-sculpted, "CAFÉ CHERKI" with the accent as a whisk.
- **On-screen text (cards, sublines):** Montserrat SemiBold, all caps for headings, title
  case for lines. White or cream only.
- **End card:** "NEXT TIME AT / CAFÉ CHERKI" then three question lines, then
  "Follow @dripmap.space". 10–14 s.
- **Shop signage in-world:** each shop has its own sign style (Nan's: hand-painted gold
  serif on black; Saka Matcha: green neon script; Rooney's: red plastic letters).

## 5. Character rules

- **No kits.** Streetwear identity per character, listed in the bible. A costume change is
  a new sheet.
- **Faces by traits**, pushed hyperreal. Two or three signature cues per character that
  read in a two-second cut.
- **Ages read younger than real** unless the joke is age (Rooney, Becks).
- Locked sheets live in `HIGGSFIELD_ASSETS.md`. The contact sheet below is the visual index.

### Contact sheet

Media `f12a77f2-552e-4374-a573-500f45fb4d89` — every locked puppet, head crop over full
body, name underneath (2080 × 3630). Regenerate it in the sandbox with
`contact-sheet/make.py` whenever a sheet is locked or superseded; the script's table is the
list of source sheet IDs. The image lives on Higgsfield, not in the repo.

## 6. Sets

| Set | Palette | Signature detail |
|---|---|---|
| Café Cherki, Ancoats | cream, matcha, pale oak | one whisk on a stand, no menu, "Matchas only" |
| Nan's, Withington | rose, coffee dark, brass | doilies, two-bar fire, corkboard, biscuit tin |
| Nan's, London | same as above, quieter, one light on | lace curtains, the bell that doesn't ring |
| Wet Manchester street | blue-grey brick, sodium orange | rain, reflections, railway arch |
| London night | white stone, gold on water | Tower Bridge, Big Ben, red bus |
| Becks's penthouse | white stone, glass, black | one long counter, Big Ben through the glass |

## 7. Sound

Locked bumper (French house, 3 s sting on the ident, 10 s bed under montages). Foley over
music. No trend sounds. Voices per the voice bible; every voice is a preset, never a clone.

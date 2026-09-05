# Café Cherki — Voice Bible

Voices carry this series. The clay faces are caricatures; the voices are where the
audience recognises who's who and where the jokes land. Every voice here is an
**original character voice built from research into how the real player talks**, then
pushed to an exaggerated version, or deliberately twisted against type where that's
funnier.

## Rule: the script is the script

Dialogue in the episode files is the owner's wording. Accent goes in through the
performance tag and light eye-dialect spelling only; never add or rewrite lines to make
a voice "work". If a line needs changing, flag it, don't change it.

## Rule: reference, don't clone

We research each player's real speech (accent, pace, tics, catchphrases) and write the
voice direction from that. We do **not** upload their interview audio to build a cloned
voice. Cloning a living person's voice without consent is a personality-rights problem
on top of the likeness one, Higgsfield's voice creation asks for consent, and it isn't
needed: the comedy comes from the exaggeration, not from acoustic accuracy. Half the
cast are twisted on purpose anyway (posh Rashford), which a clone would fight.

## How a voice is built in Higgsfield

1. **Engine:** `seed_audio` (Seed Audio 1.0). It takes a bracketed performance
   instruction at the front of the prompt, a preset voice, and pitch / speed / loudness
   tuning. Fallback engine: `text2speech_v2` with `variant: elevenlabs`.
2. **Preset voice:** picked per character from `list_voices` and locked in the table
   below once approved. Same voice ID on every episode.
3. **Performance tag:** the bracketed direction at the front of every line, e.g.
   `[Young French man, thick exaggerated French accent, calm, deadpan]`. Locked per
   character; copy it verbatim.
4. **Eye-dialect:** we spell the accent into the script line so the engine has no
   choice. "three 'undred", "ze championship", "innit", "summat", "y'know".
5. **Tuning:** `pitch_rate` (−12…12) and `speech_rate` (−50…100). Haaland is low and
   slow; Foden is fast; Cherki sits at default.
6. **Pipeline:** voice line first, picture second. Generate the line with the locked
   voice, then drive the clip from it (Seedance 2.5 `omni_reference` or Wan 2.7 both
   accept an `audio_references` input) so the clay mouth follows the take. Kling can
   generate its own dialogue audio, but then the voice changes shot to shot, which is
   exactly what we don't want.

Each character has one locked **test line** below. Re-run it whenever the voice is
tweaked so takes are comparable.

## Research notes (real speech, from public interviews and press)

| Player | How they actually talk |
|---|---|
| Rayan Cherki | Lyon-born. English went from charmingly broken (the TNT interview where he answered everything with "you know, the championship is so long") to fluent and chatty within a season. Big hand gestures, unbothered, smiles through mistakes. |
| Marcus Rashford | Wythenshawe. Routinely called "the most Mancunian accent in the world". Flat vowels, "eh?" tags, quiet and measured, sincere. Picked up a Spanish lilt during his Barcelona spell. |
| Harry Maguire | Mosborough, Sheffield. Broad South Yorkshire, slow and even, unflappable in interviews no matter what the internet says about his head. |
| Erling Haaland | Norwegian, English learned in Bryne and at Leeds as a kid. Deadpan one-liners: "I just think about my chicken", "I just run fast", "Yeah, not bad". Answers in as few words as possible with a completely neutral face. |
| Phil Foden | Stockport. Soft, mumbly Manc, very quiet in interviews, short answers, "yeah, no, obviously". |
| Jack Grealish | Solihull. Brummie, cheeky, fast, laughs at his own jokes, calls everyone "mate". |
| Harry Kane | Walthamstow / Chingford. Estuary English, famously flat and media-trained, "yeah, no, listen, obviously". |
| Wayne Rooney | Croxteth. Thick Scouse, gravelly, blunt. |
| Pep Guardiola | Catalan-accented English, rapid, repeats words for emphasis ("the guys, the guys were incredible"), hands everywhere. |
| Kevin De Bruyne | Flemish-accented English, quiet, matter-of-fact, no filler. |
| Cole Palmer | Wythenshawe like Rashford. Slow, cold, nasal Manc, famously unbothered ("chippy chips"). |

## Cast voice directions

Format: **direction** → performance tag → tuning → eye-dialect rules → test line.

### Rayan Cherki (lead)
- **Direction:** his real English, exaggerated hard, then given a Dr. Evil register: a
  villain who is completely calm because the plan is already working. Thick Lyon accent,
  drops every "h", "th" becomes "z", "with" becomes "wiz", French rhythm (stress on the
  last syllable), a little rolled "r". Never raises his voice. Signature: "…c'est de
  l'art." and the pinky.
- **Tag:** `[Young French man from Lyon speaking English as a second language with a very thick, heavy, exaggerated French accent, rolled r, drops every h, th becomes z, French sentence rhythm, calm, deadpan, quietly villainous, like a cartoon supervillain explaining his plan]`
- **LOCKED VOICE:** seed_audio preset **Andre**, `f1e8226e-2248-4d5f-b43c-0a79e9949dbf` (owner pick, 2026-09-04).
- **Tuning:** pitch 0, speed −5.
- **Eye-dialect:** 'undred, 'ere, 'as, ze, zis, zem, wiz, "I will sell" not "I'll sell", French filler "euh" and "you know" at the end of statements.
- **Test line:** "I am going to make Ps… selling matchas with cold foams, to all the Gen Z in Manchester." (TTS spelling: "peas" with a comma after it, never an ellipsis; "wiz", "ze". Locked take `065b8127…`.)

### Marcus Rashford (antagonist)
- **Direction:** the twist. Real Rashford is the most Manc voice in football; ours is the
  most *proper* voice in football. 1950s BBC Received Pronunciation, slow, precise, every
  word finished, quietly offended at all times, never swears above a murmur. The joke is
  that nobody in the show ever comments on it.
- **LOCKED VOICE:** seed_audio preset **Alistair**, `d9d5c263-f84e-4752-97b5-3750fcc6fd2f`, with the RP performance tag below (owner pick, 2026-09-04, after the ElevenLabs Voice Design route was tried and dropped).
- **Tag:** `[Extremely proper, plummy, upper-class British Received Pronunciation, like a BBC announcer from 1950, slow and precise, every consonant finished, quietly offended]`
- **Tuning:** pitch −1, speed −10.
- **Eye-dialect:** none. Script lines verbatim. "I'm" stays "I'm".
- **Test lines:** "I'm back from Barcelona, and ready to sell some tea." /
  "There's only one type of tea in Manchester."

### Harry Maguire (Rashford's right-hand man)
- **Direction:** broad, warm South Yorkshire (Sheffield), slow, friendly, slightly
  bewildered, says everything like it's the first time he's heard it. Big man, big head,
  gentle voice. "Ey up", "pal", "reyt", "nowt", "summat", "only gone an'". Always chewing.
- **LOCKED VOICE:** ElevenLabs engine (`text2speech_v2`, `variant: elevenlabs`), preset **Callum**, `858499d9-fef5-40e1-bc29-b4dc661dc283`, no performance tag (owner pick, 2026-09-04). The accent is the voice's own; do not add a seed_audio tag on top.
- **Tuning:** none on ElevenLabs. Slow him down in the edit if needed.
- **Eye-dialect:** none. Script lines verbatim.
- **Test line:** "Rash, Cherki's opened a trendy matcha shop."

### Phil Foden (roadman, from Ep 2)
- **Direction:** real Foden is quiet Stockport. Ours is a full London roadman who has
  somehow never left Manchester. Fast, cocky, everything is "innit", "bruv", "allow it".
  Always slightly too loud for the tea room.
- **Tag:** `[Young London roadman, heavy multicultural London English, fast, cocky, swallowing consonants, every sentence ends up like a question]`
- **Tuning:** pitch +1, speed +15.
- **Eye-dialect:** innit, bruv, fam, ting, "man's" for "he's", "bag" for pound, "allow it".
- **Test line:** "Rash, bruv, listen yeah. Cherki's only gone an' opened a matcha shop innit. Green ting. Eleven bag. Eleven! Man's takin' the piss, fam. Allow it."

### Erling Haaland
- **LOCKED VOICE:** Seed Audio preset Alexey `7c2133e5-68ab-511f-9aed-9a67664382b1` with a British tag (owner pick). Tag: `[British English only, a huge Norwegian man who learned his English in Yorkshire, flat northern British accent, deadpan monotone, zero emotion, very slow]`. Speed −30 on short lines.
- **Direction:** his real deadpan, turned to eleven. Enormous, slow, Scandinavian
  monotone, zero emotion, long pauses. Every line is a complete sentence of three words.
  "Not bad" is the highest praise in the universe.
- **Tag:** `[Huge Norwegian man, flat monotone Scandinavian accent, zero emotion, very slow, long pauses, deadpan]`
- **Tuning:** pitch −3, speed −15.
- **Eye-dialect:** none. Just fewer words.
- **Test line:** "Black coffee. Big. … We don't do coffee? … Okay. … I take the cake. … Not bad."

### Jack Grealish
- **LOCKED VOICE:** ElevenLabs engine, preset Jasper `a7b8abe9-47f1-553e-a9df-87945a7e5bc8`, no tag (owner pick).
- **Direction:** Brummie and proud, cheeky, half-asleep, always sounds like he's just
  woken up (because he has). Laughs mid-sentence.
- **Tag:** `[Young man from Birmingham, strong Brummie accent, cheeky, sleepy, laughing at his own jokes]`
- **Tuning:** pitch 0, speed −5.
- **Test line:** "It's two in the afternoon, Rash. … Yeah I'm up. I'm up. What's a matcha?"

### Harry Kane
- **LOCKED VOICE:** Seed Audio preset Julian `95429266-c0ac-4137-a209-63b8812b0f23` with a British Essex tag (owner pick). Tag: `[British English only, English man from Essex, flat estuary London accent, calm, extremely media-trained, slightly robotic]`.
- **Direction:** the most media-trained man alive. Every sentence starts "yeah, no,
  listen, obviously". Estuary English, flat, weirdly calm about everything, counting
  under his breath.
- **Tag:** `[English man from Essex, flat estuary accent, calm, extremely media-trained, slightly robotic]`
- **Tuning:** pitch 0, speed 0.
- **Test line:** "Yeah, no, listen, obviously. Is this about the oat milk again? Because I've measured it, and it's fine."

### Wayne Rooney (cameo)
- **Direction:** pure Scouse, gravel, permanently annoyed, mostly grunts. When he does
  speak it's one furious sentence.
- **Tag:** `[Middle-aged man from Liverpool, thick gravelly Scouse accent, blunt, permanently annoyed]`
- **Tuning:** pitch −4, speed −5.
- **Test line:** "(grunt) … Oat milk. In my caff. Over me dead body, la."

### Pep Guardiola
- **Direction:** rapid Catalan-accented English, repeats everything twice for emphasis,
  never finishes a sentence because he's already had a better idea.
- **Tag:** `[Spanish Catalan man speaking fast English, warm, intense, repeats words for emphasis, constantly interrupting himself]`
- **Test line:** "The counter, the counter is wrong. No no no. Listen. We move it. We move it two metres and, and, the matcha… exceptional."

### Cole Palmer
- **Direction:** real Palmer, slowed down further. Cold, nasal, unbothered Manc. Sounds
  like he's shivering even when he isn't.
- **Tag:** `[Young man from Manchester, nasal flat Mancunian accent, slow, completely unbothered, slightly shivering]`
- **Tuning:** pitch 0, speed −20.
- **Test line:** "It's cold. … Yeah. … Iced, obviously. … Chippy chips."

### Lamine Yamal
- **Direction:** Spanish-accented Gen-Z English, everything is "lowkey", "fire", "no cap". Fast and bored.
- **Tag:** `[Teenage Spanish boy speaking English with a Barcelona accent, Gen-Z slang, fast, bored, confident]`

### Lionel Messi
- **Direction:** barely audible Argentine-accented English, soft, every sentence trails off. Everyone else goes silent when he speaks.
- **Tag:** `[Quiet Argentine man, soft Spanish-accented English, mumbling, humble, trailing off]`
- **Tuning:** loudness −20.

### Cristiano Ronaldo
- **Direction:** Portuguese-accented English delivered like a motivational keynote. Loud, precise, third person occasionally, "SIUU" as punctuation.
- **Tag:** `[Portuguese man speaking English with total confidence, loud, precise, motivational-speaker energy]`
- **Tuning:** loudness +15.

### Ronaldinho
- **Direction:** Brazilian-Portuguese-accented English, sing-song, laughing constantly, never a full sentence.
- **Tag:** `[Brazilian man speaking English with a Portuguese accent, laughing, musical, joyful, relaxed]`

### Thierry Henry
- **Direction:** the other French voice, so it must contrast Cherki: deep, slow, elegant, disappointed. TV pundit cadence. Long exhale before every judgement.
- **Tag:** `[Older French man speaking polished English, deep voice, slow, elegant, quietly disappointed, TV pundit]`
- **Tuning:** pitch −4, speed −10.

### Luka Modrić
- **Direction:** Croatian-accented English, calm, gentle, never hurried, like a chess commentator.
- **Tag:** `[Croatian man speaking soft measured English, calm, thoughtful, gentle]`

### David Beckham
- **Direction:** East London, high and polite, classic Beckham. Says "lovely" a lot. Unfailingly nice even when furious.
- **Tag:** `[English man from East London, light high-pitched cockney accent, extremely polite, gentle]`
- **Tuning:** pitch +3.

### Zlatan Ibrahimović
- **Direction:** Swedish-accented English, third person only, every line is a threat delivered as a fact.
- **Tag:** `[Swedish man speaking English, deep, arrogant, slow, speaks about himself in the third person]`
- **Tuning:** pitch −3.

### Mo Salah
- **Direction:** Egyptian-accented English, warm, cheeky, always sounds like he's winking.
- **Tag:** `[Egyptian man speaking English, warm, cheeky, friendly, smiling through every line]`

### Kylian Mbappé
- **Direction:** the third French voice, so: fast. Clipped, impatient, already leaving.
- **Tag:** `[Young French man speaking fast fluent English with a French accent, impatient, clipped, always in a hurry]`
- **Tuning:** speed +20.

### Jude Bellingham
- **Direction:** Brummie meets Madrid. Confident, chest out, sprinkles Spanish words in.
- **Tag:** `[Young man from Birmingham, confident Brummie accent with occasional Spanish words, charismatic]`

### Bukayo Saka
- **Direction:** North London, soft, polite, apologetic, laughs nervously. The nicest voice in the show.
- **Tag:** `[Young man from North London, soft polite accent, gentle, apologetic, nervous laugh]`

### Neymar Jr
- **Direction:** Brazilian-accented English, dramatic, every minor inconvenience is a tragedy, lots of gasps.
- **Tag:** `[Brazilian man speaking English, dramatic, theatrical, gasping, overreacting to everything]`

### Vinícius Jr
- **Direction:** Brazilian-accented English, fast, joyful, half-singing.
- **Tag:** `[Young Brazilian man speaking English, fast, energetic, joyful, almost singing]`

### Son Heung-min
- **Direction:** Korean-accented English, polite, cheerful, apologises to inanimate objects.
- **Tag:** `[Korean man speaking English, polite, cheerful, gentle, apologetic]`

### Virgil van Dijk
- **Direction:** Dutch-accented English, deep, calm, immovable, doorman energy.
- **Tag:** `[Tall Dutch man speaking English, very deep, calm, slow, authoritative]`
- **Tuning:** pitch −5.

### Kevin De Bruyne
- **Direction:** Flemish-accented English, quiet, dry, no filler, mildly irritated that he has to explain.
- **Tag:** `[Belgian man speaking English with a Flemish accent, quiet, dry, matter-of-fact, mildly irritated]`

## ElevenLabs Voice Design workflow (any character)

1. In ElevenLabs: Voices → Voice Design → paste the character's description → generate
   previews with the character's test line → save the winner as `<Name> · Cafe Cherki`.
2. Text to Speech with that voice, one script line per file, settings as above.
3. Download the MP3s. In this chat, say "uploading Rashford lines" and the Higgsfield
   upload widget opens; drop the files in. Each upload returns a `media_id`.
4. The `media_id` goes into the video generation as `audio_references` alongside the
   shot's still as `start_image` (Seedance 2.5 omni_reference), exactly as the Nan's
   lip-sync test was made. The clay mouth follows the ElevenLabs take.
5. Record the ElevenLabs voice ID and the media_ids in HIGGSFIELD_ASSETS.md so the same
   voice is reused every episode.

Voice Design briefs for the rest of the cast, if the presets fail them too:

| Character | Voice Design description |
|---|---|
| Cherki (backup; Andre is locked for now) | Young French man from Lyon in his early twenties speaking English as a second language, thick French accent, drops his h's, calm and deadpan, quietly amused, light tenor, unhurried, clean studio recording |
| Haaland | Very tall Norwegian man in his mid twenties speaking English with a flat Scandinavian accent, deep monotone, zero emotion, very slow, long pauses, dry, clean studio recording |
| Grealish | Young man from Birmingham, strong Brummie accent, cheeky, sleepy, warm, laughs under his breath, mid tenor, relaxed pace |
| Kane | English man from Essex in his early thirties, flat estuary accent, calm, media-trained, slightly robotic, even pace, no emotion |
| Rooney | Middle-aged man from Liverpool, thick gravelly Scouse accent, blunt, low, permanently annoyed, short phrases |
| Foden | Young man from Stockport, quiet soft Mancunian accent, mumbly, short answers, light tenor |
| Palmer | Young man from Manchester, nasal flat Mancunian accent, slow, cold, completely unbothered, low energy |
| Guardiola | Catalan man in his fifties speaking fast English with a strong Spanish-Catalan accent, warm, intense, repeats words for emphasis, interrupts himself |
| Henry | French man in his late forties speaking polished fluent English with a French accent, deep smooth baritone, slow, elegant, quietly disappointed, TV pundit |
| Beckham | English man from East London in his forties, light high-pitched cockney accent, extremely polite, gentle, soft |
| Zlatan | Swedish man in his forties speaking English with a Swedish accent, deep, arrogant, slow, self-assured, theatrical |
| Van Dijk | Tall Dutch man in his thirties speaking English with a Dutch accent, very deep, calm, slow, authoritative |
| De Bruyne | Belgian man in his thirties speaking English with a Flemish accent, quiet, dry, matter-of-fact, mildly irritated |
| Messi | Argentine man in his late thirties speaking soft English with a Spanish accent, mumbling, humble, quiet, trailing off |
| Ronaldo | Portuguese man in his late thirties speaking English with total confidence, loud, precise, motivational-speaker energy, rich baritone |

## Sample takes

First A/B round (Episode 1 lines) is logged in HIGGSFIELD_ASSETS.md under "Voice samples".
Listen, pick one voice ID per character, and it gets written into the table above as locked.

# Café Cherki — Series Bible

AI claymation Instagram Reels series. Football's biggest personalities living in a
coffee / matcha / tea world. Reference vibe: **Palmer's Packet** (@palmerspacketofficial)
— British, deadpan, banter-first, footballer-as-small-business-owner skits in a
Wallace-and-Gromit plasticine look. Ours is the same universe of humour, but the
economy is caffeine, not crisps.

> Note: Instagram is blocked from the build environment, so the Palmer's Packet
> reference is from memory of the format (AI claymation, short skits, British
> banter, footballer running a shop). Cross-check tone against the account before
> locking the voice direction.

## Logline

Rayan Cherki opens the most aesthetic matcha bar Manchester has ever seen.
The rest of football thinks he's taking the piss. Marcus Rashford, proprietor of
a tea room that looks like your nan's front room, decides something has to be done.

## Format

| Item | Spec |
|---|---|
| Length | 60 s max per episode (Reels sweet spot 45–60 s) |
| Aspect | 9:16, 1080×1920, exported for Reels |
| Look | Hyperreal claymation, as Palmer's Packet: realistic proportions, detailed sculpted faces that read as the player at a glance, real-fabric costumes, slight stop-motion jitter (12 fps feel), miniature set with tilt-shift depth, warm practical lighting |
| Audio | Character dialogue (accented, deadpan), foley heavy: milk steaming, ceramic clinks, kettle whistle. No music under dialogue; one needle-drop sting at the cliffhanger |
| Text | Burned-in captions, bottom third, chunky rounded sans, cream on coffee-dark |
| Overlay | DripMap badge on every video, every frame (see § DripMap overlay) |
| Cliffhanger | Every episode ends on an unresolved beat + "Next time at Café Cherki" card |

## Episode structure (every episode, same as Palmer's Packet)

1. **Cold open (0:00–0:06).** Straight into a scene. The first line or visual gag lands
   before anyone knows what they're watching. No logo first.
2. **Logo ident (0:06–0:08).** Hard cut to the Café Cherki ident: clay letters, matcha
   bowl, whisk spin, kettle-click sting. Two seconds, never longer.
3. **Story (0:08–0:57).** Back into the scene where the cold open left off.
4. **Cliffhanger card (0:57–1:00).** "Next time at Café Cherki".

The ident clip is generated once and reused on every episode. Ident assets are listed in
HIGGSFIELD_ASSETS.md.

## Bumper and sonic logo

The recurring music cue that runs under the ident is the series **bumper**; the musical
hit itself is the **sting**, and because it is identical in every episode it functions as
the show's **sonic logo**. Palmer's Packet uses a UK rap loop in the same slot. Ours is a
coffee-bar record: downtempo French house, filtered four-on-the-floor kick, Rhodes chord
stabs, a slow filter sweep that opens up into the story, one vibraphone accent.

Rules:

- Same cue, same place, every episode. Never re-score it, never swap it out for a trend
  sound. Recognition is the entire point.
- The 3-second sting sits on the ident at 0:06–0:08. Its filter sweep is timed to open as
  the cut lands on the first story shot, so the music carries the transition.
- The 10-second bed is the same recording at a lower level. Use it under a montage or a
  wordless run of shots. Duck it under dialogue; it never competes with a line.
- It is generated for us and unencumbered, so it publishes as **original audio** on Reels.
  Viewers can reuse it, and every reuse links back to the account. That is why we made our
  own rather than dropping in a library track, which would attribute to the track and put
  us under every other account using it.
- Master levels: sting at -14 LUFS to sit up on the ident, bed at -20 LUFS to sit under
  dialogue.

## DripMap overlay

Every video carries the DripMap badge for its full duration, including the ident and
the end card.

Built from `public/logo-dark.jpg` — the colourway that is already the volt bean mark plus
the white wordmark, with no green panel behind it. The dark ground is removed by flood
filling from the image border using a brightness test (anything below 140 max-channel is
ground), which clears the background while leaving the dark drip shape *inside* the mark
intact. The artwork is never redrawn or recoloured, only unbacked.

- Lockup trims to 487x108, placed at 400 px wide, top-left at x=48, y=252.
- A 50% black gaussian shadow sits 4 px under it so the white wordmark holds against pale
  footage.
- Clear of the Instagram header (top 250 px), the right action rail (130 px) and the
  caption area (bottom 420 px).

Assets in `overlay/`: `dripmap-overlay-1080x1920.png` (transparent, full frame) and
`overlay-preview.jpg` (shown against mid-grey to check the knockout).

## Style rules (locked)

- **No kits, ever.** Every character wears fashion-forward streetwear that tells you
  who they are before they speak. Clubs are referenced by colour accents only.
- **Faces are hyperreal, cues still matter.** The sculpted faces carry the recognition,
  but each character still needs 2–3 unmistakable signature cues (hair, gesture,
  accessory, way of talking) so they read in a two-second cut.
- **Shops are characters too.** Each footballer's venue is an extension of their personality.
- Comedy comes from status, pettiness and tiny stakes. Nobody plays football on screen.

## Likeness / rights note

These are real, living people. Caricature parody is common on IG, but commercial use
of a footballer's name and likeness is a personality-rights risk (and Higgsfield's
own policy asks for stylised original characters rather than exact likenesses).
Generation prompts in this folder describe faces **by traits** (hair, brow, jaw, beard,
earring), pushed as close as the hyperreal style allows, without uploading the players'
photos as references. Decision on naming real players on-screen is the owner's call.

## Core cast (Season 1)

| # | Character | Venue | Streetwear identity | Signature cue |
|---|---|---|---|---|
| 1 | **Rayan Cherki** (lead) | *Café Cherki* — minimalist matcha bar, Ancoats | French fashion-house streetwear: cream mock-neck knit with rust flame print, orange-tinted shades, black wide trousers, chunky loafers, oversized tan leather tote, rings. Alt: raw-denim trucker jacket, white tee, wide embroidered jeans | Whisks matcha like he's dribbling. Says "c'est de l'art" about everything |
| 2 | **Marcus Rashford** (antagonist S1) | *Nan's* — cosy English tea room, Withington | Very British: beige check hooded jacket, white tee, straight-leg jeans, Clarks Wallabees, cornrows sharp | Serves everything with a biscuit. Just back from Barcelona. "There is only one type of tea in Manchester" |
| 3 | **Erling Haaland** | *The Deadlift* — protein-coffee bar | Nordic loungewear, oversized hoodie, silky pyjama trousers, slides with socks | Drinks 2 litres of black coffee from a bucket. Says very little |
| 4 | **Kevin De Bruyne** | *Assist* — quiet Belgian filter bar | Understated: navy quarter-zip, chinos, New Balance | Never orders for himself; always "passes" the cup to someone |
| 5 | **Pep Guardiola** | Roaming consultant / matcha sommelier | Cashmere turtleneck, tailored coat, Catalan scarf | Rearranges everyone's shop layout uninvited |
| 6 | **Cole Palmer** | *Cold's* — iced coffee only | Ice-blue puffer, baggy jorts, shades indoors | Shivers dramatically at everything hot |
| 7 | **Jack Grealish** | *Calves* — espresso martini bar | Blonde-brown quiff, oversized monogram puffer gilet over a cream sweatshirt, white joggers, white trainers, iced coffee always in hand | Only opens after 9pm |
| 8 | **Harry Maguire** | Nan's regular, Rashford's right-hand man | Navy tipped polo, grey jeans, Sambas, Yorkshire Tea mug | Enormous head, broad Yorkshire, always eating. "Ey up" |
| 8b | **Phil Foden** | Nan's regular | Manc casual: Stone Island badge, tracksuit, bucket hat | Quiet, appears in the car in Ep 2 |
| 9 | **Lamine Yamal** | *17* — bubble tea kiosk | Gen-Z Barça street: baggy denim, Y2K sunnies, chain | Everything is "lowkey fire" |
| 10 | **Lionel Messi** | *La Casa* — yerba mate courtyard | Quiet luxury: linen shirt, loafers, no logos | Speaks softly; everyone stops talking |
| 11 | **Cristiano Ronaldo** | *SIUU Espresso* — mirrored, gold, chrome | Full monochrome white, gold chain, diamond studs | Counts his own reviews out loud |
| 12 | **Ronaldinho** | *Samba Cold Brew* — beach shack | Bucket hat, open shirt, beads, crocs | Never stops smiling; DJs his own shop |
| 13 | **Thierry Henry** | *Va-Va-Voom* — Parisian café, critic-in-residence | Camel coat, tailored, cigarette-thin scarf | Judges everyone's crema with a raised eyebrow |
| 14 | **Luka Modrić** | *Ten* — Croatian kava with a chessboard in the corner | Clean casual: knit polo, pleated trousers | Calm, plays chess against himself |
| 15 | **David Beckham** | *Studio 7* — coffee + honey (his bees) | Swept-back quiff greying at the temples, salt-and-pepper beard, tan Prince-of-Wales check blazer, white shirt, navy-and-gold tie, pocket square | Obsessively straightens cups |
| 16 | **Zlatan Ibrahimović** | *Zlatan Roasters* — the beans "chose him" | All black, samurai bun, long coat | Third person only |
| 17 | **Mo Salah** | *Egyptian King Karkadé* — hibiscus tea house | Relaxed: silk shirt, tailored shorts, sliders | Winks at the camera |
| 18 | **Kylian Mbappé** | *Turtle Drip* — drive-through | Slick: Hennessy-black leather, sneaker collab | Arrives everywhere too fast |
| 19 | **Jude Bellingham** | *Hey Jude* — Birmingham-meets-Madrid brunch spot | Tailored bomber, wide trousers, Prada-style loafers | Arms-out celebration when a latte art lands |
| 20 | **Bukayo Saka** | *Starboy* — pastry counter | Olive hooded parka over a black retro collared jersey, black nylon shorts, cream socks with green stripes, tan-and-green retro runners | Gives everyone a free pastry, gets bullied for being too nice |
| 21 | **Neymar Jr** | *Rolling Beans* — always "closed for injury" | Drip-heavy: designer everything, grillz | Falls over dramatically at minor inconvenience |
| 22 | **Vinícius Jr** | *Baila* — Brazilian pastel & coffee | Loud prints, chunky sneakers, cap backwards | Dances behind the counter |
| 23 | **Harry Kane** | *The Penalty Spot* — German-precision bakery | Dad-core: gilet, polo, boat shoes | Counts everything; loves a rule |
| 24 | **Son Heung-min** | *Sonny's* — Korean dalgona coffee | Clean Seoul streetwear: oversized blazer, trainers | Apologises to the coffee |
| 25 | **Virgil van Dijk** | *The Wall* — doorman at every venue | Tailored trench, Dutch minimal | Nothing gets past him. Literally, nobody gets in |
| — | **Wayne Rooney** (cameo) | *Rooney's* — greasy spoon, full English | Grey trackies, polo, bald cap glare | Angry at oat milk |

## Recurring locations

- **Café Cherki** (Ancoats): white-washed brick, blonde wood, one green neon "c'est de l'art",
  matcha whisked to order, pastry case with three items. Silence is aesthetic.
- **Nan's** (Withington): floral wallpaper, doilies, mismatched teacups, a gas fire, a cat
  that isn't Rashford's, a framed photo of the Queen. Custard creams are mandatory.
- **The Group Chat**: recurring visual device — a plasticine phone screen with tiny clay
  bubbles popping in. Chat name: "Brew Crew (no Cherki)".

## Episode arc (Season 1)

1. **Ep 1 — Grand Opening**: Cherki opens. Nobody is happy. Rashford calls the lads. *(this script)*
2. Ep 2 — The Sabotage: Rashford, Foden and Grealish attempt to ruin opening week. It backfires.
3. Ep 3 — The Consultant: Pep turns up and rearranges Nan's. Rashford has a breakdown.
4. Ep 4 — The Critic: Henry reviews both shops. Cliffhanger: 5 stars for… the wrong one.
5. Ep 5 — Cold's: Palmer opens an iced-only rival next door. Cherki is furious. Enemies become allies.
6. Ep 6 — The Legends: Messi and Ronaldo both arrive on the same morning. Manchester shuts down.

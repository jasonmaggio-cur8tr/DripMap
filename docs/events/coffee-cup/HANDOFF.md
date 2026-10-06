# Handoff — The Coffee Cup

> Written to move this work from a Claude Code **web/cloud** session to **Claude Code desktop**.
> Last updated: October 6, 2026.

---

## 1. Paste this into desktop to get Claude up to speed

```
I'm picking up The Coffee Cup event planning from a cloud session.

Read docs/events/coffee-cup/ in this repo — HANDOFF.md first, then README.md,
timeline-and-runbook.md, pitch-futsi.md and pitch-coffee-shops.md.

The partner deck is a Claude Artifact at
https://claude.ai/artifact/2VfrvgNjDpMcGmnfbzek83
Read it before changing any slide.

We're on branch claude/coffee-cup-tournament-planning-a1tvws, open as draft PR #42.
```

First, get the branch:

```bash
git fetch origin claude/coffee-cup-tournament-planning-a1tvws
git checkout claude/coffee-cup-tournament-planning-a1tvws
```

---

## 2. Where everything actually lives

| Thing | Where | On your computer? |
|---|---|---|
| **Event playbook** (4 docs) | `docs/events/coffee-cup/` on branch `claude/coffee-cup-tournament-planning-a1tvws` | **Yes**, once you pull the branch |
| **Partner deck** (11 slides) | Claude Artifact: [claude.ai/artifact/2VfrvgNjDpMcGmnfbzek83](https://claude.ai/artifact/2VfrvgNjDpMcGmnfbzek83) | **No** — cloud only, see below |
| Deck slide source (12 files) | The cloud container's scratchpad — **being destroyed** | No |
| Draft PR | [jasonmaggio-cur8tr/DripMap#42](https://github.com/jasonmaggio-cur8tr/DripMap/pull/42) | n/a |

### About the deck specifically

**The deck has no copy on your computer.** It is a published Claude Artifact, which is a page hosted on claude.ai. The twelve HTML source files Claude wrote exist only inside the cloud container that built it, at a scratchpad path that is wiped when that container is reclaimed.

**That is fine, and nothing is lost.** The Artifact itself is the durable store. A desktop session can read the published files straight back out of it and edit from there — just point Claude at the URL and ask it to read the deck before making changes. There is deliberately no second copy in this repo: one source of truth, no backups to drift out of sync.

Two things to know about it:

- **It is private.** Futsi, sponsors and shops cannot open that link until you share it from the page's Share menu. Claude cannot change sharing for you.
- **It exports.** Share › Export gives you PDF or .pptx when you need a file to email or present off a strange laptop.

---

## 3. State as of this handoff

**PR #42** — open, **draft**, mergeable, Vercel green on head `a964576`. Two commits, docs only, no app code touched. No review comments. It has been sitting green and untouched since Sept 26; it is waiting on you to merge it or leave it, nothing more.

**Deck** — 11 slides, version 4. Cover has tonal street-soccer court markings and a vector trophy with steam.

**One scheduled check-in is still armed** (`trig_01HqdjKdeekLfXbm4e8zEFgF`, fires 07:39 UTC Oct 6). It is bound to the **cloud** session, not to desktop — so those check-ins will not follow you over, and they stop mattering once that session is gone. If you want them off cleanly, ask Claude in the cloud session to delete that trigger.

---

## 4. The live decision: October 9

This is the thing that actually matters, and it is **this Friday**.

| On Oct 9 | Decision |
|---|---|
| **8+ shops committed and Futsi confirmed** | Order the trophy. Run **Sunday Nov 15, 2026** lean and self-funded. |
| **Under 8 shops, or Futsi's Sunday is booked** | Slide to **early March 2027** with warm shops in hand and nothing spent. |

Everything done before Oct 9 transfers to either date. The trophy order is the first irreversible spend.

**What decides it:** how many shops said yes, and whether Futsi's Nov 15 Sunday is actually free on two courts.

**Still unresolved as far as this session knows:**

- [ ] Has the Futsi owner confirmed the date? How many courts does Futsi have? (Two courts = 12 teams; one court = cap the field at 8.)
- [ ] Futsi's certificate of insurance — do you need your own rider?
- [ ] Shop count committed
- [ ] Any sponsor conversations opened

---

## 5. Placeholders to fill before anything goes to a third party

In the deck:

- **The date** — bracketed on the cover, format and timeline slides
- **DripMap's follower count** and the shops' real average follower count — the two empty rows in the reach model on the Reach slide
- **Your contact details** on the closing slide
- **Sponsor prices** — currently $1,500 / $750 / $250, all bracketed so they can move

The reach slide is the weakest part of the deck until those two rows are filled, and it is the slide a sponsor will interrogate hardest. Worth twenty minutes with the actual follower counts of your top twelve target shops.

---

## 6. Decisions already made (don't re-litigate these)

- **3v3 street soccer**, Sacramento's **coffee & tea shops**.
- **2:00pm first whistle** — most Sac shops close between 2 and 5 on a Sunday, so a 1:00pm start excludes the staff the event is for.
- **$100 per shop including 3 tees**, collected **at registration** through DripMap's existing Stripe integration — not as day-of cash. Shirts print with shop names on them; day-of collection means no leverage against a no-show.
- **Roster minimums of 2 women and 2 shop staff** (not 1 each) so the on-court gender rule survives an injury.
- **Perpetual trophy** that lives on the winning shop's bar for the year.
- **No dollar figure on the Futsi slide.** Ask for year one comped and let him name a number. A number on a slide becomes the floor. Carry ~$350 as your own ceiling, and lead with the league funnel if he hesitates.
- **Lead with the endorsement, not the CPM**, in sponsor conversations. The CPM is the credibility check, not the pitch.

---

## 7. Next build work, if you want it

Not started, listed in rough order of leverage:

1. **Registration flow on DripMap** — event listing + $100 Stripe checkout + roster form + digital waiver. This gates the Week 1 target of six committed shops; you can't say "reply and I'll send the link" without a link.
2. **Spectator RSVP page** — free, but capture the email.
3. **Shirt design brief** — ready to hand a printer the moment the field closes.
4. **Sponsor one-pager** — the $1,000–1,500 ask that funds the shirt run.

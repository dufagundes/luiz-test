# THE LAST SIGNAL: Story Bible (Season 1)

> **Logline:** At 11:47 PM, every phone in Harlow Point receives the same message: *"YOU HAVE 24 HOURS. DO NOT TRUST THE PERSON CLOSEST TO YOU."* Four kids discover it was sent from a future version of their town, where almost everyone has vanished. The audience votes on every major decision.

**Genre:** mystery · suspense · sci-fi · psychological thriller
**Format:** vertical 9:16 animated chapters, 45–60 s each, 12 chapters per season, a poll at the end of every chapter
**Season clock:** Season 1 covers exactly 24 hours, from **Fri Nov 13, 11:47 PM** to **Sat Nov 14, 11:47 PM**. Every chapter shows the on-screen countdown (`23:59:59` style). Story time must only move forward.

This file is the source of truth. If a chapter contradicts it, the chapter is wrong. Visual definitions live in code in `src/series/cast.ts` and must match this file.

---

## 1. Characters

### NORA VANCE, 16 (protagonist)
- **Look:** auburn hair in a high ponytail (blue hair tie), freckles, green eyes, mustard-yellow raincoat with 4 buttons, navy jeans, white sneakers.
- **Voice:** Piper `en-us-lessac-medium` (clear, young female).
- **Personality:** stubborn, brave to the point of reckless, sarcastic when scared, fiercely protective of Milo. Hates being lied to more than anything.
- **Want:** to find out what happened to her father.
- **Need:** to learn to trust again, but trust the *right* people.
- **Wound:** her father vanished 3 years ago. The town said he "left". She never believed it.
- **Skills:** amateur radio (Dad taught her), Morse code, knows every path on Cutter's Hill.
- **Habit:** taps her phone against her palm when thinking.

### THEO PARK, 17 (best friend; first suspect)
- **Look:** messy spiky black hair, round black glasses, olive-green bomber jacket with orange collar, white tee, dark jeans, red sneakers. Slightly taller than Nora.
- **Voice:** Piper `en-us-libritts-high`, speaker 28.
- **Personality:** funny and warm, jokes when nervous, good with machines (fixes bikes, phones, radios), avoids conflict, and lies to protect people.
- **Relationship:** Nora's best friend since they were six. Always climbs in through her attic window instead of using the door.
- **Secret (revealed gradually):** on **Fri Oct 23, 11:47 PM** (exactly 3 weeks early) Theo got the Signal message plus a second message only he has seen: *"IF NORA GOES TO THE TOWER, SHE DOESN'T COME BACK."* He kept quiet to protect her.
- **Arc:** loyal liar becomes honest ally. He is *not* the villain, but an Echo of him appears (see §4).

### MILO VANCE, 11 (Nora's little brother; the oracle)
- **Look:** small, curly brown hair, freckles, red-and-navy striped sweater, brown corduroys. Always carries a spiral notebook.
- **Voice:** Piper `en-us-libritts-high`, speaker 12, pitched up ×1.12.
- **Personality:** quiet, observant, says unsettling things calmly, loves drawing.
- **Secret ability:** since Dad vanished, Milo has "static dreams". He sees moments from the future town and draws them before they happen. The drawings are always accurate, but he doesn't understand them.

### JULES OKAFOR, 16 (the skeptic; joins in Ch.2–3)
- **Look:** dark skin, long box braids, purple hoodie, black headphones around her neck, white sneakers.
- **Personality:** sharp, logical, debate-team captain, funny in a dry way. Demands evidence.
- **Relationship:** was Nora's close friend until 8th grade. They fell out when Jules said Nora's dad "probably just left". It still hurts both of them.
- **Hook:** she is the sheriff's daughter and has access to the station.

### SHERIFF DANA OKAFOR, 44 (Jules's mother)
- **Look:** short black hair, tan uniform, gold star badge, dark trousers.
- **Secret:** she was at the tower the night Elias Vance vanished and signed the report saying he "left town". She has been protecting the **Meridian** project ever since, out of fear, not malice.

### ELIAS VANCE, 45 (missing father)
- **Look:** auburn hair (like Nora), navy hoodie. Seen in the pinned photo in Nora's attic, flashbacks, and later the future town.
- **Role:** engineer at the Meridian Relay Tower. Discovered that the tower's frequency (**114.7**) can carry signals across time ("the Fold"). Vanished 3 years ago during a test.
- **Where is he really?** In the future town. Alive. (Revealed in the season finale.)

### THEO'S ECHO (appears Ch.2)
- **Look:** identical to Theo (same cast definition) but **never wet**. Rain stops in a dome around him. His phone always shows **11:47**.
- **Voice:** Theo's voice, slightly lower and thinner (`echo` voice in the audio builder).
- **Behavior:** calm, stands still, looks up at Nora's window. Texts from Theo's number. Wants to be let in.
- **Ch.3:** speaks in person ("Hi, Nora."), can't cross the threshold uninvited, knows Theo's secret, carries the 3-year-old photo. Subtitle tag "THE OTHER THEO" (voice `echo_live`). His smile disappears when the radio speaks.
- **Origin (now known to the audience):** he walked out of the tower's light the night Elias vanished, 3 years ago.

### THE RADIO VOICE ("Future Nora")
- Comes through Elias's ham radio on **114.7**.
- **Sounds exactly like Nora** (same voice, run through a radio filter). This is deliberate and is a key clue.
- Knows things only Nora knows. Gives instructions that are *mostly* helpful… with one hidden goal (see §4).

---

## 2. Locations
| Location | Description | Code |
|---|---|---|
| **Harlow Point** | small rainy coastal town, ~3,000 people. Night palette: navy, ink and blue phone-light. | `locations/Town.tsx` |
| **Cutter's Hill + Meridian Relay Tower** | lattice radio tower on the hill above town. Red beacon blinks normally and turns **white** when the Fold is charging. | in `Town.tsx`, visible through the attic window |
| **The Vance house, 14 Maple Street** | foreground of the town panorama. Nora's room is the **attic** with the dormer window. | `Town.tsx` + `locations/Attic.tsx` |
| **Nora's attic** | sloped ceiling, string lights, dormer window (Theo's entrance), desk with Dad's ham radio, poster "114.7", pinned photo of Dad, door on the left. | `locations/Attic.tsx` |
| **Vance front yard** | seen from the attic window, looking down: lawn, stone path, picket fence, mailbox "14", dead streetlight, porch roof edge. Rain can be masked around an Echo ("dry dome"). | `locations/Yard.tsx` (Ch.2+) |
| **Vance front hallway** | ground floor: front door (opens inward, hinge right) onto the rainy porch, threshold + doormat, staircase up to the landing (left), oval hall mirror, coat hooks with Dad's navy hoodie, framed family photo. Barrier plane option for Echoes; red radio glow can spill down the stairs. | `locations/Entry.tsx` (Ch.3+) |
| **Flashback: the tower, 3 years ago** | desaturated night, tower with blinding white light at its base, rock where 14-year-old Theo hid | inline in `chapters/ch03/Ch03.tsx` (reuse/extract when needed) |
| **Sheriff's station (exterior)** | flat-roofed building in the mid-distance of the town panorama, "SHERIFF" sign, patrol car with red/blue light bar. Keeps its power during the blackout. | `Town.tsx` `stationLit` (Ch.2+) |
| *(planned)* Sheriff's station, Harlow High, Maple Street, the Meridian bunker under the tower, **Future Harlow Point** (the same town, empty, gray, frozen at 11:47) | build as new reusable components when first needed | |

---

## 3. Timeline
| When | Event |
|---|---|
| 1960s | Meridian Relay Tower built on Cutter's Hill (official story: weather and radio relay). |
| 3 years ago | Elias Vance runs a night test at the tower and vanishes. Sheriff Okafor's report says he "left town". Milo's static dreams begin. |
| Fri Oct 23, 11:47 PM | Theo receives the Signal message *three weeks early*, plus a private warning about Nora. Tells no one. |
| **Fri Nov 13, 11:47 PM** | **Ch.1:** every phone in town receives the Signal. Dad's radio turns on by itself. The tower beacon turns white and the town loses power. |
| Fri Nov 13, ~11:48 PM | **Ch.2:** in the dark attic Theo confesses and shows the second message. Milo's new drawing: "the boy" with Theo's glasses, his phone says 11:47, "he dosnt get wet". Only the sheriff's station still has power. Nora gets a text from Theo's number: *"I'm outside. Don't trust whoever is with you."* A second, bone-dry Theo stands in the yard in the rain, phone frozen at 11:47. |
| Fri Nov 13, ~11:49 PM | **Ch.3:** Nora opens the front door. The Echo of Theo ("Hi, Nora.") cannot cross the threshold: the doorway acts like a wall. He makes the real Theo confess: Theo was at the tower 3 years ago and saw Elias walk into the light, then saw the Echo come out. The Echo slides a photo across the threshold: the tower, Elias, Theo… and 13-year-old Nora. Nora has no memory of it. The radio upstairs (Nora's voice): *"Nora. Close the door. Now."* For the first time the Echo stops smiling. |
| Sat Nov 14, 11:47 PM | **Deadline.** The Fold completes. In the future timeline, this is when "almost everyone disappeared". |

---

## 4. The mystery (writers only; never reveal early)
1. **What is the Signal?** A warning broadcast backwards in time from *Future Harlow Point* through the Meridian tower on 114.7.
2. **Who sent it?** The radio voice: an older Nora, stranded in the empty future town.
3. **What happens at 11:47 PM Saturday?** The tower completes "the Fold". Everyone within its range is pulled into the static. In the future timeline only a few people were left behind.
4. **Echoes:** while the Fold charges, the static makes **copies ("Echoes")** of people near the signal. Echoes look and talk exactly like the original, **but:**
   - they have **no reflection** in glass or phone screens,
   - their phones always show **11:47**,
   - rain doesn't seem to touch them (they are never wet).
   Echoes want to take the originals' place before the Fold, so *they* are the ones left in the real world.
5. **"Do not trust the person closest to you."** Everyone reads this as "your best friend / your family". The real meaning (finale twist): **the person closest to you is *you*.** Future Nora is not simply Nora. She is **Nora's Echo**, formed the night Elias vanished, and she has been steering Nora toward the tower so she can swap places.
6. **Theo's secret** is real and honest: he hid the warning to protect Nora. The figure "behind Theo" in Milo's drawing is **Theo's Echo**.
7. **Elias** is alive in the future town. He is the reason the tower still works.

## 5. Clue tracker
| Clue | Introduced | Meaning | Paid off |
|---|---|---|---|
| Everything happens at **11:47** (clock, radio frequency 114.7) | Ch.1 | the Fold's anchor time | ongoing |
| Radio voice sounds exactly like Nora | Ch.1 | it's (Echo) Nora | Ch.11–12 |
| Milo drew the scene *yesterday* | Ch.1 | static dreams show the future | Ch.9 |
| Dark figure "behind Theo" in the drawing; silhouette in the window during the lightning flash | Ch.1 | Theo's Echo exists | Ch.5–6 |
| Theo's message dated **Oct 23** | Ch.1 | Theo was warned early; there's a second private message | Ch.2 |
| Tower beacon turns **white**, town blackout | Ch.1 | the Fold has started charging | Ch.4–5 |
| Theo is soaking wet in the attic (real); the window figure is dry | Ch.1 (subtle) | Echoes are never wet | Ch.4 |
| Pinned photo of Dad by the radio | Ch.1 | Elias | Ch.7, Ch.12 |
| Theo's **second message** (Oct 23, 11:48 PM, only to Theo): *"IF NORA GOES TO THE TOWER, SHE DOESN'T COME BACK."* | Ch.2 | someone is trying to keep Nora away from the tower, the opposite of what the radio voice wants. Who sent it? (writers: Elias, from the future) | Ch.7 |
| Milo's page 2: Theo-like boy, phone reads **11:47**, "he dosnt get wet" | Ch.2 | first on-screen statement of two Echo tells (frozen 11:47 phone, never wet) | Ch.2 (yard) / Ch.4 (rules confirmed) |
| Only the **sheriff's station** keeps power in the blackout | Ch.2 | the station runs on Meridian's private line; Dana is connected to the tower | Ch.3 |
| The Echo's text is in Theo's voice but slightly lower and "thinner" | Ch.2 | audio tell: Echo voices are a little off | Ch.6 |
| Real Theo is soaked; yard Theo is dry inside a "dome" where rain doesn't fall | Ch.2 | which Theo is real (the wet one in the attic) | Ch.4–6 |
| **Echoes cannot cross a doorway uninvited** (shimmering "wall" at the threshold, hum + crackle) | Ch.3 | Echoes need permission to enter. The Ch.2 text ("I'm outside… let me in") was a request for an invitation | Ch.4 (vote) |
| **Theo was at the tower the night Elias vanished**; saw Elias walk into the light and the Echo walk out | Ch.3 | Theo's Echo was made 3 years ago (not tonight); it has been waiting ever since | Ch.6, Ch.10 |
| **The photo**: tower · Elias · Theo (14) · Nora (13) in her yellow raincoat, handwritten "Nov 13 · 11:47 · 3 yrs ago" | Ch.3 | Nora was at the tower that night but doesn't remember. (Writers: her Echo was formed then; Dana saw two Noras) | Ch.10–12 |
| The hall **mirror** shows the open doorway **empty** while the Echo stands in it | Ch.3 (hidden) | Echoes have no reflection | Ch.4 |
| The radio voice orders "Close the door" and the Echo's smile drops | Ch.3 | the radio voice and the Echo are on opposite sides… or competing for the same thing | Ch.5–11 |

## 6. Audience decisions so far (canon)
| Ch. | Winner | What it changed |
|---|---|---|
| 1 | **A: Let Theo explain** | Nora didn't go to the tower. Theo's secret came out early (second message). Nora is angry but has **not** cut Theo off; their trust is cracked, not broken. Nora was at home when the Echo of Theo arrived. |
| 2 | **1: Open the door** (⚠️ creator's creative decision, not an audience vote) | Nora confronts the Echo at the front door instead of fleeing to the station. Jules and the station are postponed to Ch.4–5. Theo's 3-year secret is exposed. |
| 3 | ⏳ pending: 1: Close the door / 2: Let him in | |

### Character state after Ch.3
- **Nora:** holding a photo that proves she was at the tower 3 years ago. She has no memory of it. Torn between the radio voice (her own voice) and the Echo, who seems to know the truth. Trust in Theo badly shaken a second time.
- **Theo (real):** on the stairs, soaked, ashamed. He has confessed he witnessed Elias vanish and saw the Echo come out of the light. He never told anyone, not even Nora.
- **Theo's Echo:** on the porch, unable to come in uninvited. Calm, taunting, informed. Stopped smiling when the radio spoke.
- **Milo:** at the top of the stairs, watching, red radio light behind him.
- **Jules / Dana:** still off-screen. The station is still the only powered building.

### Character state after Ch.2 (previous)
- **Nora:** hurt by Theo's secret but believing him. Shaken: there are now two Theos. Still has Dad's radio voice telling her to go to the tower alone.
- **Theo (real):** confessed everything. Soaking wet. Terrified of the copy of himself.
- **Theo's Echo:** standing in the Vance yard, dry, phone at 11:47, sending texts from Theo's number. Wants to be let in.
- **Milo:** his dreams are clearly showing the Echo. He is calm, which scares Nora more.
- **Jules / Dana:** not yet on screen. The sheriff's station is the only lit building in town.

## 7. Open questions (for the audience to theorize about)
- Who sent the message? Why would *anyone* get it three weeks early?
- Why does the voice sound like Nora?
- What did Milo really see in his dreams?
- What happened to Elias Vance?
- Who is the "person closest to you"?

## 8. Tone and style rules
- Suspense first: every chapter **reveals one real thing** and **ends on a new question**.
- Grounded emotions: friendship, grief, trust. Characters react like real teenagers.
- Narrator (Piper `en-us-ryan-high`) is calm, close and cinematic. Characters speak in short lines.
- Color code: **phone-blue** = the Signal; **amber** = home and safety; **red** = danger and the tower; **white** = the Fold.
- On-screen series elements in every chapter: countdown HUD, chapter title card, interactive ending.
- **Standard interactive ending (Ch.2 onward, about 9 s total, built by `src/series/ui/InteractiveEnding.tsx`):**
  1. Right after the cliffhanger: the dramatic question and two numbered choices, **1** and **2**, each with a short description. The story image keeps playing, dimmed underneath.
  2. Voiceover: *"What should we do next? Comment 1 or 2 below and tell me why!"* plus an on-screen "COMMENT 1 OR 2 BELOW 👇".
  3. Animated card: **"YOUR CHOICE CHANGES THE STORY."** / **"COMMENT 1 OR 2 👇"** / **"FOLLOW FOR CHAPTER N 🔥"** (about 5 s).
  4. Voiceover: *"Follow so you don't miss what happens next!"*
  5. All ending text stays in the mobile safe zone (x 60–880, y 170–1430), clear of the right-side buttons and bottom captions.
  Chapter 1 (already posted) keeps its original A/B ending.

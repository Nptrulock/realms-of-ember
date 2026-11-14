# 🔥 Realms of Ember

A deep, deliberately grindy incremental idle RPG in an original high-fantasy setting. Plain HTML/CSS/JS, no build step.

**Play:** https://nptrulock.github.io/realms-of-ember/

## v2: the grind update
- **Real-time only.** No game-speed multiplier. Class and profession levels take at least 10 minutes each from level 1, and much longer after that.
- **Slow offline.** Away time earns 20% of the online rate. The 🌙 Night Watch mastery and the Hourglass relic raise it to at most 60%. The offline cap is 2h, or 6h/12h with Town upgrades.
- **Action Points & Mastery.** Kills fill a per-class pool, profession actions fill a per-profession pool, and every action feeds a general pool. AP buys permanent, escalating-cost masteries that survive Ascension:
  - general: 10 nodes
  - class: 7 nodes plus a class signature node
  - profession: 6 nodes
- **Daily rhythm.** The first 300 or more actions each day earn double AP. There are streak gifts and 3 daily deeds.
- **Success odds.** Every profession action can fail, and auto-attacks can miss.

## Content
- **10 classes:**
  - Fighter, Wizard, Rogue, Cleric, Ranger, Paladin, Warlock
  - **General:** commands troops
  - **Worker:** profession-AP specialist
  - **Collector:** loot, gold and relic odds, but fragile
- **12 professions:**
  - Mining, Herbalism, Smithing, Alchemy, Cooking, Enchanting
  - **Summoning, Dancing, Praying, Advising, Bard, Fishing**
- **27 relics:** 15 combat relics and 12 profession relics. All are account-wide and survive ascension, with exact odds in the Codex.
- **Saves:** v1 saves migrate automatically. Levels are rescaled to the new curve by equivalent play time.

`sim.js` is a headless balance simulator:
- `node sim.js class <id> <hours> [noap]`
- `node sim.js prof <id> <hours> [noap]`

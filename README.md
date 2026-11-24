# 🔥 Realms of Ember

A deep, deliberately grindy incremental idle RPG in an original high-fantasy setting. Plain HTML/CSS/JS, no build step.

**Play:** https://nptrulock.github.io/realms-of-ember/

## v3: rarity, reagents & the Star Chart
- **Rarity is a big deal.** Each tier is much rarer and much stronger than the one below:

  | Rarity | Base odds (0% MF) | Base power | Affix strength | Affixes |
  |---|---|---|---|---|
  | Common | 71.1% | ×1 | ×1 | 0 |
  | Uncommon | 22.3% (1 in 4) | ×1.6 | ×1.3 | 1 |
  | Rare | 5.6% (1 in 18) | ×2.6 | ×1.7 | 2 |
  | Epic | 0.91% (1 in 109) | ×4.2 | ×2.2 | 3 |
  | Legendary | 0.10% (1 in 985) | ×7 | ×3 | 4 + legendary power |
  | Mythic | 0.006% (1 in 16,418) | ×12 | ×4.2 | 5 + 2 powers |

  Exact odds for your current Magic Find are shown in the Inventory. Epic and better items glow, and drops get a banner.
- **Bulk sell / salvage any rarity**, including Legendary and Mythic. Epic and up asks first. Tap 🔓 on any tile to lock it; locked items are never sold.
- **High-level profession unlocks feed progression.** The hardest targets of every profession drop a rare reagent, shown with a "Used in" list:
  - Smithing infusions raise an item one tier: Rare→Epic, Epic→Legendary, Legendary→Mythic.
  - Enchanting keys open Dragon's Roost and the Endless Rift.
  - Alchemy reagents (Phoenix Draught, Philosopher's Catalyst) and Cooking's Hero's Banquet.
  - Star Chart goals.
- **Ascension is a Star Chart.** 9 constellations and 60 stars, with pan, pinch and zoom. Light stars next to lit ones with 🌠 Stardust. Some stars also need a deed. Finishing a constellation lights its capstone.
  - Ascending now keeps 20–60% of profession levels, up to 30% of class levels and 25% of gold, plus tools, recipes, reagents and zone keys.
  - Old Ascension-shop purchases are refunded as Stardust. Mythic Attunement and Astral Familiar map straight onto their stars.

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
- **Saves:** v1 and v2 saves migrate automatically. Levels from v1 are rescaled to the new curve by equivalent play time. Failed loads are never overwritten; the last 3 saves plus one daily backup are kept on the device. Hard reset asks you to type RESET.

## Saves on iPhone
Safari may delete all website data for a page that has not been added to the Home Screen after about 7 days without a visit. That wipe cannot be undone from the game — there is no server copy.

To keep a save:
1. Open the game in Safari, tap Share, then **Add to Home Screen**, and always open it from that icon.
2. Export a save code from Settings every few days and paste it into Notes.

The game will prompt once (dismissible) if it detects iPhone Safari that is not running as a Home Screen app, and it will gently remind you to export a save code every few days.

`node test-save.js` covers save/load, migrations, backups, and the export-reminder logic.

`sim.js` is a headless balance simulator:
- `node sim.js class <id> <hours> [noap]`
- `node sim.js prof <id> <hours> [noap]`

## Navigation (v2.1, phone-first)
- **Sticky header:** HP, current activity, and XP bars for your class and active profession. Each bar shows XP numbers, percent, and the estimated time to the next level.
- **Main tabs:** a bottom tab bar on phones. Swipe left or right on the content to move between tabs. On desktop, use Shift+←/→.
- **Professions, Classes and Mastery** show one page at a time. Swipe, tap ‹ ›, or tap a chip to jump. Swiping inside a pager moves the pager, not the tab.
- **Battle scene:** while your hero works a profession, it collapses to a slim strip. Use ▾ Scene to expand it. The choice is remembered.

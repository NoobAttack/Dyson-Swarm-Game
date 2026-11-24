# Progress

## Done
- M1: Tier 1 core loop. Click to collect, 6 buildings, x1/x10/x100/Max buying, milestone doublers, number formatting, localStorage save, offline progress (8h cap), export/import/reset.
- M2: Tier 2 heat. Every energy building makes heat. 3 radiator buildings remove heat and add capacity. Heat bar in the HUD. Above capacity, output ramps down smoothly to a 25% floor and never stops. Tuned in `HEAT` and `BUILDINGS`.
- Stats panel (`STATS`) and 5 achievements with small bonuses (`ACHIEVEMENTS`). Pulled forward from M6.
- UI pass (Gemini): starfield background, fonts, tier badge, floating click numbers, purchase flash, mobile layout.
- Upgrades: 14 one-time purchases in the `UPGRADES` table. Each row shows a generated line that says exactly what it changes, and building rows show per-unit numbers with upgrades included. Lost on Ascend.
- M3: Tier 3 logistics, built as supply lines instead of a plain transport cap. Mass Drivers build Swarm Satellites, Asteroid Miners build Mass Drivers, Disassemblers build Miners. This needs transport from Cargo Tugs and Bulk Freighters. With too little transport every line slows by the same share. With none, nothing is built. Supplied units make energy and heat, but do not raise prices or count toward x2 milestones. Tuned by `feed` and `haul` fields in `BUILDINGS`.
- M4: Ascend. Resets energy, buildings, heat, and upgrades for Dark Matter. Every Dark Matter earned adds +5% output forever. Dark Matter also buys permanent upgrades (`DM_UPGRADES`): less heat made, more cooling, more transport. Tuned in `PRESTIGE`.
- Phone layout: bottom tab bar (Build, Upgrades, Ascend, Stats) so only one section is on screen at a time. Build tab has Energy / Cooling / Logistics chips. Tabs show a badge when something is affordable, chips show a red dot when that area needs attention. On phones the HUD is compact and sticks to the top, rows are short (tap a row for full details), buttons are at least 48px tall, and messages are a toast above the tab bar. Tabs are data (`TABS`, `GROUPS` in the UI section). No save change.
- Welcome Back screen: when you return after more than a minute away (page load, or a sleeping tab waking up), a popup shows how long you were gone, the energy earned, average income, units the supply lines built, heat on return, and a warning if you overheated or hit the 8h cap. `simulateAway()` builds the report, `showAway()` draws it. No save change.
- Thermal clarity: the core rule is now spelled out. If heat made is above cooling you WILL overheat, because capacity is only a buffer. The HUD shows a verdict (safe or not, where heat will settle, output when settled, time until throttling, cooling you are missing) and a dashed marker on the bar for the settle point. Every building row previews what buying it does (`+heat/s`, whether it crosses into overheating, settled W/s before and after). Heat and cooling upgrades show the outlook before and after. The Cooling tab has a "How heat works" panel with a per-building heat breakdown and how many radiators fix it. The Cooling chip now warns as soon as heat made passes cooling, not only after throttling starts.
- Supply lines explained: the Logistics tab has a "How supply lines work" panel with a plain-language description, a supplied-share bar, how many Tugs or Freighters you need for full speed, and one line per supply line showing its real build rate, cargo use, and units built so far.
- SAVE_VERSION is 3. v1 and v2 saves migrate.
- `tests/smoke.js` covers all of the above.

## Next
- M5: Tier 4 rivals (see DYSON_SPEC.md)
- M6: Polish and balance

## Known bugs
- Phone layout was checked with Chrome screenshots at iPhone size (390x844), not on a real iPhone. Sticky HUD and safe-area spacing need a real-device check.
- None known. The automated test passes, but M3, M4, and upgrades have not been play tested by a person in a real browser yet.
- Fonts load from Google Fonts, so the file is not fully self-contained. Offline it falls back to system fonts and still works.

## Needs balancing
Numbers below come from a simple auto-buy bot, not real play.
- Supply lines are strong. After 2 hours the bot had about 27,000 free satellites against 111 bought ones. Lower the `feed.rate` values or raise `cargo` if this outruns everything else.
- Transport was never the limit for the bot (12 tugs and 1 freighter was enough). Raise `cargo` or lower `haul` to make transport a real choice.
- Dark Matter: the bot could ascend for 4 at 45 minutes, 12 at 1 hour, 56 at 2 hours. `PRESTIGE.base` moves this.
- Radiators are still cheap. The bot never overheated.
- With no radiators, throttling starts about 2 minutes into a new game. Raise `HEAT.baseCooling` or `baseCapacity` to delay it.
- Milestone doublers do not raise a building's heat, but they do double radiator cooling.
- Upgrade costs and achievement thresholds are first guesses.
- The new thermal and supply text has been checked in screenshots at phone size, not in real play.
- Logistics and Ascend are visible from the start. A later pass could hide them until the player gets close.

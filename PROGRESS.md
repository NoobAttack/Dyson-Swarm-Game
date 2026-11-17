# Progress

## Done
- M1: Tier 1 core loop. Click to collect, 6 buildings, x1/x10/x100/Max buying, milestone doublers, number formatting, localStorage save, offline progress (8h cap), export/import/reset.
- M2: Tier 2 heat. Every energy building makes heat. 3 radiator buildings remove heat and add capacity. Heat bar in the HUD. Above capacity, output ramps down smoothly to a 25% floor and never stops. Tuned in `HEAT` and `BUILDINGS`.
- Stats panel (`STATS`) and 5 achievements with small bonuses (`ACHIEVEMENTS`). Pulled forward from M6.
- UI pass (Gemini): starfield background, fonts, tier badge, floating click numbers, purchase flash, mobile layout.
- Upgrades: 14 one-time purchases in the `UPGRADES` table. Each row shows a generated line that says exactly what it changes, and building rows show per-unit numbers with upgrades included. Lost on Ascend.
- M3: Tier 3 logistics, built as supply lines instead of a plain transport cap. Mass Drivers build Swarm Satellites, Asteroid Miners build Mass Drivers, Disassemblers build Miners. This needs transport from Cargo Tugs and Bulk Freighters. With too little transport every line slows by the same share. With none, nothing is built. Supplied units make energy and heat, but do not raise prices or count toward x2 milestones. Tuned by `feed` and `haul` fields in `BUILDINGS`.
- M4: Ascend. Resets energy, buildings, heat, and upgrades for Dark Matter. Every Dark Matter earned adds +5% output forever. Dark Matter also buys permanent upgrades (`DM_UPGRADES`): less heat made, more cooling, more transport. Tuned in `PRESTIGE`.
- SAVE_VERSION is 3. v1 and v2 saves migrate.
- `tests/smoke.js` covers all of the above.

## Next
- M5: Tier 4 rivals (see DYSON_SPEC.md)
- M6: Polish and balance

## Known bugs
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
- Logistics and Ascend are visible from the start. A later pass could hide them until the player gets close.

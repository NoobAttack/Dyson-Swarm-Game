# Dyson Swarm: Spec and Prompts

## Pitch
An idle game where you start with one rooftop solar panel and end up harvesting a galaxy. Like AdCap, but the rules change as you grow. Each tier adds a new mechanic.

## Rules for any AI building this
1. Single file `index.html`, inline CSS and JS, no frameworks.
2. The game must run after EVERY milestone. Never leave it broken.
3. Content lives in the DATA section. Adding content means adding data, not code.
4. All production math uses delta time.
5. Sections stay in order: DATA, STATE, ENGINE, SAVE, UI, MAIN LOOP.
6. After each milestone, update `PROGRESS.md` (done, next, known bugs).
7. Bump `SAVE_VERSION` and add a migration if the save shape changes.
8. Run `node tests/smoke.js` after every change and add a check for anything new.

## Tier plan
| Tier | Scale | New mechanic |
|---|---|---|
| 1 Orbit | Planet | Basic buy loop (BUILT) |
| 2 Heat | Star | Every building makes heat. Radiators are needed or output is throttled (BUILT) |
| 3 Logistics | Star system | Supply lines: higher-tier buildings build lower-tier ones for free, limited by transport capacity (BUILT) |
| 4 Rivals | Galaxy | Rival swarms compete for the same stars. You choose where to expand |
| Ascend | Any | Reset for Dark Matter, a permanent multiplier. Later tiers get new Dark Matter upgrades (BUILT) |

## Milestones (each one playable)
- M1: Tier 1 core loop. DONE.
- M2: Tier 2 heat system. DONE.
- M3: Tier 3 logistics. DONE.
- M4: Ascend / prestige. DONE.
- M5: Tier 4 rivals.
- M6: Polish, achievements, balance.

## Prompt for Fable (paste with index.html)
> Here is my Dyson Swarm idle game (index.html) and its spec. Read both. Implement Milestone 2, the Heat system, in the same style: data driven, delta time, same section layout. Every building produces heat. Radiators are a new building that removes heat. If heat exceeds capacity, throttle total output smoothly instead of stopping it. Show a heat bar. Keep the game working and bump SAVE_VERSION with a migration. Return the full updated file and a short note for PROGRESS.md.

## Prompt for Gemini / Cursor (paste with index.html)
> Here is my Dyson Swarm idle game and its spec. Do not change the engine math. Improve only the UI: nicer visuals, subtle animations on purchase, a tier banner, and better mobile layout. Keep it a single file. Tell me every section you touched.

## Using the limited Fable access
- Give Fable one milestone at a time, with the full file.
- Ask for the full file back so nothing is lost if you run out.
- Save the file and `PROGRESS.md` after every milestone.

## Ideas backlog
From the AdVenture Capitalist breakdown. Not planned yet.
- Balance ratios (predator and prey): a support ratio between building types. Could shape M5 rivals. Heat already does a similar job.
- Grid placement with adjacency bonuses: needs a whole new UI and fights the simple list layout. Skipped for now.
- Managers: not needed, buildings already run on their own.

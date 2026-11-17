# Dyson Swarm

An idle game where you start with one rooftop solar panel and end up harvesting a galaxy. Like AdVenture Capitalist, but each tier adds a new mechanic.

## Play
Open `index.html` in a browser. There is no build step. The whole game is that one file.

## Files
- `index.html`: the game (HTML, CSS, and JS in one file).
- `DYSON_SPEC.md`: design spec, rules for anyone (or any AI) editing the game, and the tier plan.
- `PROGRESS.md`: what is done, what is next, known bugs, and balance notes.
- `tests/smoke.js`: automated check that the game still works.

## Testing
```
npm install jsdom
node tests/smoke.js
```
Run this after every change. It checks buying, heat, upgrades, supply lines, Ascend, saving, offline progress, and old save migration.

## Tuning
All numbers live in the DATA section at the top of the script in `index.html`: `BUILDINGS`, `HEAT`, `UPGRADES`, `PRESTIGE`, `DM_UPGRADES`, and `ACHIEVEMENTS`.

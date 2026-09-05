# Muscle Map

Pick exercises, see where the work lands. Every muscle on the two figures heats
up in proportion to how hard the session hits it, and selecting several
exercises adds their effects together.

**[Try it →](https://rodrigohpalmeirim.github.io/muscle-map/)**

Or clone it and open `index.html` in a browser. No build step, no
dependencies, no server needed — it is plain HTML, CSS and three scripts.

## How the numbers work

Each exercise in `src/data.js` carries an activation weight per muscle:

| weight | meaning |
| --- | --- |
| 1.00 | prime mover |
| 0.50 | meaningful assistance |
| 0.25 | stabiliser or isometric hold |

A muscle's score is `sum(weight × sets)` over everything selected, so three sets
of bench press score 3.0 on the chest and 1.65 on the front delts. The figures
shade that score six ways:

- **Relative** — the hottest muscle in the session sets the top of the scale.
  Good for reading emphasis: what is this session actually about?
- **By volume** — the scale is fixed, with a muscle fully hot at 6 hard sets.
  Good for spotting muscles that are technically trained but barely touched.

The weights are considered judgements from lifting practice, not EMG
measurements. Treat them as a map, not a lab result.

## Using it

- Click an exercise to add it; use `−`/`+` in **Your session** to set how many sets.
- Hover an exercise to preview it alone on the figures.
- Hover a muscle for its score and which lifts are feeding it.
- Click a muscle — on a figure, in the ranked list, or in **Untouched** — to
  rank the library by how hard each exercise trains it. `Esc` clears that.
- The session is saved in the browser, so a reload keeps it.

## Files

| file | what it holds |
| --- | --- |
| `index.html` | page structure |
| `src/data.js` | the 20 muscle groups and 86 exercises with their weights |
| `src/figure.js` | the anatomy plate as SVG paths, authored half-width and mirrored |
| `src/app.css` | tokens, layout, the ember ramp |
| `src/app.js` | selection state, score maths, rendering |

### Adding an exercise

Append an entry to `EXERCISES` in `src/data.js` with a unique `id`, a `group`
that already exists (or a new one — groups are derived from the data), the
`gear` it needs, and weights keyed by muscle id. Nothing else needs touching.

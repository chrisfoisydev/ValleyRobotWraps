# Valley Robot Wraps

Marketing website for **Valley Robot Wraps** — a fictional company that applies
precision vinyl wraps to commercial humanoid robot fleets. Inspired by vehicle
fleet-wrap shops like Valley Fleet Wraps, but for robots: company logos, role
titles, nametags, unit IDs, and hi-vis safety graphics that boost brand
recognition and make robots easy to identify on mixed human-robot floors.

The flagship supported platform is the **Tesla Optimus** (Gen 2 & Gen 3), with
kits for other major humanoids (Figure, Agility Digit, Apptronik Apollo,
Unitree, 1X NEO).

## Site sections

- **Hero** — value proposition with a wrapped-robot illustration and fleet stats
- **Services** — full-body wraps, nametags & unit IDs, role/job graphics,
  hi-vis safety wraps, department color coding, chassis protection film
- **Why Wrap** — brand recognition, human-robot clarity, safety, asset protection
- **Process** — 3D scan → design proof → print & cut → certified install → rollout
- **Platforms** — Optimus-first template library plus other humanoids
- **Fleet Pricing** — three per-unit tiers with volume discounts
- **Testimonials & FAQ**
- **Quote form** — client-side demo handler (no backend wired up)

## Tech

Fully static site — no build step, no dependencies.

```
index.html      # single-page site
css/style.css   # all styles (responsive, reduced-motion aware)
js/main.js      # mobile nav, scroll-reveal, quote form handler
```

## Run locally

Open `index.html` directly, or serve it:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

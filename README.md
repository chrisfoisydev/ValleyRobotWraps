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

## The Wrap Experience (`experience.html`)

A scroll-driven 3D scene built with **three.js** and **GSAP ScrollTrigger**
(inspired by scrollytelling robot sites like bandinopla's Unitree demo). A
procedurally built humanoid — UNIT-042 — stands on a fixed WebGL stage while
six scroll chapters drive the story:

1. **Intro** — bare, factory-fresh robot
2. **Scan** — a cyan scan ring sweeps the chassis
3. **Wrap** — brand vinyl applies panel by panel (torso → chest → arms → thighs)
4. **Identify** — chest badge, `UNIT-042` nametag, and `LOGISTICS` role stripe fade in
5. **Protect** — lights drop to night-shift and the hi-vis bands glow
6. **Fleet Ready** — full turn, a wave, and the CTA

The camera rig, robot pose, materials, and lighting are all tweened on one
scrubbed ScrollTrigger timeline; copy panels fade with their own triggers.
Honors `prefers-reduced-motion`, falls back gracefully without WebGL.

## Tech

Fully static site — no build step, no runtime CDN dependencies
(three.js and GSAP are vendored into `js/vendor/`).

```
index.html                     # single-page marketing site
experience.html                # scroll-driven 3D wrap experience
css/style.css                  # marketing site styles
css/experience.css             # experience styles (dark, full-screen stage)
js/main.js                     # mobile nav, scroll-reveal, quote form handler
js/experience.js               # three.js scene + GSAP scroll timeline
js/vendor/                     # three.module.min.js, gsap.min.js, ScrollTrigger.min.js
```

## Run locally

Open `index.html` directly, or serve it:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

# FS Gear Calculator

[![Vite](https://img.shields.io/badge/devserver-Vite%207-blue)]() [![HTML](https://img.shields.io/badge/HTML-5-orange)]() [![JS](https://img.shields.io/badge/JavaScript-ES6-yellow)]() [![CSS](https://img.shields.io/badge/CSS-plain-blueviolet)]()

A lightweight web app for calculating gear ratios.

It includes two tools:

- **Chain (spur) gear calculator** – compute per‑stage ratios and the overall output speed for a chain of gear pairs.
- **Planetary gear calculator** – configure Sun / Carrier / Ring roles (input / output / fixed), set teeth counts and planet count, and get component speeds plus the overall ratio.

## ✨ Features

- Multi‑stage spur gear chain (add/remove stages on the fly)
- Per‑stage ratio breakdown and running product
- Output speed computed from input speed × total ratio
- Keyboard shortcut: press **Enter** to calculate
- Planetary set with role picker (global): choose **Input / Output / Fixed** among Sun, Carrier, Ring
- Supports **Sun (z_s)**, **Planet (z_p)**, **Ring (z_k)** teeth and **number of planets**
- Displays Sun / Carrier / Ring speeds and total ratio using \( K = \frac{z_k}{z_s} \)
- Zero‑dependency front‑end (plain HTML/CSS/JS), optional Vite dev server

## 📁 Project Structure

```
FS_Gear-calculator/
├── index.html
├── public/
│   ├── gear.png
│   └── planetary.html
├── src/
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── calculator.js      # Spur chain calculator UI & logic
│       └── planetary.js       # Planetary set calculator
├── package.json               # { dev: vite }
└── package-lock.json
```

## 🚀 Getting Started

### Option A — Run as plain static site

You can open `index.html` directly in a browser. No build step is strictly required.

### Option B — Use Vite dev server (recommended for local development)

1. Install Node.js 18+.
2. Install deps:
   ```bash
   npm install
   ```
3. Start dev server:
   ```bash
   npm run dev
   ```
   Then open the printed local URL.

> **Note about builds:** This project currently references files directly (e.g., `src/js/*.js`, `src/css/*.css`) from HTML.
> The dev server works out of the box. For a production bundle via `npm run build`, either keep serving as static files
> **or** create a small `main.js` that `import`s your CSS and modules so Vite can include them in the bundle. (Open an issue if you'd like me to wire this up.)

## 🧮 How to Use

### Spur Chain

1. Enter **Input Speed** in min⁻¹.
2. For each stage, set **Driving** and **Driven** gear teeth.
3. Add/Remove stages as needed.
4. Click **Calculate** (or press Enter).  
   You’ll see per‑stage ratios and the **Total Ratio**; **Output Speed = Input × Total**.

### Planetary Set

1. Open **`public/planetary.html`**.
2. Choose which component is **Input**, **Output**, and **Fixed** (exactly one fixed).
3. Fill teeth counts: **z_s**, **z_p**, **z_k** and **number of planets**.
4. Click **Calculate** to see Sun/Carrier/Ring speeds and the overall ratio (using \(K = z_k/z_s\)).

## 🗺️ Roadmap

- [ ] Vite production bundle with `main.js` entry
- [ ] Persist last inputs in `localStorage`
- [ ] Export results to CSV/PNG
- [ ] Basic unit tests for ratio math
- [ ] Dark theme

## 🧑‍💻 Development Notes

- No frameworks; everything is in `src/js` and `src/css`.
- Keep DOM selectors in sync with `index.html` / `public/planetary.html` if you edit UI.
- Planetary calculator uses the classic relation \( K = z_k / z_s \) and role constraints to compute component speeds.

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/your-thing`)
3. Commit changes (`git commit -m "Add your-thing"`)
4. Push and open a pull request

## 📜 License

MIT License

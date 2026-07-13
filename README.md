# Typing Speed Test

[![License: MIT](https://img.shields.io/badge/license-MIT-brightgreen.svg)](LICENSE)

An elegant, lightweight typing-speed tester built with vanilla JavaScript, HTML, and CSS. Designed for fast local usage and easy deployment as a static site (GitHub Pages, Netlify, Vercel).

Table of contents

- [Demo](#demo)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [Usage](#usage)
- [Project structure](#project-structure)
- [Customization](#customization)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

Demo

- Live demo: enable GitHub Pages to publish from the `main` branch (root).

Features

- Timed tests (15s, 30s, 60s, 120s)
- Fixed-word tests (10, 25, 50, 100)
- Custom text mode for personal passages
- Live telemetry: per-key events, accuracy, and WPM
- Results visualization using Chart.js (CDN)

Tech stack

- HTML5, CSS3
- Vanilla JavaScript (ES modules)
- Chart.js (loaded from CDN)

Quick start

1. Clone the repository:

```bash
git clone https://github.com/GaLiLeo200/Typing-Speed-Test.git
cd Typing-Speed-Test
```

2. Serve the project locally (recommended for ES modules):

```bash
python -m http.server 8000
# or
npx http-server .

# then open http://localhost:8000 in your browser
```

Usage

- Choose a mode in the header: `time`, `words`, or `custom`.
- Use the settings modal to change timer duration or theme.
- Start typing — the test begins on your first character input.
- Press `Tab` to quickly restart a test.

Project structure

- `index.html` — application entry point
- `css/style.css` — styling and themes
- `js/` — JavaScript modules
	- `main.js` — app orchestrator
	- `WordManager.js` — word rendering and input handling
	- `UIController.js` — caret, focus mode, results UI
	- `Telemetry.js` — event tracking and metrics
	- `words.js` — word lists and helper generators

Customization

- Replace or extend `js/words.js` to modify the vocabulary.
- Adjust CSS variables in `css/style.css` to fine-tune colors and spacing.

Development

- No build step required. Edit files directly and reload the browser.
- Use a local static server during development for consistent ES module behavior.

Deployment

- Host as a static site. To publish via GitHub Pages:
	1. Go to repository Settings → Pages
	2. Select branch `main` and folder `/ (root)`
	3. Save and wait a minute for the site to publish

Contributing

- Contributions are welcome via issues and pull requests. Provide a clear description and short test steps for changes.

License

- MIT — see `LICENSE` for details.

Contact

- Open an issue in this repository for questions or feature requests.


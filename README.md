# Data Mastery Dashboard (Local Dev)

This workspace contains a static single-page dashboard (`index.html`) and a small Node/Express proxy to securely call the Google Generative Language API.

## Quick start

1. Install Node dependencies:

```bash
npm install
```

2. Set the generative API key in your environment:

- Windows (PowerShell):

```powershell
$env:GENERATIVE_API_KEY = "your_api_key_here"
npm start
```

- macOS / Linux:

```bash
export GENERATIVE_API_KEY="your_api_key_here"
npm start
```

3. Open http://localhost:3000 in your browser.

## What changed

- `app.js`: refactored client JS, added `localStorage` persistence, improved error handling, and updated AI call to POST `/api/generate`.
- `server.js`: Express server that serves the static files and proxies AI requests.
- `package.json`: project manifest to run the server.

## Notes

- Keep your API key secret. Do not commit `.env` files with secrets.
- For production, consider rate-limiting and additional validation on the server endpoint.

## Deploy to GitHub Pages (one-click deploy via Actions)

1. Create a new GitHub repository and push this project to the `main` branch:

```bash
git init
git add .
git commit -m "Initial"
git branch -M main
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

2. The included GitHub Actions workflow (.github/workflows/deploy.yml) will publish the repository root to the `gh-pages` branch automatically when you push to `main`.

3. After the action completes, enable GitHub Pages in your repository settings (or use the published `gh-pages` branch) and your site will be available at `https://YOUR_USERNAME.github.io/YOUR_REPO/`.

4. On iPhone, open that URL in Safari and use "Add to Home Screen" to use the app in standalone mode (uses `manifest.json` and mobile meta tags).

## UI suggestions — modern & professional

- Use a neutral dark palette with an accent color (already added via CSS variables).
- Add subtle glass blur backgrounds and consistent spacing; use `rem` units for scalable layout.
- Consider replacing generic icons with an icon set (Heroicons or Feather) and using SVGs for crispness.
- Use a slightly larger base font-size (16px) and increase touch-targets on mobile (we increased checkbox sizes and padding).
- Add micro-interactions: small hover lifts, progress animations, and success toasts when a week completes.

If you want, I can:
- (A) Polish visuals with SVG icons and animations, or
- (B) Create a simple logo and social-open graph image for GitHub Pages, or
- (C) Push the repo for you (you must provide a GitHub repo URL or grant access).

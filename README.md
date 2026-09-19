# Sprout — install on Home Screen

## Why it did not open from the Home Screen

1. **Must be hosted on HTTPS** (not opened as a local `file://` from Files / Downloads).  
   iOS and Android only treat a page as a real app when it is served over HTTPS.
2. The old package used only emoji/SVG data-URI icons. Many phones need real **PNG icons** (192×192 and 512×512).
3. There was **no service worker**, so browsers often treated the shortcut as a plain bookmark instead of a standalone app.
4. `start_url` / `scope` were incomplete, so tapping the icon could open the wrong place or fail.

## What this package includes

| File | Purpose |
|------|---------|
| `index.html` | The app |
| `manifest.json` | Name, icons, start URL, standalone display |
| `sw.js` | Service worker — offline + installability |
| `icon-180.png` | iOS home-screen icon |
| `icon-192.png` | Android / Chrome install icon |
| `icon-512.png` | High-res / splash icon |

## How to host (required)

Upload **all** files in this folder to any free HTTPS host, for example:

- [Netlify Drop](https://app.netlify.com/drop) — drag the folder
- [GitHub Pages](https://pages.github.com/)
- [Cloudflare Pages](https://pages.cloudflare.com/)
- Any static host with HTTPS

After upload, open the site in **Safari (iPhone)** or **Chrome (Android)**.

### Add to Home Screen

**iPhone (Safari only)**  
1. Open the hosted URL in Safari  
2. Tap Share → **Add to Home Screen**  
3. Confirm. The Sprout icon appears.  
4. Open it from the home screen — it runs full-screen (no browser chrome).

**Android (Chrome)**  
1. Open the hosted URL in Chrome  
2. Menu → **Install app** / **Add to Home screen**  
3. Or wait for the install banner.

## Google “look this up”

When you type things like:

- `Look this up: weather today`
- `What is photosynthesis`
- `Search for healthy habits`

Sprout opens **Google** with that query (new tab or same tab if pop-ups are blocked).  
That is intentional: the companion stays private and on-device; web facts go through Google when you ask.

Your conversations, streak, and memories stay in **localStorage on your device only**. They are not sent anywhere.

## Daily growth

The app already tracks:

- Day streak  
- Total days  
- Plant stage (Seed → Legendary)

Open it once per day and the streak / plant update automatically. No Google account or daily download is required for that.

## Updating the app later

When you change files on the host, the service worker will pick up the new `index.html` on the next visit (network-first for HTML). Users may need to close and reopen the home-screen app once after a big update.

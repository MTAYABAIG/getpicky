# Picky — website

Static marketing + support site for the Picky Chrome extension. Plain HTML/CSS, no build step.

## Pages
- `index.html` — landing page (use as the **Homepage URL** in the Chrome Web Store listing)
- `support.html` — support + FAQ (use as the **Support URL**)
- `privacy.html` — privacy policy (use as the **Privacy Policy URL**, required by Chrome)

## Preview locally
Just open `index.html` in a browser, or serve the folder:

```bash
npx serve .
# or
python -m http.server 8000
```

## Deploy
Upload the contents of this folder to any static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages, or your own server). No configuration needed.

## To customize
- Brand colors live in `:root` at the top of `styles.css` (coral accent `#ff8366`, matching the extension).
- Support email is `mtayyabbaig26@gmail.com` — search the HTML files to change it.
- Replace `assets/icon-128.png` / `assets/icon-32.png` with updated logos if needed.
- Update the "Add to Chrome" links (`#install`) with the real Web Store URL once published.

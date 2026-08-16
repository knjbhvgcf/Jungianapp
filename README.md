# Jung Functions

A free React + Vite quiz that scores Carl Jung’s eight cognitive functions (Ni, Ne, Si, Se, Ti, Te, Fi, Fe) and suggests a likely type. Everything runs in the browser — no account, no backend, no paid APIs.

## Local development

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

```bash
npm run build
npm run preview
```

`dist/` is a static site you can host anywhere.

## Free hosting

Pick one. All of these have a free tier and work with this project:

1. **Cloudflare Pages** — import the GitHub repo, build command `npm run build`, output directory `dist`.
2. **Netlify** — same build settings, or drag the `dist` folder onto [Netlify Drop](https://app.netlify.com/drop).
3. **Vercel** — import the repo; `vercel.json` already rewrites routes to `index.html`.

After you have a live URL, replace `YOUR_DOMAIN` in `public/robots.txt` and `public/sitemap.xml`.

## Full map (optional paid unlock)

The quiz stays free. The map is a one-time unlock of a longer Beebe reading.

1. Create a Lemon Squeezy or Stripe Payment Link.
2. Set the success URL to `https://YOUR_DOMAIN/dossier?key=YOUR-KEY`.
3. Copy `.env.example` to `.env` and fill in:

```
VITE_DOSSIER_CHECKOUT_URL=https://your-payment-link
VITE_DOSSIER_UNLOCK_KEYS=YOUR-KEY
VITE_DOSSIER_PRICE=$7
```

## Compatibility add-on (separate paid unlock)

Compatibility is not included in the map. It is a second product with its own checkout and keys.

1. Create a second Payment Link.
2. Set the success URL to `https://YOUR_DOMAIN/compatibility?key=YOUR-COMPAT-KEY`.
3. Add to `.env`:

```
VITE_COMPAT_CHECKOUT_URL=https://your-compat-payment-link
VITE_COMPAT_UNLOCK_KEYS=YOUR-COMPAT-KEY
VITE_COMPAT_PRICE=$4
```

Keys are checked in the browser, so treat them like a shared coupon, not a secret API token. A map key will not open compatibility, and a compatibility key will not open the map. In local development, each page has a **Preview unlock** button.

## Project layout

```
src/
  components/   reusable UI
  data/         functions, questions, type stacks
  lib/          scoring and session storage
  pages/        Home, Quiz, Results, Dossier, Compatibility, About
```

Questions are original Likert items (four per function). Type matching weights the classic four-function stack. This is an educational tool, not the MBTI® instrument and not a clinical test.

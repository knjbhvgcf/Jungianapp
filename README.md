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

## Analytics (how many people take the quiz)

Use **Cloudflare Web Analytics**. It is free, has no visitor cap, and does not store quiz answers.

`jungianapp.pages.dev` is not a hostname you own, so **Add a site** in Web Analytics will say it does not belong to your account. Enable it from the Pages project instead:

1. Cloudflare dashboard → **Workers & Pages** → the **jungianapp** project.
2. Open **Metrics** and select **Enable** under Web Analytics.
3. Trigger a new deploy (or **Retry deployment**) so Cloudflare can insert the snippet.
4. Open **Analytics & Logs** → **Web Analytics** and select the Pages project.
5. Filter by path:
   - `/quiz` — people who opened the test
   - `/results` — people who finished it

If Metrics has no Enable button, add the JS snippet yourself:

1. **Analytics & Logs** → **Web Analytics** → **Add a site**.
2. Type `jungianapp.pages.dev`, then pick the option to **install the JS snippet** (not automatic hostname setup).
3. Copy the `token` from the snippet: `data-cf-beacon='{"token": "THIS-PART"}'`.
4. In the Pages project → **Settings** → **Environment variables**, add `VITE_CF_BEACON_TOKEN` with that token for Production.
5. Redeploy. Vite only picks up the token at build time.

Leave the variable empty locally so your own clicks are not counted.

## Your Type in Depth (optional paid unlock)

The quiz stays free. Your Type in Depth is a one-time unlock of a longer Beebe reading at `/type-in-depth`.

1. Create a Lemon Squeezy or Stripe Payment Link.
2. Set the success URL to `https://YOUR_DOMAIN/type-in-depth?key=YOUR-KEY`.
3. Copy `.env.example` to `.env` and fill in:

```
VITE_DOSSIER_CHECKOUT_URL=https://your-payment-link
VITE_DOSSIER_UNLOCK_KEYS=YOUR-KEY
VITE_DOSSIER_PRICE=$3
```

Old `/dossier` links redirect to `/type-in-depth`.

## Compatibility add-on (separate paid unlock)

Compatibility is not included in Your Type in Depth. It is a second product with its own checkout and keys.

1. Create a second Payment Link.
2. Set the success URL to `https://YOUR_DOMAIN/compatibility?key=YOUR-COMPAT-KEY`.
3. Add to `.env`:

```
VITE_COMPAT_CHECKOUT_URL=https://your-compat-payment-link
VITE_COMPAT_UNLOCK_KEYS=YOUR-COMPAT-KEY
VITE_COMPAT_PRICE=$1
```

Keys are checked in the browser, so treat them like a shared coupon, not a secret API token. A Type in Depth key will not open compatibility, and a compatibility key will not open Your Type in Depth. In local development, each page has a **Preview unlock** button.

## Project layout

```
src/
  components/   reusable UI
  data/         functions, questions, type stacks
  lib/          scoring and session storage
  pages/        Home, Quiz, Results, Dossier, Compatibility, About
```

Questions are original Likert items (four per function). Type matching weights the classic four-function stack. This is an educational tool, not the MBTI® instrument and not a clinical test.

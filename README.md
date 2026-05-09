# Open League Scout

A shareable player scouting dashboard for The Open League, deployable on Vercel.

## How it works

- A Next.js serverless API route (`/api/players`) proxies requests to `prod.api.theopenleague.com` using your session cookie stored as an environment variable.
- The frontend fetches from `/api/players` and renders a filterable, sortable player grid.
- Since the cookie lives in Vercel's env vars (never exposed to the browser), it's safe to share the URL with others.

## Deploy to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "init"
gh repo create open-league-scout --public --push --source=.
```

Or manually create a repo on github.com and push.

### 2. Import into Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. Framework preset will auto-detect as **Next.js**
4. Click **Deploy** — but first, add the environment variable below

### 3. Add your cookie as an environment variable

In Vercel → your project → **Settings → Environment Variables**:

| Name | Value |
|------|-------|
| `OPEN_LEAGUE_COOKIE` | `s....` |

Paste only the cookie **value** (everything after `connect.sid=`), or paste the full `connect.sid=...` string — the API route handles both.

### 4. Redeploy

After adding the env var, trigger a redeploy:

```
Vercel dashboard → Deployments → ⋯ → Redeploy
```

Your dashboard is now live and shareable.

## Updating your cookie

When your session expires, update `OPEN_LEAGUE_COOKIE` in Vercel Settings and redeploy. To get a fresh cookie:

```bash
# Open devtools on theopenleague.com → Application → Cookies → connect.sid
# Or re-run your curl and grab the new value
```

## Local development

```bash
npm install
# Create .env.local
echo 'OPEN_LEAGUE_COOKIE=your_cookie_value_here' > .env.local
npm run dev
# Visit http://localhost:3000
```

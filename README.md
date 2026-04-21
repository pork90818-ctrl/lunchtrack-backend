# LunchTrack Backend

Proxy server that fetches school lunch menu data from Nutrislice and returns it to the LunchTrack app. Caches results for 1 hour so Nutrislice isn't hit on every request.

## API

### GET /menu
Fetch a school's lunch menu for the current week.

**Params:**
- `district` — Nutrislice district identifier (e.g. `vanburenschools`)
- `school` — School slug (e.g. `belleville-high-school`)

**Example:**
```
GET /menu?district=vanburenschools&school=belleville-high-school
```

Returns the full Nutrislice JSON with days, menu items, and nutrition info.

### GET /health
Returns `{ "status": "ok" }` — use this to check the server is running.

---

## Deploy to Railway (free, ~5 minutes)

Railway is the easiest way to host this. Free tier is enough to start.

1. Go to https://railway.app and sign up with GitHub
2. Click **New Project → Deploy from GitHub repo**
3. Push this folder to a GitHub repo first:
   ```bash
   git init
   git add .
   git commit -m "initial commit"
   # create a repo on github.com, then:
   git remote add origin https://github.com/YOURUSERNAME/lunchtrack-backend.git
   git push -u origin main
   ```
4. Select your repo in Railway
5. Railway auto-detects Node.js and runs `npm start`
6. Click **Generate Domain** to get a public URL like:
   `https://lunchtrack-backend-production.up.railway.app`

That URL is your backend. Paste it into the frontend app.

---

## Connect to the frontend

In `lunchtrack.html`, find this line:
```js
const BACKEND = 'YOUR_RAILWAY_URL_HERE';
```
Replace with your Railway URL, e.g.:
```js
const BACKEND = 'https://lunchtrack-backend-production.up.railway.app';
```

The frontend then calls:
```
GET {BACKEND}/menu?district=vanburenschools&school=belleville-high-school
```

---

## Adding more schools

Schools using Nutrislice follow this URL pattern:
```
https://{district}.nutrislice.com/menu/{school-slug}
```

To find a school's district and slug, visit their Nutrislice page and read the URL.

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
};

function getDateParts() {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: String(now.getMonth() + 1).padStart(2, '0'),
    day: String(now.getDate()).padStart(2, '0'),
  };
}

async function tryFetch(url) {
  const res = await fetch(url, { headers: { ...HEADERS, 'Referer': url, 'Origin': new URL(url).origin } });
  console.log(`  ${res.status} ${url}`);
  return res;
}

app.get('/menu', async (req, res) => {
  const { district, school } = req.query;

  if (!district || !school) return res.status(400).json({ error: 'Missing district or school' });
  if (!/^[a-z0-9-]+$/i.test(district) || !/^[a-z0-9-]+$/i.test(school)) return res.status(400).json({ error: 'Invalid parameters' });

  const cacheKey = `${district}|${school}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`Cache hit: ${cacheKey}`);
    return res.json(cached.data);
  }

  const { year, month, day } = getDateParts();
  const base = `https://${district}.api.nutrislice.com`;

  const urlsToTry = [
    `${base}/menu/api/weeks/school/${school}/menu-type/lunch/${year}/${month}/${day}/`,
    `${base}/menu/api/weeks/school/${school}/menu-type/lunch/`,
    `${base}/menu/api/weeks/school/${school}/menu-type/lunch/${year}/${month}/01/`,
  ];

  console.log(`Trying ${urlsToTry.length} URLs for ${district}/${school}`);

  for (const url of urlsToTry) {
    try {
      const response = await tryFetch(url);
      if (response.ok) {
        const data = await response.json();
        cache.set(cacheKey, { data, timestamp: Date.now() });
        console.log(`Success with: ${url}`);
        return res.json(data);
      }
    } catch (err) {
      console.log(`  Error: ${err.message}`);
    }
  }

  res.status(404).json({ error: 'Could not fetch menu — all URL formats returned errors' });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`LunchTrack backend running on port ${PORT}`));

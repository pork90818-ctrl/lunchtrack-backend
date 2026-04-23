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
  'X-Requested-With': 'XMLHttpRequest',
};

function getDateParts() {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: String(now.getMonth() + 1).padStart(2, '0'),
    day: String(now.getDate()).padStart(2, '0'),
  };
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

  const urlsToTry = [
    // Non-api subdomain (what the browser actually uses)
    `https://${district}.nutrislice.com/menu/${school}/lunch/api/weeks/`,
    `https://${district}.nutrislice.com/menu/${school}/lunch/api/weeks/${year}/${month}/${day}/`,
    // api subdomain with date
    `https://${district}.api.nutrislice.com/menu/api/weeks/school/${school}/menu-type/lunch/${year}/${month}/${day}/`,
    // api subdomain without date
    `https://${district}.api.nutrislice.com/menu/api/weeks/school/${school}/menu-type/lunch/`,
  ];

  for (const url of urlsToTry) {
    try {
      console.log(`Trying: ${url}`);
      const response = await fetch(url, {
        headers: {
          ...HEADERS,
          'Referer': `https://${district}.nutrislice.com/`,
          'Origin': `https://${district}.nutrislice.com`,
        }
      });
      console.log(`  Status: ${response.status}`);
      if (response.ok) {
        const data = await response.json();
        cache.set(cacheKey, { data, timestamp: Date.now() });
        console.log(`  Success!`);
        return res.json(data);
      }
    } catch (err) {
      console.log(`  Error: ${err.message}`);
    }
  }

  res.status(404).json({
    error: 'Could not fetch menu from Nutrislice',
    hint: 'Check Railway logs to see which URLs were tried'
  });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => console.log(`LunchTrack backend running on port ${PORT}`));

// Handle Railway shutdown signals gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});

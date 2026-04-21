const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000;

app.get('/menu', async (req, res) => {
  const { district, school } = req.query;

  if (!district || !school) {
    return res.status(400).json({ error: 'Missing district or school parameter' });
  }

  if (!/^[a-z0-9-]+$/i.test(district) || !/^[a-z0-9-]+$/i.test(school)) {
    return res.status(400).json({ error: 'Invalid characters in parameters' });
  }

  const cacheKey = `${district}|${school}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`Cache hit: ${cacheKey}`);
    return res.json(cached.data);
  }

  const url = `https://${district}.api.nutrislice.com/menu/api/weeks/school/${school}/menu-type/lunch/`;
  console.log(`Fetching: ${url}`);

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'LunchTrack/1.0' }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Nutrislice returned ${response.status}` });
    }

    const data = await response.json();
    cache.set(cacheKey, { data, timestamp: Date.now() });
    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch from Nutrislice' });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`LunchTrack backend running on port ${PORT}`));


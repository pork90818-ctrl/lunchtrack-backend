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
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': `https://${district}.nutrislice.com/`,
        'Origin': `https://${district}.nutrislice.com`,
      }
    });
 
    console.log(`Nutrislice status: ${response.status}`);
 
    if (!response.ok) {
      return res.status(response.status).json({ error: `Nutrislice returned ${response.status}` });
    }
 
    const data = await response.json();
    cache.set(cacheKey, { data, timestamp: Date.now() });
    res.json(data);
 
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch from Nutrislice', detail: err.message });
  }
});
 
app.get('/health', (req, res) => res.json({ status: 'ok' }));
 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`LunchTrack backend running on port ${PORT}`));
 

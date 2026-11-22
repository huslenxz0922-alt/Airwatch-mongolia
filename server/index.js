import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pg from 'pg';

const app = express();
const port = Number(process.env.PORT || 4000);
const pool = process.env.DATABASE_URL
  ? new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false })
  : null;
const OPENAQ_BASE = 'https://api.openaq.org/v3';
const OPENAQ_KEY = process.env.OPENAQ_API_KEY;
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

async function cached(key, loader) {
  const saved = cache.get(key);
  if (saved && Date.now() - saved.time < CACHE_TTL) return saved.value;
  const value = await loader();
  cache.set(key, { time: Date.now(), value });
  return value;
}

async function openaq(path) {
  if (!OPENAQ_KEY) {
    const error = new Error('OPENAQ_API_KEY is not configured. Add it to your server .env file.');
    error.status = 503;
    throw error;
  }
  const response = await fetch(`${OPENAQ_BASE}${path}`, {
    headers: { 'X-API-Key': OPENAQ_KEY, accept: 'application/json' },
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) {
    const error = new Error(`OpenAQ API returned HTTP ${response.status}`);
    error.status = response.status === 429 ? 503 : response.status;
    throw error;
  }
  return response.json();
}

async function getMongoliaLocations() {
  return cached('openaq:mn:locations', async () => {
    const payload = await openaq('/locations?iso=MN&limit=100&page=1');
    return (payload.results || []).map((location) => ({
      id: String(location.id),
      name: location.name || location.locality || 'Нэргүй станц',
      city: location.locality || location.country?.name || 'Монгол',
      latitude: location.coordinates?.latitude,
      longitude: location.coordinates?.longitude,
      source: location.provider?.name || 'OpenAQ',
      sensors: (location.sensors || []).map((sensor) => ({
        id: sensor.id,
        parameter: sensor.parameter?.name,
        displayName: sensor.parameter?.displayName || sensor.parameter?.name,
        unit: sensor.parameter?.units
      }))
    })).filter((location) =>
      Number.isFinite(location.latitude) &&
      Number.isFinite(location.longitude)
    );
  });
}

async function getLatestMeasurements() {
  return cached('openaq:mn:latest', async () => {
    const stations = await getMongoliaLocations();
    const queue = [...stations];
    const output = [];
    const workers = Array.from({ length: Math.min(6, queue.length) }, async () => {
      while (queue.length) {
        const station = queue.shift();
        try {
          const payload = await openaq(`/locations/${encodeURIComponent(station.id)}/latest?limit=100&page=1`);
          const sensorById = new Map(station.sensors.map((sensor) => [sensor.id, sensor]));
          for (const item of payload.results || []) {
            const sensor = sensorById.get(item.sensorsId);
            if (!sensor || !Number.isFinite(item.value)) continue;
            output.push({
              id: `${station.id}-${item.sensorsId}`,
              stationId: station.id,
              stationName: station.name,
              parameter: sensor.displayName,
              value: item.value,
              unit: sensor.unit,
              measuredAt: item.datetime?.utc || null,
              source: station.source,
              provider: 'OpenAQ'
            });
          }
        } catch (error) {
          console.error(`OpenAQ latest failed for location ${station.id}:`, error.message);
        }
      }
    });
    await Promise.all(workers);
    return output;
  });
}

app.get('/api/v1/health', async (_req, res) => {
  let database = 'not_configured';
  if (pool) {
    try { await pool.query('SELECT 1'); database = 'connected'; }
    catch { database = 'unavailable'; }
  }
  res.json({
    status: 'ok',
    service: 'airwatch-api',
    database,
    openaq: OPENAQ_KEY ? 'configured' : 'missing_api_key',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/stations', async (_req, res) => {
  try {
    const data = await getMongoliaLocations();
    res.json({ data, meta: { count: data.length, provider: 'OpenAQ', retrievedAt: new Date().toISOString() } });
  } catch (error) {
    res.status(error.status || 502).json({ error: 'AIR_QUALITY_PROVIDER_UNAVAILABLE', message: error.message });
  }
});

app.get('/api/v1/measurements/latest', async (_req, res) => {
  try {
    const data = await getLatestMeasurements();
    res.json({ data, meta: { count: data.length, provider: 'OpenAQ', retrievedAt: new Date().toISOString() } });
  } catch (error) {
    res.status(error.status || 502).json({ error: 'AIR_QUALITY_PROVIDER_UNAVAILABLE', message: error.message });
  }
});

app.use((req, res) => res.status(404).json({ error: 'NOT_FOUND', path: req.path }));
app.listen(port, () => console.log(`AirWatch API listening on ${port}`));
process.on('SIGTERM', async () => { if (pool) await pool.end(); process.exit(0); });

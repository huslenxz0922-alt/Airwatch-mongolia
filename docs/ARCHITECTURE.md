# System architecture

## Components
- Web: React + TypeScript + Vite; displays station and measurement data.
- API: Express REST API under /api/v1.
- Storage: PostgreSQL with PostGIS for station geospatial data.
- Providers: provider adapters normalize external payloads before storage.

## Data flow
1. Provider adapter fetches data under documented provider terms.
2. Validate station, parameter, value, unit, timestamp and source.
3. Persist valid records in PostgreSQL.
4. API returns latest readings with original source and measurement time.
5. UI displays values only when real records exist.

## Data integrity
- Never label generated/sample values as live.
- Preserve source attribution, units and original measurement time.
- Reject invalid coordinates, negative pollutant values and unsupported parameters.
- Define freshness thresholds before showing stale/fresh labels.
- Keep provider secrets on the server, never in Vite client variables.

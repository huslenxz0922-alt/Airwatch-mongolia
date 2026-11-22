# API reference

Base path: /api/v1

## GET /health
Returns API status, database connection status and server timestamp.

## GET /stations
Returns active monitoring stations. If the database is not configured, returns an empty array with an explanatory metadata message.

## GET /measurements/latest
Returns the newest measurement for each station and pollutant parameter. Records include value, unit, source and measuredAt. No demo readings are generated.

## Errors
Errors return a JSON object with a stable error code and an appropriate HTTP status.

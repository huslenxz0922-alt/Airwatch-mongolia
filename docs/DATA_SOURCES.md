# Data source integration

## OpenAQ v3
The backend reads Mongolia locations from `GET https://api.openaq.org/v3/locations?iso=MN&limit=100&page=1` and latest values from `GET /v3/locations/{location_id}/latest`.

Authentication uses the `X-API-Key` header. Store the key only in the server-side `OPENAQ_API_KEY` environment variable. Never expose it through a Vite `VITE_*` variable or commit it to Git.

Get an API key at https://explore.openaq.org/ . See https://docs.openaq.org/using-the-api/quick-start and https://docs.openaq.org/resources/locations.

The server caches provider responses for five minutes and returns source, unit and measurement timestamp. The provider's data coverage is not comprehensive; an empty response means no matching OpenAQ records were returned, not that Mongolia has no monitoring stations.

## Official Mongolian source
The official public portal is https://agaar.gov.mn/. Its public data interface must be confirmed before implementing an adapter. Do not scrape undocumented endpoints or assume that website data is an authorized API. The public portal reports official real-time station data; integration is pending endpoint/terms verification.

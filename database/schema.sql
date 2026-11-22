CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS stations (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), external_id TEXT UNIQUE, name TEXT NOT NULL,
 city TEXT NOT NULL DEFAULT 'Ulaanbaatar', latitude DOUBLE PRECISION NOT NULL CHECK(latitude BETWEEN -90 AND 90),
 longitude DOUBLE PRECISION NOT NULL CHECK(longitude BETWEEN -180 AND 180),
 location GEOGRAPHY(POINT,4326), source TEXT NOT NULL, is_active BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS stations_location_gix ON stations USING GIST(location);
CREATE TABLE IF NOT EXISTS measurements (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
 parameter TEXT NOT NULL CHECK(parameter IN ('PM1','PM2.5','PM10','NO2','SO2','CO','O3')),
 value DOUBLE PRECISION NOT NULL CHECK(value>=0), unit TEXT NOT NULL, measured_at TIMESTAMPTZ NOT NULL,
 source TEXT NOT NULL, source_record_id TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 UNIQUE(station_id,parameter,measured_at,source)
);
CREATE INDEX IF NOT EXISTS measurements_station_time_idx ON measurements(station_id,measured_at DESC);
CREATE INDEX IF NOT EXISTS measurements_parameter_time_idx ON measurements(parameter,measured_at DESC);
CREATE TABLE IF NOT EXISTS data_sources (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL UNIQUE, base_url TEXT,
 attribution TEXT NOT NULL, terms_url TEXT, is_verified BOOLEAN NOT NULL DEFAULT FALSE,
 last_success_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE OR REPLACE FUNCTION set_station_geography() RETURNS TRIGGER AS $$
BEGIN NEW.location:=ST_SetSRID(ST_MakePoint(NEW.longitude,NEW.latitude),4326)::geography;NEW.updated_at:=NOW();RETURN NEW;END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS stations_geography_trigger ON stations;
CREATE TRIGGER stations_geography_trigger BEFORE INSERT OR UPDATE OF latitude,longitude ON stations
FOR EACH ROW EXECUTE FUNCTION set_station_geography();

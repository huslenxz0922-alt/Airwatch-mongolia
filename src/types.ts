export type Station = { id: string; name: string; city: string; latitude: number; longitude: number; source: string; sensors?: { id: number; parameter: string; displayName: string; unit: string }[] };
export type Measurement = { id: string; stationId: string; stationName: string; parameter: string; value: number; unit: string; measuredAt: string; source: string; provider: string };

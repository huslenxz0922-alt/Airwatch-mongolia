# AirWatch Mongolia 🇲🇳

**Монгол Улсын агаарын чанарын мэдээллийг нэг дороос хянах нээлттэй веб платформ.**

AirWatch Mongolia нь хэмжилтийн эх сурвалж, байршил, хугацаа, нэгж болон өгөгдлийн шинэчлэлтийг ил тод харуулах зорилготой.

> **Өгөгдлийн зарчим:** Баталгаажсан provider холбогдоогүй үед систем бодит хэмжилт зохиомлоор харуулахгүй. Хоосон төлөвийг ил тод үзүүлнэ.

## Features
- Агаарын чанарын dashboard (PM2.5, PM10, NO₂, SO₂)
- OpenStreetMap дээр станцын байршил харах
- Express REST API
- PostgreSQL + PostGIS schema
- Source, unit, timestamp хадгалах өгөгдлийн загвар
- GitHub Actions build/typecheck workflow

## Tech stack
React · TypeScript · Vite · Leaflet · Node.js · Express · PostgreSQL · PostGIS

## Run locally
Requirements: Node.js 20+ and npm.

```bash
npm install
cp .env.example .env
npm run dev
```

Windows PowerShell:
```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

Web: http://localhost:5173  
API health: http://localhost:4000/api/v1/health

## Data providers
- Монгол Улсын агаарын чанарын мэдээллийн портал: https://agaar.gov.mn/
- OpenAQ API documentation: https://docs.openaq.org/

Provider integration хийхийн өмнө API endpoint, эрх, хамрах хүрээ, лиценз болон attribution нөхцөлийг шалгана. Одоогоор provider integration хийгдээгүй.

## Project structure
- src/ — React frontend
- server/ — Express API
- database/ — PostgreSQL/PostGIS schema
- docs/ — architecture and API docs
- .github/workflows/ — CI pipeline

## Status
Энэ нь хөгжүүлэлтийн эхний суурь хувилбар. Dashboard, API болон database scaffold нэмэгдсэн. Баталгаажсан бодит өгөгдлийн интеграци, хэрэглэгчийн бүртгэл, түүхэн график болон production deployment дараагийн шатанд хийгдэнэ.

## Scripts
- npm run dev — frontend + backend
- npm run build — production frontend build
- npm run typecheck — TypeScript шалгалт
- npm run start:server — API server

## License
MIT. See [LICENSE](LICENSE).

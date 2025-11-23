# Warehouse WMS - Systém správy skladu

Kompletní řešení pro správu skladových rolí materiálu s mobilní aplikací a REST API backendem.

## 📋 Přehled

Systém umožňuje:
- **Příjem rolí** - naskenování EAN kódu, vyplnění údajů, umístění na kolejnici
- **Přesuny** - rychlé přemístění role mezi kolejnicemi
- **Odebrání** - označení role jako odebrané ze skladu
- **Vyhledávání** - fulltext podle EAN, názvu, filtry
- **Historie** - kompletní auditní stopa všech pohybů
- **Vizuální mapa** - grafický přehled kolejnic a obsazenosti
- **Export** - CSV snapshot + NDJSON event stream pro integraci

## 🏗️ Architektura

```
warehouse-wms/
├── backend/          # Node.js + Express + PostgreSQL + Prisma
│   ├── src/
│   │   ├── index.ts
│   │   └── routes/   # API endpointy
│   ├── prisma/
│   │   └── schema.prisma
│   └── docker-compose.yml
│
└── mobile/           # React Native (Expo) aplikace
    ├── App.tsx
    ├── screens/      # UI obrazovky
    ├── services/     # API klient
    └── contexts/     # Auth context
```

### Technologie

**Backend:**
- Node.js 20+ + TypeScript
- Express - REST API framework
- Prisma - ORM
- PostgreSQL 16 - relační databáze
- Docker - kontejnerizace

**Mobile:**
- React Native + Expo
- TypeScript
- React Navigation
- Expo Camera - skenování EAN
- AsyncStorage - lokální persistence

## 🚀 Quick Start

### Předpoklady

- Node.js 18+
- Docker & Docker Compose
- npm nebo yarn
- Expo CLI (pro mobile)

### 1. Backend setup

```bash
cd backend

# Instalace závislostí
npm install

# Vytvoření .env souboru
cp .env.example .env

# Spuštění PostgreSQL
docker-compose up -d

# Migrace databáze
npm run prisma:migrate

# Seed testovacích dat
npx tsx prisma/seed.ts

# Spuštění serveru
npm run dev
```

Backend běží na `http://localhost:3000`

### 2. Mobile app setup

```bash
cd mobile

# Instalace závislostí
npm install

# Vytvoření .env souboru
cp .env.example .env

# Úprava API_URL v .env (použijte lokální IP, ne localhost)
# Např: API_URL=http://192.168.1.100:3000/api

# Spuštění aplikace
npm start
```

Poté stiskněte `i` (iOS) nebo `a` (Android) nebo naskenujte QR kód v Expo Go.

## 📱 Mobilní aplikace - Hlavní funkce

### Domovská obrazovka
- Grafická mřížka všech kolejnic (5x8)
- Barevné odlišení: prázdná (zelená), obsazená (oranžová)
- Tap na kolejnici → detail s rolemi

### Skenování EAN
- Kamera s automatickým rozpoznáním čárových kódů
- Pokud role existuje → zobrazí detail
- Pokud role neexistuje → nabídne příjem

### Vyhledávání
- Fulltext podle EAN nebo názvu materiálu
- Filtry: Aktivní / Odebrané / Vše
- Zobrazení aktuální pozice role

### Detail role
- Kompletní informace (EAN, rozměry, gramáž, dodavatel, šarže)
- Aktuální umístění na kolejnici
- Historie pohybů (timeline)
- Operace: Přesunout / Odebrat

### Příjem role
- Formulář s údaji o roli
- Vizuální výběr kolejnice z mapy
- Okamžitý sync

### Přesun role
- Výběr cílové kolejnice z grafické mapy
- Validace (nelze přesunout odstraněnou roli)
- Historie aktualizována okamžitě

## 🔌 REST API Endpointy

### Users
```
POST /api/users/register      # Registrace zařízení/uživatele
GET  /api/users/me            # Získání info o uživateli
```

### Rails (Kolejnice)
```
GET /api/rails                # Seznam všech kolejnic
GET /api/rails/:code          # Detail kolejnice
GET /api/rails/:code/inventory # Role na kolejnici
```

### Rolls (Role materiálu)
```
GET  /api/rolls               # Vyhledávání (query, status, railCode)
GET  /api/rolls/:id           # Detail + historie pohybů
POST /api/rolls/receive       # Příjem nové role
POST /api/rolls/:id/move      # Přesun role
POST /api/rolls/:id/remove    # Odebrání role
```

### Export
```
GET /api/export/snapshot.csv  # CSV export aktuálního stavu
GET /api/export/events.ndjson # NDJSON event stream
```

## 📊 Datový model

### Klíčové entity

**Warehouse** - Sklad
- id, name, zones[]

**Rail** - Kolejnice
- id, code (R-001), name
- rowIndex, colIndex, posIndex (pozice v mřížce)
- x, y, width, height (geometrie pro mapu)
- isActive

**Roll** - Role materiálu
- id, ean (unique)
- materialName, description
- widthMm, grammageGm2, color
- supplier, batchNo
- status (active, removed)

**Location** - Aktuální umístění
- rollId (PK, 1:1)
- railId (nullable při removed)
- placedAt, lastMovedAt

**Movement** - Historie pohybů (append-only)
- id, type (RECEIVE, MOVE, REMOVE)
- rollId, fromRailId, toRailId
- at (timestamp)
- userId, deviceId
- attributes (JSON pro rozšíření)

**User** - Uživatel/zařízení
- id, name, role, deviceId (unique)

## 📤 Export a integrace

### CSV Snapshot
Kompletní snapshot inventáře:
```csv
roll_id,ean,material_name,width_mm,grammage_gm2,status,rail_code,last_moved_at
123,8595000001,Papír lesklý,1200,80,active,R-012,2025-11-23T10:15:00Z
```

### NDJSON Event Stream
Append-only event log pro replikaci:
```json
{"event_id":"e-001","event_type":"ROLL_RECEIVED","occurred_at":"2025-11-23T08:15:00Z","payload":{"roll_id":"123","ean":"859...","to_rail_code":"R-012"}}
{"event_id":"e-002","event_type":"ROLL_MOVED","occurred_at":"2025-11-23T09:05:00Z","payload":{"roll_id":"123","from_rail_code":"R-012","to_rail_code":"R-020"}}
```

Stejné event schéma lze později použít pro:
- REST webhooky
- Message queue (RabbitMQ, Kafka)
- Real-time WebSocket stream

## 🔒 Bezpečnost a validace

### Transakční konzistence
- Všechny operace běží v DB transakcích
- Kontrola stavů před změnou
- Optimistické zámky (budoucí)

### Validace
- Nelze přesunout odstraněnou roli
- Varování při přesunu na již plnou kolejnici (soft limit)
- Kontrola existence EAN při příjmu

### Idempotence
- DeviceId + timestamp = idempotency key
- Prevence duplicitních zápisů

## 📈 Budoucí rozšíření

### MVP+ (Next steps)
- [ ] Offline režim v mobile (SQLite + sync queue)
- [ ] QR kódy na kolejnicích (přímé skenování pozice)
- [ ] Role a oprávnění (worker/supervisor/admin)
- [ ] Kapacitní limity na kolejnicích (hard constraints)

### Integrace
- [ ] REST webhooky (subscription na eventy)
- [ ] Message queue publikování
- [ ] Read-only API do ERP (obohacení dat)
- [ ] Telemetrie a error tracking

### UX
- [ ] Batch operace (přesun více rolí)
- [ ] Foto rolí
- [ ] Tisk štítků
- [ ] Heatmapa obsazenosti
- [ ] Kapacitní planning

## 🧪 Testování

### Backend
```bash
cd backend

# Spuštění testů (budoucí)
npm test

# Prisma Studio (prohlížení DB)
npm run prisma:studio
```

### Mobile
Testování na fyzickém zařízení s Expo Go:
1. Nainstalovat Expo Go z App Store/Google Play
2. Spustit `npm start` v mobile/
3. Naskenovat QR kód
4. Ujistit se, že API_URL používá lokální IP (ne localhost)

## 📝 Příklady použití

### Příjem role (cURL)
```bash
curl -X POST http://localhost:3000/api/rolls/receive \
  -H "Content-Type: application/json" \
  -d '{
    "ean": "8595000000001",
    "materialName": "Papír lesklý",
    "widthMm": 1200,
    "grammageGm2": 80,
    "toRailCode": "R-001",
    "userId": "user-123",
    "deviceId": "device-001"
  }'
```

### Přesun role
```bash
curl -X POST http://localhost:3000/api/rolls/{rollId}/move \
  -H "Content-Type: application/json" \
  -d '{
    "toRailCode": "R-020",
    "userId": "user-123",
    "deviceId": "device-001"
  }'
```

### Vyhledávání
```bash
curl "http://localhost:3000/api/rolls?query=papír&status=active"
```

## 🐳 Docker Deployment

```bash
# Build backend image
cd backend
docker build -t warehouse-wms-backend .

# Run with docker-compose
docker-compose up -d
```

Pro production použít orchestraci (Kubernetes, Docker Swarm) nebo PaaS (Heroku, Railway, Fly.io).

## 📚 Dokumentace

- [Backend README](./backend/README.md) - API dokumentace, setup
- [Mobile README](./mobile/README.md) - Aplikace, screens, funkcionalita
- Prisma schema: `backend/prisma/schema.prisma`

## 🤝 Přispívání

1. Fork repository
2. Vytvořit feature branch (`git checkout -b feature/amazing-feature`)
3. Commit změny (`git commit -m 'Add amazing feature'`)
4. Push do branch (`git push origin feature/amazing-feature`)
5. Otevřít Pull Request

## 📄 License

MIT

---

**Vytvořeno pro správu skladových rolí materiálu s důrazem na jednoduchost, rychlost a škálovatelnost.**

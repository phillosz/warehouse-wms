# Warehouse WMS - Backend API

Backend API pro systém správy skladu (Warehouse Management System) s podporou sledování rolí materiálu na kolejnicích.

## Technologie

- **Node.js** + **TypeScript**
- **Express** - REST API framework
- **Prisma** - ORM a databázové migrace
- **PostgreSQL** - relační databáze

## Quick Start

### 1. Instalace závislostí

```bash
npm install
```

### 2. Nastavení databáze

Zkopírovat `.env.example` do `.env`:

```bash
cp .env.example .env
```

Spustit PostgreSQL pomocí Docker:

```bash
docker-compose up -d
```

### 3. Spuštění migrací

```bash
npm run prisma:migrate
npm run prisma:generate
```

### 4. Seed dat (volitelné)

Pro vytvoření testovacích dat spustit:

```bash
npx tsx prisma/seed.ts
```

### 5. Spuštění serveru

Development mode:

```bash
npm run dev
```

Production build:

```bash
npm run build
npm start
```

Server běží na `http://localhost:3000`

## API Endpointy

### Health Check
- `GET /health` - Kontrola stavu serveru

### Users
- `POST /api/users/register` - Registrace uživatele/zařízení
- `GET /api/users/me?deviceId={id}` - Získání info o uživateli

### Rails (Kolejnice)
- `GET /api/rails` - Seznam všech kolejnic
- `GET /api/rails/:code` - Detail kolejnice
- `GET /api/rails/:code/inventory` - Role na kolejnici

### Rolls (Role materiálu)
- `GET /api/rolls?query={text}&status={status}&railCode={code}` - Vyhledávání rolí
- `GET /api/rolls/:id` - Detail role + historie pohybů
- `POST /api/rolls/receive` - Příjem nové role
- `POST /api/rolls/:id/move` - Přesun role na jinou kolejnici
- `POST /api/rolls/:id/remove` - Odebrání role ze skladu

### Export
- `GET /api/export/snapshot.csv` - CSV export aktuálního stavu
- `GET /api/export/events.ndjson?since={ISO8601}&limit={N}` - NDJSON export událostí

## Příklady použití

### Registrace zařízení

```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Filip Tichý",
    "deviceId": "device-001"
  }'
```

### Příjem role

```bash
curl -X POST http://localhost:3000/api/rolls/receive \
  -H "Content-Type: application/json" \
  -d '{
    "ean": "8595000000001",
    "materialName": "Papír lesklý",
    "widthMm": 1200,
    "grammageGm2": 80,
    "toRailCode": "R-001",
    "userId": "{userId}",
    "deviceId": "device-001"
  }'
```

### Přesun role

```bash
curl -X POST http://localhost:3000/api/rolls/{rollId}/move \
  -H "Content-Type: application/json" \
  -d '{
    "toRailCode": "R-005",
    "userId": "{userId}",
    "deviceId": "device-001"
  }'
```

### Vyhledávání

```bash
curl "http://localhost:3000/api/rolls?query=papír&status=active"
```

## Databázové schéma

Hlavní entity:
- **Warehouse** - Sklad
- **Rail** - Kolejnice (s pozicí a geometrií)
- **Roll** - Role materiálu (s EAN kódem)
- **Location** - Aktuální umístění role
- **Movement** - Historie všech pohybů (append-only audit)
- **User** - Uživatelé/zařízení

## Development

### Prisma Studio

Pro prohlížení databáze:

```bash
npm run prisma:studio
```

### Database Reset

```bash
npx prisma migrate reset
```

## Struktura projektu

```
backend/
├── prisma/
│   ├── schema.prisma      # Databázové schéma
│   └── migrations/        # SQL migrace
├── src/
│   ├── index.ts          # Entry point
│   └── routes/           # API endpointy
│       ├── rails.ts
│       ├── rolls.ts
│       ├── export.ts
│       └── users.ts
├── docker-compose.yml    # PostgreSQL setup
└── package.json
```

## Environment Variables

```env
DATABASE_URL=postgresql://warehouse:password@localhost:5432/warehouse_wms?schema=public
PORT=3000
NODE_ENV=development
```

## License

MIT

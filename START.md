# 🚀 Jak spustit Warehouse WMS

## Rychlý start

### 1️⃣ Spusťte Docker Desktop
- Otevřete Docker Desktop aplikaci
- Počkejte, až se spustí (ikona v menu baru)

### 2️⃣ Backend (v prvním terminálu)

```bash
cd /Users/filiptichy/eclipse_firstdemo/backend
./start.sh
```

Tento skript:
- ✅ Zkontroluje Docker
- ✅ Spustí PostgreSQL
- ✅ Aplikuje migrace
- ✅ Nabídne seed data
- ✅ Spustí server na http://localhost:3000

### 3️⃣ Mobile (v druhém terminálu)

```bash
cd /Users/filiptichy/eclipse_firstdemo/mobile
./start.sh
```

Tento skript:
- ✅ Zkontroluje závislosti
- ✅ Vytvoří .env pokud neexistuje
- ✅ Zvýší limit souborů
- ✅ Spustí Expo

**DŮLEŽITÉ:** Před spuštěním mobile upravte `mobile/.env`:
```bash
# Zjistit vaši IP adresu
ifconfig | grep "inet " | grep -v 127.0.0.1

# Upravit mobile/.env
API_URL=http://192.168.1.XXX:3000/api  # ← Vaše IP
```

---

## Alternativní způsob (manuální)

### Backend

```bash
cd backend

# 1. Spustit PostgreSQL
docker-compose up -d

# 2. Migrace
npm run prisma:migrate

# 3. Seed data (volitelné)
npx tsx prisma/seed.ts

# 4. Spustit server
npm run dev
```

### Mobile

```bash
cd mobile

# 1. Zvýšit limit souborů
ulimit -n 10240

# 2. Upravit .env
# API_URL=http://VaseIP:3000/api

# 3. Spustit Expo
npm start
```

---

## Troubleshooting

### ❌ "Docker daemon not running"
→ Spusťte Docker Desktop

### ❌ "EMFILE: too many open files"
→ Spusťte: `ulimit -n 10240`

### ❌ Mobile se nepřipojí k API
→ Zkontrolujte IP adresu v `mobile/.env` (nesmí být localhost)
→ Backend musí běžet
→ Telefon a počítač musí být ve stejné WiFi síti

### ❌ "Port 3000 already in use"
→ Zastavte jiné aplikace na portu 3000
→ Nebo změňte PORT v `backend/.env`

---

## ✅ Kontrola, že vše běží

### Backend
```bash
curl http://localhost:3000/health
# Mělo by vrátit: {"status":"ok","timestamp":"..."}
```

### Database
```bash
docker ps
# Měl by běžet kontejner: warehouse_wms_db
```

### Mobile
- Expo QR kód by se měl zobrazit v terminálu
- Naskenujte v Expo Go (Android) nebo Camera app (iOS)

---

## 🛑 Zastavení

```bash
# Zastavit backend (Ctrl+C v terminálu, pak)
cd backend
docker-compose down

# Zastavit mobile
# Stisknout Ctrl+C v terminálu
```

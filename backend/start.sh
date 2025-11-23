#!/bin/bash

# Warehouse WMS - Backend Start Script

echo "🚀 Spouštím backend..."

# Zkontrolovat Docker
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker neběží. Spusťte Docker Desktop a zkuste znovu."
    exit 1
fi

# Přejít do backend složky
cd "$(dirname "$0")"

# Spustit PostgreSQL
echo "📦 Spouštím PostgreSQL..."
docker-compose up -d

# Počkat na DB
echo "⏳ Čekám na databázi..."
sleep 5

# Zkontrolovat, jestli DB běží
if ! docker ps | grep -q warehouse_wms_db; then
    echo "❌ PostgreSQL se nepodařilo spustit"
    exit 1
fi

# Spustit migrace (pouze při prvním spuštění)
if [ ! -d "node_modules" ]; then
    echo "📥 Instaluji závislosti..."
    npm install
fi

echo "🔄 Aplikuji databázové migrace..."
npm run prisma:migrate

# Seed data (volitelné)
read -p "Chcete naplnit databázi testovacími daty? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Naplňuji testovací data..."
    npx tsx prisma/seed.ts
fi

# Spustit server
echo "✅ Backend je připraven!"
echo "🎯 Spouštím server na http://localhost:3000"
echo ""
npm run dev

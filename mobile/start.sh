#!/bin/bash

# Warehouse WMS - Mobile Start Script

echo "📱 Spouštím mobilní aplikaci..."

# Přejít do mobile složky
cd "$(dirname "$0")"

# Instalace závislostí (pokud je potřeba)
if [ ! -d "node_modules" ]; then
    echo "📥 Instaluji závislosti..."
    npm install
fi

# Zkontrolovat .env
if [ ! -f ".env" ]; then
    echo "⚠️  .env soubor neexistuje. Vytvářím z .env.example..."
    cp .env.example .env
    echo ""
    echo "⚠️  DŮLEŽITÉ: Upravte API_URL v mobile/.env souboru!"
    echo "   Použijte lokální IP adresu (ne localhost):"
    echo "   Příklad: API_URL=http://192.168.1.100:3000/api"
    echo ""
    echo "   Vaše IP adresy:"
    ifconfig | grep "inet " | grep -v 127.0.0.1
    echo ""
    read -p "Pokračovat? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Zvýšit limit souborů pro macOS
ulimit -n 10240

echo "✅ Mobilní app je připravena!"
echo "📱 Naskenujte QR kód v Expo Go aplikaci"
echo "   nebo stiskněte 'i' pro iOS simulator / 'a' pro Android emulator"
echo ""

# Spustit Expo
npm start

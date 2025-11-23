#!/bin/bash

# Warehouse WMS - Mobile Start Script (FIXED)

echo "📱 Spouštím mobilní aplikaci..."

# Přejít do mobile složky
cd "$(dirname "$0")"

# Instalace závislostí (pokud je potřeba)
if [ ! -d "node_modules" ]; then
    echo "📥 Instaluji závislosti..."
    npm install
fi

# Kontrola assetů
if [ ! -f "assets/icon.png" ]; then
    echo "⚠️  Chybí assety. Stahuji placeholder obrázky..."
    mkdir -p assets
    cd assets
    curl -o icon.png "https://placehold.co/1024x1024/007AFF/FFF.png?text=WMS"
    curl -o splash.png "https://placehold.co/1242x2436/007AFF/FFF.png?text=Warehouse+WMS"
    cp icon.png adaptive-icon.png
    cp icon.png favicon.png
    cd ..
fi

# Získat IP adresu
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')

echo ""
echo "📡 Vaše IP adresa: $LOCAL_IP"
echo ""
echo "⚠️  DŮLEŽITÉ: Zkontrolujte app.json, že 'extra.apiUrl' má správnou IP:"
echo "   Aktuálně: http://172.20.10.5:3000/api"
echo "   Mělo by být: http://$LOCAL_IP:3000/api"
echo ""

# Zvýšit limit souborů
echo "🔧 Zvyšuji limit souborů..."
ulimit -n 65536 2>/dev/null || ulimit -n 10240 2>/dev/null || true

# Vyčistit cache
echo "🧹 Čistím Expo cache..."
npx expo start -c

echo ""
echo "✅ Mobilní app je připravena!"
echo "📱 Naskenujte QR kód v Expo Go aplikaci"
echo ""

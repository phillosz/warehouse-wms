# Warehouse WMS - Mobilní aplikace

Mobilní aplikace pro správu skladových rolí materiálu s podporou skenování EAN kódů.

## Technologie

- **React Native** s **Expo**
- **TypeScript**
- **React Navigation** - navigace
- **Expo Camera** - skenování čárových kódů
- **AsyncStorage** - lokální ukládání dat
- **Axios** - HTTP klient

## Požadavky

- Node.js 18+
- npm nebo yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator nebo Android Emulator (pro vývoj)
- Fyzické zařízení s Expo Go (pro testování)

## Instalace

```bash
cd mobile
npm install
```

## Konfigurace

Zkopírovat `.env.example` do `.env`:

```bash
cp .env.example .env
```

Upravit API URL v `.env`:

```env
API_URL=http://192.168.1.100:3000/api
```

**Poznámka:** Pro testování na fyzickém zařízení použijte IP adresu vašeho počítače v lokální síti (ne localhost).

## Spuštění

### Development server

```bash
npm start
```

Poté:
- Stiskněte `i` pro iOS simulator
- Stiskněte `a` pro Android emulator
- Naskenujte QR kód v Expo Go aplikaci na fyzickém zařízení

### iOS

```bash
npm run ios
```

### Android

```bash
npm run android
```

## Struktura aplikace

```
mobile/
├── App.tsx                 # Root component s navigací
├── contexts/
│   └── AuthContext.tsx    # Autentizace a user management
├── screens/
│   ├── LoginScreen.tsx    # Přihlášení
│   ├── HomeScreen.tsx     # Domovská stránka s mapou kolejnic
│   ├── ScanScreen.tsx     # Skenování EAN kódů
│   ├── SearchScreen.tsx   # Vyhledávání rolí
│   ├── RollDetailScreen.tsx      # Detail role + operace
│   ├── RailDetailScreen.tsx      # Detail kolejnice
│   ├── SelectRailScreen.tsx      # Výběr kolejnice
│   └── ReceiveRollScreen.tsx     # Příjem nové role
├── services/
│   └── api.ts            # API klient
└── package.json
```

## Funkce

### 1. Přihlášení
- Jednoduché přihlášení jménem
- Automatická registrace zařízení
- Trvalé uložení session

### 2. Domovská stránka (Mapa skladu)
- Grafická mřížka kolejnic
- Barevné odlišení prázdných/obsazených kolejnic
- Tap na kolejnici → detail kolejnice
- Pull-to-refresh

### 3. Skenování
- Kamera pro čtení EAN/QR kódů
- Automatické rozpoznání existující/nové role
- Přímý přechod na detail nebo příjem

### 4. Vyhledávání
- Fulltext podle EAN, názvu materiálu
- Filtry: Aktivní / Odebrané / Vše
- Zobrazení aktuální pozice
- Tap na roli → detail

### 5. Detail role
- Kompletní informace o roli
- Aktuální umístění
- Historie všech pohybů (timeline)
- Tlačítka: **Přesunout** / **Odebrat**

### 6. Operace
- **Příjem:** Vyplnění formuláře + výběr kolejnice
- **Přesun:** Výběr cílové kolejnice z mapy
- **Odebrání:** Potvrzení dialogem
- Okamžitý sync s backendem

## API Integrace

Aplikace komunikuje s backend API pomocí služby `services/api.ts`.

Hlavní endpointy:
- `POST /users/register` - Registrace zařízení
- `GET /rails` - Seznam kolejnic
- `GET /rolls` - Vyhledávání rolí
- `GET /rolls/:id` - Detail role
- `POST /rolls/receive` - Příjem role
- `POST /rolls/:id/move` - Přesun role
- `POST /rolls/:id/remove` - Odebrání role

## Oprávnění

Aplikace vyžaduje přístup ke:
- **Kameře** - pro skenování EAN kódů

Oprávnění se požadují při prvním použití funkce.

## Build pro produkci

### Android APK

```bash
expo build:android
```

### iOS

```bash
expo build:ios
```

Nebo použít EAS Build:

```bash
npm install -g eas-cli
eas login
eas build --platform android
eas build --platform ios
```

## Testování

Pro testování na fyzickém zařízení:

1. Nainstalujte **Expo Go** z App Store / Google Play
2. Spusťte `npm start`
3. Naskenujte QR kód
4. Ujistěte se, že zařízení je ve stejné síti jako vývojový počítač
5. Nastavte správnou IP adresu v `.env`

## Troubleshooting

### Aplikace se nepřipojí k API

- Zkontrolujte IP adresu v `.env` (nesmí být localhost)
- Ujistěte se, že backend běží
- Zkontrolujte firewall na vývojovém počítači

### Kamera nefunguje

- Povolte oprávnění kamery v nastavení zařízení
- Na iOS simulátoru kamera není dostupná

### Expo Go aktualizuje pomalu

- Použijte LAN connection místo Tunnel
- Restartujte Metro bundler

## Budoucí rozšíření

- [ ] Offline režim s lokální frontou
- [ ] QR kódy na kolejnicích
- [ ] Push notifikace
- [ ] Batch operace
- [ ] Foto rolí
- [ ] Tisk štítků

## License

MIT

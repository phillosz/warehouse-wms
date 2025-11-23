# Warehouse WMS - Assets

Tato složka obsahuje placeholder soubory pro Expo aplikaci.

## Potřebné assety

Pro kompletní funkcionalitu je potřeba vytvořit následující soubory:

### Ikony a splash screen

1. **icon.png** (1024x1024px)
   - Hlavní ikona aplikace
   - PNG s průhledným pozadím

2. **splash.png** (1242x2436px)
   - Splash screen při startu
   - PNG s bílým pozadím

3. **adaptive-icon.png** (1024x1024px, Android)
   - Adaptive icon pro Android
   - Bezpečná zóna: 432x432px uprostřed

4. **favicon.png** (48x48px)
   - Favicon pro web verzi

## Generování assetů

Můžete použít online nástroje:
- [Expo Icon Generator](https://icons.expo.fyi/)
- [App Icon Generator](https://appicon.co/)

Nebo vytvořit vlastní design v:
- Figma
- Adobe Illustrator
- Canva

## Placeholder assety

Pro development můžete použít jednobarevné placeholdery:
- Modrá (#007AFF) pro ikonu
- Bílá s logem pro splash screen

## Automatické generování

Expo může generovat potřebné velikosti z jednoho souboru:

```bash
npx expo-optimize
```

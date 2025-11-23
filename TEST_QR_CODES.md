# Testovací QR Kódy pro WMS Aplikaci

## 🔍 Jak testovat skenování

Otevřete tyto URL v prohlížeči na druhém zařízení a naskenujte QR kód telefonem:

### Existující role v databázi:

1. **Role 1 - Křídový papír**
   - EAN: `8590123456789`
   - URL (jednoduchý text): https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=8590123456789

2. **Role 2 - Běžný papír**
   - EAN: `8590123456790`
   - URL: https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=8590123456790

3. **Role 3 - Lesklý papír**
   - EAN: `8590123456791`
   - URL: https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=8590123456791

4. **Role 4 - Matný karton**
   - EAN: `8590123456792`
   - URL: https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=8590123456792

5. **Role 5 - Vlnitý karton**
   - EAN: `8590123456793`
   - URL: https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=8590123456793

### Nová role (pro testování příjmu):

**Nový produkt**
- EAN: `8590123456999`
- URL: https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=8590123456999

---

## 📱 Jak použít:

### Metoda 1: Druhé zařízení (NEJJEDNODUŠŠÍ)
1. Otevřete URL na počítači nebo tabletu
2. Zobrazí se QR kód s číslem
3. V aplikaci: Záložka "Scan"
4. Naskenujte QR kód z obrazovky

### Metoda 2: Zadat ručně
Aplikace akceptuje jakýkoliv text jako EAN, takže můžete:
1. V aplikaci přejít na "Search"
2. Zadat EAN ručně: `8590123456789`
3. Nebo při příjmu role zadat libovolný EAN

### Metoda 3: Online generátor
Použijte QR generátor pro text (ne EAN-13):
- https://www.qr-code-generator.com/
- Vyberte typ: Text
- Zadejte číslo: `8590123456789`
- QR kód bude fungovat

---

## ✅ Co otestovat:

1. **Existující role** - naskenujte/zadejte `8590123456789`
   - Měl by se zobrazit detail role "Křídový papír 80g/m²"
   - Vidíte historii pohybů
   - Můžete přesunout na jinou kolejnici

2. **Nová role** - naskenujte/zadejte `8590123456999`
   - Zobrazí se formulář pro příjem
   - Vyplňte údaje
   - Vyberte kolejnici
   - Přijměte roli

3. **Ruční zadání v Search**
   - Záložka "Search"
   - Do pole EAN zadejte: `8590123456789`
   - Klikněte na výsledek → Detail role

4. **Přesun role**
   - V detailu role klikněte "Přesunout"
   - Vyberte novou kolejnici
   - Role se přesune

5. **Odebrání role**
   - V detailu role klikněte "Odebrat ze skladu"
   - Potvrďte
   - Role změní stav na "removed"

---

## 💡 TIP:
Aplikace ukládá EAN jako text, takže můžete používat **jakékoliv číslo nebo text**. 
Není potřeba validní EAN-13 kontrolní součet!

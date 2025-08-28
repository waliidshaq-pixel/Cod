
Lawid Launcher - Electron + React

Udpak mappen til: C:\1LawidOS\LawidLauncher  (mappen hedder allerede "LawidLauncher")

Kør i Windows PowerShell (i den mappe hvor package.json ligger):
  npm install
  npm run start

Hvis du vil bygge en installer:
  npm run package

Hurtige noter:
- Fuldskærm/kiosk som standard (luk med Ctrl+Shift+Q)
- Auto-start ved login toggles i Indstillinger
- Scanning af installerede Steam/Epic-spil
- Start/Installér via protokoller og spawn af .exe
- Dine spil/apps gemmes i %APPDATA%/Lawid Launcher/items.json

# OneOff – Secrets rotieren: Checkliste

Stand: 29.09.2026. Ausgelöst durch die Repo-Bereinigung. Das öffentliche Repo
`Pipoto192/oneoff` enthielt über 10 Monate lang einen **validen Android-Signing-Key
zusammen mit seinem Klartext-Passwort im selben Ordner**.

> **Wichtigste Regel:** Das Entfernen aus der Git-History ist nur Hygiene. Es macht
> nichts ungeschehen. Ein Secret, das öffentlich war, ist kompromittiert – egal wie
> sauber die History jetzt ist. Nur der Tausch des Secrets selbst hilft.

## Befund (belegt)

| # | Was | Beweis | Status |
|---|-----|--------|--------|
| 1 | `client/android/app/upload-keystore.jks` | SHA256 `3D2170C4…FB4AB`, Alias `upload`, SHA384withRSA. Workspace == Klon == Repo byte-identisch | **Live-Key kompromittiert** |
| 2 | Passwort in `build.gradle:22/24` | eingebracht in `d8ca77e`, in 47/62 `main`-Commits, 9 identische Blobs, nie rotiert, `storePassword == keyPassword` | Kompromittiert |
| 3 | Repo war öffentlich | `private=false`, forks=0, stars=0 – aber **traffic: 5 Clones / 4 eindeutige Quellen** im Fenster 10.–23.09. bei 0 Views/Forks → Muster von Secret-Scanner-Bots | Als heruntergeladen betrachten |
| 4 | `GET /debug` → `res.json(rooms)` | `index.js:54-57`, im laufenden Betrieb mit HTTP 200 bestätigt. Liefert Room-Codes, `deviceId`, Username, `socketId` | **Aus dem Code entfernt**, aber Server neu deployen! |
| 5 | Startup loggte die ersten 50 Zeichen der `.env` | `index.js:31-39` | **Aus dem Code entfernt**, Deploy-Logs bei Koyeb prüfen/löschen |
| 6 | `/api/redeem` ohne Auth und ohne Rate-Limit | POST liefert 400 statt 401/403; kein `express-rate-limit`/`helmet` in `package.json`; `cors()` offen. Codes = `PRO-` + `randomBytes(4)` = 2³² | **Offen – siehe P1 unten** |
| 7 | `.env` mit Spotify/Mongo | **Nie committet** (History-Scan: 0 Treffer). Betrifft nur Deploy-Logs über Punkt 5 | Nur Vorsichtsmaßnahme |

Zusätzlich aus der History entfernt: alle `.apk`/`.aab` (ca. 500 MB), `node_modules`,
`.next`, `out`, `build`, `.cap8-template`, `server/admin/` (Code-Generator-Tooling),
`.verifier-tmp`.

## P0 – heute

- [ ] **Neuen Upload-Key erzeugen**
  ```powershell
  $env:JAVA_HOME='C:\Users\Timo\android-build\jdk-21.0.12.1+1'
  & "$env:JAVA_HOME\bin\keytool.exe" -genkey -v -keystore upload-keystore.jks `
      -alias upload -keyalg RSA -keysize 2048 -validity 10000 -storepass <NEU>
  ```
- [ ] **Google Play – Upload-Key zurücksetzen:** Play Console → *Release* →
  *Setup* → *App signing* → **„Reset your play app signing key“**. Das Play-*Signing*-Key
  selbst bleibt erhalten, Nutzer-Updates funktionieren also weiter. Nur das *Upload*-Zertifikat tauscht man.
- [ ] Neues Passwort **nur** in `client/android/keystore.properties` (nicht committen,
  ist durch `.gitignore` gedeckt). `keystore.properties.example` enthält nur Platzhalter.
- [ ] **Server neu deployen**, damit `/debug` und das `.env`-Logging wirklich weg sind.
  Der Code ist bereinigt, aber die laufende Instanz auf Koyeb nutzt noch den alten Stand.
- [ ] Koyeb-Log-Einträge löschen, die `.env`-Inhalte zeigen.

## P1 – diese Woche

- [ ] `/api/redeem` absichern: `express-rate-limit` + `helmet`, Code-Vergleich mit
  `crypto.timingSafeEqual`, Rate-Limit pro `deviceId` **und** pro IP, nach N Fehlversuchen sperren.
- [ ] `server/admin/generate_codes.js`: Codes auf `randomBytes(10)` (2⁸⁰) erhöhen und
  **nicht** mehr im Klartext ausgeben, sondern nur hashen bzw. einmalig in einem Kanal
  übergeben, den der Betreiber selbst einlöst.
- [ ] Bereits ausgegebene Pro-Codes als potenziell erraten betrachten und neu ausstellen.
- [ ] Raumcodes: `Math.random()` → `crypto.randomInt()` / `randomBytes`; 5 Zeichen sind
  bei öffentlichem Rate-Limit ratebar.
- [ ] Altes APK/AAB aus dem Play-internen Artefaktbereich nehmen, wenn es noch irgendwo
  als Download liegt.

## P2 – GitHub-History endgültig loswerden

Der Force-Push ist erledigt (`main` = `4b66e97`, 1 Commit, 10,6 MB, 0 verbotene Pfade).
Aber: **GitHub behält unreiche Object-DB-Einträge und cacht Commit-SHAs.**

- [ ] Repo zeitweise auf **privat** stellen: `gh repo edit Pipoto192/oneoff --visibility private`
- [ ] Support-Ticket für „remove cached objects“ aufmachen – nötig, damit die alte
  `69bdaba…`-History aus Caches/CDN verschwindet. Solange forks=0 ist das möglich.
- [ ] `deploy-server` **bewusst behalten**: eigener Orphan-Root (`5fffb9a`), keine Secrets
  (geprüft), liefert den Koyeb-Deploy. Löschen würde die Server-Deployment-Pipeline kappen.
- [ ] Lokales Backup der alten History: `.git-cleanup/oneoff-clone` (614 MB, enthält alle
  62 Commits). Erst löschen, wenn der neue Stand bestätigt ist.

## P3 – nur Vorsichtsmaßnahme

Kein Nachweis in der History, aber wegen Punkt 5 (Deploy-Logs):

- [ ] `SPOTIFY_CLIENT_SECRET` bei Spotify Dashboard rotieren
- [ ] `MONGODB_URI`-Passwort bei MongoDB Atlas ändern
- [ ] Koyeb-Env-Variablen neu setzen, App neu deployen

## Was der lokale Workspace jetzt tut

Damit Builds unverändert laufen, ohne dass ein Passwort in einer committeten Datei steht:

1. `client/android/app/build.gradle` liest die Credentials über
   `rootProject.file("keystore.properties")`; fehlt die Datei, wird nur eine Warnung
   ausgegeben und Release-Signing ist deaktiviert (Debug-Builds laufen weiter).
2. `client/android/keystore.properties` enthält die Werte (lokal, git-ignoriert).
3. `client/android/keystore.properties.example` ist die committete Vorlage mit Platzhaltern.
4. `client/android/.gitignore` hat `*.jks` / `*.keystore` **aktiviert** (waren auskommentiert).
5. Root-`.gitignore` ignoriert zusätzlich `server/admin/`, `fluttertest/`, `.git-cleanup/`.

# Repo-Cleanup & Secrets-Hygiene - OneOff / Music Imposter

**Stand:** 29.09.2026 · **Autor:** repo-auditor · **Scope:** `C:\Users\Timo\Documents\Apps\OneOff`
**Status:** ✅ **Cutover durchgeführt.** Repo neu aufgesetzt und auf `main` force gepusht.

### Ausführungsstand (29.09.2026)

| Schritt | Status | Beleg |
|---|---|---|
| Audit + Secret-Scan | erledigt | Teil 0.3 dieses Dokuments, `docs/secret-rotation.md` |
| `.gitignore` gehärtet (UTF-8, Regeln aktiviert) | erledigt | `git check-ignore` bestätigt 6/6 Sensibles |
| Saubere Quelle **aus dem lokalen Workspace** gebaut | erledigt | nicht aus dem Remote-Klon – der war auf v0.3.1 zurück und hätte 66/130 Dateien zurückgedreht |
| Keystore + Passwort aus `build.gradle` externalisiert | erledigt | `keystore.properties`-Muster, `.example` als Vorlage |
| `GET /debug` + `.env`-Logging entfernt | erledigt | Code + lokaler Workspace |
| `server/admin/` aus Repo, lokal per `.gitignore` gehalten | erledigt | `git check-ignore` trifft |
| Force-Push auf `main` | erledigt | `main` = `4b66e97`, 2 Commits, 131 Dateien, 10,6 MB, 0 verbotene Pfade |
| `deploy-server` gelöscht | **absichtlich NICHT** | eigener Orphan-Root `5fffb9a`, keine Secrets (geprüft); Löschen hätte den Koyeb-Deploy gekippt |
| Secrets rotieren | **offen** | siehe `docs/secret-rotation.md` – P0-Punkte sind noch nicht gemacht |
| GitHub-Cache-Purge | **offen** | Support-Ticket nötig; solange `forks = 0` möglich |
| Server neu deployen (damit `/debug` live weg ist) | **offen** | Code ist weg, die laufende Koyeb-Instanz noch nicht aktualisiert |

> ⚠️ Der Force-Push ist **nur Hygiene**. Der kompromittierte Signing-Key ist erst nach
> Teil B (`docs/secret-rotation.md`, P0) unschädlich gemacht.

Lokales Backup der alten 62-Commits-History: `.git-cleanup/oneoff-clone` (614 MB) – erst
löschen, wenn der neue Stand verifiziert ist.

Lokal geändert außerdem: `.gitignore`, `.env.example`, `client/android/app/build.gradle`,
`client/android/keystore.properties` (neu, ignoriert), `client/android/keystore.properties.example` (neu),
`music-imposter-app/server/index.js`, `docs/secret-rotation.md` (neu).

> **Goldene Regel:** Alles, was jemals in ein GitHub-Repo gepusht wurde, gilt als **kompromittiert** - auch nach dem Löschen. Es lebt in der Git-History, in Forks, in PR-Refs, in GitHub-Caches und ggf. in Logs weiter.
> Reihenfolge daher immer: **1. Secrets rotieren → 2. History bereinigen bzw. neu aufsetzen → 3. pushen.**

**Verifizierter Kontext (Stand jetzt):**

* Kein lokales Git-Repo: kein `.git` unter `C:\Users\Timo\Documents\Apps` (rekursiv geprüft), keine `~/.gitconfig`, keine `.git-credentials`.
* `gh` (GitHub CLI) ist **nicht** installiert → `git 2.55.0.windows.5` ist vorhanden.
* Kein `.env` liegt irgendwo unter `C:\Users\Timo\Documents` / `Desktop` / `Downloads` / `projects` (bis Tiefe 4 gesucht) → die echten Werte leben nur im Deploy-Umfeld (Koyeb-Env-Vars) und ggf. im Remote-Repo.
* Remote-URL/Owner des GitHub-Repos ist unbekannt.

---

## 0. Inventar: was liegt hier eigentlich herum?

### 0.1 Top-Level im Workspace

| Pfad | Größe / Inhalt | Klassifikation | Empfehlung |
|---|---|---|---|
| `client\` | Next.js 16 + Capacitor 8 Quellcode | **belongs in repo** | KEEP (ohne Build-Outputs) |
| `music-imposter-app\` | Express/Socket.io/Mongoose-Server (`index.js`, `models.js`, `admin/`) | **belongs in repo** | KEEP - außer `.env`, `admin/` siehe Teil A |
| `docs\index.html` | Datenschutzerklärung (Play-Console-Pflicht) | **belongs in repo** | KEEP |
| `.gitignore` | jetzt UTF-8, 3,1 KB | **belongs in repo** | KEEP (gehärtet 29.09.2026) |
| `.env.example` | Vorlage ohne Werte | **belongs in repo** | KEEP (neu angelegt) |
| `build-android-release.ps1` | Release-Build-Skript (AAB/APK) | **belongs in repo** | KEEP (JDK-Fallback `C:\Users\Timo\android-build` ist maschinenspezifisch, optional bereinigen) |
| `.vscode\settings.json` | 66 B Editor-Setting | **belongs in repo** | KEEP (harmlos) |
| `oneoff-logo.png` | 400 KB Logo | **belongs in repo** | KEEP (besser nach `docs/assets/`) |
| `.cap8-template\` | 52 Dateien, 0,3 MB, heruntergeladenes Capacitor-v8-Template | **scratch/one-off** | REMOVE aus Repo + per `.gitignore` ausschließen |
| **35 × `*.apk`** | **440,7 MB** | **generated artifact** | REMOVE aus Repo |
| **8 × `*.aab`** | **86,3 MB** | **generated artifact** | REMOVE aus Repo |
| `client\node_modules\` | **642,9 MB** / 38.627 Dateien | **generated artifact** | REMOVE aus Repo |
| `client\android\app\build\` | **292,2 MB** / 1.782 Dateien (inkl. `…\outputs\bundle\release\app-release.aab`, 5 signed APKs, `mapping\release\mapping.txt`) | **generated artifact** | REMOVE aus Repo |
| `client\.next\` | **46,1 MB** / 253 Dateien | **generated artifact** | REMOVE aus Repo |
| `client\android\.gradle\` | 8,4 MB | **generated artifact** | REMOVE aus Repo |
| `client\out\` | 1,1 MB (Next.js Static Export = Capacitor `webDir`) | **generated artifact** | REMOVE aus Repo |
| `client\android\app\src\main\assets\public\` | 1,1 MB / 62 Dateien (von `npx cap sync` kopiert) | **generated artifact** | REMOVE aus Repo |
| `client\android\app\upload-keystore.jks` | 2,7 KB Signing-Key | **secret/sensitive** | REMOVE + ROTATE (Teil B) |
| `client\android\local.properties` | `sdk.dir=C:\Users\Timo\…` | **secret/sensitive (maschinenspezifisch)** | REMOVE (bereits ignoriert) |
| `music-imposter-app\server\.env` | existiert lokal **nicht** | **secret/sensitive** | lokal anlegen, **niemals** committen |

**Fazit:** Würde man jetzt „alles“ committen, entstünden **~1,5 GB** Repo-Inhalt (643 MB `node_modules` + 527 MB APK/AAB + 292 MB Gradle + 46 MB `.next`) plus Keystore und ggf. Secrets. Genau das ist die Ursache für einen unbrauchbaren Remote-Stand.

### 0.2 Warum das bisher überhaupt passieren konnte (Root Cause)

* **Die Root-`.gitignore` war UTF-16LE kodiert** (Nullbytes, kein BOM). Git liest `.gitignore` byte-weise; UTF-16-Zeilen matchen nichts → `node_modules`, `.env` und die APK-Namen waren **wirkungslos**. (Am 29.09.2026 auf UTF-8 umgestellt: 3.154 Bytes, keine NUL-Bytes.)
* **`client\android\.gitignore` ist ebenfalls UTF-16LE** → `*.apk`, `*.aab`, `build/` greifen dort nicht. Zusätzlich steht dort ein **falscher Pfad** (`client/android/app/upload-keystore.jks` - relativ zur `.gitignore`-Datei ist das `client/android/client/android/app/...` und matcht nie) und die `*.jks`/`*.keystore`-Regeln sind **auskommentiert** (Zeilen 57/58).
* Der neue Root-`.gitignore` deckt `*.apk`, `*.aab`, `*.jks`, `build/`, `.env` **rekursiv** ab und kompensiert damit diese kaputte Datei. Die Datei selbst bitte trotzdem fixen (siehe D, Schritt 3).

---

## 0.3 Secret-Scan: alle Treffer mit Bewertung

Gescannt wurden Quell-/Konfig-Dateien (`client/src`, `client/android/**` ohne Build-Outputs, `music-imposter-app/**`, Skripte, `package*.json`) - **nicht** `node_modules`, `.next`, `out`, `build`.
Ergebnis vorab: **keine** hartkodierten API-Keys, Tokens, Private Keys oder DB-Connection-Strings gefunden (`BEGIN … PRIVATE KEY` = 0 Treffer, `mongodb+srv://` = 0 Treffer, `client_secret`-Treffer = ausschließlich `process.env`-Zugriffe). Das Risiko liegt woanders: **Signing-Key, kaputte `.gitignore`, Logging und Admin-Code.**

| # | Fund (file:line) | Urteil |
|---|---|---|
| 1 | `client/android/app/upload-keystore.jks` (2.712 B, Android-Upload-Key) | **ROTATE + REMOVE** |
| 2 | `client/android/app/build.gradle:22` `storePassword "mus…(maskiert)"` | **REMOVE / MOVE TO ENV** → `keystore.properties` |
| 3 | `client/android/app/build.gradle:24` `keyPassword "mus…(maskiert)"` | **REMOVE / MOVE TO ENV** → `keystore.properties` |
| 4 | `client/android/app/build.gradle:23` `keyAlias "upload"` | KEEP (kein Geheimnis) |
| 5 | `music-imposter-app/server/index.js:36` `console.log("First 50 chars of .env:", …)` | **REMOVE** (Secret-Leak in Deploy-Logs!) |
| 6 | `music-imposter-app/server/index.js:31,34` Logging von `process.cwd()` / `.env`-Pfad | REMOVE (Info-Leak, Rauschen) |
| 7 | `music-imposter-app/server/index.js:50` `console.log("- Client ID:", SPOTIFY_CLIENT_ID.substring(0,5)+"…")` | REMOVE (unnötig; Client-ID ist öffentlich, aber Log-Rauschen) |
| 8 | `music-imposter-app/server/index.js:54-57` `app.get('/debug')` → `res.json(rooms)` | **REMOVE** (Info-Disclosure/Backdoor) |
| 9 | `music-imposter-app/server/index.js:60` `POST /api/redeem` - unauthentifiziert, ohne Rate-Limit, Codes `PRO-<8 Hex>` (≈32 bit) | **REMOVE/SPERREN** (Admin-Bereich; Brute-Force → Gratis-Pro) |
| 10 | `music-imposter-app/server/admin/generate_codes.js` (privilegiertes DB-Tool) | **REMOVE** (in privates Ops-Repo verschieben) |
| 11 | `music-imposter-app/server/models.js:3-14` `Code`, `Subscription` | REMOVE nur wenn Pro-System entfällt; sonst KEEP |
| 12 | `music-imposter-app/server/index.js:42` `process.env.SPOTIFY_CLIENT_SECRET` | KEEP (korrekt - MOVE TO ENV ist schon erfüllt) |
| 13 | `music-imposter-app/server/index.js:328,386` Basic-Auth-Header aus Client-ID/Secret | KEEP (korrekte Nutzung; nur niemals loggen) |
| 14 | `client/src/app/page.js:20,112,253,623` + `client/src/context/SocketContext.js:18` hartkodierte `https://prominent-hookworm-dailyvibes-2b2f2caa.koyeb.app` | MOVE TO ENV (`NEXT_PUBLIC_SERVER_URL`), kein Hardcode-Fallback |
| 15 | `client/android/local.properties:1` `sdk.dir=C:\Users\Timo\AppData\Local\Android\Sdk` | REMOVE (maschinenspezifisch) |
| 16 | `client/android/app/src/main/AndroidManifest.xml:52` AdMob-App-ID `ca-app-pub-9755109992994241~4692266504` | KEEP (öffentliche ID, kein Secret) |
| 17 | `docs/index.html:143` Kontakt-Mail `pipotoo192@gmail.com` | KEEP (Datenschutzerklärung = öffentlich) |
| 18 | `build-android-release.ps1:22` Fallback `C:\Users\Timo\android-build` | MOVE TO ENV/param (maschinenspezifisch) |
| 19 | `music-imposter-app/server/index.js:429,498` `deviceId` wird in `rooms` gespeichert | KEEP, aber Datenminimierung: besser Hash statt Roh-`deviceId` (nur in-memory) |
| 20 | 35 × `.apk` + 8 × `.aab` + Binaries im Repo-Root | **REMOVE** (Binary-Bloat; Release-Artefakte nie in Git) |

### Ranking der 10 gravierendsten Findings

1. **Keystore + Klartext-Passwort** (`upload-keystore.jks` + `build.gradle:22/24`) → wer beides hat, kann „OneOff"-Releases signieren.
2. **Kaputte UTF-16-`.gitignore`** (Root + `client/android`) → `node_modules`/`.env`/APKs wurden faktisch **nicht** ignoriert (Ursache des ganzen Schlamassels).
3. **`/debug`-Endpoint** liefert live alle Lobby-Daten inkl. `deviceId` und `socketId`.
4. **`.env`-Inhalt wird geloggt** (`index.js:36`) → Secrets in Koyeb-/Build-Logs.
5. **~1 GB Binär-/Build-Müll** im Repo (527 MB APK/AAB, 643 MB `node_modules`, 292 MB Gradle).
6. **`/api/redeem` ohne Auth/Rate-Limit** → Pro-Freischaltung per Brute-Force.
7. **Admin-Tool `admin/generate_codes.js`** im Repo → jeder mit Push-Rechten kann Codes erzeugen.
8. **`client/android/.gitignore` kaputt** (UTF-16 + falscher Relativpfad + `*.jks` auskommentiert).
9. **Hartkodierte Prod-URL** (Koyeb) an 5 Stellen im Client → Infra-Leak, Deployment-Falle.
10. **`local.properties`** mit lokalem Windows-Username-Pfad im Repo (minor Info-Leak).

---

## A) Was fliegt raus

### A1 - Datei-Ebene (diese Dateien/Ordner dürfen nie im Repo landen)

* [ ] `client/android/app/upload-keystore.jks` - **vor** dem Löschen rotieren (Teil B) und extern sichern (Passwort-Manager + verschlüsseltes Backup, z. B. `%USERPROFILE%\backups\oneoff-keys\`, **außerhalb** dieses Ordners)
* [ ] `.env` (bzw. `music-imposter-app/server/.env`) - echte Werte nur lokal/als Deploy-Env-Var
* [ ] **35 × `*.apk`** und **8 × `*.aab`** im Root (527 MB): `music-imposter*.apk`, `oneoff-v*.apk`, `OneOff-v*.apk`, `oneoff-*.aab`, `OneOff-*.aab` → Release-Artefakte gehören in die Play Console / GitHub **Releases** (Assets), nicht in den Baum
* [ ] `.cap8-template/` (Scratch-Template, 52 Dateien)
* [ ] `client/node_modules/` (643 MB)
* [ ] `client/.next/` (46 MB) und `client/out/` (Build-Output = Capacitor-`webDir`)
* [ ] `client/android/app/build/` (292 MB, inkl. **signierter** `app-release.aab`, 5 Release-APKs, `mapping.txt`) sowie `client/android/build/`, `client/android/.gradle/`, `client/android/.kotlin/`, `client/android/capacitor-cordova-android-plugins/`
* [ ] `client/android/app/src/main/assets/public/`, `.../assets/capacitor.config.json`, `.../assets/capacitor.plugins.json`, `client/android/app/src/main/res/xml/config.xml` (alle von `npx cap sync` generiert)
* [ ] `client/android/local.properties`
* [ ] optional: `oneoff-logo.png` → nach `docs/assets/logo.png` verschieben (Duplikat von `client/assets/icon.png`)

> **Wichtig:** Löschen allein entfernt nichts aus der Git-History. Wenn diese Dateien schon gepusht waren, gilt Teil B + C/D.

### A2 - Code-Ebene

**1. Debug-Backdoor entfernen** (`music-imposter-app/server/index.js`)

* [ ] Zeilen 31-39 löschen (`.env`-Pfad + **erste 50 Zeichen des `.env`-Inhalts** werden geloggt)
* [ ] Zeilen 49-52 auf ein Minimum reduzieren (`console.log("Spotify Config loaded")` reicht) - kein `substring()` auf Credentials
* [ ] Zeilen 54-57 (`// Debug Endpoint`, `app.get('/debug', …)`) **komplett löschen**
* [ ] Optional sauber: Health-Endpoint statt Debug, z. B. `app.get('/health', (req,res)=>res.json({ ok:true, rooms:Object.keys(rooms).length }))` - **ohne** Raum-Inhalte

**2. Admin-/Pro-Bereich (Redeem-Codes) - bewusst entscheiden**

* [ ] `music-imposter-app/server/admin/generate_codes.js` löschen (und in ein privates Repo, z. B. `oneoff-ops`, verschieben)
* [ ] Wenn Pro/Redeem weiter existieren soll: `POST /api/redeem` mit Auth absichern (`x-admin-key` gegen `process.env.ADMIN_API_KEY`, Rate-Limit) und Codes länger machen (`crypto.randomBytes(10)`) - Entscheidung nötig (siehe Report-Frage)
* [ ] Wenn Pro entfällt: `index.js:60-112` (`/api/redeem`), `index.js:114-132` (`/api/status`) sowie `models.js:3-14` (`Code`, `Subscription`) entfernen
* [ ] Client entsprechend aufräumen: `client/src/app/page.js` `ProRedeemModal` (ab Zeile 92), `isPro`-States (202, 601), `/api/redeem`- und `/api/status`-Aufrufe (117, 644), AdMob-Kopplung in `client/src/app/lobby/page.js:658-677`
* [ ] `PlayerProfile` / `ACHIEVEMENTS` **behalten** (Spiel-Feature, kein Admin-Kram)

**3. Hardcodierte Signing-Passwörter externalisieren** (`client/android/app/build.gradle`)

* [ ] Datei `client/android/keystore.properties` anlegen (ist per `.gitignore` ausgeschlossen) und `build.gradle` umbauen:

```gradle
// oben in client/android/app/build.gradle
def keystorePropsFile = rootProject.file("keystore.properties")
def keystoreProps = new Properties()
if (keystorePropsFile.exists()) {
    keystoreProps.load(new FileInputStream(keystorePropsFile))
}

android {
    signingConfigs {
        release {
            if (keystorePropsFile.exists()) {
                storeFile file(keystoreProps['storeFile'])      // z. B. upload-keystore.jks
                storePassword keystoreProps['storePassword']
                keyAlias keystoreProps['keyAlias']
                keyPassword keystoreProps['keyPassword']
            }
        }
    }
    // ... Rest unverändert
}
```

```properties
# client/android/keystore.properties  (NICHT committen, steht in .gitignore)
storeFile=upload-keystore.jks
storePassword=<NEUES_PASSWORT>
keyAlias=upload
keyPassword=<NEUES_PASSWORT>
```

* [ ] Zusätzlich `client/android/keystore.properties.example` (ohne Werte) ins Repo legen
* [ ] `client/android/.gitignore` **neu als UTF-8** schreiben und dabei korrigieren: `*.jks` / `*.keystore` einkommentieren, den falschen Eintrag `client/android/app/upload-keystore.jks` durch `app/upload-keystore.jks` ersetzen. Einzeiler:
  `Get-Content 'client\android\.gitignore' -Raw | Set-Content 'client\android\.gitignore' -Encoding utf8` (danach Zeilen 55-58 + 102-112 im Editor aufräumen)

**4. Infrastruktur-Hardcodes → Env**

* [ ] Koyeb-URL an 5 Stellen (`client/src/app/page.js` 20/112/253/623, `client/src/context/SocketContext.js:18`, `client/src/app/lobby/page.js:623`) durch `process.env.NEXT_PUBLIC_SERVER_URL` ersetzen; für Mobile-Builds die Variable in `.env.local` (nicht committen) oder im Build-Skript setzen
* [ ] `build-android-release.ps1:22`: Fallback `C:\Users\Timo\android-build` → Parameter `-JdkPath` oder `JDK_HOME`

**5. Hygiene (optional, nicht blockierend)**

* [ ] `deviceId` in `rooms` nur gehasht speichern (`crypto.createHash('sha256').update(deviceId).digest('hex').slice(0,16)`), da `rooms` in-memory und via Socket-Broadcasts (`user_joined`/`joined_room`) verteilt wird

---

## B) Secrets rotieren

> **Zuerst lesen:** Sobald ein Secret in einem GitHub-Repo stand (auch in einem privaten! auch wenn es später gelöscht wurde), ist es **kompromittiert**. GitHub behält Objekte in der History, Forks und Caches; Scanner (und Bots) durchsuchen neue Pushes innerhalb von Sekunden. Rotieren ist **nicht optional** und muss **vor** dem nächsten Push passieren - danach hat ein Angreifer nur noch tote Werte.

### B1 - Spotify Client Secret (Priorität: hoch, falls es je gepusht wurde)

* [ ] https://developer.spotify.com/dashboard → App „OneOff" öffnen → **Settings**
* [ ] Beim Feld *Client secret* auf **Rotate / Reset client secret** klicken (Button-Bezeichnung je nach Dashboard-Version „Reset"/„Rotate")
* [ ] Falls kein Rotate-Button existiert: neue App anlegen, dort dieselben **Redirect URIs** eintragen, neue `SPOTIFY_CLIENT_ID` + `SPOTIFY_CLIENT_SECRET` übernehmen, alte App **löschen**
* [ ] Redirect URIs prüfen (müssen exakt zu `SPOTIFY_REDIRECT_URI` passen): lokal `http://localhost:3001/callback` **und** die Produktions-URL (Koyeb) - auch `CLIENT_URL`-abgeleitete Callbacks
* [ ] Neue Werte als Deploy-Env-Vars setzen (Koyeb: *Settings → Environment variables*), Redeploy
* [ ] Lokal `music-imposter-app/server/.env` aus `.env.example` neu erzeugen und neue Werte eintragen
* [ ] **Kontrolle:** Spotify-Dashboard → *User Management*/App-Statistiken auf unerwartete Nutzung prüfen

### B2 - MongoDB Atlas (DB-User-Passwort / `MONGODB_URI`)

* [ ] https://cloud.mongodb.com → Projekt → **Database Access** → DB-User (z. B. `oneoff-app`) → **Edit** → *Edit Password* → neues, zufälliges Passwort generieren → **Update User**
* [ ] **Network Access** prüfen und auf das Minimum reduzieren (IP-Allowlist statt `0.0.0.0/0`)
* [ ] *Project → Access Manager → API Keys*: alte/unbekannte Keys löschen
* [ ] **Organization/Project Access**: Rollen prüfen (keine unnötigen Owner)
* [ ] Neuen Connection-String in Koyeb setzen (`MONGODB_URI`) + Redeploy, lokal in `.env`
* [ ] Atlas **Audit/Activity Log** auf fremde Verbindungen prüfen (Billing/Alerts auf Nutzungsspitzen)
* [ ] Falls die Codes/Subscription-Daten manipuliert sein könnten: Collection `codes` auf verdächtige `isRedeemed`-Muster prüfen

### B3 - Google Play Upload-Key (`upload-keystore.jks` + Passwort)

Das ist der **kritischste** Fund: Keystore **und** Klartext-Passwort lagen zusammen im Projekt (`build.gradle:22,24`).

* [ ] Play Console → App → *Test und Release* → **App-Integrität** prüfen: Ist **Play App Signing** aktiv? (Bei neuen Apps seit 2021 standardmäßig ja)
* [ ] **Fall „Play App Signing aktiv":** Upload-Key ist „nur" der Upload-Key → Reset möglich.
  * [ ] Google-Support-Formular *„Upload key reset request"* ausfüllen (Play Console → App-Integrität → *Upload-Schlüssel zurücksetzen anfordern*, bzw. https://support.google.com/googleplay/android-developer/answer/9842756)
  * [ ] Neuen Keystore **lokal** erzeugen:
    `keytool -genkeypair -v -keystore upload-keystore.jks -alias upload -keyalg RSA -keysize 4096 -validity 10000 -storetype JKS`
    (Passwort: **neues, starkes** Passwort, nicht wiederverwenden - nicht ins Repo!)
  * [ ] Zertifikat exportieren und bei Google hochladen:
    `keytool -export -rfc -keystore upload-keystore.jks -alias upload -file upload_certificate.pem`
  * [ ] Passwörter in `client/android/keystore.properties` (via Teil A2.3) eintragen, **nicht** in `build.gradle`
  * [ ] Prüfen, dass der alte Keystore **nirgends** mehr im Repo/History ist (Teil C) und externen Backup-Ort verschlüsseln
* [ ] **Fall „Play App Signing NICHT aktiv":** Der App-Signing-Key selbst ist kompromittiert. Ein Angreifer könnte Update-APKs signieren, die dein App-Update sind. Google erlaubt für bereits veröffentlichte Apps **keinen** Key-Wechsel ohne Play App Signing → Support kontaktieren (https://support.google.com/googleplay/android-developer/contact/key) und Play App Signing nachträglich aktivieren lassen; im Extremfall ist eine neue App-Listing-ID nötig.
* [ ] **Zusatz:** Das in `build.gradle:22/24` geleakte Keystore-Passwort gilt überall als verbrannt (Wert bewusst nicht im Dokument) - auch wenn es „nur" ein Keystore-Passwort war (dictionary-angreifbar, 2.7 KB Keystore ist offline-brute-forcebar)

### B4 - Deploy-Umgebung & Sonstiges

* [ ] Koyeb (*Environment variables*): `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `MONGODB_URI`, `CLIENT_URL` auf neue Werte setzen und **neu deployen** (neue Deploy-ID)
* [ ] **Log-Hygiene:** `index.js:36` hat den Anfang des `.env`-Inhalts in die Logs geschrieben → alte Koyeb-Deployment-Logs/Build-Logs löschen bzw. Aufbewahrungszeit prüfen
* [ ] `gh auth login` (kommt gleich) → Token **mit minimalen Scopes** erzeugen (`repo`, `workflow`; kein `admin:org`, kein `delete_repo`) und ggf. nur kurzlebig
* [ ] GitHub: **Secret Scanning + Push Protection** für das (neue) Repo aktivieren (Settings → Code security) - verhindert künftige Pushes von Secrets
* [ ] Geprüft und **kein** Rotationsbedarf: AdMob-App-ID (`ca-app-pub-…~…` ist öffentlich), Kontakt-Mail in `docs/index.html` (öffentliche Datenschutzerklärung), `keyAlias "upload"` - kein Geheimnis
* [ ] Falls es irgendwann eine `.env` mit weiteren Keys gab (Firebase, Deezer, Mail): diese ebenfalls rotieren - im Workspace lagen keine, bitte gegenprüfen

---

## C) Git-History bereinigen (wenn Secrets/Artefakte schon gepusht wurden)

**Voraussetzung:** Es gibt lokal noch kein Repo → zuerst einen **Spiegel-Backup** ziehen und einen Arbeitsklon anlegen. Platzhalter: `<OWNER>` = GitHub-User/Org, `<REPO>` = Repo-Name.

```powershell
cd C:\Users\Timo\Documents\Apps
# 0) Vollständiges Backup der Original-History (NICHT überschreiben)
git clone --mirror https://github.com/<OWNER>/<REPO>.git ..\backup-OneOff-mirror.git
# 1) Arbeitsklon
git clone https://github.com/<OWNER>/<REPO>.git oneoff-history-fix
cd oneoff-history-fix
```

Erst **schauen**, was wirklich drin war (nichts blind löschen):

```powershell
git log --oneline --all
git log --all --pretty=format: --name-only | Sort-Object -Unique | Out-File ..\all-files-ever.txt
Select-String -Path ..\all-files-ever.txt -Pattern '(^|/)\.env|\.jks$|\.keystore$|\.aab$|\.apk$|keystore\.properties|node_modules/|\.cap8-template'
git log --all --oneline -- music-imposter-app/server/.env client/android/app/upload-keystore.jks
```

### C1 - Empfohlen: `git filter-repo` (neu, schnell, von Git empfohlen)

```powershell
# Installation (Python erforderlich): 
pip install git-filter-repo
# Alternative ohne pip: Single-File-Skript von https://github.com/newren/git-filter-repo
# herunterladen und als "git-filter-repo" in einen PATH-Ordner legen.
git filter-repo --version
```

```powershell
# 1) Sensible Dateien + Artefakte aus ALLEN Commits entfernen
git filter-repo --invert-paths `
  --path music-imposter-app/server/.env `
  --path client/android/app/upload-keystore.jks `
  --path client/android/keystore.properties `
  --path client/android/local.properties `
  --path .cap8-template `
  --path client/node_modules `
  --path client/.next `
  --path client/out `
  --path client/android/app/build `
  --path-glob '*.jks' `
  --path-glob '*.keystore' `
  --path-glob '*.aab' `
  --path-glob '*.apk'

# 2) Restliche Klartext-Secrets in überlebenden Dateien ersetzen
#    Datei replacements.txt anlegen (eine Regel pro Zeile):
#      literal:<GELEAKTES_PASSWORT>==>REDACTED
#      regex:(PRO-)[0-9A-F]{8}==>\1XXXXXXXX
git filter-repo --replace-text replacements.txt
```

> `git filter-repo` **entfernt aus Sicherheitsgründen das `origin`-Remote**. Deshalb danach neu setzen und forciert pushen:

```powershell
git remote add origin https://github.com/<OWNER>/<REPO>.git
git fetch origin
git push --force-with-lease origin --all
git push --force-with-lease origin --tags
# falls --force-with-lease mangels Remote-Tracking-Ref fehlschlägt:
#   git push --force origin --all   (nur nach Kontrolle + Absprache!)
```

### C2 - Alternative: BFG Repo-Cleaner

```powershell
git clone --mirror https://github.com/<OWNER>/<REPO>.git ..\repo.git
# bfg.jar: https://rtyley.github.io/bfg-repo-cleaner/  (Java 21 ist vorhanden, z. B. C:\Users\Timo\android-build\jdk-21*)
java -jar bfg.jar --strip-blobs-bigger-than 1M --no-blob-protection `
     --delete-files .env --delete-files '*.jks' --delete-files '*.keystore' `
     --delete-files '*.aab' --delete-files '*.apk' --delete-folders node_modules `
     --delete-folders .cap8-template ..\repo.git
# passwords.txt mit den zu ersetzenden Strings füllen, dann:
java -jar bfg.jar --replace-text passwords.txt ..\repo.git

cd ..\repo.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force-with-lease
```

### C3 - Nach dem Rewrite (Pflicht!)

* [ ] **Alle Collaborators müssen neu klonen** (alter Klon → Konflikte/Geister-Commits beim Push). Kein `git pull` auf dem alten Klon.
* [ ] **Forks:** GitHub löscht geforkte Kopien **nicht** mit; Forks behalten die alten Objekte. Forks löschen lassen oder (bei eigenen) selbst bereinigen.
* [ ] **Caches/Views:** GitHub cached Blobs/Views serverseitig. Nach dem Force-Push ein Ticket aufmachen: https://support.github.com/request → Kategorie *„Remove data / sensitive data"*, Repo + betroffene Pfade + Commit-Shas angeben (Doku: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
* [ ] **Pull-Request-Refs** (`refs/pull/*`) können alte Commits weiter erreichbar machen → Support im Ticket erwähnen
* [ ] Falls nicht anders möglich: **Repo löschen** und neu anlegen (Repo-Rechte, Actions-Secrets, Webhooks, Deployments neu konfigurieren) - dann **alle** Secrets rotieren, da sie per Fork/Clone weiterleben
* [ ] Danach: Secret Scanning + Push Protection aktivieren, `git log --stat -5` prüfen, `.gitignore` aus Teil D verifizieren

> **Faustregel:** Ist die History stark verschmutzt (100+ Commits, viele Binaries), ist **Teil D (sauberer Neustart)** schneller, sicherer und billiger als ein Rewrite.

---

## D) Repo neu aufsetzen (sauberer Start) - der risikoärmste Weg

Da **kein lokales Repo** existiert und der Remote-Stand unbekannt/verseucht ist, ist ein frischer Start meist die beste Wahl. Vorteil: **keine History-Rewrites**, kein Force-Push, kein Support-Ticket, keine Koordinationsprobleme mit Collaborators - und die alten Secrets werden durch die Rotation (Teil B) entwertet.

### D1 - Reihenfolge (nicht vertauschen!)

1. [ ] **Erst rotieren** (Teil B) - Spotify, MongoDB, Play-Upload-Key, Koyeb-Env
2. [ ] Lokal aufräumen (siehe A1) bzw. die Dateien in einen Ordner außerhalb des Repos verschieben, z. B. `C:\Users\Timo\OneOff-release-artefakte\`
3. [ ] `client/android/.gitignore` fixen (Teil A2.3)
4. [ ] Frisches Repo initialisieren, prüfen, committen, pushen
5. [ ] Altes GitHub-Repo **archivieren** (Settings → *Archive this repository*), erst später löschen - so bleibt ein Notfall-Backup, aber nichts ist mehr öffentlich editierbar

### D2 - Frisches Repo anlegen (lokal)

```powershell
cd C:\Users\Timo\Documents\Apps\OneOff
git init -b main

# 1) Trockenlauf: WAS würde committet werden? (Liste genau lesen!)
git add --dry-run .

# 2) Verbots-Check (Ausgabe MUSS leer sein, siehe Teil E)
git add .
git ls-files | Select-String -Pattern '\.apk$|\.aab$|\.jks$|\.keystore$|(^|/)\.env$|keystore\.properties|local\.properties|node_modules/|\.next/|\.cap8-template'

# 3) Umfang + Größe prüfen (Ziel: < 5 MB, ~80-120 Dateien)
(git ls-files | Measure-Object).Count
$s=0; foreach($f in (git ls-files)){ if(Test-Path -LiteralPath $f){ $s += (Get-Item -LiteralPath $f).Length } }; '{0:N2} MB' -f ($s/1MB)

# 4) Committen
git commit -m "Initial commit: OneOff (Music Imposter) - Client (Next.js/Capacitor) + Server, ohne Artefakte und Secrets"
```

### D3 - Nach GitHub pushen (mit `gh`, nach `gh auth login`)

```powershell
gh auth login          # HTTPS, GitHub.com, "Login with a web browser"; Scopes minimal halten
gh auth status

# NEUES, privates Repo anlegen und direkt pushen
gh repo create OneOff --private --source . --remote origin --push `
  --description "OneOff / Music Imposter - Multiplayer Musik-Ratespiel (Next.js + Capacitor + Express/Socket.io)"

# Kontrolle
git remote -v
git log --stat -1
gh repo view --web
```

Danach in den Repo-Settings: **Secret scanning** + **Push protection** aktivieren (*Settings → Code security and analysis*), Branch-Protection für `main`, und als Alternative zu Binaries **GitHub Releases** für AAB/APK nutzen.

### D4 - Was gehört (kuratiert) ins Repo?

| Rein | Raus (siehe A1) |
|---|---|
| `.gitignore`, `.env.example`, `README`-Dateien | `.env` (jede echte Variante) |
| `build-android-release.ps1` | alle `*.apk` / `*.aab` (35 + 8) |
| `docs/` (`index.html` Datenschutz, `repo-cleanup.md`) | `.cap8-template/` |
| `client/src/**`, `client/public/**`, `client/assets/**` | `client/node_modules/`, `client/.next/`, `client/out/` |
| `client/{package.json,package-lock.json,next.config.mjs,postcss.config.mjs,eslint.config.mjs,jsconfig.json,capacitor.config.ts,vercel.json,.gitignore}` | `client/android/app/build/`, `client/android/build/`, `client/android/.gradle/`, `client/android/.kotlin/`, `client/android/capacitor-cordova-android-plugins/` |
| `client/android/**` (Gradle-Dateien, `app/src/**`, `app/build.gradle` **ohne** Passwörter) | `client/android/app/upload-keystore.jks`, `keystore.properties`, `local.properties` |
| `client/android/app/src/main/res/**`, `AndroidManifest.xml` | `app/src/main/assets/public/`, `assets/capacitor.config.json`, `assets/capacitor.plugins.json`, `res/xml/config.xml` |
| `music-imposter-app/README.md`, `server/{index.js,models.js,package.json,package-lock.json}` | `server/admin/generate_codes.js` (→ privates Ops-Repo), `server/.env` |

**Entscheidungsmatrix History-Fix vs. Neustart**

| Situation | Empfehlung |
|---|---|
| Secrets wurden gepusht, Repo ist öffentlich, viele Forks | **Neustart (D)** + Rotation + Support-Ticket für Alt-Repo |
| Secrets wurden gepusht, privates Repo, 1 Entwickler | **Neustart (D)** reicht; Rotation trotzdem Pflicht |
| Secrets **nie** gepusht, Repo nur mit Artefakten verschmutzt | **Neustart (D)** oder `filter-repo` (C) - beides ok |

---

## E) Prüf-Checkliste vor **jedem** Push

```powershell
# a) Was ist gestaged? (nur erwartete Dateien?)
git status --short

# b) Negativ-Check: sind die Verbots-Pfade ignoriert? (muss Treffer ausgeben)
git check-ignore -v --no-index client/android/app/upload-keystore.jks music-imposter-app/server/.env client/out client/.next client/node_modules .cap8-template

# c) Positiv-Check: .env.example darf NICHT ignoriert sein
#    ohne -v: leere Ausgabe + ExitCode 1 = korrekt / ExitCode 0 = FEHLER
#    (Achtung: "check-ignore -v" zeigt Negationsmuster ebenfalls an - nicht verwenden!)
git check-ignore --no-index .env.example
if ($LASTEXITCODE -eq 1) { 'OK: .env.example wird getrackt' } else { 'FEHLER: .env.example ist ignoriert!' }

# d) Verbots-Muster im Index? (Ausgabe MUSS leer sein)
git ls-files | Select-String -Pattern '\.apk$|\.aab$|\.jks$|\.keystore$|(^|/)\.env$|keystore\.properties|local\.properties|node_modules/|\.next/|\.cap8-template'

# e) Secret-Muster in getrackten Dateien? (Ausgabe MUSS leer sein)
git ls-files | Where-Object { $_ -notmatch 'package-lock\.json|\.env\.example$' } |
  Select-String -Pattern 'client_secret\s*[:=]\s*[\x22\x27]','BEGIN [A-Z ]*PRIVATE KEY','mongodb\+srv://','api[_-]?key\s*[:=]','storePassword\s+[\x22\x27]' -CaseSensitive:$false

# f) Index-Größe (Warnschwelle: > 10 MB => etwas Großes ist reingerutscht)
$s=0; foreach($f in (git ls-files)){ if(Test-Path -LiteralPath $f){ $s += (Get-Item -LiteralPath $f).Length } }; '{0:N2} MB' -f ($s/1MB)

# g) Letzter Commit: welche Dateien, wie viele Zeilen?
git log --stat -1
```

* [ ] `git status --short` zeigt keine `.env`, keine `*.jks`, keine Build-Ordner
* [ ] `check-ignore`-Negativ-Check (b) liefert für **alle** Verbots-Pfade Treffer
* [ ] `check-ignore`-Positiv-Check (c) meldet „OK: .env.example wird getrackt" (ExitCode 1); bei „FEHLER" ist das Muster `.env.*` zu breit
* [ ] Verbots-Muster (d) = 0 Treffer, Secret-Muster (e) = 0 Treffer
* [ ] Index < 10 MB (f)
* [ ] Commit-Diff (g) gelesen - keine fremden Änderungen
* [ ] **Nie** `git add -f` blind und **nie** `.env` in den Index
* [ ] Optional als Guard: `gitleaks`/`trufflehog` als Pre-Commit-Hook bzw. GitHub Action (z. B. `gitleaks/gitleaks-action`)

---

## Anhang: Verifikationen dieses Audits & lokale Änderungen

**Durchgeführte Prüfungen (29.09.2026)**

| Prüfung | Ergebnis |
|---|---|
| `.git`-Verzeichnis unter `C:\Users\Timo\Documents\Apps` (rekursiv) | **keins** |
| `C:\Users\Timo\.gitconfig` | existiert nicht |
| `gh` (GitHub CLI) | **nicht installiert**; `git 2.55.0.windows.5` vorhanden |
| `.env`-Dateien unter Documents/Desktop/Downloads/projects (Tiefe 4) | **keine gefunden** |
| `BEGIN … PRIVATE KEY` / `mongodb+srv://` in Quellen | 0 Treffer |
| `.gitignore`-Kodierung | Root + `client/android` waren **UTF-16LE** (Nullbytes) → unwirksam |
| Root-Binärartefakte | 35 × `.apk` = **440,7 MB**, 8 × `.aab` = **86,3 MB** |
| Build-/Dependency-Müll | `node_modules` 642,9 MB · `android/app/build` 292,2 MB · `.next` 46,1 MB · `android/.gradle` 8,4 MB · `out` 1,1 MB · `cap8-template` 0,3 MB |

**Lokal geänderte/neue Dateien**

1. `C:\Users\Timo\Documents\Apps\OneOff\.gitignore` - **ersetzt**: vorher 177 Bytes UTF-16LE mit 4 APK-Namen, jetzt 3.154 Bytes **UTF-8 ohne BOM**; deckt Secrets (`.env*`, `*.jks`, `*.keystore`, `keystore.properties`, `local.properties`, `*.pem`), Dependencies/Build (`.next/`, `out/`, `build/`, `dist/`, `node_modules/`), Android/Gradle/Capacitor, Flutter (`.dart_tool/`, `.flutter-plugins*`, `oneoff_flutter/build/`), `.cap8-template/`, IDE- und OS-Dateien ab; `.env.example` explizit **nicht** ignoriert; alle Alt-Einträge (inkl. der 4 APK-Namen) bleiben erhalten.
2. `C:\Users\Timo\Documents\Apps\OneOff\.env.example` - **neu** (1,6 KB): Vorlage mit `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REDIRECT_URI`, `CLIENT_URL`, `MONGODB_URI`, `PORT` **ohne echte Werte**, plus Hinweis auf `NEXT_PUBLIC_SERVER_URL` und die Kopier-Anleitung nach `music-imposter-app/server/.env`.
3. `C:\Users\Timo\Documents\Apps\OneOff\docs\repo-cleanup.md` - **neu** (dieses Dokument).

**Validierung der neuen `.gitignore` (echter Git-Test, außerhalb des Projekts)**

In `%TEMP%\oneoff-gitignore-test` wurde ein Wegwerf-Repo mit 31 Testdateien angelegt, die neue `.gitignore` kopiert und `git init && git add -A` ausgeführt. Ergebnis:

* **Getrackt (korrekt):** `.gitignore`, `.env.example`, `.vscode/settings.json`, `build-android-release.ps1`, `client/android/app/build.gradle`, `client/android/app/src/main/res/values/strings.xml`, `client/assets/icon.png`, `client/package.json`, `client/src/app/page.js`, `docs/repo-cleanup.md`
* **Ignoriert (korrekt, per `git check-ignore -v` belegt):** `*.jks` (`upload-keystore.jks`), `.env`, `.env.local`, `music-imposter-app/server/.env`, `keystore.properties`, `local.properties`, `node_modules/`, `.next/`, `out/`, `build/` (`android/app/build/**`), `.gradle/`, `.cap8-template/`, `*.apk`, `*.aab`, `.dart_tool/`, `.idea/`, `.DS_Store`, `Thumbs.db`, `client/android/app/src/main/assets/public/`
* **Positiv-Check:** `git check-ignore --no-index .env.example` → leere Ausgabe, ExitCode 1 = **wird getrackt** ✔

**Nichts im Projekt gelöscht oder umbenannt, kein `git init`/kein Commit im Projektordner, kein Netzwerkzugriff auf GitHub.** (Der eigene Temp-Testordner `%TEMP%\oneoff-gitignore-test` wurde vor der Erstellung entfernt und danach bewusst liegen gelassen.)

**Offene Entscheidung des Users (blockiert den Remote-Cleanup):** Repo-URL/Owner + ob Secrets schon gepusht wurden + ob der Pro-/Redeem-Bereich raus soll.


# Auth & User-Profil — Design

**Datum:** 2026-04-22
**Scope:** Anmeldung/Registrierung/Logout/Passwort-Reset über Directus Auth, ein bearbeitbares "Mein Konto"-Profil, Header-Avatar-Dropdown, geschützte Routen unter `/konto/*`. Vorbereitung für die anschließende Buchungs-Spec, die `directus_users` als FK nutzen wird.

## 1. Ausgangslage

- Nuxt 4 App in `backup/`, Directus 11 Backend unter `https://directuscon.axtlust.de`.
- Bisheriger Server-seitiger Datenzugriff läuft mit einem **statischen Admin-Token** aus `.env` über `useDirectusServer()` — für öffentliche Inhalte (Touren, Pages, Blocks) bleibt das so.
- Keine Auth-Komponenten vorhanden. Header zeigt einen "Anmelden"-Button, der ins Leere klickt.
- Directus hat eingebaute Auth-Endpoints (`/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/password/request`, `/auth/password/reset`, `/users/register`, `/users/me`).
- SMTP-Status: `/auth/password/request` antwortet `204` ohne Fehler — vermutlich konfiguriert, muss aber bei Implementierung mit echter E-Mail verifiziert werden.

## 2. Zielbild

- Besucher kann sich mit **E-Mail + Passwort registrieren** und wird sofort eingeloggt.
- Eingeloggter User sieht sein **Avatar/Initialen-Dropdown** im Header statt "Anmelden".
- "Mein Konto" Seite (`/konto`): bearbeitbares Profil (E-Mail, Vorname, Nachname, Avatar) + Passwort ändern.
- "Passwort vergessen" Flow funktional inkl. E-Mail-Reset-Link.
- Session bleibt **persistent 7 Tage** (Directus-Default `REFRESH_TOKEN_TTL`) über httpOnly-Cookies, automatischer Token-Refresh im Hintergrund.
- `/konto/*` ist via Auth-Middleware geschützt — Nicht-eingeloggte User landen auf `/anmelden?redirect=/konto`.
- Backend-seitig: Neue Directus-Rolle "Kunde" mit minimalen Permissions (eigenes User-Record lesen/updaten, öffentliche Collections lesen).

## 3. Architektur-Entscheidung: Server-proxied Auth

**Wahl:** Frontend ruft **eigene Nuxt-Server-Routes** unter `/api/auth/*` auf. Diese Routes proxy-en zu Directus und verwalten **httpOnly-Cookies** auf unserer Domain.

**Warum nicht direkt von Client zu Directus?**
- Directus läuft auf einer anderen Domain (`directuscon.axtlust.de` vs. App-Domain). Cross-origin httpOnly-Cookies brauchen exakte CORS-Konfiguration auf Directus-Seite und sind fragiler.
- httpOnly-Cookies können vom Client-JavaScript nicht gesetzt werden — der Server muss das tun.
- Server-Proxy gibt uns einen sauberen Punkt zum Loggen, Rate-Limiten und für künftige Erweiterungen (Captcha, Audit-Trail).

**Wie zerteilt sich der Datenfluss:**

| Operation | Aufruf | Wo werden Tokens verwendet? |
|---|---|---|
| **Öffentliche Inhalte** (Touren, Pages, Blocks) | wie heute, `useDirectusServer()` mit Admin-Token | Server-side, bestehender Flow |
| **Login / Register / Logout** | `/api/auth/login` etc. → Nuxt-Server proxy-t zu Directus | Server liest/setzt httpOnly-Cookies |
| **Profil lesen / updaten** | `/api/auth/me` (GET/PATCH) | Server liest Cookie, fragt Directus mit User-Token |
| **Token-Refresh** | Server-Middleware vor jeder geschützten Route | Stillschweigend, falls `access_token` < 60s gültig |

## 4. Daten-Architektur

### 4.1 Directus-User-Felder (eingebaut, nichts neues nötig)

Wir nutzen ausschließlich die Standard-Felder von `directus_users`:

| Feld | Verwendung |
|---|---|
| `id` (uuid) | Primärschlüssel, später FK in `buchungen` |
| `email` | Login-Identifikator + Account-E-Mail |
| `password` | Bcrypt-gehasht durch Directus |
| `first_name` | Vorname, im Header und in Buchungen vorbefüllt |
| `last_name` | Nachname |
| `avatar` | FK auf `directus_files` — optionales Profilbild |
| `role` | gesetzt auf "Kunde" für alle Selbst-Registrierten |
| `status` | `active` für normale User, `suspended` falls Admin sperrt |
| `last_access` | von Directus auto-gepflegt |

**Keine zusätzlichen Custom-Felder.** Telefon/Adresse gehören zur `buchungen`-Collection (separater Spec), weil sie sich pro Buchung unterscheiden können (z. B. Rechnungs-Adresse).

### 4.2 Neue Directus-Rolle "Kunde"

Idempotent via Setup-Script angelegt:

| Property | Wert |
|---|---|
| `name` | `Kunde` |
| `icon` | `person` |
| `description` | "Endkunde der Website. Kann eigene Daten bearbeiten und Touren buchen." |
| `admin_access` | `false` |
| `app_access` | `false` (kein Zugriff auf Directus-Admin-UI) |

### 4.3 Permissions der "Kunde"-Rolle

Über eine **Policy** (Directus 11 Permission-Modell):

| Collection | Action | Filter / Fields |
|---|---|---|
| `directus_users` | `read` | `id` `_eq` `$CURRENT_USER` — Fields: id, email, first_name, last_name, avatar, status |
| `directus_users` | `update` | `id` `_eq` `$CURRENT_USER` — Fields: email, password, first_name, last_name, avatar |
| `directus_files` | `create` | nur Upload, kein Filter (Avatar-Upload) |
| `directus_files` | `read` | nur eigene Files: `uploaded_by` `_eq` `$CURRENT_USER` (öffentliche Files wie Tour-Galerien werden über Public-Role separat freigegeben — bestehender Zustand) |
| `touren` | `read` | `status` `_eq` `published` |

### 4.4 Public-Registrierung in Directus aktivieren

Globale Setting via Setup-Script:
- `public_registration: true`
- `public_registration_role: <Kunde-Role-ID>` — neue Self-Service-Accounts bekommen automatisch die Kunde-Rolle.
- `public_registration_email_filter: null` (keine Domain-Restriction)
- `public_registration_verify_email: false` (Q1=A → kein Verify-Schritt; können wir später flippen ohne Code-Changes).

## 5. Frontend-Architektur

### 5.1 Neue/Geänderte Dateien

```
backup/
├── app/
│   ├── components/
│   │   ├── sections/
│   │   │   └── TheHeader.vue              (GEÄNDERT: Auth-State + Avatar-Dropdown)
│   │   └── Auth/
│   │       ├── LoginForm.vue              (NEU)
│   │       ├── RegisterForm.vue           (NEU)
│   │       ├── PasswordResetRequestForm.vue (NEU)
│   │       ├── PasswordResetForm.vue      (NEU)
│   │       ├── UserMenu.vue               (NEU — Header-Dropdown)
│   │       └── UserAvatar.vue             (NEU — Avatar-Bild oder Initialen)
│   ├── composables/
│   │   ├── useAuth.ts                     (NEU — login/logout/register actions)
│   │   └── useUser.ts                     (NEU — current user state via useState)
│   ├── middleware/
│   │   └── auth.ts                        (NEU — schützt /konto/*)
│   ├── pages/
│   │   ├── anmelden.vue                   (NEU)
│   │   ├── registrieren.vue               (NEU)
│   │   ├── passwort-vergessen.vue         (NEU)
│   │   ├── passwort-ruecksetzen.vue       (NEU — query param `token`)
│   │   └── konto/
│   │       ├── index.vue                  (NEU — Profil-Übersicht/-Edit)
│   │       └── passwort.vue               (NEU — Passwort ändern)
│   └── plugins/
│       └── auth-init.ts                   (NEU — lädt User beim App-Start, läuft server- und client-seitig für SSR-Hydration ohne Flicker)
├── server/
│   ├── api/
│   │   └── auth/
│   │       ├── login.post.ts              (NEU)
│   │       ├── register.post.ts           (NEU)
│   │       ├── logout.post.ts             (NEU)
│   │       ├── refresh.post.ts            (NEU)
│   │       ├── me.get.ts                  (NEU)
│   │       ├── me.patch.ts                (NEU)
│   │       ├── password-request.post.ts   (NEU)
│   │       ├── password-reset.post.ts     (NEU)
│   │       └── avatar.post.ts             (NEU — Multipart-Upload für Profilbild)
│   ├── middleware/
│   │   └── auth-refresh.ts                (NEU — auto-refresh access_token vor Ablauf)
│   └── utils/
│       ├── auth-cookies.ts                (NEU — set/get/clear httpOnly cookies)
│       └── directus-user.ts               (NEU — kleiner Directus-Client, nutzt User-Token statt Admin-Token)
├── shared/types/
│   └── auth.ts                            (NEU — User-Type, Auth-Errors)
└── scripts/
    └── auth-setup.mjs                     (NEU — Kunde-Rolle + Permissions + public_registration)
```

### 5.2 Komponenten-Grenzen

- **`useAuth()` composable** — Aktionen: `login`, `register`, `logout`, `requestPasswordReset`, `resetPassword`, `updateProfile`, `uploadAvatar`. Jede Aktion ruft genau eine Server-Route, behandelt Fehler einheitlich (return-objekt `{ ok: true } | { ok: false, error: 'Falsche E-Mail oder Passwort' }`), refreshed bei Erfolg den User-State.
- **`useUser()` composable** — exponiert `user: Ref<User | null>` und `isLoggedIn: ComputedRef<boolean>`. Kein eigener Fetch — wird von `auth-init.client.ts` initial befüllt und von `useAuth`-Aktionen aktualisiert. Reine State-Quelle.
- **Auth-Forms** (Login/Register/PasswordReset/PasswordResetRequest) — präsentationelle Komponenten, kennen nur die Felder + Submit-Callback. Keine Routing-Logik im Form selbst; das macht die Page.
- **`UserAvatar.vue`** — kennt nur `{ user }` und rendert entweder `<img>` (falls `avatar` gesetzt) oder einen runden Kreis mit Initialen. Wiederverwendbar.
- **`UserMenu.vue`** — Dropdown mit shadcn `<DropdownMenu>`. Kennt nur den User und triggert `useAuth().logout()` beim Klick auf "Abmelden".

### 5.3 Datenfluss: Login

```
1. User füllt Email/Password in LoginForm.vue
2. LoginForm ruft useAuth().login(email, password)
3. useAuth POST /api/auth/login mit JSON-Body
4. server/api/auth/login.post.ts:
   a. fetch Directus POST /auth/login (mit body-mode 'json')
   b. Directus antwortet { access_token, refresh_token, expires }
   c. Setze httpOnly-Cookies: 'directus_at' (access, 15min — Directus-Default `ACCESS_TOKEN_TTL`), 'directus_rt' (refresh, 7d — Directus-Default `REFRESH_TOKEN_TTL`)
   d. Antwortet { ok: true }
5. useAuth ruft im Hintergrund GET /api/auth/me und füllt useUser-State
6. LoginForm navigiert zu redirect-target (Default: '/konto')
```

### 5.4 Datenfluss: Authenticated Request (z. B. Profil updaten)

```
1. User submit'ed Profil-Edit-Formular
2. useAuth().updateProfile({ first_name, last_name, email })
3. useAuth PATCH /api/auth/me mit JSON-Body
4. server/middleware/auth-refresh.ts läuft VOR der Route:
   a. liest Cookie 'directus_at'
   b. Falls fehlt oder TTL <60s → versucht Refresh via 'directus_rt'
   c. Falls Refresh fehlschlägt → 401, Cookies löschen
5. server/api/auth/me.patch.ts:
   a. Erstellt einen Directus-Client mit dem aktuellen access_token
   b. PATCH /users/me mit erlaubten Feldern (allowlist: email, first_name, last_name, avatar)
   c. Liest User neu zurück und gibt ihn zurück
6. useAuth refreshed useUser-State mit der neuen User-Antwort
```

### 5.5 Datenfluss: Token-Refresh-Strategie

- **Strategie**: Lazy refresh in der Server-Middleware vor jeder `/api/auth/*`-Route.
- **Trigger**: access_token TTL < 60 Sekunden ODER fehlt komplett (Refresh-Token noch da).
- **Bei Refresh-Erfolg**: neue Cookies werden gesetzt, Request läuft normal weiter mit neuem Token.
- **Bei Refresh-Fail**: Cookies werden gelöscht, Route gibt 401 zurück, Client navigiert zu `/anmelden`.
- **Kein Client-side Auto-Refresh** — alles serverseitig, kein Polling im Browser.

### 5.6 Pages — Zweck und Layout

| Pfad | Zweck | Layout |
|---|---|---|
| `/anmelden` | Login + Link zu Registrierung + "Passwort vergessen" | Zentriertes Card-Layout, Header bleibt sichtbar |
| `/registrieren` | E-Mail + Passwort + Passwort-Bestätigung + Link zurück zu Login | Zentriertes Card-Layout |
| `/passwort-vergessen` | E-Mail-Eingabe → "Wir haben dir eine E-Mail geschickt" | Zentriertes Card-Layout |
| `/passwort-ruecksetzen?token=…` | Neues Passwort + Bestätigung → "Erfolg, einloggen" | Zentriertes Card-Layout |
| `/konto` | Profil-Übersicht: E-Mail, Name, Avatar editierbar, Link zu "Passwort ändern" und "Abmelden" | Header-Layout wie Touren-Detail, Hauptbereich mit Profil-Card |
| `/konto/passwort` | Aktuelles Passwort + neues Passwort + Bestätigung | Wie /konto |

## 6. Header-Verhalten

**Eingeloggt (`isLoggedIn === true`):**
- Statt "Anmelden"-Button: `<UserAvatar :user="user" size="sm" />` als Trigger
- Klick → shadcn `<DropdownMenu>` mit:
  - **Mein Konto** → `/konto`
  - **Abmelden** → ruft `useAuth().logout()`, navigiert zur Home
- "Tour buchen" Button bleibt sichtbar

**Ausgeloggt (`isLoggedIn === false`):**
- Wie heute: "Anmelden" (jetzt verlinkt nach `/anmelden`) + "Tour buchen"

**Mobile (Drawer-Menü):**
- Eingeloggt: Drawer-Footer zeigt Avatar + Name + "Abmelden"-Button
- Ausgeloggt: heutige "Anmelden" + "Tour buchen" Buttons

**SSR-Behavior:** Da Cookies serverseitig lesbar sind, kennt der Server beim ersten Render den Login-Status. Kein "blink" beim Hydration — der Header wird direkt mit korrektem State serverseitig gerendert.

## 7. Geschützte Routen

- **`/konto/*`** ist mit Route-Middleware `auth.ts` geschützt.
- Middleware-Logik:
  ```
  if (!useUser().isLoggedIn) {
    return navigateTo(`/anmelden?redirect=${encodeURIComponent(to.fullPath)}`)
  }
  ```
- Die `/anmelden`-Page liest `?redirect=…` aus dem Query-Param und navigiert nach erfolgreichem Login dorthin (Default: `/konto`).
- **Server-Schutz**: Die Server-Routes `/api/auth/me`, `/api/auth/me PATCH` etc. werfen 401, wenn kein gültiger Token im Cookie. Doppelt geschützt.

## 8. Error Handling & Edge Cases

| Szenario | Verhalten |
|---|---|
| Falsche Login-Daten | Form zeigt "E-Mail oder Passwort falsch" — keine Unterscheidung welches falsch ist |
| E-Mail bereits registriert | Form zeigt "Diese E-Mail ist bereits vergeben" |
| Schwaches Passwort | Frontend-Validierung: min. 8 Zeichen. Directus prüft serverseitig zusätzlich. |
| Refresh-Token abgelaufen / ungültig | Cookies werden gelöscht, User-State auf `null`, geschützte Route → Redirect `/anmelden` |
| User wird in Directus auf `suspended` gesetzt | Login wirft 403, Form zeigt "Account gesperrt — bitte kontaktieren Sie uns" |
| `/passwort-ruecksetzen` ohne `token` Query-Param | Page zeigt "Ungültiger Reset-Link" + Link zurück zu `/passwort-vergessen` |
| `/passwort-ruecksetzen` mit abgelaufenem Token | Form-Submit gibt Fehler zurück, Page zeigt "Link abgelaufen — bitte erneut anfordern" |
| Avatar-Upload zu groß / falscher Typ | Server-Route prüft (max 2 MB, image/* MIME), gibt 400 mit Klartext zurück |
| Netzwerkfehler bei Login | Form zeigt "Verbindungsproblem — bitte später erneut versuchen" |
| Self-Registrierung deaktiviert (Setting nicht gesetzt) | `/api/auth/register` gibt 403, Page zeigt "Registrierung derzeit nicht möglich" |

## 9. Teststrategie

Wie bei der Touren-Spec: **Manuelle Browser-Smoketests + `yarn build` als Type-Gate**, kein Test-Framework.

Für jede der unten aufgelisteten Reihen wird im Browser Folgendes verifiziert:

1. **Registrierung**: Neue E-Mail eingeben, Account erstellen, automatisch eingeloggt, Header zeigt Avatar.
2. **Login**: Mit derselben E-Mail abmelden, dann erneut einloggen.
3. **Login mit falschen Daten**: Falsches Passwort, korrekte Fehlermeldung.
4. **Profil bearbeiten**: Vorname ändern, Speichern, im Header sichtbar.
5. **Avatar hochladen**: PNG/JPG hochladen, im Header sichtbar.
6. **Passwort vergessen**: E-Mail eingeben, in Inbox prüfen ob E-Mail ankommt (SMTP-Verifikation).
7. **Passwort zurücksetzen**: Link aus E-Mail klicken, neues Passwort setzen, mit neuem Passwort einloggen.
8. **Geschützte Route ohne Login**: `/konto` direkt aufrufen → Redirect nach `/anmelden?redirect=/konto`.
9. **Token-Refresh**: 15min eingeloggt warten, Profil-Edit → muss noch funktionieren (Auto-Refresh).
10. **Logout**: Abmelden-Klick, geschützte Route nicht mehr erreichbar, Cookies sind weg.

## 10. Non-Goals (explizit ausgeschlossen)

- **Social Login** (Google, GitHub, OAuth): Eigener Spec-Zyklus, falls je gewünscht.
- **Two-Factor Auth**: Directus unterstützt es, aber für eine Wander-Touren-Site Overkill.
- **Captcha**: Erst hinzuziehen, wenn Bot-Registrierungen ein konkretes Problem werden.
- **E-Mail-Verifizierung bei Registrierung**: Bewusst auf später verschoben (Q1=A). Setting in Directus ist nicht-Code-Change und kann jederzeit aktiviert werden.
- **Buchungen, "Meine Buchungen"-Übersicht**: Nächster Spec-Zyklus.
- **Account-Löschung durch User**: Erst auf Anfrage; aktuell läuft das über Admin-Manuell.
- **Login mit Magic-Link** (passwortlos): Möglich, aber nicht heute.
- **Session-Devices-Übersicht** (welche Browser sind eingeloggt): Overkill für aktuellen Scope.

## 11. Entscheidungslog

| # | Entscheidung | Alternative | Grund |
|---|---|---|---|
| 1 | Server-proxied Auth über Nuxt-Server-Routes | Direkt vom Client zu Directus | Cross-Origin httpOnly-Cookies sind fragiler; Server-Proxy ist sauberer & erlaubt künftiges Audit/Logging |
| 2 | httpOnly-Cookies für `directus_at` + `directus_rt` | localStorage | XSS-sicher, SSR-fähig, kein "Token im JS"-Anti-Pattern |
| 3 | Persistent Session (~7d), keine Checkbox | Session-only oder Checkbox | UX: 99% wollen eingeloggt bleiben (Q4=B) |
| 4 | Standard-`directus_users`-Felder, keine Custom-Felder | Eigene Felder für Telefon/Adresse | Telefon/Adresse gehören zur Buchung, nicht zum Account (Q3=B) |
| 5 | Eine Rolle "Kunde", eine Policy | Mehrere Rollen (Premium, Standard…) | YAGNI, Self-Registrierung soll automatisch in genau eine Rolle landen |
| 6 | Lazy Token-Refresh in Server-Middleware | Client-Side Refresh-Loop | Server hat Cookies eh in der Hand, kein zusätzlicher Client-Code, kein 401-Flicker |
| 7 | Avatar-Upload via eigene Server-Route, max 2MB | Direkter Multipart zu Directus oder Crop-Tool | Wir wollen eine Allowlist (max 2MB, image/* nur), Crop ist YAGNI |
| 8 | Slugs / URLs auf Deutsch (`/anmelden`, `/konto`) | Englisch (`/login`, `/account`) | Konsistent mit `/touren`, deutsche Site |
| 9 | Kein "Profil zu 80% vollständig"-Indikator | UI-Polish | YAGNI — Felder sind alle optional außer E-Mail |

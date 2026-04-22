# Session-Handoff — Alpenpfad

Dieses Dokument fasst den aktuellen Projektstand zusammen, damit eine neue Claude-Session direkt produktiv starten kann. Bitte als Erstes komplett lesen.

## Projekt-Überblick

- **Alpenpfad** — Nuxt 4 + Directus 11.6.1 Website für geführte Alpen-Wandertouren.
- Inhaber / Hauptnutzer: **Robby Schmidt** (schmidt@rhowerk.de). Deutschsprachig, pragmatisch, mag kurze Antworten und konkrete Empfehlungen.
- Directus-Backend: `https://directuscon.axtlust.de` (Admin-User `mcp@axtlust.de`). Token in `backup/.env`.
- **Aktiver Ordner: `backup/`** — die Nuxt-App mit Directus-Verbindung. Der `test/`-Ordner war ein älteres Snapshot und wurde mittlerweile gelöscht.
- **Aktive Branch:** `development`. Direkte Commits dort sind OK (so arbeiten wir durchgängig).

## Was ist aktuell live (auf `development`)

### Feature 1 — Touren-Collection (abgeschlossen)

- Directus-Collection `touren` mit 23 Feldern + M2M-Gallery `touren_files`.
- Drei Touren geseedet: **Königssee-Rundweg**, **Drei-Zinnen-Umrundung**, **Watzmann-Überschreitung** (alle mit `status=published`, leerem `booking_url`, 4 SVG-Bildern pro Tour in der Gallery).
- Block `block_tourGrid.tours` von JSON zu M2M migriert (Backup der alten Daten unter `exports/migrations/`).
- **Server-API:** `GET /api/content/block` (dereferenziert Tour-M2M), `GET /api/content/tour?slug=<slug>` (einzelne Tour + Gallery).
- **Frontend:** Kacheln auf der Home (`TourGrid.vue` + `TourCard.vue`, komplette Karte clickbar) → Detailseite `/touren/[slug]` mit Hero / FactsBar / Highlights / Gallery (shadcn Carousel mit Loop) / Included / Organizational / CTA / StickyMobileCTA.
- Alle `booking_url`-Felder sind leer → CTAs zeigen disabled "Buchung in Kürze". **Das ist der Handshake für die Buchungs-Spec** (siehe unten).

**Relevante Spec + Plan:**
- `docs/superpowers/specs/2026-04-21-touren-collection-design.md`
- `docs/superpowers/plans/2026-04-21-touren-collection.md`

### Feature 2 — Auth & Benutzerprofil (abgeschlossen)

- Directus-Rolle `Kunde` + Policy mit 5 Permissions (read/update self on `directus_users`, create/read own `directus_files`, read published `touren`).
- `public_registration: true` mit Kunde als Default-Rolle, `public_registration_verify_email: false`.
- **Server-API** (9 Endpoints unter `/api/auth/`): `login`, `logout`, `register` (auto-login), `refresh`, `me` (GET/PATCH), `password-request`, `password-reset`, `avatar` (multipart, max 2 MB, `image/*`).
- Server-Middleware `auth-refresh.ts` refresht abgelaufene Access-Tokens transparent.
- Tokens laufen über **httpOnly-Cookies** (`directus_at` 15 min, `directus_rt` 7 d). Nie im Client-JS.
- **Frontend:** `useUser()` + `useAuth()` Composables, `auth-init.ts`-Plugin mit SSR-Cookie-Forwarding (kein Login-Blink), `auth.ts`-Route-Middleware für `/konto/*`.
- **Pages:** `/anmelden`, `/registrieren`, `/passwort-vergessen`, `/passwort-ruecksetzen?token=…`, `/konto` (Profil + Avatar-Upload), `/konto/passwort`.
- **Header:** Avatar-Dropdown-Menü bei Login, sonst "Anmelden"-Button. Mobile Drawer ebenso.

**Relevante Spec + Plan:**
- `docs/superpowers/specs/2026-04-22-auth-design.md`
- `docs/superpowers/plans/2026-04-22-auth.md`

**Offene Polish-Items aus dem Final-Review** (nicht blockierend, siehe Commit-Log):
- I1 (Policy-Frage): Suspended-User-Sessions laufen bis zu 15 min weiter. 1-Zeilen-Fix in `me.get.ts` möglich, falls sofortige Sperrung gewünscht.
- I3: `me.patch`-Passwort-Change erzeugt Orphan-Refresh-Tokens in Directus (wir logout'en die Throwaway-Session nicht).
- M1: Avatar-Endpoint nutzt `error: 'server_error'` für Validierungsfehler (sauberer: eigener `validation_error`-Code).
- M2: Register-Error-Message ist verwirrend wenn die E-Mail mit anderem Passwort existiert.
- SMTP-Verifikation im Live-Browser: Passwort-Reset-E-Mail muss mal real getestet werden (Task-15-Checklist).

## Nächstes Feature — Buchungssystem

**Noch nicht gestartet.** Workflow bei uns:

1. **`superpowers:brainstorming`** Skill invoken. Ich stelle Klärungsfragen nacheinander (ca. 4–6 Stück), schlage Approaches vor, hole OK per Abschnitt.
2. Design-Spec nach `docs/superpowers/specs/2026-04-22-buchungen-design.md` (oder heutiges Datum) schreiben, self-review, committen.
3. **`superpowers:writing-plans`** für den bite-sized Implementierungsplan (ähnlich wie Touren/Auth: 12–17 Tasks in Phasen).
4. **`superpowers:subagent-driven-development`** für die Umsetzung: pro Task frischer Subagent, Spec-Review + Code-Quality-Review zwischendurch.

**Grobe Eckpunkte für die Buchungen, die schon klar sind:**
- Neue Directus-Collection `buchungen`. Wahrscheinliche Felder: `id` (uuid), `status`, `user` (m2o → directus_users), `tour` (m2o → touren), Datum, Personen-Zahl, Kontakt-Snapshot (Name/Telefon/E-Mail — auch bei User-gebundenen Buchungen, weil sich das pro Buchung unterscheiden kann), Preis-Summe, Notizen, Created/Updated.
- Neue Page `/touren/<slug>/buchen` mit Buchungs-Formular. Setzt Login voraus (via bestehender `auth`-Middleware).
- Optional: `/konto/buchungen` als "Meine Buchungen"-Übersicht (via Kunde-Policy read-own mit `filter: { user: { _eq: '$CURRENT_USER' } }`).
- Sobald `booking_url` pro Tour befüllt ist (oder wir die Buchung an die Detailseite direkt anschließen), aktivieren sich die vorhandenen "Jetzt buchen"-CTAs automatisch.
- Noch zu klären im Brainstorm: Tour-Termine (feste Abfahrten vs. Wunschdatum), Payment (Stripe / Rechnung / Platzhalter), Kapazitäts-Check gegen `group_size_max`, E-Mail-Bestätigungen via Directus Flows.

## Entwickler-Hinweise (kritisch!)

- **Build-Gate:** `yarn build` nutzen, **nicht** `yarn nuxi typecheck`. Letzteres hat pre-existing vue-tsc-Tooling-Probleme (`vue-router/dist/volar/sfc-route-blocks.cjs` MODULE_NOT_FOUND + ein `node:buffer`-Fehler in `server/api/asset/[id].get.ts`, beides vor unserer Zeit).
- **`.env.example`**: In der Working-Tree gibt es eine pre-existing Modifikation. **Nicht stagen.** `git add -A` vermeiden; immer explizite Pfade angeben.
- **Shell:** Git-Bash unter Windows. Unix-Syntax (`/dev/null`, forward slashes). Für `curl` mit URL-Filtern die eckigen Klammern escapen: `"$URL/roles?filter\[name\]\[_eq\]=Kunde"`.
- **Directus-Quirks:**
  - `.test`-TLD wird als E-Mail-Domain abgelehnt — für Smoketests `.de` verwenden.
  - `/users/register` (public) gibt **anti-enumeration 204** auch bei existierenden Adressen → kein `RECORD_NOT_UNIQUE`. Admin-`/users` gibt den Fehler.
  - Directus 11 hat Roles → **Policies** (via `directus_access`) → Permissions. Nicht mehr direkt Role → Permission wie in v10.
  - `@directus/sdk@21` blockt `readItems`/`createItem` auf Core-Collections wie `directus_access` → für die `customEndpoint({ path: '/access', ... })` nutzen (siehe `scripts/auth-setup.mjs`).
- **Test-Framework:** Es gibt keins und es soll keins rein. Verification läuft über Script-Idempotenz + curl-Smoketests + manueller Browser-Test.
- **Token-Verfügbarkeit:** `.env` wird im Production-Mode (`node .output/server/index.mjs`) **nicht** automatisch geladen. Für Prod-Smoketests: `export $(grep -v '^#' .env | xargs -0 | tr '\n' ' ')` davor.

## Nützliche Befehle (copy-paste-fertig)

```bash
cd /c/Users/RobbySchmidt/Documents/GitHub/claude-directus-mcp/backup

# Build (unsere Gate)
yarn build 2>&1 | tail -5

# Dev-Server im Hintergrund
yarn dev > /tmp/dev.log 2>&1 &
sleep 10 && curl -s http://localhost:3000/

# Kill Background-Prozess (Unix+Windows)
kill $DEV_PID 2>/dev/null || taskkill //F //PID $DEV_PID 2>/dev/null

# Directus-API probeweise
TOKEN=$(grep '^DIRECTUS_TOKEN=' .env | cut -d= -f2)
URL=$(grep '^DIRECTUS_URL=' .env | cut -d= -f2)
curl -s -H "Authorization: Bearer $TOKEN" "$URL/server/info"

# Commit nur explizite Dateien (NIE git add -A)
git add <spezifische/dateien>
git commit -m "…"
```

## Arbeits-Skills (Superpowers)

In jeder neuen Session als Erstes ausführen:
1. `superpowers:using-superpowers` lädt automatisch bei Session-Start (Skill-Index).
2. Wenn neues Feature → **`superpowers:brainstorming`** invoken. **Wichtig:** Nie direkt zur Implementierung — erst Spec, dann Plan, dann Code.
3. Plan-Phase: **`superpowers:writing-plans`** nach Brainstorming-Approval.
4. Umsetzung: **`superpowers:subagent-driven-development`** (empfohlen, haben wir zweimal erfolgreich durchlaufen).
5. Memory lädt automatisch bei Session-Start — siehe [memory/MEMORY.md](../../memory/MEMORY.md) (liegt außerhalb des Repos unter `~/.claude/projects/.../memory/`).

## Check-in-Moment

Vor dem Start der Buchungs-Spec:
- [ ] Der User sollte im Browser einen finalen manuellen Auth-Smoketest machen (Register → Login → Profil-Edit → Avatar-Upload → Passwort ändern → Passwort-Reset-E-Mail real empfangen → Logout). Das schließt das Auth-Feature für Live-Betrieb ab.
- [ ] Policy-Entscheidung zu I1 (Suspended-User-Sessions) — optional, kann auch später.

Dann: `superpowers:brainstorming` für die Buchungen.

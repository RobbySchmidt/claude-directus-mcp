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

### Feature 3 — Zweisprachigkeit (DE/EN, abgeschlossen)

- `languages`-Collection mit `de-DE` + `en-US`. N-Sprachen-ready: weitere Sprachen lassen sich per Directus-Admin + `nuxt.config.ts`-Eintrag hinzufügen.
- 15 Translations-Subtables (4 Stammdaten + 10 Blocks + `navigation_items`) + 7 Item-Sub-Collections (für ehemalige JSON-Arrays in Blocks).
- Setup-Script `scripts/i18n-setup.mjs` idempotent, liest DE-Werte aus Backups unter `exports/migrations/`. Rollback-Flag implementiert als Hinweis (manuelle Restore aus JSON-Backups).
- Navigation aus Directus gezogen (3 Records: `Main`, `Footer`, `FooterLegal`, je mit DE+EN Translations). Alte `TheHeader.vue` + `TheFooter.vue` entfernt; `app/layouts/default.vue` rendert jetzt `WebsiteHeader` + `WebsiteFooter`.
- Frontend: `@nuxtjs/i18n@9.5.6` mit `strategy: 'prefix'`, `restructureDir: false` (wegen Nuxt 4 `srcDir: 'app/'`). Slugs pro Sprache: `defineI18nRoute({ paths: { de: '...', en: '...' } })` auf statischen Pages; Tour-/Page-Slugs kommen aus Directus-Translations.
- Zod-Validation lokalisiert via `zod-i18n-map`.
- Legacy-Redirects: alte unprefixed URLs → 301 auf `/de/...` via `server/middleware/legacy-redirect.ts`.
- Scope: Transaktionale E-Mails bleiben DE bis Buchungen live gehen (out-of-scope).

**Bekannte Eigenheiten (aus Setup- + Debug-Runden, alle in der aktuellen Codebase berücksichtigt — zum Nachlesen falls beim Erweitern ähnliche Fehler auftreten):**

- **`defineI18nRoute` paths:** Nuxt-Syntax `[slug]` verwenden, NICHT Vue-Router-Syntax `:slug`. `@nuxtjs/i18n` escaped `:` zu `\:` (literal colon), dynamische Routen matchen sonst nicht.
- **`app.vue` braucht `<NuxtLayout>`:** Ohne expliziten `<NuxtLayout>`-Wrapper in `app.vue` rendert Nuxt das `layouts/default.vue` nicht — Header + Footer wären dann unsichtbar.
- **Homepage-Endpoint darf Blocks NICHT hydrieren:** [server/api/content/homepage.get.ts](../../server/api/content/homepage.get.ts) fragt nur `blocks.*` ab, NICHT `blocks.item.*`. Wenn `blocks.item.*` abgefragt wird, liefert Directus die kompletten Items als Objekte — der `ContentBlockBuilder` würde dann das ganze Objekt als `:id` propagieren, was die Block-API zum URL-encoden des Objekts und zu `403 Forbidden` führt. Jeder Block lädt seine Daten selbst via `/api/content/block`.
- **Block-Komponenten müssen `locale` weitergeben:** Alle 7 Blocks in [app/components/blocks/](../../app/components/blocks/) lesen `const { locale } = useI18n()` und übergeben `locale.value` in der Query. Der `useAsyncData`-Key enthält auch die Locale (`block-${collection}-${id}-${locale.value}`), damit SSR-Cache pro Sprache getrennt bleibt. `watch: [locale]` stellt Re-Fetch bei Sprach-Switch sicher.
- **Gallery M2M-Wrapper muss geflattet werden:** [server/api/content/tour.get.ts](../../server/api/content/tour.get.ts) unwrapped `gallery: [{ directus_files_id: {...} }]` → `gallery: [{...}]` bevor Response. Sonst rendert die Gallery-Komponente keine Bilder (erwartet flache File-Objekte).
- **Tour-Page braucht `useSetI18nParams`:** Der Language-Switcher respektiert Route-Params nicht automatisch. Auf Tour-Detail muss [app/pages/touren/[slug]/index.vue](../../app/pages/touren/[slug]/index.vue) via `setI18nParams({ de: { slug: alt['de-DE'] }, en: { slug: alt['en-US'] } })` sagen, welcher Slug pro Locale gilt. Sonst landet der Switch auf `/en/tours/<de-slug>` → 404.
- **Tour-Links via Named-Route:** Nicht `localePath(\`/touren/${slug}\`)` (erkennt das Slug-Template nicht), sondern `localePath({ name: 'touren-slug', params: { slug } })`. Betrifft [TourCard.vue](../../app/components/TourCard.vue), [TourTermine.vue](../../app/components/Tour/TourTermine.vue), [BuchungDetail.vue](../../app/components/Buchung/BuchungDetail.vue). Auto-Route-Namen: `touren-slug` für `pages/touren/[slug]/index.vue`, `touren-slug-buchen` für `.../buchen.vue`.
- **Directus `display_template`-Referenzen:** Nach der Translation-Migration dürfen `display_template` & Konsorten nicht mehr auf gedroppte Parent-Felder zeigen. `touren.display_template` = `"{{ translations.title }} ({{ region }})"` (nicht `{{ title }}`). Prüfen wenn eine Directus-Admin-Ansicht `403 Forbidden [field does not exist]` wirft.
- **Layout-Padding:** [layouts/default.vue](../../app/layouts/default.vue) hat `<main class="pt-17">` (=68px) — genau die Header-Höhe. Nicht höher, sonst entsteht sichtbare Lücke zwischen Header und Seiteninhalt.
- **`hreflang`-Tags auf SSR:** Tour-Hreflang zeigte vorher server-seitig den DE-Slug auch für EN. Der `useSetI18nParams`-Fix oben korrigiert auch das (seit Commit `aaccecb`).

**Relevante Spec + Plan:**
- `docs/superpowers/specs/2026-04-23-i18n-design.md`
- `docs/superpowers/plans/2026-04-23-i18n.md`

**Neue Konventionen für Folgearbeiten:**
- Alle UI-Strings neu hinzukommender Komponenten in `locales/de.json` + `locales/en.json` eintragen (es gibt ~150 Keys organisiert nach Namespaces `common`, `nav`, `cta`, `auth`, `booking`, `tour`, `form`, `validation`, `footer`, `language`).
- Neue Content-Collections mit Text: Translations-Subtable analog zu `CONTENT_TRANSLATIONS` im Setup-Script.
- Interne Links immer `useLocalePath()` nutzen statt hardcoded `to="/..."`.
- Neuer Block-Typ: in `server/api/content/block.get.ts` in `BLOCK_CONFIG` eintragen.
- EN-Content-Drafts für neue Items: `scripts/i18n-content-en.mjs` erweitern, dann `yarn i18n:setup` ausführen (idempotent).
- `defineI18nRoute` mit dynamischen Segmenten: immer `[param]` statt `:param`.

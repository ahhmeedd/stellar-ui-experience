# PLAN.md: ChantierPro V2 (working name)

> **Single source of truth.** Read this file fully before every task. Build ONE phase at a time, only when asked ("Build Phase N"). Never stub, never use mock data in place of real Supabase logic, never skip RLS. At the end of each phase, update the **Progress tracker** at the bottom of this file and list what is done and what is missing.

---

## 0. Working rules for the AI builder

1. Build only the phase requested. Do not start the next one.
2. No placeholders, fake buttons or hardcoded mock data (except the seed data defined in Phase 1).
3. Every table has Row Level Security. Every rule in section 4 is enforced in the database (constraints, triggers, RLS), not only in the UI.
4. Every user-facing string goes through i18n (FR / AR / EN). No hardcoded text.
5. Use logical CSS properties (`ms-`, `me-`, `ps-`, `pe-`, `start`, `end`) so RTL works everywhere.
6. Keep the code modular: `/features/<module>`, `/components/ui`, `/lib`, `/i18n`, `/hooks`. Typed Supabase queries.
7. If a phase is too large for one run, stop at a clean numbered block and say what remains. I will reply "Continue with the next block".
8. At the end of each phase: list what works, what is missing, and update the tracker.

---

## 1. Product overview

An internal work-tracking app for a small construction team of **4 people (1 admin + up to 3 assistants)**. It tracks **clients, chantiers (sites), visits, meetings, tasks, PV (procès-verbaux de réunion), problems and reports**.

- **Primary target:** Android app (wrapped later with Capacitor).
- **Secondary:** responsive web portal for PC, same codebase.
- **Stack:** React + TypeScript + Tailwind + shadcn/ui, Supabase (Auth, Postgres, Storage, Edge Functions, pg_cron, Realtime).
- **Timezone:** Africa/Tunis (UTC+1, no DST). Store UTC, display Africa/Tunis.
- **Languages:** French (default), Arabic (full RTL), English, via react-i18next. Language switch in profile.

---

## 2. Design direction

Benchmark: Linear, Procore, Fieldwire, Notion Calendar.

- Calm, dense-but-clean, confident.
- Colors: ink navy `#0F172A`, single amber accent `#F59E0B`, slate greys, semantic status colors (green, amber, red, blue). Light and dark mode.
- Fonts: Inter for FR/EN, Cairo or IBM Plex Sans Arabic for AR.
- 8px grid, 12-16px radii, soft layered shadows, high contrast for outdoor use.
- **Mobile (<768px):** top app bar, bottom tab bar (Accueil, Calendrier, Visites, Tâches, Plus), amber FAB above the tab bar, touch targets of at least 48px, one-hand use.
- **Desktop (>=768px):** collapsible left sidebar, top bar with global search (Ctrl/Cmd+K), split list/detail views, content max-width.
- Skeleton loaders, illustrated empty states with a primary action, 150-200ms micro-interactions, toasts, pull-to-refresh on mobile, AA accessibility.

---

## 3. Domain model and core logic

- **Client** has many **Chantiers**.
- **Chantier** has many Visits, Meetings, Problems, Tasks, Photos, PVs.
- **Visit:** check-in/check-out with start time, end time and duration; tasks done, people contacted, problems, photos, decisions, next steps.
- **Meeting (réunion):** scheduled by admin, linked to chantier/client, participants, reminders. A PV is written **after** a meeting.
- **Task:** the ONLY entity that is assigned to a person. The admin has his own tasks too.
  - Overall status: `a_faire` → `en_cours` → `termine` (finished).
  - Daily marking **"fait aujourd'hui"**: logged per day and per person in `task_daily_logs`. The task stays `en_cours` and reappears the next morning until someone marks it `termine`. This log is the work history used in reports.
- **PV actions** automatically become Tasks (responsible person + deadline).
- **Problem:** title, description, severity (`faible` / `moyen` / `critique`), status (`ouvert` / `en_cours` / `resolu`), photos, responsible, resolved_at.
- **Point:** short note left by an assistant, of type `daily_report` (end-of-day report) or `for_admin` (something for the admin to look at). **Assistants NEVER add points into a PV.**
- **Photos:** a secondary feature (standalone gallery + quick urgent-problem capture), not a main flow.

---

## 4. Roles and permission matrix

Only two roles: `admin` and `assistant`. The admin can grant an assistant the flag `can_prepare_pv`.

| Area | Admin | Assistant |
|---|---|---|
| Clients, chantiers | Create, edit, delete | Read only |
| Meetings, visits (scheduling) | Schedule, edit, delete | See scheduled ones |
| Start / finish a visit (check-in/out) | Yes | Yes |
| During a visit (tasks done, contacts, problems, photos) | Everything | Yes |
| Tasks | Create, assign to anyone (including himself), edit, delete | See ONLY their own; mark en cours / fait aujourd'hui / terminé |
| Problems | Full control | See and update only those they logged or that belong to visits they took part in |
| Points | See all, mark as seen | Create (`daily_report` or `for_admin`); see their own |
| PV | Create, edit, validate, sign, lock | Read PVs of meetings they attended. With `can_prepare_pv`: edit drafts only, and only until the meeting date has passed |
| Reports (PDF) | Generate | No |
| Photos | Full | Add and view |
| Team, settings, trash, audit log, notification center | Full | No |

"Attached to visits" means **attendance**: the person is in `visit_participants` or started the visit. It is not assignment.

**Quick-add button (mobile FAB):**
- Admin: "Nouvelle réunion", "Nouvelle visite" (each opens straight into its details form).
- Assistant: "Problème", "Photo", "Point" (pour l'admin / rapport du jour) only.

---

## 5. Database schema

All tables: `uuid` PK, `created_at`, `updated_at`, `created_by`. `deleted_at` where noted.

| Table | Key columns |
|---|---|
| `profiles` | id = auth.users.id, full_name, phone, role, can_prepare_pv (default false), language, digest_time (default '07:30'), is_active, avatar_url, push_tokens jsonb |
| `settings` (single row) | company_name, logo_url, pv_header, default_reminder_minutes int[] (default {60,15}), default_digest_time, default_language |
| `clients` | name, company, phones[], email, address, notes, tags[] |
| `chantiers` | client_id, name, address, lat, lng, status (prospect / en_cours / en_pause / termine), start_date, end_date, description |
| `visits` | chantier_id, scheduled_start, scheduled_end, checkin_at, checkout_at, status (planifiee / en_cours / terminee), summary, decisions, next_steps, started_by |
| `visit_participants` | visit_id, user_id |
| `visit_contacts` | visit_id, contact_name, type (client / sous-traitant / fournisseur / bureau_de_controle / autre), reason, outcome |
| `meetings` | chantier_id, client_id, title, starts_at, ends_at, location, agenda, recurrence_rule, **deleted_at** |
| `meeting_participants` | meeting_id, user_id nullable, external_name nullable |
| `tasks` | title, description, chantier_id, assigned_to, due_date, status, source (manual / pv_action), pv_id, finished_at, **deleted_at** |
| `task_daily_logs` | task_id, user_id, log_date, note; unique (task_id, user_id, log_date) |
| `problems` | chantier_id, visit_id, title, description, severity, status, reported_by, responsible_id, resolved_at |
| `points` | chantier_id, visit_id, author_id, type (daily_report / for_admin), content, is_seen_by_admin |
| `photos` | chantier_id, visit_id, problem_id, storage_path, caption, taken_by, is_urgent |
| `pvs` | meeting_id, chantier_id, number (auto per chantier), status (brouillon / valide / verrouille), prepared_by, agenda, discussed_points jsonb, decisions jsonb, absents jsonb, next_meeting_at, signature_path, validated_at, locked_at, **deleted_at** |
| `pv_revisions` | pv_id, snapshot jsonb, edited_by, edited_at |
| `pv_actions` | pv_id, description, responsible_id, deadline, task_id |
| `reminders` | item_type, item_id, user_id, remind_at, kind (notification_1h / alarm_15m / custom), sent_at |
| `notifications` | user_id, type, title, body, link, read_at |
| `audit_log` | actor_id, action, entity_type, entity_id, before jsonb, after jsonb, flagged_conflict |

Storage buckets: `photos`, `logos`, `signatures`, `pdfs` (with policies).

---

## 6. Business rules (enforce in the database)

**Assistant read access**
- clients, chantiers, meetings, visits: all scheduled ones.
- tasks: only those assigned to them.
- problems and points: only those they created, or attached to visits they participate in or started.
- pvs: only PVs of meetings they participate in (read-only), unless `can_prepare_pv = true` (then edit `brouillon` only, and only until the meeting date has passed; afterwards admin only).
- photos: add and view.

**Assistant write access**
- Check in/out visits, add visit contacts, create problems / photos / points, update problems they created, update the status of their own tasks and insert their own `task_daily_logs`.
- No create / edit / delete of clients, chantiers, meetings, visit scheduling, reports, team or settings.

**PV lifecycle:** `brouillon` → `valide` → `verrouille`.
- Validate, sign and lock are admin only.
- A locked PV can **never** be deleted, and neither can its meeting.
- Admin edits to a locked PV create a `pv_revisions` row and an `audit_log` row.

**Deletion**
- Tasks, non-locked PVs and **future** meetings: soft delete (`deleted_at`), permanently purged after 30 days by a daily pg_cron job. The trash shows a red "N j" days-remaining badge.
- **Past** meetings: permanent delete, no trash. Blocked if they have a validated or locked PV.
- Trash is admin only.

**Tasks**
- Inserting a `task_daily_logs` row moves the task from `a_faire` to `en_cours`.
- Setting `termine` sets `finished_at`.
- PV actions auto-create tasks (`assigned_to = responsible_id`, `due_date = deadline`) when the PV is validated.

**Audit**
- Triggers on clients, chantiers, visits, meetings, tasks, pvs, problems, profiles, settings.
- Last write wins. Set `flagged_conflict = true` when the incoming `updated_at` is older than the stored one.

**Auth**
- Supabase email + password. No public sign-up: the admin invites users through an edge function. `is_active = false` blocks all access.

---

## 7. Phases

### Phase 1: Foundation (design system, shell, database, security)

1. **Design system:** tokens as CSS variables (light/dark) and components: Button (large mobile size), Input, Select, DatePicker, TimePicker, StatusPill, Card, BottomSheet, Dialog, Tabs, Toast, EmptyState, Skeleton, SearchInput, Avatar, ListItem, SegmentedControl, ConfirmDialog.
2. **App shell:** mobile and desktop layouts (section 2). Routed pages with empty states: Dashboard, Clients, Chantiers, Visites, Calendrier, Réunions & PV, Tâches, Problèmes, Rapports, Photos, Recherche, Notifications (desktop only), Équipe, Corbeille, Journal d'audit, Paramètres. Hidden from assistants: Rapports, Équipe, Corbeille, Journal d'audit, Paramètres. Role-aware navigation config. A hidden slim black ribbon component ("Mode hors ligne" / "Synchronisation...") driven by a global connectivity store, wired in Phase 4.
3. **i18n:** FR / AR / EN files, language switcher, RTL mirroring verified in all three.
4. **Database:** all tables from section 5, migrations, helper functions (`is_admin()`, `can_see_visit(uuid)`, etc.), triggers and RLS for every rule in section 6, storage buckets and policies.
5. **Auth:** polished login page wired to real Supabase auth, role-based route guards, admin invite edge function.
6. **Seed data:** 1 admin, 3 assistants, 3 clients, 4 chantiers, sample visits, meetings, tasks, problems.
7. **Deliver:** a table of all RLS policies, and a demo page of every component in FR, AR (RTL) and EN.

**Done when:** I can log in as admin and as assistant, and RLS blocks what section 4 forbids.

### Phase 2: Field work (clients, chantiers, visits, tasks, problems, dashboard)

**Clients**
- List with search, tag filter, cards (name, company, tap-to-call phone, active chantiers count).
- Detail: contact info, notes, tags, his chantiers, recent activity, and (admin) a "Générer un rapport" shortcut (wired in Phase 3).
- Create / edit / delete: admin only.

**Chantiers**
- List with search, filters (status, client), status pills, open-problems count, last visit date, and a "À visiter" badge if no visit for 14 days.
- Detail tabs: Vue d'ensemble, Timeline, Visites, Réunions & PV, Tâches, Problèmes, Photos.
- Timeline: one vertical chronological feed of visits, problems, meetings, PVs and finished tasks, with infinite scroll.
- "Ouvrir dans Maps" button (`geo:` link on mobile, Google Maps on desktop).
- Admin creates / edits / deletes. Assistants see read-only (no edit buttons rendered).

**Visits (the heart of the app)**
- List tabs: Aujourd'hui / À venir / Passées, with search and chantier filter. Admin schedules, edits, deletes.
- **Live visit mode:** big "Démarrer la visite" (check-in) and "Terminer la visite" (check-out), running timer, computed duration. Sticky bottom action bar: + Tâche effectuée, + Contact, + Problème, + Photo, + Décision.
  - Tasks done: checklist plus free text.
  - Contacts: type, reason, outcome.
  - Problems: quick form (title, description, severity, photo, responsible) linked to the visit and chantier.
  - Photos: camera or gallery, optional caption.
  - Decisions and next steps: dictation-friendly text fields.
  - Participants: admin marks team members present (attendance).
- Admin and assistants can both start / finish a visit and log tasks, contacts, problems, photos. Assistants cannot schedule, edit scheduling or delete.
- A finished visit becomes a clean read-only summary that feeds reports.
- Points: create "rapport du jour" or "pour l'admin" from a visit, or from a standalone quick form.
- The live visit screen must feel like a focused tool: large timer, high contrast, minimal chrome.

**Tasks**
- Views: Aujourd'hui (default), En cours, À venir, Terminées, Toutes (admin). Search and filters (assignee for admin, chantier, due date).
- Admin: create, edit, soft-delete, assign to anyone. Assistant: sees only his own, cannot create or reassign.
- Each task card has 3 actions: **En cours**, **Fait aujourd'hui** (writes a `task_daily_logs` row, task stays en_cours, disappears from today's list, returns tomorrow), **Terminé** (closes it).
- Task detail shows a work history ("Lun ✓ Mar ✓ Jeu terminé"). Overdue tasks in red. Tasks from PV actions show a "PV n°X" chip.

**Problems**
- Page with search and filters (severity, status, chantier). Visibility per section 4.

**Dashboard**
- "Morning briefing" header: greeting and date in the user's language.
- Admin: today's agenda (meetings + visits), tasks done and in progress today per person with workload, open problems by severity, late tasks, chantiers needing a visit, unseen points, recent activity.
- Assistant: today's schedule, my tasks of today, my open problems.

**Done when:** I can run a complete visit end to end as an assistant, and the admin sees the results on his dashboard.

### Phase 3: Calendar, reminders, PV and reports

**Calendar and meetings**
- Day / Week / Month / Agenda views. Meetings and visits in distinct colors, today marker, swipe between periods on mobile, drag-to-reschedule on desktop (admin only).
- Admin creates / edits meetings: title, chantier, client, date/time, location, participants (team + external names), agenda, recurrence (none / daily / weekly / monthly), reminders. Assistants see meetings and visits read-only.

**Reminders and daily digest**
- Each person sets reminders on items they can see. Defaults: notification **1 hour before** and alarm-style **15 minutes before**, editable per item, defaults configurable in settings. One `reminders` row per user per item.
- Edge function `dispatch-reminders`, run every minute by pg_cron: creates `notifications` rows and calls `send-push` (FCM HTTP v1, credential placeholders). 15-minute alarms are sent high priority on Android channel id `alarm_channel`.
- **Daily digest:** pg_cron job every 5 minutes that sends, once per day per user at their `digest_time` (default **07:30 Africa/Tunis**), a personalized push plus a stored notification: today's meetings, today's visits, and their tasks for today (in progress, due today, PV actions due).
- Client-side `NotificationService` abstraction with a web implementation and stubs for Capacitor (finished in Phase 4).

**PV de réunion**
- Written **after** a meeting. Two entry paths:
  1. "Choisir une réunion planifiée": past meetings without a PV, pre-filled with date, chantier, client, participants.
  2. "Nouveau PV" on the spot, optionally creating the meeting record too.
- Who prepares: admin, or an assistant with `can_prepare_pv` (draft only). Other assistants only read PVs of meetings they attended. Assistants never add points into a PV.
- Sections: header (logo and PV header from settings), PV number per chantier (PV n°1, 2, 3...), date, place, chantier, participants (présent / absent / excusé), ordre du jour, points discutés, décisions, actions (description, responsible, deadline; each becomes a task on validation), prochaine réunion, finger/mouse signature pad stored in Storage.
- Lifecycle pills: Brouillon → Validé/signé → Verrouillé. Only admin validates, signs, locks. After the meeting date, only admin can edit. Locked = never deletable; later admin edits create a revision, shown in an "Historique des révisions" panel. Non-locked deletion = soft delete with 30-day trash.
- Preview screen that mirrors the final PDF.
- **PDF export:** branded layout (logo, header, participants and actions tables, signature block, page numbers). Embedded Arabic font with correct RTL for AR, Inter for FR/EN. Store in the `pdfs` bucket, with "Télécharger" and native "Partager".
- PV list with search and filters (chantier, status, date).

**Reports (admin only, PDF only)**
- Three modes as clear cards:
  1. **Par période:** all team activity in a date range.
  2. **Par client:** within a date range, or across all his chantiers when no range is set.
  3. **Par chantier:** within a date range, or the complete total when no range is set.
- Toggleable sections: summary header (scope, period, generated by, logo), KPIs (visits, time on site, tasks finished, problems opened/resolved, meetings held), visits detail, task history with daily logs per person, problems (optional photos), meetings and PV list, assistants' daily report points, optional charts.
- Flow: filters → live preview → "Générer le PDF" → download / share. "Rapports récents" list. Correct FR/AR/EN and RTL in the PDF. Log each generation in the audit log. Wire the client page shortcut from Phase 2.

**Done when:** I create a meeting, receive its 1h and 15 min reminders, write and validate a PV, export it in Arabic, and generate one report of each mode.

### Phase 4: Admin tools, offline, app lock and Android packaging

**Équipe (admin)**
- Members with role, active state, last activity, workload (tasks en cours / due today). Invite by email, set role, toggle `can_prepare_pv`, deactivate / reactivate. Member detail with assigned tasks and a quick "create and assign a task".

**Notification center (desktop web only; mobile relies on push)**
- Full page: reminders, new assignments, late tasks, new problems, new points for admin. Read / unread, type filters, mark all read, click opens the item, Realtime updates.

**Photos**
- Standalone gallery (grid by date, chantier filter), add and full-screen view. Discreet "Signaler un problème urgent": camera → minimal form (chantier, short text, severity) → creates problem + photo and notifies the admin instantly. Not a main flow.

**Corbeille (admin)**
- Deleted tasks, PVs and future meetings with a red "N j" badge in the corner, restore and delete-forever.

**Journal d'audit (admin, read-only)**
- Filterable table (user, entity, action, date) with before/after diff and highlighted conflict flag.

**Paramètres (admin)**
- Company info, logo, PV header, default language, digest time, default reminder times, per-user language and digest overrides in profile, "Tester mon alarme" button.

**Search**
- Global search (Ctrl/Cmd+K on desktop, icon on mobile) across clients, chantiers, tasks, problems, PV, meetings, respecting RLS, grouped results, keyboard navigation. Local search on every list page.

**Quick-add FAB (mobile):** per section 4.

**Offline mode (mobile)**
- Slim black ribbon "Mode hors ligne" at the top. The app opens from cached data only (TanStack Query persisted in IndexedDB) and does not fetch new data.
- Persisted offline queue for: visit check-in/out, contacts, problems, photos, points, task actions (en cours, fait aujourd'hui, terminé).
- On reconnect the ribbon shows "Synchronisation..." while the queue flushes in order, then disappears with a toast. Failed items show a retry state. Last write wins, conflict flagged in `audit_log`. Pending-changes counter on the ribbon.

**App lock**
- **Android:** sign in once, session in secure storage. On every open or return from background (after 1 minute) require biometrics or a 6-digit PIN. PIN set at first login, stored hashed locally, 5 wrong attempts force a full sign-in.
- **Web (PC):** sign in every time, short session, no "remember me", auto-logout on inactivity.

**Capacitor (Android)**
- Plugins: local-notifications, push-notifications (FCM), camera, network, preferences plus a secure-storage plugin, a biometric plugin, geolocation (map links only), share.
- Native `NotificationService`: local notifications for reminders (1 h notification, 15 min alarm on a high-importance channel with sound, exact-alarm permission), FCM token saved in `profiles.push_tokens`, deep-link on tap.
- Provide `capacitor.config.ts`, channel setup, AndroidManifest permissions (`POST_NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM`, `USE_BIOMETRIC`, `CAMERA`), and step-by-step build instructions (GitHub export, `npx cap sync`, Android Studio, APK/AAB).
- In-app guide about battery optimization for reliable alarms. App icon, splash screen, status bar theming.
- Finish with a checklist of everything to test on a real Android device.

**Done when:** the app works offline and syncs back, locks with PIN/biometrics, and the alarms ring on a real phone.

---

## 8. Out of scope (do NOT build)

- CSV import / export (only PDF of reports and PVs).
- Contacts directory for sous-traitants / fournisseurs.
- Client portal, journal de chantier, budget / devis, AI summaries, geofenced check-in, Google Calendar sync (possible later versions).
- More than two roles.
- Multi-company / multi-tenant.

---

## 9. Prompts to use (copy and paste)

**Start a phase**
> Read PLAN.md fully. Build Phase 1 only. No stubs, no mock data, RLS on everything. When finished, list what is done and what is missing, and update the Progress tracker.

**Continue after a stall or a cut-off**
> Continue Phase N from PLAN.md with the next unfinished numbered block. Do not restart. Do not redo finished work.

**Next phase**
> Phase N is validated. Read PLAN.md and build Phase N+1 only.

**Fix without breaking**
> Fix only: [describe the bug]. Do not change anything else. Check the rules in PLAN.md section 4 and 6 still hold.

**Audit before moving on**
> Audit Phase N against PLAN.md. List every requirement, mark it done / partial / missing, and list any table without RLS. Do not change code yet.

---

## 10. Progress tracker (update after each phase)

| Phase | Status | Notes |
|---|---|---|
| 1. Foundation | Not started | |
| 2. Field work | Not started | |
| 3. Calendar, reminders, PV, reports | Not started | |
| 4. Admin tools, offline, lock, Capacitor | Not started | |

**Known gaps / decisions log:**
- (empty)

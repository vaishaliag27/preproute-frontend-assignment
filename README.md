# Preproute — Test Management Application

Frontend test management application built with React and TypeScript as part of the
Preproute Frontend Developer task evaluation.

It implements the full flow — **Login → Dashboard → Create/Edit Test → Question
Creation → Preview & Publish** — built to the supplied Figma designs.

---

## Quick start

```bash
npm install
```

```bash
cp .env.example .env
```

```bash
npm run dev
```

The app starts on <http://localhost:5173>. `.env.example` ships with **mock mode
enabled**, so it runs end to end without a backend — sign in with:

| User ID | Password   |
| ------- | ---------- |
| `demo`  | `demo1234` |

### Pointing at the real API

The task brief does not specify an API base URL, so it is configurable. Edit `.env`:

```bash
VITE_USE_MOCK=false
VITE_API_BASE_URL=/api
VITE_API_PROXY_TARGET=http://localhost:5000
```

`VITE_API_BASE_URL=/api` routes requests through the Vite dev proxy defined in
[vite.config.ts](vite.config.ts), which forwards to `VITE_API_PROXY_TARGET` and
sidesteps CORS in development. To call a deployed API directly, set
`VITE_API_BASE_URL` to an absolute URL (e.g. `https://api.example.com`) — the
proxy is then bypassed.

### Scripts

| Command           | Description                                |
| ----------------- | ------------------------------------------ |
| `npm run dev`     | Dev server with HMR                        |
| `npm run build`   | Typecheck (`tsc -b`) then production build |
| `npm run lint`    | Oxlint                                     |
| `npm run preview` | Serve the production build                 |

---

## The screens

**Login** — split panel with the line-art illustration, User ID / Password,
"Forgot password?" and a full-width Login button. Client-side validation; the JWT
is stored in `localStorage` and sent as `Authorization: Bearer <token>` on every
later request. A `401` from any endpoint clears the session and returns to login.
Deep links survive: visiting a test URL while logged out redirects to login and
lands you back on that URL afterwards.

**Dashboard** — all tests in a table with name, subject, topics, question count,
status and created date, plus View / Edit / Delete. Search matches name, subject
and topics; filters narrow by status and subject. No Figma screen was supplied
for the dashboard, so it follows the same design system as the rest of the app.

**Test Creation** — breadcrumb, the Chapterwise / PYQ / Mock Test tab group, and
the two-column form: Subject, Name of Test, Topic, Sub Topic, Duration and the
Easy / Medium / Difficult radio row. The marking scheme uses the stepper inputs
(`-1`, `+0`, `+5`); **Total Marks is derived** from questions × correct-answer
marks and is read-only, as in the design.

Subject, Topic and Sub Topic are genuinely dependent: picking a subject fetches
its topics, picking topics fetches their sub-topics, and changing a subject drops
the now-invalid selections beneath it.

**Question Creation** — the collapsible left rail lists every question slot with
its completion state, padded out to the planned total. The summary card carries
the type badge, difficulty pill, subject/topic/sub-topic facts and the
time / questions / marks chips, with a pencil that opens the **Edit Test
creation** modal. Below it: the question counter, `+ MCQ` and `CSV` actions,
Delete All Edits, the rich text editor, four options with a correct-answer radio,
Add Solution, prev/next paging and the Level of Difficulty / Topic / Sub-topic
settings.

**Preview & Publish** — "Test created" with the All-N-Questions-done badge, the
summary card, then Publish Now / Schedule Publish. Scheduling adds a date and
time picker; **Live Until** offers Always Available, 1/2/3 Weeks, 1 Month or a
Custom Duration with end date and time. Confirming sets the status to `live`,
shows a success toast and returns to the dashboard.

---

## Notable pieces

**Rich text editor** — [RichTextEditor.tsx](src/ui/RichTextEditor.tsx) is a
dependency-free `contentEditable` with the toolbar from the design: bold, italic,
underline, strikethrough, link, colour, three alignments, bulleted and numbered
lists, horizontal rule, image and a formula placeholder. Output is run through
an allow-list sanitiser ([sanitize.ts](src/lib/sanitize.ts)) both when stored and
when rendered, so question HTML can never carry scripts or unsafe URLs.

**CSV import** — the `CSV` button accepts
`question, option1–4, correct_option, explanation, difficulty`. Quoted fields with
embedded commas are handled, `correct_option` accepts `option2`, `2` or `B`, and
incomplete rows are skipped with a count reported back.

**Data fetching** — [`useResource`](src/hooks/useResource.ts) runs a fetcher when
its dependencies change and aborts the in-flight request, so a slow response can
never overwrite a newer one. It resets state during render rather than in an
effect, so `loading` is already true on the render where a request becomes
enabled — without that, a dependent fetch briefly reports "not loading, no data",
which is indistinguishable from an empty result.

**HTTP layer** — [`request`](src/lib/http.ts) attaches the JWT, unwraps the
`{ success, data }` envelope, and turns transport failures, non-2xx responses and
`success: false` bodies into one `ApiError` with a readable message.

**Styling** — hand-written CSS with design tokens taken from the Figma, no UI
framework. Responsive to 375px (the sidebar collapses, the table becomes labelled
cards) with light and dark themes.

**Accessibility** — labelled controls with `aria-describedby` hints and errors,
`role="alert"` validation messages, `aria-pressed` toolbar state, keyboard-
dismissable dropdowns, native `<dialog>` modals and a reduced-motion guard.

---

## Architecture

```
src/
  api/          Typed wrappers, one per documented endpoint
  auth/         Session storage, AuthProvider, route guard
  hooks/        useResource — fetch + loading/error state with abort handling
  lib/          HTTP client, sanitiser, CSV parser, test-form model, formatting
  mock/         In-memory implementation of the documented API
  pages/        One component per screen
  ui/           Reusable presentational components and the icon set
  types.ts      API request/response shapes
  styles.css    Design tokens and component styles
```

---

## Decisions worth flagging

Where the brief and the designs disagreed, or where something was unspecified:

- **No API base URL was given**, so it is environment-configurable and the app
  ships with a mock implementation of every documented endpoint.
- **Save as Draft** is not in the Figma, which shows only Cancel and Next, but the
  brief requires it — so the create screen has all three buttons.
- **The publish screen has no question list in the Figma**, but the brief asks for
  the full test overview at that step. It sits behind a "Review all questions"
  disclosure so the designed layout stays intact.
- **Scheduling and Live Until are not in the API brief.** They are sent on
  `PUT /tests/:id` as `scheduled_at`, `live_until` and `live_duration` alongside
  `status: "live"`.
- **Test Tracking** appears in the sidebar of the designs but has no screen, so
  [TrackingPage](src/pages/TrackingPage.tsx) is a signposted placeholder rather
  than invented UI.
- **No endpoint is documented for updating or deleting a single question.** The
  question screen edits and removes locally and, on save, attempts
  `PUT /questions/:id` and `DELETE /questions/:id`. A failure there is reported
  but not fatal, because `PUT /tests/:id` re-links the authoritative list anyway.
- **No endpoint is documented for deleting a test**, so the dashboard uses the
  conventional `DELETE /tests/:id`.
- **`status` is nullable on create.** Save as Draft sends `"draft"`, Next
  preserves the existing status (so editing a published test does not silently
  unpublish it), and publishing sends `"live"`.
- **`GET /tests` returns display names** for subject and topics while
  `GET /tests/:id` returns ids. Every consumer accepts both and resolves ids to
  names via the taxonomy endpoints.

---

## Tech

React 19 · TypeScript (strict) · Vite 8 · React Router 7 · Oxlint. React Router
is the only runtime dependency beyond React itself — no state management, data
fetching, rich text or component library.

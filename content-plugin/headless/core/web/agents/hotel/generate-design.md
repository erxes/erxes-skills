# Hotel Design Generation — Source Observation → Design Brief

> **Pipeline position:** Step 3.5 — runs FIRST, before the shared `agents/pencil-design.md` Pencil flow.
> **Inputs:** `hotel.config.json` from Step 0 (generic + hotel setup) and the `ui_source` source named in `ui_source_ref`.
> **Outputs:** `output/<slug>/source-observation.md`, `output/<slug>/design-brief.md`, and the `source_observation` + `design_brief` blocks written back into `hotel.config.json`.
> **After this file:** start `agents/pencil-design.md` with the observed inventory as its Phase 0 Intake.

---

## AUTONOMY CONTRACT — read first

This file is fully autonomous. It asks the user **no questions**.

- The only user input is `agents/hotel/setup.md` + `hotel.config.json`.
- Every design fact comes from that config, from the `ui_source` source itself, or from a default you choose.
- When a fact is missing: choose a sensible default, use it, and record it in the `## Assumptions` section of `design-brief.md` and in `HANDOFF.md`. Then continue. Never stop to ask.
- The **single exception**: if `ui_source_ref` is unreachable, empty, or invalid, stop and ask for a corrected source. Never silently switch to a different source. See "Phase 1.1 — Stop Condition".

Hotel-specific facts (hotel type, booking engine, CMS sections, rooms) come from `agents/hotel/setup.md` / `hotel.config.json`, or from a default recorded as an assumption. They are never asked.

---

## Purpose and Role

You are the design-derivation agent for the hotel pipeline. Before any visual work, you observe the `ui_source` source directly, resolve the remaining hotel inputs from `hotel.config.json`, and produce:

- an **observed source inventory** — the ground truth for structure, components, colors, type, spacing, and static copy
- wireframe structure per page — derived from the observed section order
- layout section order per page — derived from the observed source
- component inventory — observed components plus the locked booking surface
- visual direction candidates — strategy-mapped, with a named lead that is never a locked choice
- a CMS and navigation field map — derived from observed source slugs when the source exposes them
- an `## Assumptions` section listing every default chosen

**Hard Gate:** Do not generate any design directions, visual concepts, homepage previews, or frontend ideas until Phase 1 (Source Observation) is complete and `source_observation` exists in `hotel.config.json`.

---

## Phase 1 — Source Observation

Read `ui_source` and `ui_source_ref` from `hotel.config.json` and open the actual source. Never design from a file path, a filename, or an assumption about what the source contains.

Observation runs **first** because everything downstream — wireframes, section order, components, slugs, direction candidates — is derived from it.

### Phase 1.1 — Stop Condition

If `ui_source_ref` is empty, malformed, or the source cannot be opened or fetched:

- stop
- report exactly which path or URL failed and why
- ask the user for a corrected source
- never substitute a different source
- never fall back to `words` on your own initiative

This is the only situation in this file where you may ask the user something.

### Phase 1.2 — `words`

`ui_source_ref` is the creative brief. Parse it for:

- implied sections and their order ("a hero, then a grid of rooms, then reviews")
- implied components (booking form, room cards, gallery, pricing table)
- implied tone, density, color words, typography words
- implied audiences and page purpose

Record the derivation as a quoted inventory: which phrase implied which section or component. This keeps Phase 4 auditable. There is no source file to open in this case.

### Phase 1.3 — `screenshot`

1. Screenshots were copied into `output/<slug>/screenshots/` by `lib/config-loader.ts`; `ui_source_ref` lists their paths one per line.
2. Open **every** image. Never design from a path or from a description of an image.
3. If any region is blurred, cropped, low-contrast, or otherwise ambiguous, record your interpretation as an assumption — never silently guess.
4. Record the observed inventory for each image into `output/<slug>/source-observation.md`.

The inventory requirements for `screenshot` are the same ones `agents/pencil-design.md` requires for its own screenshot path — see Phase 1.7.

### Phase 1.4 — `website`

**Always run the audit, for every `design_strategy`** — including `from-scratch` and `brand-first`:

```bash
pnpm site:audit "<reference-url-or-ui_source_ref>" "output/<slug>/source-audit.json"
```

Read `source-audit.json` before deciding anything. It is the source of truth for structure and static copy.

Do not stop at the single URL. Discover and fetch the relevant internal pages and locale variants first, as `agents/pencil-design.md` Phase 3.5 requires. Prefer the navigation pages and high-signal marketing pages. Do not scrape private, authenticated, checkout, cart, search, or irrelevant utility pages.

**When `design_strategy` is `beat-competitors`:** run the audit once per URL in `competitor_urls`, into a sibling file each time (`source-audit-<n>.json`), and compare them:

```bash
pnpm site:audit "<competitor-url-1>" "output/<slug>/source-audit-1.json"
pnpm site:audit "<competitor-url-2>" "output/<slug>/source-audit-2.json"
```

`source-audit.json` (from `ui_source_ref` or `reference_url`) remains the primary reference; the competitor audits feed the differentiation decisions in Phase 4.4.

**When `design_strategy` is `copy-site` or `improve-site`:** the audit of the reference URL is the baseline and its section order and static copy are preserved, per `agents/pencil-design.md` Phase 0.5 strategy rules.

### Phase 1.5 — `pencil`

Open the exact `.pen` path from `ui_source_ref` using the Pencil MCP tools. Record frames, section order, component inventory, colors, and type.

`agents/pencil-design.md` "Pencil Path Discipline" applies: open only the exact path from `ui_source_ref`. If the path is missing or invalid, that is a Stop Condition — stop and ask for a corrected path. Never open a different or "related" `.pen` project.

### Phase 1.6 — `figma`

Open the Figma URL or the exported assets in `ui_source_ref`. Record frame structure, section order, components, and color/type usage. If the link or asset is unreachable, that is a Stop Condition.

### Phase 1.7 — Observed inventory — record for every source type

Write `output/<slug>/source-observation.md` containing a section titled exactly `## Observed Source Inventory` with:

- **observed homepage section order**, top to bottom, as an ordered list
- **header and footer patterns** — nav items, CTA labels, locale switcher
- **observed component types** — hero, cards, grids, forms, galleries, testimonials, map, filters, etc.
- **dominant colors**, named
- **typography feel** — display/body character, weight, case
- **spacing density**, corner radius, shadow character
- **observed static copy** — nav labels, section headings, CTA labels, page titles
- **observed route/page slugs**, when the source exposes them
- **assumptions** — every ambiguous or unreadable region, recorded as an assumption

Then write the machine-readable block into `hotel.config.json`:

```json
"source_observation": {
  "ui_source": "<words|pencil|figma|screenshot|website>",
  "source_ref": "<path or url>",
  "audit_path": "<output/<slug>/source-audit.json — website only, else null>",
  "competitor_audit_paths": ["<output/<slug>/source-audit-1.json>"],
  "observed_section_order": ["hero", "rooms-preview", "..."],
  "observed_components": ["hero", "card-grid", "..."],
  "observed_colors": { "primary": "<name>", "secondary": "<name>", "neutral": "<name>" },
  "typography_feel": "<short>",
  "spacing_density": "<compact|normal|airy>",
  "radius_character": "<sharp|soft|round>",
  "shadow_character": "<none|subtle|layered>",
  "observed_routes": ["<slug>", "..."],
  "observed_copy": { "nav": [], "cta_labels": [], "section_headings": [] },
  "assumptions": []
}
```

**Gate:** do not begin Phase 2 until `source-observation.md` and the `source_observation` block both exist.

---

## Phase 2 — Resolve Inputs From Config

Now resolve every remaining hotel fact. Each field has a source priority order; observation beats config beats default.

| Brief fact | Source (priority order) | Default when nothing supplies it |
| ---------- | ------------------------ | ---------------------------------- |
| `design_strategy` | `design_strategy` in config | `from-scratch` |
| `hotel_type` / `positioning` | `extra_notes` → observed copy tone → `tone` → `name` | `boutique`, positioning from `name` + observed content |
| `brand` | `extra_notes` (logo/hex/font names) → `color_hint` → `source_observation.observed_colors` | `has_identity: false`, `needs_suggestions: true` |
| `pages` | `observed_routes` → `sections` ∪ `cms_sections` → hotel baseline | `home`, `rooms`, `room-detail`, `booking` |
| `rooms` | room labels observed in the source → `cpPmsRooms` stage names at runtime | 4 generic types (`standard`, `deluxe`, `suite`, `family`); centerpiece = first |
| `booking_widget` | booking surface observed in the source → `allow_guest` → `pipeline_id` presence | `dates: true`, `guest_count: true`, `filters: []`, `special_rates: false` |
| `languages` | `languages` in config | do not change — config is authoritative |
| `tone_mood` | observed typography feel → `tone` | `modern` |
| `must_have_sections` | `observed_section_order` mapped to section names | `["reviews", "map-location"]` |
| `competitor_sites` | `competitor_urls` | `[]` |
| `reference_sites` | `reference_url` + competitor URLs | `[]` |

Rules:

- Never invent a fact that contradicts config. Defaults only fill gaps.
- Never overwrite `languages`, `sections`, `cms_sections`, `tone`, or `allow_guest` — the `design_brief` block mirrors them for the design stage only.

---

## Phase 3 — Record Config Blocks and Defaults

Build the `design_brief` object entirely from Phase 1 + Phase 2. Do not ask anything.

Every field you could not source from config or the observation gets a sibling entry in `design_brief.assumptions`:

```json
"assumptions": [
  { "field": "hotel_type", "value": "boutique", "reason": "`tone` was `modern` and no `extra_notes`; no hotel type stated in the source copy", "used_in": ["4.1", "4.4"] }
]
```

Write the machine-readable copy into `hotel.config.json` under `design_brief`:

```json
"design_brief": {
  "hotel_type": "<luxury|boutique|budget|resort|business|other>",
  "positioning": "<one sentence>",
  "brand": {
    "has_identity": true,
    "logo_path": "",
    "colors": "<hex values or ''>",
    "fonts": "<font names or ''>",
    "needs_suggestions": false
  },
  "reference_sites": ["<url>"],
  "competitor_sites": ["<url>"],
  "pages": ["home", "rooms", "room-detail", "booking", "<amenities|gallery|about|contact|offers|blog>"],
  "rooms": [{ "type": "<room name>", "count": 12, "centerpiece": true }],
  "booking_widget": {
    "dates": true,
    "guest_count": true,
    "filters": ["<price-range|bed-type|view|capacity|pet-friendly>"],
    "special_rates": false,
    "guest_booking": true
  },
  "tone_mood": "<primary mood word>",
  "must_have_sections": ["<reviews|map-location|dining|spa|events|offers|newsletter>"],
  "assumptions": []
}
```

`assumptions` may be an **empty array** when config and the observed source covered every field. Do not invent an assumption to fill it.

---

## Phase 4 — Generate the Design Brief

Generate **six artifacts** inside `output/<slug>/design-brief.md` — 4.1 through 4.5 plus `## Assumptions`. Follow the design-stage conventions from `agents/pencil-design.md` (section-to-page rule, homepage-first, section slugs consistent) and the code conventions from `agents/conventions.md` (match `color_hint` as primary color, `tone`-aware styling, mobile-first responsive, fonts supporting the locale character sets, real text in the site language — never lorem ipsum).

### 4.1 Wireframe structure

**Derivation rule.** When `ui_source` is `pencil`, `figma`, `screenshot`, or `website`, the wireframe section order MUST come from `source_observation.observed_section_order`. Do not substitute the hotel template order. Record the observed order in the brief so it can be audited.

When `ui_source` is `words`, the generic wireframe below is the fallback baseline and you adapt it from the description's quoted inventory.

For each page in `design_brief.pages`, write a top-to-bottom wireframe. Example for the homepage — **`words` baseline only**:

```text
HOME
┌─────────────────────────────────────────────┐
│ Header        [nav]        [locale] [Book]  │
├─────────────────────────────────────────────┤
│ Hero image / video                          │
│ Headline + one-line positioning             │
│ Availability widget (dates · guests)        │
├─────────────────────────────────────────────┤
│ Rooms preview  → centerpiece room first     │
│ (3–6 RoomCards, "view all" → /rooms)        │
├─────────────────────────────────────────────┤
│ Amenities strip (icons or photo tiles)      │
├─────────────────────────────────────────────┤
│ Experience sections in confirmed order      │
│ (dining · spa · events, as confirmed)       │
├─────────────────────────────────────────────┤
│ Testimonials / reviews  (if confirmed)      │
├─────────────────────────────────────────────┤
│ Map + location  (if confirmed)              │
├─────────────────────────────────────────────┤
│ Gallery preview                             │
├─────────────────────────────────────────────┤
│ CTA band  (book or contact)                 │
├─────────────────────────────────────────────┤
│ Footer                                      │
└─────────────────────────────────────────────┘
```

Produce the same plain-text wireframe for every page in `design_brief.pages`:

- **Rooms listing** — filter bar (dates · guest count · room filter chips) → room card grid → sticky book CTA.
- **Room detail** — photo gallery → info panel (amenities, features, price per night) → sticky booking widget → similar rooms.
- **Booking flow** — booking summary + dates/nights → guest details → payment, following the route patterns in `agents/hotel/AGENTS.md`.
- **Amenities / Gallery / About / Offers / Contact** — one hero header + a content layout that matches the matching homepage section.
- **Blog** (when in `pages`) — listing + detail, reusing the CMS post patterns.

### 4.2 Layout section order per page

Record the section sequence in a table so `agents/pencil-design.md` and Step 4 reproduce it without interpretation.

**Derivation rule.** For every non-`words` source, the sequence comes from `source_observation.observed_section_order`. The table below is the `words` baseline only.

| Page          | Section sequence (top → bottom)                                    |
| ------------- | ----------------------------------------------------------------- |
| Home          | header · hero+availability · rooms preview · amenities · experiences · testimonials · map · gallery · CTA · footer |
| Rooms listing | header · filter bar · room card grid · footer                      |
| Room detail   | header · gallery · info panel · booking widget · similar rooms · footer |
| About         | header · story · team/milestones · CTA · footer                    |
| Amenities     | header · amenity grid (split by category) · footer                 |
| Gallery       | header · filterable photo grid · footer                            |
| Offers        | header · offer cards · terms note · footer                         |
| Contact       | header · map · contact form · footer                               |

Any homepage section that is not purely decorative must also exist as a standalone page with the same slug.

### 4.3 Component inventory

List the components the design needs, grouped the way `agents/frontend.md` structures the frontend.

**Derivation rule.** For non-`words` sources, every entry in `source_observation.observed_components` MUST appear here. Map each component back to its observation or to the config field that produced it, and mark any component that came from a default.

**Layout**
- Header (navigation + locale switcher + "Book now" CTA)
- Footer (contact, quick links, map link)
- Mobile navigation

**Booking widget surface (from `booking_widget`)**
- Availability widget — check-in/check-out date fields + guest counter (only the visual form; it redirects to `/rooms` per `agents/hotel/AGENTS.md`)
- Guest counter stepper — when `guest_count`
- Room filter chips — bed type / view / capacity / pet-friendly, from `filters`
- Special rate code field — when `special_rates`
- Booking summary panel — dates, nights, price

**Rooms**
- RoomCard — photo, name, room count, price per night, features, "Book" link
- RoomCardGrid — responsive columns
- RoomDetailGallery — gallery + info panel + sticky booking widget

**Experience sections (from `must_have_sections`)**
- TestimonialsCarousel — when `reviews`
- MapSection — embedded map + address, when `map-location`
- Dining / Spa / Events cards — one block per experience section
- OffersBanner — when offers or promotions page is in `pages`
- Newsletter — when confirmed

**CMS + shared**
- PostCard / PostGrid for blog (when in `pages`)
- ContactForm
- Section heading pattern, CTA band, buttons, inputs — from the design tokens / shadcn set in `agents/frontend.md`

### 4.4 Visual direction candidates (lead recommendation)

Propose **2 to 3 visual direction candidates** and name one of them as the **lead recommendation**. The lead is a recommendation, not a decision — `agents/pencil-design.md` Phase 1 still presents its 3 direction options to the user for comparison.

**Strategy mapping (mirrors `agents/pencil-design.md:302-312`).** When the source is an existing design — `pencil`, `figma`, `screenshot`, or `website` — frame the three candidates like this:

| `design_strategy` | Candidate A | Candidate B | Candidate C |
| ----------------- | ----------- | ----------- | ----------- |
| `copy-site` | faithful | faithful plus production/accessibility fixes only | bold reinterpretation |
| `improve-site` | faithful | improved | bold reinterpretation |
| `beat-competitors` | shared market convention | deliberate differentiation | bold reinterpretation |
| `from-scratch` / `brand-first` | use the family mapping table below for all three candidates | | |

For `copy-site`, candidate A bias is mandatory — visual fidelity outranks reinterpretation.

**Family mapping** — use this for `from-scratch` / `brand-first`, and as the vocabulary for the candidates above:

| hotel_type / tone_mood | Direction family from `agents/pencil-design.md` | Suggested color hint | Motion level |
| ---------------------- | ------------------------------------------- | -------------------- | ------------ |
| Luxury / calm, classic | Editorial Luxury, Midnight Cinema | navy, oxblood, gold | 2–3 |
| Boutique / warm, minimal | Organic Texture, Editorial Luxury | warm neutrals, terracotta | 1–2 |
| Budget / friendly, efficient | Swiss Grid, Morphic Soft | teal, sky-blue | 1 |
| Resort / tropical, relaxed | Aurora Gradient, Organic Texture | turquoise, coral, forest-green | 2–4 |
| Business / modern, precise | Glass Future, Data Precision, Swiss Grid | navy, steel | 1–2 |

For non-`words` sources, each candidate must also state how it relates to the observed inventory — which observed colors it keeps, which observed components it reorders, and what it upgrades.

**Motion level note:** the motion level in the table is a **recommendation only**, carried into `agents/pencil-design.md` Phase 2 — where the user-facing motion-level lock (0–5) still happens and `ui-libraries.json` is produced. It does not replace or skip Phase 2.

Write each candidate as a short paragraph in the brief: direction name, mood, color energy, typography approach (fonts that support every locale in `languages`), layout feel, and animation signature. When the brand owns colors and fonts, the brand wins and only the gap-filling choices are suggested. Keep every candidate's paragraph, not just the lead, in `design-brief.md`.

### 4.5 CMS and navigation field map

Map every page and must-have section to its durable CMS-facing identifiers, mirroring what `agents/pencil-design.md` writes into `HANDOFF.md` section "2. erxes CMS Field Map".

**Derivation rule.** For non-`words` sources, prefer `source_observation.observed_routes` and `source_observation.observed_copy.nav` over the default table below. Observed source slugs win.

| Item                    | Slug            | Route             | Content holder   | Menu kind | Blog category need |
| ----------------------- | --------------- | ----------------- | ---------------- | --------- | ------------------ |
| Home + landing sections | `<section-slug>` | `/`, `/<slug>`    | CMS page \| section | header      | —              |
| Rooms listing           | `rooms`          | `/rooms`          | PMS query        | header      | —                  |
| Room detail             | `rooms/[id]`     | `/rooms/[id]`     | PMS query        | —           | —                  |
| Booking confirm/verify  | —               | `/booking/*`      | Deal/invoice     | —           | —                  |
| Amenities               | `amenities`     | `/amenities`      | CMS page         | header \| footer | —         |
| Gallery                 | `gallery`       | `/gallery`        | CMS page         | header \| footer | —         |
| About                   | `about`         | `/about`          | CMS page         | header \| footer | —         |
| Offers                  | `offers`        | `/offers`         | CMS page         | header \| footer | —         |
| Review/testimonial section | `reviews`     | homepage section  | CMS page \| section | —          | —              |
| Map/location            | `location`      | homepage section  | CMS page \| section | footer   | —                  |
| Blog                    | `blog`          | `/blog`, `/blog/[slug]` | CMS posts   | header \| footer | hotel travel tips, offers, events |

Rules:

- Every standalone page gets the same slug on the homepage, the standalone route, and the navigation — never three different names.
- `menu kind` stays one of `header` / `footer` so the `cpMenus` queries in Step 5 and the navigation components in Step 4 bind without surprises.
- When blog is confirmed, record the category names here so Step 5 seeds them.
- **Do not create a separate untracked map.** When `agents/pencil-design.md` produces `HANDOFF.md` section 2, lift this table verbatim into it — it is the input, not a parallel deliverable.

---

## Assumptions

Every default chosen in Phase 2 or Phase 1.7, in one list. This section is lifted verbatim into `HANDOFF.md`.

| Field | Assumed value | Why the source/config did not supply it | Where it is used |
| ----- | ------------- | -------------------------------------- | ---------------- |
| `hotel_type` | `boutique` | `tone` = `modern`, no `extra_notes`, no hotel type in the source copy | 4.1 section order, 4.4 direction family |
| `rooms` | standard / deluxe / suite / family | no room labels observable in the screenshots | 4.3 RoomCard copy, rooms page |
| `booking_widget.filters` | `[]` | booking surface not described in the source | 4.3 filter chips |

Rules:

- This table may be **empty** when config and the observed source covered every field. Write `None — config and observed source covered every field.` in that case.
- Never hide a guess. An assumption written here is allowed; a silent guess is not.
- This table must stay identical to `design_brief.assumptions` in `hotel.config.json`.

---

## Phase 5 — Handoff to Pencil

There is **no approval gate and no interview here.** Write `source-observation.md`, `design-brief.md`, and both config blocks, then continue straight into `agents/pencil-design.md`.

Carry forward as pre-answered intake — **do not re-ask any of it**:

- `output/<slug>/source-observation.md` + the `source_observation` block → replaces `agents/pencil-design.md` Phase 0 Intake entirely
- `output/<slug>/design-brief.md` + the `design_brief` block → replaces Phase 0/0.5 gaps
- the `## Assumptions` section → lifted into `HANDOFF.md`

**`HANDOFF.md` inventory rule:** when `agents/pencil-design.md` writes `HANDOFF.md`, its observed-inventory section must be a **verbatim lift** of the `## Observed Source Inventory` section from `output/<slug>/source-observation.md`, and its assumptions section must be a verbatim lift of the `## Assumptions` table above. Do not summarize, reword, reorder, or re-derive them — the two files must not be able to diverge.

The remaining user-facing gates are exactly the ecommerce ones and live in `agents/pencil-design.md`: Phase 1 direction presentation → Phase 1.5 homepage preview choice → Phase 1.75 `do you wanna edit design before build frontend?` loop.

---

## Anti-Patterns

Do not:

- ask the user any question from this file — it is fully autonomous
- generate any design direction, visual concept, or homepage idea before Phase 1 is complete
- design from `ui_source_ref` as a path or a filename instead of opening the source
- skip the `pnpm site:audit` run for `ui_source = website` — it is required for every `design_strategy`
- substitute the generic hotel wireframe or section order for the observed source section order when `ui_source != words`
- pick direction candidates by `hotel_type` / `tone_mood` alone when the source is an existing design — the 4.4 strategy mapping is mandatory
- summarize or reword the observed inventory when writing `HANDOFF.md` — lift it verbatim
- record a guess that is not listed in `## Assumptions`
- silently switch source when `ui_source_ref` is unreachable — stop and ask instead
- overwrite `languages`, `sections`, `cms_sections`, `tone`, or `allow_guest` in config
- put booking logic, GraphQL, or CMS mutations in this file or in the brief — this is the design surface only
- treat the lead direction candidate as a locked choice before `agents/pencil-design.md` Phase 1 presents its 3 options to the user
- ignore locale font support when `languages` includes Cyrillic or CJK
- write `design_brief` or `source_observation` into a different config file

---

## Completion Gate

This step is complete only when all of these are true:

- **no user question was asked at any point in this file**
- `ui_source_ref` was opened/fetched, or the Stop Condition was hit and a corrected source was given
- `output/<slug>/source-observation.md` exists with a complete `## Observed Source Inventory`
- `source_observation` is written into `hotel.config.json`
- for `ui_source = website`, `source-audit.json` exists — and one sibling audit per `competitor_urls` entry when `design_strategy` is `beat-competitors`
- `output/<slug>/design-brief.md` exists and contains the six artifacts: wireframe structure (4.1), layout section order (4.2), component inventory (4.3), direction candidates with a named lead (4.4), CMS/navigation field map (4.5), and Assumptions
- `design_brief` is written into `hotel.config.json`
- for non-`words` sources, the wireframes and section order trace back to `observed_section_order`
- no existing config field was overwritten

Only then continue to `agents/pencil-design.md` for the Pencil direction previews.
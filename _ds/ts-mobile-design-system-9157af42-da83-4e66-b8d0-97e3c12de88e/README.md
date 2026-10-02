## Building mobile webapps with Ts-Mobile (TseCore + mobile layer)

This design system is for **responsive webapps that run on phones** (and degrade to tablet and
desktop). It is two layers in one bundle:

1. **TseCore** — the real shipped `@tse-core/ts-components@4.5.1` code. The catalog lists the
   ~50 that work on a phone (buttons, text and number fields, checkboxes, tags, steps, cards,
   lists…); selects and pickers come through their `TsM*` versions;
   desktop-only ones are left out (see "Not in this catalog" below). Every control on screen is
   one of these. Never re-draw a TSE control in raw HTML/CSS: a hand-drawn lookalike is immediately
   recognisable as not-the-product, and the mobile app must look like the desktop one.
2. **TsM** — the mobile layer (`TsM*` components): the app shell, navigation, action bar, page
   container, device frames, and the **containers that replace desktop-only ones on a phone**
   (`TsMSheet` for `TsModal`, `TsMConfirm`, `TsMActionSheet` / `TsMMenuButton` for menus). It adds **structure**, not a new look: it composes the real
   `TsIcon`/`TsAvatar` and is styled only with TseCore tokens.

All components are on `window.TseCore`; the TsM ones are also on the alias `window.TseMobile`
(same objects). In Claude Design import them as `TseCore.TsMAppShell`, `TseCore.TsButton`, …

### 0. The skeleton of every mobile mockup

```jsx
const { IntlProvider, PoloAuthGate, TsMDeviceFrame, TsMAppShell, TsMPage, TsButton } = window.TseCore;

<IntlProvider locale="it">
  <TsMDeviceFrame device="iphone">              {/* presentation only — not part of the product */}
    <PoloAuthGate app="easy-wms">               {/* every mockup starts at the login */}
      <TsMAppShell
        brand="Nordest" subBrand="Easy WMS"     // client name/logo + app name
        navigation="drawer"                     // or "tabbar" (3–5 sections)
        navItems={[{ key: 'home', label: 'Home', icon: 'home' }, /* … */]}
        activeKey="home" onNavigate={go}
        user={{ name: 'Mario Rossi' }}
      >
        <TsMPage title="Benvenuto, Mario" titleSize="lg" subtitle="01 - Nordest Logistica S.r.l.">
          {/* blocks: white cards / TsSectionFields with real TseCore fields */}
        </TsMPage>
      </TsMAppShell>
    </PoloAuthGate>
  </TsMDeviceFrame>
</IntlProvider>
```

- **`PoloAuthGate` is mandatory** and `app` must name THIS mockup in kebab-case (the login
  subtitle reads "Accedi per _<app>_"). Never hand-draw a login. On a phone the login card
  becomes the page (no border, content at the top, 44px buttons) — that's automatic, inside
  a device frame or on a real phone. Full contract: `guidelines/tse-auth-poloauth.md`.
- **`TsMAppShell` is the root of the app** (one per mockup). It measures **its own width** and
  publishes the breakpoint: `phone` < 768px ≤ `tablet` < 1024px ≤ `desktop`. Read it with
  `useTsmBreakpoint()` or show/hide with `<TsMShow on="phone">…</TsMShow>` — never use
  `window.innerWidth` or media queries (the mockup is rarely the size of the viewport).
- **Step flows** (carico, ordine, rapportino): `title` + `onBack` on the shell (back arrow instead
  of the menu), `hideTabBar`, and the actions in `actionBar={[<TsButton>Annulla</TsButton>,
  <TsButton type="primary">Avanti</TsButton>]}` — never at the bottom of the scrolling page.
- `TsMDeviceFrame` (`iphone` 402×874, `android` 412×915, `tablet` 820×1180, `browser`
  1280×800, `scale` to fit side by side) only presents the mockup; leave it out when the mockup
  is meant to fill the browser.

### 1. What the shell does to TseCore on a phone

Inside a `TsMAppShell` narrower than 768px, TseCore controls are adapted **without changing their
look**: fields, selects, pickers, checkboxes and buttons become **44px** tall (touch target), and
the text of every field becomes **16px** (below 16px iOS Safari zooms the page on focus).
`size="small"` buttons stay 32px. Outside a shell, or from 768px up, TseCore is untouched.
Don't re-implement any of this by hand. The list of adaptations is in
`guidelines/tsm-foundations.md`.

### 1b. Sheets, confirms and menus instead of modals and popovers

On a phone a centred modal or a popover next to its button is the wrong container. Use the TsM
components: they render the **phone container** below 768px and fall back **by themselves** to
the real TseCore desktop one from tablet up — write the screen once.

| need | use | phone | tablet / desktop |
|---|---|---|---|
| detail, short choice, small form | `TsMSheet` | bottom sheet (content height, max 90%) | real `TsModal` |
| long form, free text | `TsMSheet size="full"` | full-screen sheet, 56px header with ✕ | real `TsModal` (720px) |
| confirm an action | `TsMConfirm` (`danger` for destructive) | sheet, TS title rule, stacked buttons | `TsModal` in the `TsModal.confirm` layout |
| secondary actions on an object | `TsMMenuButton` (⋯) | `TsMActionSheet` (real `TsMenuActions`, 52px rows) | TS popover with `TsMenuActions` |

They must live **inside the `TsMAppShell`** (anywhere in its tree): they open in the shell's
overlay layer, above header and bars, inside the device frame, with phone-sized fields. Buttons
go in `footer` (real `TsButton`s, one primary). `open` / `defaultOpen` show them open in static
boards. Rules and a full snippet: `guidelines/tsm-overlays.md`. Don't use `TsModal`,
`TsModal.confirm` or `TsToolTip`-menus directly in a mobile mockup.

### 1c. Pickers: the real field, the choice in a sheet

Selects and date/time pickers keep the **real TseCore field** (same look, 44px, 16px text) and,
on a phone, open the choice in a bottom sheet instead of the antd dropdown/calendar. From
tablet up they are the plain TseCore component.

| value | use | phone sheet |
|---|---|---|
| one option | `TsMSelect` (`options` `{value, description}`) | list, search above 8 options, tap = pick |
| several options | `TsMMultiSelect` (value = array of `value`s) | `TsCheckbox` list, "Seleziona tutti", Conferma (n) |
| a date / a period / a month | `TsMDatePicker` (`YYYY-MM-DD`) / `TsMRangePicker` (`{from,to}`) / `TsMMonthPicker` (`YYYY-MM`) | month calendar with shortcuts / start→end + summary / 12-month grid |
| a time / date + time | `TsMTimePicker` (`HH:mm:ss`, `minuteStep`) / `TsMDateTimePicker` | hour/minute wheels / calendar + wheels |

`label` is the sheet title (the visible field label stays in your form). `defaultValue` +
`defaultOpen` make static boards and tappable prototypes without state; `today` pins "today"
in mockups. Rules: `guidelines/tsm-pickers.md`.

### 1d. Lookups and data lists

- **`TsMLookup`** — a record from an archive (article, customer, location): the real `TsLookup`
  field (or `TsMultiLookup` with `multiple`); on a phone a full-screen search with code,
  description and extra columns. Value = a lookup row: build it with
  `tsmLookupRow('ART-2210', 'Tasselli nylon 8 mm', { um: 'pz' })`.
- **`TsMDataList`** — any list of records. Define it once with `TsTable` columns plus a `role`
  per column (`title`, `subtitle`, `amount`, `status` → `TsTag` with `tagColors`, `progress` →
  `TsProgress`, `meta`, `none` = table only). Phone/tablet: cards; desktop: the real `TsTable`.
  `rowActions` (⋯), `selectable` + `bulkActions` (bar docked at the bottom), `onSearchChange`,
  `sortOptions`, `filterContent` + `activeFilters`, `totalCount`/`hasMore`/`onLoadMore`
  ("20 di 134 · Carica altri"). Rules: `guidelines/tsm-data.md`.

### 1e. Operational flows (warehouse, field service)

`TsMStepHeader` (segments + "Passo n di N"; real `TsSteps` on desktop) on top of the page,
`TsMScanBar` (real `TsInput` that a hardware scanner types into + Leggi / manual / camera, with
the result of the last read) and `TsMLineCard`s (done / target with a status bar, lot sub-rows
with `TsInputNumber`). `tsmParseGS1(code)` reads GS1 codes (parenthesised, raw with FNC1,
`]C1` prefix) into `{ ok, gtin, lot, expiry, qty, sscc, serial, error }`; `tsmBuildGS1({...})`
builds demo codes for simulated reads (`demoCodes`). Rules: `guidelines/tsm-operations.md`.

### 1f. Home, states and messages

`TsMTileGrid` (home tiles with counters; compact rows on phones above 4 tiles),
`TsMEmptyState` (`kind`: empty / search / done / error / offline — also the empty state of
`TsMDataList`), `TsMToast` (the real `TsNotification` of `TsMessage`, docked inside the shell:
bottom on phones, top-right on desktop) and `TsMConnectionBanner` (`state`: offline / syncing /
pending / error / synced, for the shell's `banner`; queued rows get a yellow "In coda" tag).
Rules: `guidelines/tsm-feedback.md`.

```jsx
<TsMDataList
  columns={[
    { key: 'ragione', title: 'Ragione sociale', role: 'title', width: 260 },
    { key: 'citta', title: 'Città', role: 'subtitle', width: 140 },
    { key: 'fatturato', title: 'Fatturato 2026', role: 'amount', align: 'end', width: 150 },
    { key: 'stato', title: 'Stato', role: 'status', width: 120, tagColors: { Attivo: '#00AA00', 'Fido superato': '#DA2C38' } },
    { key: 'piva', title: 'P.IVA', role: 'none', width: 150 },
  ]}
  rows={clienti} totalCount={134} hasMore onLoadMore={more} onRowClick={open}
/>
```

### 2. Setup, styling idiom and tokens

Wrap the whole tree in `IntlProvider` (locale `it`) — always. Without it every locale-formatting
component (`TsInputNumber`, `TsInputCurrency`, `TsNumberLabel`, the pickers) throws
`[React Intl] Could not find required 'intl' object`. Link **`styles.css` only**; the bundle
vendors its own React 16, don't add another React.

- **Component appearance comes from PROPS**, never classes. `TsButton` `type=`
  `"primary"|"default"|"link"|"danger"|"secondary-danger"|"tertiary-danger"`, `size=`
  `"small"|"default"|"large"`.
- **Your own glue** (cards, field stacks, list rows) = plain inline styles reading `var(--token)`.
  Never hard-code a brand hex. Do **not** target `ts-*`, `ant-*` or `tsm-*` classes.

| family | tokens |
|---|---|
| brand | `--primary-color` (#0090d1 cerulean), `--primary-color-dark` (#005075), `--primary-background` (gradient, active nav item) |
| state | `--danger-color`, `--success-color`, `--warning-color` |
| surfaces | `--white` (cards), `--white-smoke` (page), `--azureish-white` (card borders, separators), `--columbia-blue`, `--yankees-blue` (text) |
| fields | `--input-backgroud` *(sic)*, `--input-bordercolor`, `--input-color`, `--label-color` |
| type | `--font-family` (Roboto), `--font-family-header` (Cairo — use **700** for bold titles: 300–600 render alike) |
| mobile spacing | `--tsm-space-1`…`--tsm-space-8` (4, 8, 12, 16, 20, 24, 32, 40px), `--tsm-gutter-phone` 16 / `-tablet` 24 / `-desktop` 32 |
| mobile sizes | `--tsm-touch-min` 44, `--tsm-header-height` 56, `--tsm-tabbar-height` 56, `--tsm-content-max-width` 960 |
| mobile type | `font: var(--tsm-font-page-title)` (Cairo 700 24), `--tsm-font-section-title` (Cairo 700 16), `--tsm-font-card-title` (Roboto 600 14), `--tsm-font-body`, `--tsm-font-meta` (12), `--tsm-font-label` (600 12), `--tsm-font-figure` (600 16) |
| mobile surfaces | `--tsm-radius-card` 4px, `--tsm-shadow-raised`, `--tsm-scrim` |
| safe areas | `--tsm-safe-top/-bottom/-left/-right` (notch, home indicator — set by the shell/frame) |

### 3. Read before composing

- `guidelines/tsm-foundations.md` — mobile tokens, touch sizes, type, safe areas, TseCore adaptations
- `guidelines/tsm-shell-navigation.md` — shell anatomy, drawer vs tab bar, step flows, action bar
- `guidelines/tsm-responsive.md` — what changes at each breakpoint, what to use instead of desktop-only patterns
- `guidelines/tsm-overlays.md` — sheets, confirms, action sheets and the ⋯ menu: which one, and the rules
- `guidelines/tsm-pickers.md` — selects, dates, periods, months, times: which picker, value formats, rules
- `guidelines/tsm-data.md` — lookups and data lists: column roles, selection, filters, loading more
- `guidelines/tsm-operations.md` — step flows, barcode/GS1 reading, line cards
- `guidelines/tsm-feedback.md` — home tiles, empty states, toasts, offline and sync status
- `guidelines/tsm-forms.md` — form sections, fields, inline help instead of tooltips, errors
- `guidelines/tse-foundations.md`, `tse-conventions.md` — TseCore palette, icons, cross-component prop rules
- `components/<group>/<Name>/<Name>.prompt.md` + `<Name>.d.ts` — per-component API

(The guidelines are written in Italian.)

### Not in this catalog

Some TseCore components are deliberately **not listed** here. They are still inside the bundle
(the TsM components render them on tablet/desktop), but you should not place them in a mobile
mockup yourself:

| left out | use instead |
|---|---|
| `TsModal`, `TsModal.confirm`, `TsDropdown`, `TsMenuActions`, `TsToolTip` menus | `TsMSheet`, `TsMConfirm`, `TsMMenuButton` / `TsMActionSheet` |
| `TsSelect`, `TsMultiSelect`, `TsSelectAdv`, `TsDatePicker`, `TsTimePicker`, `TsMonthPicker`, `TsDateTimePicker` | `TsMSelect`, `TsMMultiSelect`, `TsMDatePicker` / `TsMRangePicker`, `TsMTimePicker`, `TsMMonthPicker`, `TsMDateTimePicker` |
| desktop app chrome: `TsHeader`, `TsPage`, `TsToolbar`, `TsBreadcrumb`, `TsRightPanel*` | `TsMAppShell`, `TsMPage`, `TsMActionBar`, `TsMSheet size="full"` |
| `TsTable`, `TsLookup`, `TsMultiLookup` | `TsMDataList`, `TsMLookup` (`multiple`) |
| `TsSteps` | `TsMStepHeader` |
| `TsMessage` (imperative notifications) | `TsMToast` |
| advanced grids: `TsTableAdv`, `TsGroupingTable`, `TsTreeViewTable`, `TsTableK5I`, `TsCardTable` | `TsMDataList` |
| charts (`Ts*Chart`), grid calendars (`TsCalendar`, `TsGridCalendar`, `TsTimeGridCalendar`) | `TsListCalendar` for agendas; charts are not available in this DS |
| `TsRichText`, `TsIFrame`, `TsPlugin`, `TsAnchor`, `TsInputLanguageContainer`, `TsVariantsConfiguratorContainer` | — (desktop back-office features) |

Desktop masks (prima nota, scadenzari, back-office) belong to the **TS-React-Design-System**
project, which keeps all of these with their recipes.

**Top gotchas**: `TsButton`'s visible label is `children`, not `title` (`title` is the tooltip);
with an `icon`, TsButton puts no space before the text — wrap it:
`<TsButton icon="fal fa-check"><span style={{ marginLeft: 8 }}>Conferma</span></TsButton>`.
`TsIcon` takes a bare FA name (`icon="plus"` + `typeIcon`) while `TsButton`/`TsFab`
take the full string (`icon="fal fa-plus"`); `navItems[].icon` is a bare name too.
Lists of records are always `TsMDataList` (cards on phones, the real `TsTable` on desktop) —
never hand-drawn cards, never `TsTable` directly. Never let an antd dropdown open on a phone: use the
`TsM*` pickers, whose sheets open inside the shell and can be shown open (`defaultOpen`).

### 4. Idiomatic snippet — a phone form step

```jsx
const { TsMAppShell, TsMPage, TsMStepHeader, TsMFormSection, TsMField, TsMSelect, TsMDatePicker, TsTextArea, TsButton } = window.TseCore;

<TsMAppShell title="Carico merce" onBack={back} hideTabBar
  actionBar={[<TsButton key="a">Annulla</TsButton>, <TsButton key="b" type="primary">Avanti</TsButton>]}>
  <TsMPage title="Carico merce da fornitore" subtitle="01 - Nordest Logistica S.r.l.">
    <TsMStepHeader steps={['Fornitore', 'Ordine', 'Lettura', 'Riepilogo']} current={1} />
    <TsMFormSection title="Dati documento">
      <TsMField label="Deposito" required><TsMSelect label="Deposito" options={depositi} value="D01" onChange={setDep} /></TsMField>
      <TsMField label="Data DDT" required half><TsMDatePicker label="Data DDT fornitore" value="2026-09-24" onChange={setData} /></TsMField>
      <TsMField label="Numero DDT" required half><TsInput value={ddt} onChange={setDdt} /></TsMField>
      <TsMField label="Note" help="Visibili solo in magazzino."><TsTextArea /></TsMField>
    </TsMFormSection>
  </TsMPage>
</TsMAppShell>
```

`TsMField` = label (TS style, red asterisk) + control + `help` / `info` (i) sheet / `error`;
`TsMFormSection` = card with the real `TsSectionFields` title, one column on phones (`half`
pairs), auto grid from tablet up (`full` spans the row). Never hand-write label/field markup.
Rules: `guidelines/tsm-forms.md`.

# TseCore (@tse-core/ts-components@4.5.1)

This design system is the published @tse-core/ts-components React library, bundled as a single
browser global. All 77 components are the real upstream code.

## Where things are

- `_ds_bundle.js` — the whole-DS bundle at the project root; loads every component to `window.TseCore`. First line is a `/* @ds-bundle: … */` metadata header.
- `styles.css` — the single stylesheet entry: it `@import`s the tokens, fonts, and component styles (`_ds_bundle.css`). Link this one file.
- `components/<group>/<Name>/<Name>.prompt.md` (example JSX + variants), `<Name>.d.ts` (types), `<Name>.html` (variant grid).
- `tokens/*.css` — CSS custom properties, names verbatim from upstream.
- `fonts/` — `@font-face` files + `fonts.css` (when the package ships fonts).
- `guidelines/` — the design system's own usage guidance (12 doc(s), see `guidelines/index.md`). Read these before composing larger layouts.

For a specific component, `read_file("components/<group>/<Name>/<Name>.prompt.md")`.

## Loading

Add these two lines to your page once (React must be on the page first):

```html
<link rel="stylesheet" href="styles.css">
<script src="_ds_bundle.js"></script>
```

Components are then available at `window.TseCore.*`. Mount into a dedicated child node (e.g. `<div id="ds-root">`), not the host page's own React root, so the two trees don't collide:

```jsx
const { PoloAuthGate } = window.TseCore;
ReactDOM.createRoot(document.getElementById('ds-root')).render(<PoloAuthGate />);
```

Wrap the tree in the provider — most components read theme/i18n from context:

```jsx
<IntlProvider locale={"it"}>{children}</IntlProvider>
```

## Tokens

148 CSS custom properties from @tse-core/ts-components. Names are
preserved verbatim from upstream. They are declared inside `_ds_bundle.css` (this DS ships one compiled stylesheet rather than separate token files).

- **color** (20): `--antd-wave-shadow-color`, `--primary-color`, `--primary-color-dark`, …
- **spacing** (8): `--tsm-space-1`, `--tsm-space-2`, `--tsm-space-3`, …
- **typography** (34): `--font-size`, `--font-size-header`, `--font-size-xxs`, …
- **radius** (4): `--input-border-radius`, `--tsm-radius-card`, `--tsm-radius-sheet`, …
- **shadow** (3): `--tsm-shadow-raised`, `--tsm-shadow-drawer`, `--tsm-shadow-bar`
- **other** (79): `--cyan-progress`, `--dark-imperial-blue`, `--columbia-blue`, …

## Components

### auth
- `PoloAuthGate`
- `PoloAuthLogin`

### ai
- `TsAIBadge` — Compact badge to indicate AI-powered functionality.
- `TsAIDisclaimerCard` — Component to display an informational disclaimer about experimental AI features.
- `TsAISparkleIcon` — Shared AI Sparkle icon across all AI components.
- `TsAITooltipCell` — Table cell with tooltip and AI indicator support.

### data-display
- `TsAvatar` — Extends Avatar component from Ant Design
- `TsBadge` — Small numerical value or status descriptor
- `TsCard`
- `TsCardList`
- `TsChip`
- `TsChipGroup`
- `TsHtml`
- `TsIcon`
- `TsList`
- `TsTag`
- `TsTree`

### buttons-actions
- `TsButton`
- `TsButtonGroup`
- `TsDownload`
- `TsFab`

### inputs-forms
- `TsCheckbox`
- `TsInput`
- `TsInputCurrency`
- `TsInputNumber`
- `TsInputSearch`
- `TsLnLabel`
- `TsNumberLabel`
- `TsRadioGroup`
- `TsSearch`
- `TsSlider`
- `TsSwitch`
- `TsTextArea`
- `TsUploader`

### layout-containers
- `TsCollapse` — Extends Collapse component from Ant Design
- `TsPanel`
- `TsSectionFields`
- `TsStackLayout`

### feedback-status
- `TsFakePage`
- `TsFakeRow`
- `TsFakeSection`
- `TsLoader`
- `TsProgress`
- `TsSkeleton` — Used to create loading pages
- `TsSpin`

### calendar
- `TsListCalendar`

### mobile-shell
- `TsMActionBar`
- `TsMAppShell`
- `TsMHeader`
- `TsMNav`
- `TsMPage`
- `TsMTabBar`

### mobile-overlays
- `TsMActionSheet`
- `TsMConfirm`
- `TsMMenuButton`
- `TsMSheet`

### mobile-feedback
- `TsMConnectionBanner`
- `TsMEmptyState`
- `TsMTileGrid`
- `TsMToast`

### mobile-data
- `TsMDataList`
- `TsMLookup`

### mobile-pickers
- `TsMDatePicker`
- `TsMDateTimePicker`
- `TsMMonthPicker`
- `TsMMultiSelect`
- `TsMRangePicker`
- `TsMSelect`
- `TsMTimePicker`

### mobile-preview
- `TsMDeviceFrame`

### mobile-forms
- `TsMField`
- `TsMFormSection`

### mobile-operations
- `TsMLineCard`
- `TsMScanBar`
- `TsMStepHeader`

### navigation
- `TsPagination`
- `TsTabs` — Tabs component.

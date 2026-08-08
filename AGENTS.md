## Project

This repository contains a functional demo of a centralized management system for the fictitious livestock integrator:

```text
Agroganadera Valdeón SL
```

Read `CLAUDE.md` before making significant changes.

`CLAUDE.md` is the primary project specification and contains:

- architecture;
- stack;
- domain model;
- business rules;
- seed data;
- required modules;
- demo scenario;
- testing requirements;
- definition of done.

Do not implement significant functionality without understanding it first.

---

# 1. Primary objective

The application must demonstrate this complete business flow:

```text
Simular factura entrante
        ↓
Revisar factura
        ↓
Validar factura
        ↓
Tesorería actualizada
        ↓
Ceba actualizada
        ↓
Cerrar V-118
        ↓
Generar liquidación #14
        ↓
Pago incluido en previsión semanal
```

Target:

```text
8 clicks
0 typing
```

Protect this flow above everything else.

---

# 2. Stack

Use:

```text
React
Vite
TypeScript
React Router
Zustand
Zustand persist
SCSS Modules
Recharts
Vitest
localStorage
pnpm
```

Deployment:

```text
GitHub Pages
```

Do not introduce a backend unless explicitly requested.

---

# 3. Do not introduce unnecessary infrastructure

Do not add:

```text
Next.js
Express
NestJS
PostgreSQL
Supabase
Firebase
Prisma
Redux
authentication providers
real OCR
email integrations
WhatsApp integrations
bank APIs
multi-tenancy
microservices
```

This is a demo using mock data.

---

# 4. Source of truth

When requirements conflict, use this priority:

1. `CLAUDE.md`
2. existing domain tests;
3. existing domain implementation;
4. existing UI;
5. agent judgment.

If the original technical brief exists in the repository, it overrides derived assumptions.

Do not silently change business rules.

---

# 5. Architecture

Core application structure:

```text
src/
├── app/
├── components/
├── pages/
├── domain/
├── store/
├── data/
├── types/
├── utils/
└── styles/
```

---

# 6. Domain layer

All important business logic belongs in:

```text
src/domain/
```

Expected modules include:

```text
invoices.ts
tariffs.ts
feed.ts
cebas.ts
settlements.ts
treasury.ts
logistics.ts
dvr.ts
```

React components must not own business formulas.

---

# 7. State

Zustand is the global mutable state source.

State includes at least:

```text
providers
tariffs
integrateds
invoices
cebas
payments
receivables
clients
settlements
logisticsMovements
```

Use IDs for relationships.

Avoid duplicated copies of entities.

---

# 8. Derived state

Prefer selectors for calculated information.

Examples:

```text
selectPendingInvoices
selectInvoicesThisMonth
selectPaymentsNext7Days
selectActiveCebas
selectAverageConversion
selectWeeklyCashForecast
selectDvrAlerts
selectPriceDiscrepancies
```

Do not persist derived values unless necessary.

---

# 9. Critical business rules

## Invoice numbering

```text
{invoice month}{3-digit correlativo}
```

Use invoice date.

Never arrival date.

Example:

```text
5211
```

means a May invoice even if received later.

---

## Freight

Only:

```text
P1
P2
P3
```

charge freight.

Formula:

```text
kg × provider freight €/kg
```

---

## Tariffs

Resolve tariff using:

```text
provider
+
feed type
+
invoice month
```

---

## Discrepancy

Formula:

```text
kg × (invoiced price - expected tariff)
```

Required case:

```text
Invoice 7090
→ +196.80 €
```

---

## Conversion

Formula:

```text
feed kg / (exit kg - entry kg)
```

Display:

```text
2 decimals
```

---

## Settlement

```text
base =
pigs × 13.50 €
```

Bonus:

```text
conversion <= 2.35
→ 1.20 €/pig

conversion <= 2.45
→ 0.90 €/pig

conversion > 2.45
→ 0 €
```

Retention:

```text
2%
```

---

## DVR

Warning threshold:

```text
less than 30 days
```

---

# 10. The most important store action

Conceptually:

```ts
validateInvoice(invoiceId)
```

For a feed invoice this must update, in one logical transaction:

```text
invoice status
treasury payment
feed consumption
active ceba feed kg
active ceba feed cost
accounting state
digital archive state
```

Do not require separate manual actions.

---

# 11. Ceba closure

Closing a ceba must:

```text
calculate final metrics
mark it closed
set close date
generate/prep settlement
create settlement payment
update Treasury forecast
```

`V-118` is the main demo ceba.

---

# 12. Seed data

Do not casually modify the explicitly provided seed cases.

Critical fixed examples include:

```text
Invoice 7090
→ price discrepancy

Invoice 5211
→ late May numbering

Ceba V-112
→ conversion ~2.33

Ceba V-115
→ conversion ~2.45

Ceba V-118
→ main end-to-end demo flow
```

The project also requires:

```text
5 providers
40 integrated farms
15-20 additional invoices
clients
receivables
logistics movements
tariffs
cebas
```

See `CLAUDE.md` for exact seed values.

---

# 13. Components

Components should primarily:

```text
render data
receive props
call store actions
handle local UI state
```

They should not:

```text
calculate settlements
resolve business tariffs
generate invoice numbers
calculate conversion
manually synchronize modules
```

---

# 14. TypeScript rules

Prefer strict typing.

Do not use:

```ts
any
```

simply to bypass TypeScript problems.

Prefer explicit domain types.

Example:

```ts
type InvoiceStatus =
  | "pending"
  | "validated"
  | "discrepancy"
```

Use nullable/optional fields intentionally.

---

# 15. Dependency policy

Before installing a package, determine whether:

1. the current stack can already solve the problem;
2. the package materially reduces complexity;
3. it is worth adding to a 7-day demo.

Do not install libraries for trivial helpers.

---

# 16. Styling

Use:

```text
src/sass/ — existing 7-1 architecture (abstracts, base, components, layout, pages, themes, vendors)
```

Do not use CSS/SCSS Modules — this project uses the pre-existing global 7-1 Sass structure instead. Never run both systems side by side.

Global tokens/reset/typography live in `abstracts/`/`base/`. Component and page classes live in `components/`/`pages/`, forwarded from each folder's aggregator, following the existing naming convention. `main.scss` is the single stylesheet, imported once.

---

# 17. UX rules

This is an internal management application.

Optimize for:

```text
clarity
scanability
reliability
status visibility
fast operations
```

Not for flashy marketing animations.

---

## Important states must be obvious

Examples:

```text
Pendiente
Validada
Discrepancia
Activa
Lista para cierre
Cerrada
Vencido
Pagado
```

---

# 18. Every visible action must work

Never ship:

```text
dead buttons
fake filters
fake links
fake dropdowns
actions with no feedback
```

If functionality does not exist yet:

- implement it;
- disable the control explicitly;
- or remove it.

Do not pretend it works.

---

# 19. Demo simulation

External integrations are simulated.

Examples:

```text
incoming email
OCR
WhatsApp
accounting export
PDF generation
```

Simulation is intentional.

Do not replace mock flows with real APIs unless explicitly requested.

---

# 20. Persistence

State should persist through page refresh using:

```text
Zustand persist
+
localStorage
```

---

# 21. Reset demo

The application must support resetting state to original seeds.

Expected action:

```text
Restablecer demo
```

This must allow the primary scenario to be repeated reliably.

---

# 22. Tests

Use Vitest.

Business rules should have unit tests.

Minimum coverage:

```text
invoice numbering
tariff lookup
freight
price discrepancy
conversion
settlement
DVR
invoice validation propagation
```

Do not focus tests on implementation details.

---

# 23. Before editing code

Before changing a feature:

1. inspect related types;
2. inspect domain functions;
3. inspect store actions;
4. inspect selectors;
5. inspect relevant tests;
6. inspect UI consumers.

Do not patch symptoms without understanding the data flow.

---

# 24. During implementation

Prefer:

```text
small changes
focused commits
clear types
pure domain functions
reusable selectors
predictable store actions
```

Avoid:

```text
large rewrites
duplicated business logic
unrelated refactors
clever abstractions
premature optimization
```

---

# 25. After changes

Run relevant tests first.

Then run:

```bash
pnpm test
pnpm build
```

When available:

```bash
pnpm lint
```

Do not consider work complete while TypeScript/build errors remain.

---

# 26. Bug fixing protocol

When a bug appears:

1. reproduce it;
2. identify whether it belongs to:
   - data;
   - domain;
   - state;
   - selector;
   - UI;
3. fix the root cause;
4. add/update a regression test when appropriate;
5. verify the end-to-end flow still works.

Do not add UI workarounds for domain bugs.

---

# 27. Avoid duplicated formulas

There must be one canonical implementation for:

```text
invoice numbering
freight
tariff resolution
price discrepancy
conversion
settlement
DVR threshold
```

Reuse it everywhere.

---

# 28. Do not hardcode dashboard values

Wrong:

```ts
const pendingInvoices = 3
```

Correct:

```ts
const pendingInvoices = useAppStore(
  selectPendingInvoices
)
```

All KPIs and charts should reflect current state.

---

# 29. Preserve demo consistency

If an invoice is validated:

```text
Invoice screen
Treasury
Feed
Ceba
Dashboard
Accounting
```

must all agree.

If one module says a different thing, the system is broken.

---

# 30. Optional work

Do not begin optional features while mandatory flows are incomplete.

Optional:

```text
WhatsApp parser
roles
advanced accounting export
extra charts
extra animations
```

---

# 31. Priority order

When deciding what to work on, use:

```text
1. End-to-end demo flow
2. Correct business rules
3. State consistency
4. Mandatory modules
5. UX/UI
6. Tests and robustness
7. Optional extras
```

---

# 32. Definition of done for an agent task

A task is not complete merely because code was written.

It is complete when:

```text
behavior works
types pass
tests pass
build passes
existing flow is not broken
UI provides appropriate feedback
```

---

# 33. Main project commands

```bash
pnpm install
pnpm dev
pnpm test
pnpm build
pnpm lint
```

Do not replace `pnpm` with npm unless explicitly requested.

---

# 34. Final rule

Do not overengineer this project.

The winning solution is not the most architecturally complex.

The winning solution is the one that:

```text
looks credible
works reliably
matches the business rules
has coherent data
demonstrates the entire flow
can be shown without explaining away broken pieces
```

When forced to choose between:

```text
a sophisticated abstraction
```

and:

```text
a completed working business flow
```

choose the working business flow.

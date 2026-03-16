# FlowDesk AI Prospect Qualifier — Project Brief & Implementation Notes

## Project Overview

A conversational AI agent that qualifies sales prospects before they reach a founder's calendar.
Aria (powered by Groq / Llama 3.3 70B) conducts a short adaptive BANT interview, scores the
prospect, and conditionally surfaces a booking link. Pure frontend — no backend.

**Status: Complete and running.**

---

## The Fictional Company

**Company:** FlowDesk
**Product:** An AI-powered internal helpdesk tool for mid-market companies. Employees submit IT,
HR, and ops requests through a chat interface. FlowDesk auto-resolves 60% of tickets and routes
the rest to the right human, with full context attached.

**ICP (Ideal Customer Profile):**
- Industry: SaaS, fintech, logistics, healthcare-adjacent (not hospitals)
- Company size: 100–1000 employees  
- Buyer persona: Head of IT, COO, VP of Operations, or Founder/CEO at smaller end
- Pain: Support team overwhelmed, tickets falling through cracks, no visibility on resolution times
- Budget range: $800–$4000/month depending on seat count

**Disqualifiers (hard no):**
- Fewer than 50 employees
- B2C companies (no internal ops complexity)
- Government / public sector
- Already using ServiceNow or Zendesk Suite at enterprise tier (over-served)
- No dedicated ops or IT function at all

**Pricing tiers:**
- Starter: $800/month — up to 100 employees
- Growth: $2000/month — up to 500 employees
- Scale: $4000/month — up to 1000 employees
- Enterprise: Custom — 1000+ employees

---

## Tech Stack

| Layer          | Tool                           | Notes                                               |
|----------------|--------------------------------|-----------------------------------------------------|
| Frontend       | React 19 + TypeScript + Vite 8 | Single-page app, no routing library                 |
| Styling        | Tailwind CSS v3 + PostCSS      | v3 chosen — v4 incompatible with Vite 8 peer deps   |
| AI Engine      | Groq API (llama-3.3-70b-versatile) | Streaming SSE, no Groq SDK — raw fetch          |
| State          | React useState + custom hook   | `useChat` hook encapsulates all conversation logic  |
| Scoring        | `lib/scoring.ts`               | Pure function, no dependencies                      |
| Booking link   | Calendly (conditional render)  | `https://calendly.com/borpujariw`                   |
| No backend     | Pure frontend                  | API key in `.env` (Vite `VITE_` prefix)             |

**TypeScript compiler settings to be aware of:**
- `verbatimModuleSyntax: true` — all type-only imports must use `import type`
- `erasableSyntaxOnly: true` — class parameter properties are disallowed; declare fields then assign in constructor body

---

## Project Structure

```
├── index.html                     # Inter font (Google Fonts), title "FlowDesk | AI Prospect Qualifier"
├── package.json
├── vite.config.ts
├── tailwind.config.ts             # Extended dark theme + custom bounce-dot keyframe
├── postcss.config.js
├── tsconfig.json / tsconfig.app.json
├── .env                           # VITE_GROQ_API_KEY (gitignored)
├── .env.example                   # VITE_GROQ_API_KEY=your_key_here
├── .gitignore
├── README.md
└── src/
    ├── main.tsx
    ├── App.tsx                    # Screen router: landing → chat → results
    ├── index.css                  # Tailwind directives, dark globals, custom scrollbar
    ├── vite-env.d.ts
    ├── types/
    │   └── index.ts               # ChatMessage, DisplayMessage, QualificationResult, ScoringOutput, AppScreen
    ├── constants/
    │   └── index.ts               # SYSTEM_PROMPT, FORCE_JSON_INSTRUCTION, GROQ_MODEL, VALID_SCORES, thresholds, CALENDLY_URL
    ├── lib/
    │   ├── groq.ts                # Streaming Groq API client (fetch + SSE parsing)
    │   ├── scoring.ts             # BANT scoring + tier classification
    │   └── parseResponse.ts       # Defensive JSON extraction from Groq output
    ├── hooks/
    │   └── useChat.ts             # Core state machine
    ├── screens/
    │   ├── LandingScreen.tsx      # Hero + "Talk to Aria" CTA + "View analytics dashboard →" link
    │   ├── ChatScreen.tsx         # Chat UI with auto-scroll, typing indicator
    │   ├── ResultsScreen.tsx      # Score card + conditional CTA (3 tiers + disqualified)
    │   └── DashboardScreen.tsx    # Analytics dashboard — stat cards, BANT chart, funnel, results table
    ├── data/
    │   └── simulationResults.json # 20 real Groq simulation results (from scripts/simulate.mjs)
    └── components/
        ├── Button.tsx             # Primary/secondary variants, teal accent
        ├── ChatBubble.tsx         # User (right, teal) vs Aria (left, dark card)
        ├── TypingIndicator.tsx    # 3-dot staggered bounce animation
        ├── ChatInput.tsx          # Input + send, empty guard, Enter key, auto-focus, fixed on mobile
        ├── ScoreBar.tsx           # Animated horizontal bar, label + score/25
        └── ScoreBadge.tsx         # Circular badge, color-coded by tier
```

---

## Application Flow

```
[Landing Screen]
  → FlowDesk logo, tagline "The last helpdesk your team will ever need"
  → Subheading + "Talk to Aria →" CTA
  → "View analytics dashboard →" subtle link at bottom

[Chat Screen]
  → useChat.startConversation() fires on mount → Aria sends opener automatically
  → User replies → sendUserMessage() appends to history and calls Groq
  → Typing indicator shows while Groq streams
  → Streaming is buffered (not displayed token-by-token) to hide raw JSON flashing
  → Max 10 user turns → FORCE_JSON_INSTRUCTION injected as system message
  → When parseResponse detects { done: true }, transitions to Results screen

[Results Screen]
  → Disqualified path: kind "not a fit" message, disqualify reason, no scores shown
  → Qualified path: ScoreBadge (total/100) + 4 ScoreBars (BANT) + summary + tier CTA
      - High (70–100): "You're a strong fit. Book your demo →" → Calendly link
      - Medium (40–69): Email capture form ("We'd like to learn more")
      - Low (0–39): Resource link ("FlowDesk might not be the right fit right now")
  → "Start over" resets to Landing

[Dashboard Screen]
  → Accessible via "View analytics dashboard →" on Landing
  → Powered by real simulation data from src/data/simulationResults.json
  → Stat row: total simulated, high fit count, avg score, disqualified count
  → Chart 1 — BANT Score Distribution: pure SVG stacked bar chart, one row per
    qualified prospect, 4 color-coded segments (Budget/Authority/Need/Timeline)
  → Chart 2 — Qualification Funnel: 6-stage horizontal bar funnel with % labels
  → Avg BANT mini-bars: average score per dimension across qualified prospects
  → Full results table: all simulation runs with individual scores, tier badges,
    disqualify reasons
  → "← Back to home" returns to Landing
```

---

## BANT Scoring Rubric

Each category is scored 0–25. Total = Call Worthiness Score out of 100.

| Category  | 25 pts                              | 15 pts                             | 5 pts                           | 0 pts                        |
|-----------|-------------------------------------|------------------------------------|---------------------------------|------------------------------|
| Budget    | Mentioned budget fits a tier        | Open to budget, no specifics       | Vague / "depends"               | Way under budget or refused  |
| Authority | Is the decision maker               | Influences decision                | Will "pass it up"               | No connection to decision    |
| Need      | Clear pain, specific problem stated | General inefficiency mentioned     | Vague dissatisfaction           | No real problem identified   |
| Timeline  | Wants to move in <30 days           | 1–3 months                         | "Someday" / exploring           | No timeline at all           |

**Score thresholds (in `src/constants/index.ts`):**
- `SCORE_THRESHOLDS.high = 70` → High quality, Calendly CTA
- `SCORE_THRESHOLDS.medium = 40` → Medium, email capture
- Below 40 → Low, resource link

Valid score values per category: `[0, 5, 15, 25]` — any other value is clamped to 0.

---

## Groq System Prompt

Stored verbatim in `src/constants/index.ts` as `SYSTEM_PROMPT`. Key instructions to Aria:
- Qualify using BANT through 1-question-at-a-time adaptive conversation (5–8 exchanges)
- Never mention scoring, rubrics, or qualification criteria
- Detect disqualifiers early and wrap up warmly
- When done (or at 8 exchanges), output ONLY a specific JSON block with `done: true`

Max-turn fallback uses `FORCE_JSON_INSTRUCTION`:
> "The conversation has reached its limit. Summarize what you know and output the final JSON now."

---

## Key Implementation Details

### `src/lib/groq.ts`
- Streaming fetch to `https://api.groq.com/openai/v1/chat/completions` with `stream: true`
- SSE parser: splits on `\n`, extracts `data:` lines, parses `choices[0].delta.content`
- `GroqError` class: status is declared as a field (`status?: number`) and assigned in constructor body — NOT a parameter property (required by `erasableSyntaxOnly`)
- AbortController with 30s timeout
- 429 retry: waits `RATE_LIMIT_RETRY_MS` (3000ms) then retries once
- Missing API key throws immediately with a clear message

### `src/lib/parseResponse.ts`
- Strips markdown code fences (` ```json ... ``` `)
- Regex-extracts the first `{...}` block from anywhere in the string
- Only returns a result if `parsed.done === true`
- Clamps all four score fields to `[0, 5, 15, 25]`, defaults to 0
- Returns `null` for normal conversational responses — this is the normal case on most turns

### `src/hooks/useChat.ts`
- Two message arrays: `messages` (includes system prompt, sent to Groq) and `displayMessages` (UI-only, no system messages)
- `startConversation()`: calls Groq with system prompt only → gets Aria's opener
- `sendUserMessage(text)`: appends user message, calls Groq, parses response
  - Conversational response → append to both arrays, continue
  - JSON with `done: true` → call `computeScore()`, pass result up via `onComplete`
- At `userTurnCount >= MAX_USER_TURNS (10)`: injects `FORCE_JSON_INSTRUCTION` as a system message before the Groq call

### `src/App.tsx`
- `AppScreen` type: `'landing' | 'chat' | 'results' | 'dashboard'`
- No routing library — plain `useState` for screen management
- `handleComplete(result)` stores scoring result and transitions to results screen
- `handleDashboard()` transitions to the analytics dashboard screen

---

## Design System

Dark SaaS aesthetic (Linear / Vercel / Raycast style). Configured in `tailwind.config.ts`:

| Token             | Value     | Usage                          |
|-------------------|-----------|--------------------------------|
| `dark.bg`         | `#0a0a0a` | Page background                |
| `dark.card`       | `#141414` | Card/bubble backgrounds        |
| `dark.border`     | `#1a1a1a` | Borders                        |
| `dark.muted`      | `#6b7280` | Secondary/muted text           |
| `accent`          | `#14b8a6` | Teal — CTAs, user bubbles, bars |

Custom animation: `bounce-dot` keyframe for the 3-dot typing indicator (staggered via `animation-delay`).

---

## Known Gotchas & Decisions

1. **Tailwind v3, not v4** — `@tailwindcss/vite@4.x` requires `vite ^5–^7` but project uses Vite 8. Installed Tailwind v3 + PostCSS instead.

2. **No Groq SDK** — Plain fetch + SSE parsing. Avoids a dependency; the streaming implementation is ~50 lines.

3. **Streaming is buffered** — The full response is assembled before being shown. This prevents raw JSON from flashing briefly as Groq outputs the final evaluation turn.

4. **`import type` everywhere** — `verbatimModuleSyntax` is enabled. All type-only imports require `import type { ... }`.

5. **`GroqError` field syntax** — `erasableSyntaxOnly` disallows TypeScript parameter properties (`constructor(public status?)` syntax). Fields must be declared at the class level and assigned in the constructor body.

6. **Vite scaffolding** — Initial `npm create vite@latest .` was cancelled because CLAUDE.md already existed in the directory. Scaffolded in `/tmp/vite-scaffold` and copied files over.

7. **Node/simdjson mismatch (one-time)** — Node 25.2.1 was linked against `libsimdjson.29.dylib` but Homebrew had 4.3.0 (lib 30). Fixed with `brew reinstall node`.

8. **JSON import requires `resolveJsonModule: true`** — Vite handles JSON imports natively at bundle time, but TypeScript's type-checker needs the flag explicitly set in `tsconfig.app.json` to resolve `import data from './file.json'` without error.

9. **Groq free tier rate limits concurrent requests** — `scripts/simulate.mjs` originally ran 5 personas concurrently; only 1 in 5 completed per batch. Script updated to run sequentially with 1.2s between API calls and exponential back-off on 429s (8s → 16s → 24s).

---

## Configuration

All in `src/constants/index.ts`:
- `CALENDLY_URL` — Update to your Calendly link
- `GROQ_MODEL` — Currently `'llama-3.3-70b-versatile'`
- `SCORE_THRESHOLDS` — `{ high: 70, medium: 40 }`
- `MAX_USER_TURNS` — `10`
- `RATE_LIMIT_RETRY_MS` — `3000`

API key: `VITE_GROQ_API_KEY` in `.env`. See `.env.example`.

> **Note:** The Groq API key is exposed in the client bundle. This is acceptable for demos.
> In production, proxy requests through a backend server.

---

## Test Scenarios

**Scenario 1 — Strong qualify (High tier, ~85–95 pts):**
- "VP of Operations at a 300-person logistics company"
- Pain: ticket chaos, no SLA visibility
- Budget: "we have around $2k/month budgeted"
- Timeline: "looking to have something in place in 3–4 weeks"
- Expected: Score card with Calendly CTA

**Scenario 2 — Disqualify (government/tiny company):**
- "We're a government agency" or "We have about 20 people"
- Expected: Aria wraps up warmly → disqualified screen, no scores shown

**Scenario 3 — Medium tier (~45–55 pts):**
- Vague answers on authority ("I'd need to loop in my manager"), budget ("not sure yet"), timeline ("sometime this year")
- Expected: Score card with email capture form

---

## Analytics Dashboard

Added as a fourth screen to showcase the scoring engine's output quantitatively — designed for LinkedIn/portfolio presentation.

### Data Source
`src/data/simulationResults.json` — 20 results from real Groq API conversations run via `scripts/simulate.mjs`. Not synthetic; each result came from a live multi-turn conversation between the script's scripted persona and Aria.

**Simulation breakdown (actual results):**
- High Fit (≥70): 7
- Medium Fit (40–69): 1
- Low Fit (<40): 5
- Disqualified: 7
- Total: 20

### How to re-run simulations
```bash
node scripts/simulate.mjs
```
Runs 100 scripted personas sequentially through real Groq multi-turn conversations.
Results overwrite `src/data/simulationResults.json`. Free Groq tier — run sequentially
to avoid 429 rate limits (script handles back-off automatically).

### Dashboard Visualizations

**1. BANT Score Distribution (Chart 1)**
- Pure SVG stacked bar chart, zero dependencies
- One row per qualified prospect
- 4 color-coded segments: Budget (teal), Authority (indigo), Need (amber), Timeline (pink)
- Total score shown at row end, colored by tier

**2. Qualification Funnel (Chart 2)**
- 6-stage horizontal bar funnel
- Stages: Simulated → Completed → High Fit → Medium Fit → Low Fit → Disqualified
- Bar width proportional to count, percentage labeled inline

**3. Avg BANT Bars**
- Average score per BANT dimension across all qualified prospects
- Mini horizontal bars with score/25 label

**4. Full Results Table**
- All simulation runs: name, company, B/A/N/T scores, total, tier badge
- Disqualified rows show disqualify reason instead of scores

### Technical note
`resolveJsonModule: true` added to `tsconfig.app.json` to enable typed JSON import.
Vite supports JSON imports natively; TS flag adds compile-time type checking.

---

## What Was Delivered

- [x] Vite + React + TypeScript app, single repo
- [x] `.env.example` with `VITE_GROQ_API_KEY=your_key_here`
- [x] Four screens: Landing → Chat → Results → Dashboard
- [x] Working Groq integration with full conversation history
- [x] BANT scoring function
- [x] Conditional CTA rendering (Calendly / email capture / resource link / disqualified)
- [x] README with setup instructions and demo walkthrough
- [x] Mobile-responsive layout
- [x] Typing indicator, auto-scroll, auto-focus
- [x] Max turn fallback
- [x] 429 rate limit handling with retry
- [x] Defensive JSON parsing
- [x] Analytics dashboard with real simulation data
- [x] `scripts/simulate.mjs` — 100-persona simulation script (real Groq API, multi-turn)
- [x] BANT score distribution chart (pure SVG, no chart library)
- [x] Qualification funnel chart (pure SVG, no chart library)
- [x] `src/data/simulationResults.json` — 20 real results from Groq conversations

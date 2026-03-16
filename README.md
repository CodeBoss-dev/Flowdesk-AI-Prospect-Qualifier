# FlowDesk AI Prospect Qualifier

A conversational AI agent that qualifies sales prospects using BANT scoring before they reach a founder's calendar. Built with React, TypeScript, Tailwind CSS, and Groq API.

## How It Works

1. **Landing** — Prospect clicks "Talk to Aria"
2. **Chat** — Aria (powered by Llama 3.3 70B via Groq) conducts a 5-8 turn adaptive interview
3. **Results** — BANT score card with conditional next steps:
   - **70-100**: Strong fit → Book a demo
   - **40-69**: Medium → Email capture
   - **0-39**: Low → Resource link
   - **Disqualified**: Kind "not a fit" message

## Setup

```bash
# Install dependencies
npm install

# Copy env file and add your Groq API key
cp .env.example .env
# Edit .env and add your key from https://console.groq.com

# Start dev server
npm run dev
```

## Configuration

- **Groq API Key**: Get one free at [console.groq.com](https://console.groq.com)
- **Calendly URL**: Update `CALENDLY_URL` in `src/constants/index.ts` with your real link
- **Scoring thresholds**: Adjust in `src/constants/index.ts`

## Tech Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 3
- Groq API (llama-3.3-70b-versatile)
- No backend — pure frontend

## Project Structure

```
src/
├── types/          # TypeScript interfaces
├── constants/      # System prompt, thresholds, config
├── lib/            # Groq client, response parser, scoring
├── hooks/          # useChat state machine
├── components/     # Reusable UI components
└── screens/        # Landing, Chat, Results screens
```

> **Security note**: This is a demo app. The Groq API key (`VITE_GROQ_API_KEY`) is bundled into the client-side JavaScript and is visible to anyone who inspects the network requests or source bundle. Never use a production key or a key with billing limits you can't afford to expose. For production, proxy all Groq requests through a backend server and keep the key server-side only.

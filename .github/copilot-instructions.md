# AI Coding Agent Instructions for Pre Vet Scan

## Project Overview
**Pre Vet Scan** is a React + TypeScript SPA that provides AI-powered veterinary health analysis and unbiased second opinions for pet owners. The app uses Google's Generative AI (Gemini) to analyze pet images and audit vet bills, focusing on early detection and prevention ROI.

**Key Differentiator**: Unlike traditional pet insurance (reactive, incentivized to deny claims), Pre Vet Scan is proactive, AI-driven, and unbiased—no financial incentive to upsell or deny.

## Architecture

### Core Data Flow
1. **Home View** → Navigation hub; displays value proposition
2. **Analysis View** (`AnalysisView.tsx`) → Image upload → Gemini API analysis → Structured JSON result (severity, title, observations, possible causes, vet checklist, financial forecast)
3. **Chat Interface** (`ChatInterface.tsx`) → Multi-turn conversation with image support → Quote auditing + symptom triage

### API Layers
- **Frontend calls `/api/analyze`** (Vercel Edge Function) → Sends base64 image + category → Returns structured JSON analysis
- **Frontend calls `/api/chat`** → Streaming chat endpoint with optional image support → Returns streamed text responses

### Critical Service: `geminiService.ts`
- **Models used**: `gemini-2.5-flash` (fast, cost-effective for APIs) and `gemini-3-pro-preview` (if using extended thinking)
- **Thinking Budget**: API layer uses thinking for deeper analysis; set `thinkingBudget: 1024` for image analysis
- **Schema Enforcement**: Structured output via JSON schema for analysis endpoint ensures consistent `AnalysisResult` shape
- **System Instructions**: Both endpoints include tailored system prompts emphasizing "unbiased second opinion" positioning

### State Management
- **App.tsx**: Simple view switching (`home | analysis | chat`) via `useState<View>`
- **Component-level state**: Each view manages its own data (image uploads, chat messages, analysis results)
- **Message Format**: `ChatMessage` includes `role`, `text`, optional `image` (base64), `timestamp`, `isThinking` flag

## Patterns & Conventions

### Image Handling
- **Format**: All images converted to base64 data URIs during upload (client-side)
- **Stripping**: Base64 prefix stripped (`split(',')[1]`) before sending to API
- **Size**: No explicit size limits enforced; ensure image optimization in frontend if needed

### Severity Classification
Used across analysis results:
- `Healthy` → Green (no issues)
- `Low` → Blue (monitor)
- `Moderate` → Yellow (schedule soon)
- `High` → Orange (urgent, 24–48h)
- `Critical` → Red (immediate, <4h)

Map to Tailwind classes in `getSeverityColor()` for consistent UI theming.

### HealthCategory Enum
```typescript
TEETH = 'Teeth & Gums' | EYES = 'Eyes' | SKIN = 'Skin & Coat' | GAIT = 'Gait & Movement' | OTHER = 'General'
```
Categories passed to API prompt to scope Gemini's analysis; modify enum if adding new analysis categories.

### Financial Forecasting
**Core Mission Requirement**: Every analysis must include a financial forecast comparing:
- Cost of treating now (specific ranges, e.g., "$0–$300" for teeth cleaning)
- Cost of delaying (complications, e.g., "$1200+" for surgery)

This ROI comparison is the unique value driver; always include realistic US veterinary benchmarks.

### API Response Parsing
- **analyze.ts**: Extracts JSON from text response using regex `\{[\s\S]*\}` (handles LLM text wrapping)
- **chat.ts**: Streams text chunks; no JSON parsing required
- **Error Handling**: Both endpoints return descriptive error objects with status 500 and error.message context

## Development Workflow

### Local Setup
```bash
npm install
npm run dev  # Starts Vite on http://localhost:3000
```

### Environment Variables
- **`GEMINI_API_KEY`**: Required in `.env.local`; exposed to frontend via Vite's `process.env.GEMINI_API_KEY`
- **API endpoints**: Vercel Edge Functions; test locally by ensuring API routes exist in `/api/`

### Build & Deployment
```bash
npm run build    # Vite builds to dist/
npm run preview  # Local preview of production build
```
Project is built for Vercel (Edge Functions in `/api/`); ensure API routes are at `api/*.ts`.

## Key Files & Their Responsibilities

| File | Purpose |
|------|---------|
| App.tsx | View router; nav bar; home landing page |
| types.ts | Shared interfaces: `AnalysisResult`, `ChatMessage`, `HealthCategory`, `AppState` |
| components/AnalysisView.tsx | Image upload, category selection, analysis display, PDF export |
| components/ChatInterface.tsx | Multi-turn chat with image upload, streamed responses, message history |
| components/Button.tsx | Reusable UI button (primary/secondary variants) |
| api/analyze.ts | Edge Function: image analysis, structured JSON output |
| api/chat.ts | Edge Function: streaming chat with optional image |
| services/geminiService.ts | Gemini client initialization, schema definitions, API calls |

## Common Development Tasks

### Adding a New Health Category
1. Extend `HealthCategory` enum in types.ts
2. Update category list in components/AnalysisView.tsx dropdown
3. API prompts automatically scope to the category string

### Modifying Analysis Output Structure
1. Update `AnalysisResult` interface in types.ts
2. Update `analysisSchema` in api/analyze.ts to match
3. Update UI display in components/AnalysisView.tsx

### Adjusting Gemini Model or Thinking Budget
- **Model**: Change `gemini-2.5-flash` or `gemini-3-pro-preview` in api/analyze.ts and api/chat.ts
- **Thinking**: Modify `thinkingBudget` values (1024–32768); higher = deeper reasoning but higher cost/latency

### Adding Chart/Visualization
- Import `jspdf` and `html2canvas` (already in deps)
- See components/AnalysisView.tsx `exportToPDF()` for pattern

## External Dependencies & Integration Points

- **@google/generative-ai**: Gemini API client; handles streaming, schema enforcement
- **react-markdown**: Renders chat responses (supports markdown formatting)
- **jsPDF + html2canvas**: PDF export for analysis reports
- **Tailwind CSS**: All styling uses Tailwind utility classes
- **Vercel Edge**: `/api/` routes run as serverless functions (not used locally, but required for production)

## Testing Notes
- **Image Analysis**: Test with various pet photos to validate schema compliance
- **Streaming Chat**: Verify chunks render incrementally; watch for buffering issues
- **Quote Audit**: System prompt instructs Gemini to flag vague line items—test with sample vet bills
- **Error Handling**: Trigger API failures (invalid key, network error) to verify user feedback

## Messaging & Tone
- **User-facing**: Empathetic, non-alarmist ("may indicate," "warrants examination")
- **System Instructions**: Emphasize unbiased second opinion, no conflicts of interest
- **Disclaimers**: Always clarify this is AI analysis, not a veterinary diagnosis; licensed vet consultation required

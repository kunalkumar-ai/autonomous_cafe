# Brew & Bits — Autonomous Virtual Cafe

A fully autonomous 3D virtual cafe simulation. GPT-4o AI agents run every station. A robot barista physically animates to make coffee. Users can watch in god-view (orbiting 3D scene) or interact as a customer.

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **React Three Fiber** + **@react-three/drei** — full 3D cafe scene
- **Three.js** — geometry, animation via `useFrame` + lerp
- **OpenAI SDK** (`openai`) — GPT-4o, raw streaming (no agents framework)
- **Zustand** — shared cafe state
- **Framer Motion** — chat UI animations only
- **Tailwind CSS** — UI overlays only (not 3D scene)

## Environment Variables

```
OPENAI_API_KEY=your_key_here   # required — in .env.local
```

## Dev Commands

```bash
npm run dev       # start dev server at http://localhost:3000
npm run build     # production build (must pass before any PR)
npm run lint      # lint check
```

## Project Structure

```
app/
  api/agent/route.ts     # POST — streams GPT-4o response as SSE
  page.tsx               # renders <CafeApp />
components/
  CafeApp.tsx            # root: god view or customer mode
  scene/                 # all React Three Fiber 3D components
    CafeScene3D.tsx      # R3F Canvas, camera, OrbitControls
    CafeEnvironment.tsx  # floor, walls, lights
    BarCounter.tsx        # bar counter geometry
    RobotBarista.tsx     # robot with animated right arm ← star of the show
    CoffeeMachine.tsx    # espresso machine (lever animates)
    Grinder.tsx          # grinder (spins when grinding)
    CoffeeCup.tsx        # cup that fills step by step
    ReceptionDesk.tsx    # Mia at reception
    PaymentTerminal.tsx  # PAY-BOT kiosk
  customer/              # customer mode: 3D scene + chat panel
    CustomerMode.tsx
    AgentChat.tsx        # streaming GPT-4o chat
    MessageBubble.tsx
  ui/
    ViewToggle.tsx       # god ↔ customer toggle
    OrderStatusBar.tsx   # order stage progress bar
lib/
  openai.ts              # OpenAI client
  cafe-state.ts          # Zustand store
  stream-agent.ts        # client-side SSE streaming helper
  agents/
    receptionist.ts      # Mia — system prompt + ORDER_CONFIRMED parser
    barista.ts           # ROBO-1 — system prompt + STEP:xxx parser
    payment.ts           # PAY-BOT — system prompt + PAYMENT_COMPLETE parser
types/
  cafe.ts                # shared types: Order, CoffeeStep, AgentRole, etc.
```

## Key Design Decisions

### AI + Robot Split
- **AI agent (ROBO-1):** thinks, narrates, emits `[STEP:xxx]` tags
- **Robot (3D geometry):** physically moves its arm to each machine when step tag fires
- Agent is the brain; the 3D robot is the body

### Agent Communication Protocol
Agents embed control tags in their responses. Parsers in `lib/agents/*.ts` extract them:
- `[ORDER_CONFIRMED: Name | drink1, drink2]` — receptionist confirms order
- `[STEP:grinding|tamping|pulling_espresso|steaming_milk|pouring|done]` — barista step
- `[PAYMENT_COMPLETE]` — payment processed

### Robot Arm Animation
`RobotBarista.tsx` uses `useFrame` + `THREE.MathUtils.lerp` to smoothly move the right arm group. Each `CoffeeStep` maps to a target `{ rx, rz }` rotation. No external animation library needed.

### 3D Scene Layout (X axis)
```
ReceptionDesk (-5)   BarCounter (0) + Robot (-3.6)   PaymentTerminal (+5)
```

### Two View Modes
- **God view**: elevated camera + OrbitControls, see everything
- **Customer mode**: eye-level camera (locked) + chat panel on right (w-96)

## Coding Conventions

- All R3F components: no `'use client'` needed unless using hooks that require it (`useRef`, `useState`, etc.) — add it when needed
- Never SSR the Canvas — `CafeScene3D` is `'use client'`
- Agent streaming: always strip control tags before displaying to user (`.replace(/\[STEP:\w+\]/g, '')` etc.)
- Zustand state is the single source of truth — R3F components read from it via `useCafeState()` inside `useFrame`
- `useFrame` runs every render frame — keep logic cheap (lerp, Math.sin, color lerp)

## Plan

Full implementation plan: `docs/superpowers/plans/2026-06-10-autonomous-cafe.md`

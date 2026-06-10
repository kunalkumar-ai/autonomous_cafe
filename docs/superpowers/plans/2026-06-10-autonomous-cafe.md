# Autonomous Virtual Cafe — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a beautiful 3D web-based autonomous cafe simulation where real GPT-4o AI agents run every station and a robot barista physically moves and animates to make coffee — with god-view (rotate around the 3D cafe) and customer mode (interact as a guest).

**Architecture:** Next.js app with React Three Fiber (Three.js) for the full 3D cafe scene; OpenAI API (raw streaming) powers three GPT-4o agents (Receptionist, Barista, Payment); robot arm literally moves to each machine during coffee steps; Zustand drives all state transitions that trigger 3D animations.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion (chat UI only), React Three Fiber (`@react-three/fiber`), Three.js Drei helpers (`@react-three/drei`), Zustand, OpenAI SDK (`openai`), SSE streaming

---

## Key Design Decisions

### The 3D Robot
The robot barista is built from geometric Three.js shapes (no external model files needed):
- **Body**: metallic silver box
- **Head**: box with glowing LED eyes that change color by state
- **Right arm**: segmented (upper arm + forearm + hand) — pivots at shoulder, this arm physically animates to each machine during coffee steps
- **Left arm**: rests at side

**Per coffee step, the right arm moves to a specific position:**
- `grinding` → arm swings left to the grinder, rotation repeats (grinding motion)
- `tamping` → arm moves forward + presses down
- `pulling_espresso` → arm reaches to machine button, lever pulls
- `steaming_milk` → arm swings right to steam wand, wand enters milk jug
- `pouring` → arm picks up cup position, tilts forward
- `done` → arm returns to rest, robot head bobs, eyes turn green

### 3D Scene Layout
```
[RECEPTION DESK]          [BAR COUNTER + ROBOT + MACHINES]          [PAYMENT TERMINAL]
     left                          center                                  right
```
Camera in god view: elevated angle, slightly behind, OrbitControls so user can drag to rotate.
Camera in customer view: eye-level facing the counter, locked.

### Two Modes
- **God View**: Full 3D cafe, all stations visible, OrbitControls, everything animates autonomously
- **Customer Mode**: 3D scene on left (2/3 width) + chat panel on right (1/3 width)

### AI Agents (GPT-4o, raw streaming)
1. **Mia — Receptionist**: greets, takes name + order, emits `[ORDER_CONFIRMED]` tag
2. **ROBO-1 — Barista Robot**: narrates each step, emits `[STEP:xxx]` tags that trigger arm movement
3. **PAY-BOT — Payment**: calculates total, emits `[PAYMENT_COMPLETE]` tag

---

## File Structure

```
CascadeProjects/autonomous-cafe/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
├── .env.local                             # OPENAI_API_KEY
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── api/
│       └── agent/route.ts                 # POST — streams GPT-4o response as SSE
├── components/
│   ├── CafeApp.tsx                        # Root component, mode switch
│   ├── scene/
│   │   ├── CafeScene3D.tsx                # R3F Canvas, camera, lights, scene root
│   │   ├── CafeEnvironment.tsx            # Floor tiles, walls, ceiling, ambient lighting
│   │   ├── BarCounter.tsx                 # Main bar counter geometry
│   │   ├── RobotBarista.tsx               # Robot with animated right arm
│   │   ├── CoffeeMachine.tsx              # Espresso machine (box geometry)
│   │   ├── Grinder.tsx                    # Coffee grinder (cylinder geometry)
│   │   ├── SteamWand.tsx                  # Steam wand (cylinder, animated)
│   │   ├── CoffeeCup.tsx                  # Cup on counter (fills with color)
│   │   ├── ReceptionDesk.tsx              # Reception desk left side
│   │   └── PaymentTerminal.tsx            # Payment kiosk right side
│   ├── customer/
│   │   ├── CustomerMode.tsx               # 3D scene + chat panel layout
│   │   ├── AgentChat.tsx                  # Full chat panel with streaming
│   │   └── MessageBubble.tsx              # Individual chat bubble
│   └── ui/
│       ├── ViewToggle.tsx                 # God ↔ Customer toggle
│       └── OrderStatusBar.tsx             # Stage progress bar (HTML overlay)
├── lib/
│   ├── agents/
│   │   ├── receptionist.ts                # GPT-4o system prompt + tag parsers
│   │   ├── barista.ts                     # GPT-4o system prompt + step tag parsers
│   │   └── payment.ts                     # GPT-4o system prompt + tag parsers
│   ├── openai.ts                          # OpenAI client + streaming helper
│   ├── cafe-state.ts                      # Zustand store
│   └── stream-agent.ts                    # Client-side fetch streaming helper
└── types/
    └── cafe.ts                            # Shared types
```

---

## Task 1: Project Setup

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`, `.env.local`, `app/globals.css`, `app/layout.tsx`, `app/page.tsx`

- [ ] **Step 1: Scaffold Next.js project**

```bash
cd /Users/kunalkumar/CascadeProjects/autonomous-cafe
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

- [ ] **Step 2: Install dependencies**

```bash
npm install openai zustand framer-motion @react-three/fiber @react-three/drei three
npm install -D @types/three
```

- [ ] **Step 3: Create .env.local**

```
OPENAI_API_KEY=your_key_here
```

- [ ] **Step 4: Update next.config.ts to allow Three.js transpilation**

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['three'],
}

export default nextConfig
```

- [ ] **Step 5: Set globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --cafe-bg: #0d0805;
  --cafe-accent: #c8922a;
  --cafe-light: #f5d07a;
  --agent-text: #f0e6d3;
}

* { box-sizing: border-box; }

body {
  background: var(--cafe-bg);
  color: var(--agent-text);
  overflow: hidden;
  margin: 0;
}
```

- [ ] **Step 6: Update tailwind.config.ts**

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'cafe-bg': '#0d0805',
        'cafe-accent': '#c8922a',
        'cafe-light': '#f5d07a',
        'cafe-muted': '#7a5c3a',
        'cafe-dark': '#2a1a0d',
        'cafe-green': '#4a7c59',
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 7: Verify project starts**

```bash
npm run dev
```

Expected: Next.js running at http://localhost:3000, no errors.

- [ ] **Step 8: Commit**

```bash
git init
git add .
git commit -m "feat: project setup — Next.js, Three.js/R3F, OpenAI SDK, Zustand"
```

---

## Task 2: Types and Zustand State

**Files:**
- Create: `types/cafe.ts`
- Create: `lib/cafe-state.ts`

- [ ] **Step 1: Create types/cafe.ts**

```typescript
export type AgentRole = 'receptionist' | 'barista' | 'payment'

export type OrderStage =
  | 'idle'
  | 'greeting'
  | 'ordering'
  | 'confirmed'
  | 'making_coffee'
  | 'coffee_ready'
  | 'payment'
  | 'complete'

export type CoffeeStep =
  | 'grinding'
  | 'tamping'
  | 'pulling_espresso'
  | 'steaming_milk'
  | 'pouring'
  | 'done'

export interface Message {
  id: string
  role: 'user' | 'agent'
  agentRole?: AgentRole
  content: string
  timestamp: number
}

export interface Order {
  id: string
  customerName: string
  items: string[]
  total: number
  stage: OrderStage
  coffeeStep?: CoffeeStep
}

export type ViewMode = 'god' | 'customer'
```

- [ ] **Step 2: Create lib/cafe-state.ts**

```typescript
import { create } from 'zustand'
import { Order, Message, ViewMode, OrderStage, CoffeeStep, AgentRole } from '@/types/cafe'

interface CafeState {
  viewMode: ViewMode
  order: Order | null
  messages: Message[]
  activeAgent: AgentRole | null
  isAgentTyping: boolean

  setViewMode: (mode: ViewMode) => void
  startOrder: () => void
  updateOrderStage: (stage: OrderStage) => void
  updateCoffeeStep: (step: CoffeeStep) => void
  setOrderDetails: (name: string, items: string[]) => void
  setOrderTotal: (total: number) => void
  addMessage: (msg: Message) => void
  setActiveAgent: (agent: AgentRole | null) => void
  setAgentTyping: (typing: boolean) => void
  resetCafe: () => void
}

export const useCafeState = create<CafeState>((set) => ({
  viewMode: 'god',
  order: null,
  messages: [],
  activeAgent: null,
  isAgentTyping: false,

  setViewMode: (mode) => set({ viewMode: mode }),

  startOrder: () => set({
    order: {
      id: crypto.randomUUID(),
      customerName: '',
      items: [],
      total: 0,
      stage: 'greeting',
    },
    messages: [],
    activeAgent: 'receptionist',
    isAgentTyping: false,
  }),

  updateOrderStage: (stage) =>
    set((s) => s.order ? { order: { ...s.order, stage } } : {}),

  updateCoffeeStep: (coffeeStep) =>
    set((s) => s.order ? { order: { ...s.order, coffeeStep } } : {}),

  setOrderDetails: (customerName, items) =>
    set((s) => s.order ? { order: { ...s.order, customerName, items } } : {}),

  setOrderTotal: (total) =>
    set((s) => s.order ? { order: { ...s.order, total } } : {}),

  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, msg] })),

  setActiveAgent: (agent) => set({ activeAgent: agent }),
  setAgentTyping: (typing) => set({ isAgentTyping: typing }),

  resetCafe: () => set({
    order: null,
    messages: [],
    activeAgent: null,
    isAgentTyping: false,
  }),
}))
```

- [ ] **Step 3: Commit**

```bash
git add types/cafe.ts lib/cafe-state.ts
git commit -m "feat: types and Zustand cafe state store"
```

---

## Task 3: OpenAI API Layer + Agent Definitions

**Files:**
- Create: `lib/openai.ts`
- Create: `lib/agents/receptionist.ts`
- Create: `lib/agents/barista.ts`
- Create: `lib/agents/payment.ts`
- Create: `app/api/agent/route.ts`
- Create: `lib/stream-agent.ts`

- [ ] **Step 1: Create lib/openai.ts**

```typescript
import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})
```

- [ ] **Step 2: Create lib/agents/receptionist.ts**

```typescript
export const RECEPTIONIST_SYSTEM_PROMPT = `You are Mia, the warm receptionist at Brew & Bits, a fully autonomous AI cafe.

Your job:
1. Greet the customer and ask for their name
2. Take their coffee order — menu: Espresso $3, Americano $4, Cappuccino $5, Latte $5, Flat White $5, Cold Brew $5, Matcha Latte $6
3. Confirm name + order clearly
4. Tell them ROBO-1 the robot barista will make it now

Rules:
- Keep responses SHORT: 2-3 sentences max
- Be warm and slightly playful
- Only when you have BOTH the customer's name AND their confirmed order, end your message with this exact tag on its own line:
  [ORDER_CONFIRMED: {name} | {drink1}, {drink2}]
- Do not include the tag until you have both name and order confirmed
- Never invent menu items`

export function parseOrderConfirmation(text: string): { name: string; items: string[] } | null {
  const match = text.match(/\[ORDER_CONFIRMED:\s*(.+?)\s*\|\s*(.+?)\]/)
  if (!match) return null
  return {
    name: match[1].trim(),
    items: match[2].split(',').map((i) => i.trim()),
  }
}
```

- [ ] **Step 3: Create lib/agents/barista.ts**

```typescript
export const BARISTA_SYSTEM_PROMPT = `You are ROBO-1, the robot barista at Brew & Bits. You are precise, robotic but warm.

When you receive an order, narrate each step you perform as you make the coffee. Each step MUST include its tag.

Steps in order (for espresso-based drinks — skip steaming_milk for plain espresso):
1. [STEP:grinding] — grinding the beans
2. [STEP:tamping] — tamping the grounds  
3. [STEP:pulling_espresso] — pulling the espresso shot
4. [STEP:steaming_milk] — steaming the milk (skip for espresso only)
5. [STEP:pouring] — pouring and finishing
6. [STEP:done] — coffee is ready

Rules:
- One message per step, 1-2 sentences each
- Always include the [STEP:xxx] tag at the very start of the relevant message
- Be robotic-precise but friendly: "Initiating grind sequence. Fresh beans loaded."
- When told "Continue to the next step", move to the next step in sequence
- Never skip steps`

export type CoffeeStepTag = 'grinding' | 'tamping' | 'pulling_espresso' | 'steaming_milk' | 'pouring' | 'done'

export function parseCoffeeStep(text: string): CoffeeStepTag | null {
  const match = text.match(/\[STEP:(\w+)\]/)
  if (!match) return null
  return match[1] as CoffeeStepTag
}
```

- [ ] **Step 4: Create lib/agents/payment.ts**

```typescript
const PRICES: Record<string, number> = {
  espresso: 3,
  americano: 4,
  cappuccino: 5,
  latte: 5,
  'flat white': 5,
  'cold brew': 5,
  'matcha latte': 6,
}

export const PAYMENT_SYSTEM_PROMPT = `You are PAY-BOT, the payment agent at Brew & Bits cafe.

Your job:
1. State the total clearly
2. Ask them to tap to pay (this is simulated)
3. Confirm payment went through and say goodbye

Rules:
- Maximum 2 sentences per message
- Be efficient and friendly
- When payment is processed, end your message with exactly: [PAYMENT_COMPLETE]`

export function calculateTotal(items: string[]): number {
  return items.reduce((sum, item) => {
    const price = PRICES[item.toLowerCase()] ?? 5
    return sum + price
  }, 0)
}

export function parsePaymentComplete(text: string): boolean {
  return text.includes('[PAYMENT_COMPLETE]')
}
```

- [ ] **Step 5: Create app/api/agent/route.ts**

```typescript
import { NextRequest } from 'next/server'
import { openai } from '@/lib/openai'
import { RECEPTIONIST_SYSTEM_PROMPT } from '@/lib/agents/receptionist'
import { BARISTA_SYSTEM_PROMPT } from '@/lib/agents/barista'
import { PAYMENT_SYSTEM_PROMPT } from '@/lib/agents/payment'
import { AgentRole } from '@/types/cafe'

const SYSTEM_PROMPTS: Record<AgentRole, string> = {
  receptionist: RECEPTIONIST_SYSTEM_PROMPT,
  barista: BARISTA_SYSTEM_PROMPT,
  payment: PAYMENT_SYSTEM_PROMPT,
}

export async function POST(req: NextRequest) {
  const { agentRole, messages } = await req.json()
  const systemPrompt = SYSTEM_PROMPTS[agentRole as AgentRole]
  if (!systemPrompt) return new Response('Unknown agent role', { status: 400 })

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const gptStream = await openai.chat.completions.create({
          model: 'gpt-4o',
          max_tokens: 200,
          stream: true,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
          ],
        })

        for await (const chunk of gptStream) {
          const text = chunk.choices[0]?.delta?.content || ''
          if (text) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
```

- [ ] **Step 6: Create lib/stream-agent.ts (client-side streaming)**

```typescript
import { AgentRole } from '@/types/cafe'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function streamAgentMessage(
  agentRole: AgentRole,
  messages: ChatMessage[],
  onChunk: (text: string) => void
): Promise<string> {
  const response = await fetch('/api/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentRole, messages }),
  })

  if (!response.body) throw new Error('No stream body')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let fullText = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const lines = decoder.decode(value).split('\n')
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6)
      if (data === '[DONE]') return fullText
      try {
        const { text } = JSON.parse(data)
        onChunk(text)
        fullText += text
      } catch {}
    }
  }

  return fullText
}
```

- [ ] **Step 7: Commit**

```bash
git add lib/ app/api/
git commit -m "feat: OpenAI GPT-4o streaming API + three agent definitions"
```

---

## Task 4: 3D Cafe Environment

**Files:**
- Create: `components/scene/CafeEnvironment.tsx`
- Create: `components/scene/BarCounter.tsx`
- Create: `components/scene/ReceptionDesk.tsx`
- Create: `components/scene/PaymentTerminal.tsx`

- [ ] **Step 1: Create CafeEnvironment.tsx (floor, walls, lighting)**

```tsx
import { useRef } from 'react'
import * as THREE from 'three'

function FloorTiles() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[20, 14]} />
      <meshStandardMaterial color="#1a0e08" roughness={0.8} metalness={0.1} />
    </mesh>
  )
}

function TileGrid() {
  // Render a grid of subtle tile lines
  return (
    <gridHelper
      args={[20, 20, '#2a1a0d', '#2a1a0d']}
      position={[0, 0.001, 0]}
    />
  )
}

function Walls() {
  return (
    <>
      {/* Back wall */}
      <mesh position={[0, 2.5, -7]} receiveShadow>
        <boxGeometry args={[20, 5, 0.2]} />
        <meshStandardMaterial color="#2d1a0e" roughness={0.9} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-10, 2.5, 0]} receiveShadow>
        <boxGeometry args={[0.2, 5, 14]} />
        <meshStandardMaterial color="#2d1a0e" roughness={0.9} />
      </mesh>
      {/* Right wall */}
      <mesh position={[10, 2.5, 0]} receiveShadow>
        <boxGeometry args={[0.2, 5, 14]} />
        <meshStandardMaterial color="#2d1a0e" roughness={0.9} />
      </mesh>
    </>
  )
}

function PendantLights() {
  const positions: [number, number, number][] = [[-3, 4, -2], [3, 4, -2], [0, 4, 1]]
  return (
    <>
      {positions.map((pos, i) => (
        <group key={i} position={pos}>
          {/* Cord */}
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 1]} />
            <meshStandardMaterial color="#555" />
          </mesh>
          {/* Bulb housing */}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.12]} />
            <meshStandardMaterial color="#c8922a" emissive="#c8922a" emissiveIntensity={1} />
          </mesh>
          {/* Point light */}
          <pointLight color="#f5d07a" intensity={1.5} distance={6} decay={2} castShadow />
        </group>
      ))}
    </>
  )
}

export function CafeEnvironment() {
  return (
    <>
      {/* Ambient */}
      <ambientLight intensity={0.3} color="#3d2510" />
      {/* Main fill */}
      <directionalLight
        position={[5, 8, 5]}
        intensity={0.8}
        color="#f5d07a"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <FloorTiles />
      <TileGrid />
      <Walls />
      <PendantLights />
    </>
  )
}
```

- [ ] **Step 2: Create BarCounter.tsx**

```tsx
export function BarCounter() {
  return (
    <group position={[0, 0, -3]}>
      {/* Counter top */}
      <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[7, 0.1, 1.2]} />
        <meshStandardMaterial color="#3d2510" roughness={0.4} metalness={0.2} />
      </mesh>
      {/* Counter body */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[7, 1.0, 1.2]} />
        <meshStandardMaterial color="#2d1a0e" roughness={0.7} />
      </mesh>
      {/* Counter edge trim */}
      <mesh position={[0, 1.07, 0.6]}>
        <boxGeometry args={[7, 0.04, 0.04]} />
        <meshStandardMaterial color="#c8922a" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  )
}
```

- [ ] **Step 3: Create ReceptionDesk.tsx**

```tsx
import { useCafeState } from '@/lib/cafe-state'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function ReceptionDesk() {
  const { activeAgent } = useCafeState()
  const isActive = activeAgent === 'receptionist'
  const glowRef = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = isActive
        ? 0.4 + Math.sin(Date.now() * 0.003) * 0.2
        : 0.05
    }
  })

  return (
    <group position={[-5, 0, 0]}>
      {/* Desk */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[2, 1.2, 1]} />
        <meshStandardMaterial color="#2d1a0e" roughness={0.8} />
      </mesh>
      {/* Desk top */}
      <mesh position={[0, 1.21, 0]} castShadow>
        <boxGeometry args={[2, 0.05, 1]} />
        <meshStandardMaterial color="#3d2510" roughness={0.3} metalness={0.1} />
      </mesh>

      {/* MIA avatar — stylized human figure */}
      <group position={[0, 1.8, -0.3]}>
        {/* Body */}
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.28, 0.4, 0.18]} />
          <meshStandardMaterial color="#c8922a" roughness={0.6} />
        </mesh>
        {/* Head */}
        <mesh position={[0, 0.35, 0]} castShadow>
          <sphereGeometry args={[0.14]} />
          <meshStandardMaterial color="#f0c8a0" roughness={0.8} />
        </mesh>
        {/* Glowing screen/tablet she's holding */}
        <mesh ref={glowRef} position={[0, -0.05, 0.12]} castShadow>
          <boxGeometry args={[0.18, 0.22, 0.02]} />
          <meshStandardMaterial
            color="#4a9eff"
            emissive="#4a9eff"
            emissiveIntensity={isActive ? 0.6 : 0.1}
          />
        </mesh>
      </group>

      {/* Label */}
      {isActive && (
        <pointLight position={[0, 2.5, 0]} color="#c8922a" intensity={1.5} distance={3} />
      )}
    </group>
  )
}
```

- [ ] **Step 4: Create PaymentTerminal.tsx**

```tsx
import { useCafeState } from '@/lib/cafe-state'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function PaymentTerminal() {
  const { activeAgent, order } = useCafeState()
  const isActive = activeAgent === 'payment'
  const screenRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (screenRef.current) {
      const mat = screenRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = isActive
        ? 0.5 + Math.sin(Date.now() * 0.004) * 0.2
        : 0.08
    }
  })

  return (
    <group position={[5, 0, 0]}>
      {/* Pedestal */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 1.2, 8]} />
        <meshStandardMaterial color="#1a0f0a" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Terminal head */}
      <mesh position={[0, 1.4, 0]} castShadow>
        <boxGeometry args={[0.5, 0.7, 0.12]} />
        <meshStandardMaterial color="#1a0f0a" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Screen */}
      <mesh ref={screenRef} position={[0, 1.4, 0.07]}>
        <boxGeometry args={[0.42, 0.58, 0.01]} />
        <meshStandardMaterial
          color={order?.stage === 'complete' ? '#4a7c59' : '#4a9eff'}
          emissive={order?.stage === 'complete' ? '#4a7c59' : '#4a9eff'}
          emissiveIntensity={isActive ? 0.5 : 0.08}
        />
      </mesh>

      {/* PAY-BOT robot figure above terminal */}
      <group position={[0, 2.3, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.22, 0.3, 0.16]} />
          <meshStandardMaterial color="#2a3a4a" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.27, 0]} castShadow>
          <boxGeometry args={[0.2, 0.2, 0.18]} />
          <meshStandardMaterial color="#2a3a4a" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Eyes */}
        {[-0.05, 0.05].map((x, i) => (
          <mesh key={i} position={[x, 0.28, 0.09]}>
            <sphereGeometry args={[0.025]} />
            <meshStandardMaterial
              color={isActive ? '#4a9eff' : '#1a2a3a'}
              emissive={isActive ? '#4a9eff' : '#000'}
              emissiveIntensity={isActive ? 1 : 0}
            />
          </mesh>
        ))}
      </group>

      {isActive && (
        <pointLight position={[0, 2.5, 0]} color="#4a9eff" intensity={1.5} distance={3} />
      )}
    </group>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add components/scene/CafeEnvironment.tsx components/scene/BarCounter.tsx components/scene/ReceptionDesk.tsx components/scene/PaymentTerminal.tsx
git commit -m "feat: 3D cafe environment — floor, walls, lights, reception desk, payment terminal"
```

---

## Task 5: Robot Barista with Animated Arm

**Files:**
- Create: `components/scene/CoffeeMachine.tsx`
- Create: `components/scene/Grinder.tsx`
- Create: `components/scene/CoffeeCup.tsx`
- Create: `components/scene/RobotBarista.tsx`

- [ ] **Step 1: Create CoffeeMachine.tsx**

```tsx
import { useCafeState } from '@/lib/cafe-state'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function CoffeeMachine() {
  const { order } = useCafeState()
  const step = order?.coffeeStep
  const leverRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (!leverRef.current) return
    const target = step === 'pulling_espresso' ? -0.3 : 0
    leverRef.current.rotation.z = THREE.MathUtils.lerp(
      leverRef.current.rotation.z, target, 0.05
    )
  })

  return (
    <group position={[0.8, 1.1, -3.3]}>
      {/* Machine body */}
      <mesh castShadow>
        <boxGeometry args={[0.7, 0.65, 0.5]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Top */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[0.72, 0.05, 0.52]} />
        <meshStandardMaterial color="#111" metalness={0.95} roughness={0.05} />
      </mesh>
      {/* Group head (portafilter dock) */}
      <mesh position={[0, -0.05, 0.27]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.12, 16]} />
        <meshStandardMaterial color="#222" metalness={0.8} />
      </mesh>
      {/* Lever */}
      <mesh ref={leverRef} position={[0.28, 0.1, 0.1]} castShadow>
        <boxGeometry args={[0.06, 0.3, 0.06]} />
        <meshStandardMaterial color="#c8922a" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Drip tray */}
      <mesh position={[0, -0.38, 0.2]}>
        <boxGeometry args={[0.5, 0.04, 0.2]} />
        <meshStandardMaterial color="#333" metalness={0.9} />
      </mesh>
      {/* Status LED */}
      <mesh position={[-0.28, 0.2, 0.26]}>
        <sphereGeometry args={[0.025]} />
        <meshStandardMaterial
          color={step === 'pulling_espresso' ? '#ff6600' : '#004400'}
          emissive={step === 'pulling_espresso' ? '#ff6600' : '#00ff00'}
          emissiveIntensity={0.8}
        />
      </mesh>
    </group>
  )
}
```

- [ ] **Step 2: Create Grinder.tsx**

```tsx
import { useCafeState } from '@/lib/cafe-state'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function Grinder() {
  const { order } = useCafeState()
  const isGrinding = order?.coffeeStep === 'grinding'
  const hopperRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (hopperRef.current && isGrinding) {
      hopperRef.current.rotation.y += 0.08
    }
  })

  return (
    <group position={[-0.8, 1.1, -3.3]}>
      {/* Base */}
      <mesh castShadow>
        <boxGeometry args={[0.35, 0.5, 0.35]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Hopper (rotates when grinding) */}
      <mesh ref={hopperRef} position={[0, 0.38, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.15, 0.3, 8]} />
        <meshStandardMaterial
          color={isGrinding ? '#c8922a' : '#222'}
          metalness={0.6}
          roughness={0.4}
          emissive={isGrinding ? '#c8922a' : '#000'}
          emissiveIntensity={isGrinding ? 0.3 : 0}
        />
      </mesh>
      {/* Chute */}
      <mesh position={[0, -0.1, 0.15]}>
        <cylinderGeometry args={[0.04, 0.06, 0.2, 8]} />
        <meshStandardMaterial color="#333" metalness={0.7} />
      </mesh>
    </group>
  )
}
```

- [ ] **Step 3: Create CoffeeCup.tsx**

```tsx
import { useCafeState } from '@/lib/cafe-state'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const STEP_FILL: Record<string, number> = {
  grinding: 0,
  tamping: 0,
  pulling_espresso: 0.3,
  steaming_milk: 0.6,
  pouring: 0.9,
  done: 1.0,
}

export function CoffeeCup() {
  const { order } = useCafeState()
  const step = order?.coffeeStep
  const fillRef = useRef<THREE.Mesh>(null)
  const targetFill = step ? (STEP_FILL[step] ?? 0) : 0

  useFrame(() => {
    if (!fillRef.current) return
    const mat = fillRef.current.material as THREE.MeshStandardMaterial
    const currentScale = fillRef.current.scale.y
    fillRef.current.scale.y = THREE.MathUtils.lerp(currentScale, targetFill, 0.04)
    fillRef.current.position.y = -0.08 + fillRef.current.scale.y * 0.08
    // Color transitions from espresso brown to latte tan
    mat.color.lerp(
      new THREE.Color(step === 'done' ? '#8B4513' : '#3d1a08'),
      0.05
    )
  })

  return (
    <group position={[0, 1.1, -3.0]}>
      {/* Cup body */}
      <mesh castShadow>
        <cylinderGeometry args={[0.07, 0.055, 0.16, 16]} />
        <meshStandardMaterial color="#f0e6d3" roughness={0.9} />
      </mesh>
      {/* Coffee fill (scales up) */}
      <mesh ref={fillRef} position={[0, -0.08, 0]}>
        <cylinderGeometry args={[0.063, 0.048, 0.16, 16]} />
        <meshStandardMaterial color="#3d1a08" roughness={1} />
      </mesh>
      {/* Handle */}
      <mesh position={[0.09, 0, 0]}>
        <torusGeometry args={[0.035, 0.008, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#f0e6d3" roughness={0.9} />
      </mesh>
      {/* Steam particles when done */}
      {step === 'done' && (
        <pointLight position={[0, 0.3, 0]} color="#c8922a" intensity={0.5} distance={1} />
      )}
    </group>
  )
}
```

- [ ] **Step 4: Create RobotBarista.tsx — the main animated robot**

```tsx
'use client'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useCafeState } from '@/lib/cafe-state'
import { CoffeeStep } from '@/types/cafe'

// Target arm positions per coffee step
// [shoulderRotX, shoulderRotZ, forearmRotX, positionX, positionZ]
const ARM_TARGETS: Record<CoffeeStep, { rx: number; rz: number; px: number; pz: number }> = {
  grinding:         { rx: -0.4, rz:  0.6, px: -0.8, pz: -3.3 }, // reach left to grinder
  tamping:          { rx: -0.8, rz:  0.0, px:  0.0, pz: -3.1 }, // press down forward
  pulling_espresso: { rx: -0.3, rz: -0.2, px:  0.8, pz: -3.3 }, // reach right to machine
  steaming_milk:    { rx: -0.5, rz: -0.5, px:  1.1, pz: -3.0 }, // far right steam wand
  pouring:          { rx: -0.6, rz:  0.1, px:  0.0, pz: -3.0 }, // center to cup
  done:             { rx:  0.0, rz:  0.0, px:  0.0, pz: -3.0 }, // rest
}

const REST: { rx: number; rz: number; px: number; pz: number } = { rx: 0, rz: 0, px: 0, pz: -3 }

export function RobotBarista() {
  const { activeAgent, order } = useCafeState()
  const isActive = activeAgent === 'barista'
  const step = order?.coffeeStep

  const bodyRef = useRef<THREE.Group>(null)
  const headRef = useRef<THREE.Mesh>(null)
  const rightArmGroupRef = useRef<THREE.Group>(null)
  const rightUpperRef = useRef<THREE.Mesh>(null)
  const rightForearmRef = useRef<THREE.Mesh>(null)
  const leftEyeRef = useRef<THREE.Mesh>(null)
  const rightEyeRef = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    const target = step ? (ARM_TARGETS[step] ?? REST) : REST

    // Animate right arm shoulder rotation
    if (rightArmGroupRef.current) {
      rightArmGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        rightArmGroupRef.current.rotation.x, target.rx, 0.06
      )
      rightArmGroupRef.current.rotation.z = THREE.MathUtils.lerp(
        rightArmGroupRef.current.rotation.z, target.rz, 0.06
      )
    }

    // Grinding: add oscillation to simulate grinding motion
    if (step === 'grinding' && rightArmGroupRef.current) {
      rightArmGroupRef.current.rotation.x += Math.sin(Date.now() * 0.005) * 0.02
    }

    // Tamping: add press-down pulse
    if (step === 'tamping' && rightArmGroupRef.current) {
      const pulse = Math.sin(Date.now() * 0.004) * 0.04
      rightArmGroupRef.current.position.y = -0.18 + pulse
    } else if (rightArmGroupRef.current) {
      rightArmGroupRef.current.position.y = THREE.MathUtils.lerp(
        rightArmGroupRef.current.position.y, -0.18, 0.06
      )
    }

    // Head bob when active
    if (headRef.current && isActive) {
      headRef.current.position.y = 0.52 + Math.sin(Date.now() * 0.002) * 0.01
    }

    // Body idle sway
    if (bodyRef.current && isActive) {
      bodyRef.current.rotation.y = Math.sin(Date.now() * 0.0008) * 0.05
    }

    // Eye color by state
    const eyeColor = step === 'done'
      ? new THREE.Color('#00ff88')
      : isActive
      ? new THREE.Color('#4a9eff')
      : new THREE.Color('#1a2a3a')

    ;[leftEyeRef, rightEyeRef].forEach((ref) => {
      if (ref.current) {
        const mat = ref.current.material as THREE.MeshStandardMaterial
        mat.emissive.lerp(eyeColor, 0.1)
        mat.emissiveIntensity = isActive ? 0.8 + Math.sin(Date.now() * 0.003) * 0.2 : 0.1
      }
    })
  })

  return (
    <group ref={bodyRef} position={[0, 1.1, -3.6]}>
      {/* === TORSO === */}
      <mesh castShadow>
        <boxGeometry args={[0.38, 0.5, 0.28]} />
        <meshStandardMaterial color="#2a3a4a" metalness={0.85} roughness={0.15} />
      </mesh>
      {/* Chest panel / logo */}
      <mesh position={[0, 0.05, 0.145]}>
        <boxGeometry args={[0.22, 0.18, 0.01]} />
        <meshStandardMaterial
          color="#1a2a3a"
          emissive="#4a9eff"
          emissiveIntensity={isActive ? 0.4 : 0.05}
        />
      </mesh>

      {/* === HEAD === */}
      <mesh ref={headRef} position={[0, 0.52, 0]} castShadow>
        <boxGeometry args={[0.3, 0.28, 0.26]} />
        <meshStandardMaterial color="#2a3a4a" metalness={0.85} roughness={0.15} />
      </mesh>
      {/* Visor */}
      <mesh position={[0, 0.52, 0.135]}>
        <boxGeometry args={[0.24, 0.1, 0.01]} />
        <meshStandardMaterial color="#0a1a2a" emissive="#4a9eff" emissiveIntensity={isActive ? 0.3 : 0.05} />
      </mesh>
      {/* Eyes */}
      <mesh ref={leftEyeRef} position={[-0.07, 0.54, 0.135]}>
        <sphereGeometry args={[0.028, 12, 12]} />
        <meshStandardMaterial color="#4a9eff" emissive="#4a9eff" emissiveIntensity={0.1} />
      </mesh>
      <mesh ref={rightEyeRef} position={[0.07, 0.54, 0.135]}>
        <sphereGeometry args={[0.028, 12, 12]} />
        <meshStandardMaterial color="#4a9eff" emissive="#4a9eff" emissiveIntensity={0.1} />
      </mesh>
      {/* Antenna */}
      <mesh position={[0, 0.72, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.12, 8]} />
        <meshStandardMaterial color="#555" metalness={0.9} />
      </mesh>
      <mesh position={[0, 0.79, 0]}>
        <sphereGeometry args={[0.025]} />
        <meshStandardMaterial
          color="#c8922a"
          emissive="#c8922a"
          emissiveIntensity={isActive ? 0.8 : 0.1}
        />
      </mesh>

      {/* === LEFT ARM (static) === */}
      <group position={[-0.24, 0.1, 0]}>
        <mesh position={[0, -0.14, 0]} castShadow>
          <boxGeometry args={[0.1, 0.28, 0.1]} />
          <meshStandardMaterial color="#2a3a4a" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, -0.32, 0.04]} castShadow>
          <boxGeometry args={[0.09, 0.22, 0.09]} />
          <meshStandardMaterial color="#1a2a3a" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* === RIGHT ARM (animated) === */}
      <group ref={rightArmGroupRef} position={[0.24, -0.18, 0]}>
        {/* Upper arm */}
        <mesh ref={rightUpperRef} position={[0, -0.14, 0]} castShadow>
          <boxGeometry args={[0.1, 0.28, 0.1]} />
          <meshStandardMaterial color="#2a3a4a" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Elbow joint */}
        <mesh position={[0, -0.28, 0]}>
          <sphereGeometry args={[0.055, 10, 10]} />
          <meshStandardMaterial color="#3a4a5a" metalness={0.9} />
        </mesh>
        {/* Forearm */}
        <mesh ref={rightForearmRef} position={[0, -0.44, 0]} castShadow>
          <boxGeometry args={[0.09, 0.22, 0.09]} />
          <meshStandardMaterial color="#1a2a3a" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Hand / gripper */}
        <group position={[0, -0.58, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.13, 0.08, 0.13]} />
            <meshStandardMaterial color="#c8922a" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Gripper fingers */}
          {[-0.04, 0.04].map((x, i) => (
            <mesh key={i} position={[x, -0.06, 0.04]} castShadow>
              <boxGeometry args={[0.03, 0.08, 0.03]} />
              <meshStandardMaterial color="#c8922a" metalness={0.7} roughness={0.3} />
            </mesh>
          ))}
        </group>
      </group>

      {/* Active glow light */}
      {isActive && (
        <pointLight position={[0, 1, 0.3]} color="#4a9eff" intensity={0.8} distance={2.5} />
      )}
    </group>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add components/scene/CoffeeMachine.tsx components/scene/Grinder.tsx components/scene/CoffeeCup.tsx components/scene/RobotBarista.tsx
git commit -m "feat: 3D robot barista with animated arm + coffee machine + grinder + cup"
```

---

## Task 6: CafeScene3D — Main Canvas

**Files:**
- Create: `components/scene/CafeScene3D.tsx`

- [ ] **Step 1: Create CafeScene3D.tsx**

```tsx
'use client'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import { Suspense } from 'react'
import { CafeEnvironment } from './CafeEnvironment'
import { BarCounter } from './BarCounter'
import { RobotBarista } from './RobotBarista'
import { CoffeeMachine } from './CoffeeMachine'
import { Grinder } from './Grinder'
import { CoffeeCup } from './CoffeeCup'
import { ReceptionDesk } from './ReceptionDesk'
import { PaymentTerminal } from './PaymentTerminal'
import { useCafeState } from '@/lib/cafe-state'

interface Props {
  allowOrbit?: boolean
}

export function CafeScene3D({ allowOrbit = true }: Props) {
  const { viewMode } = useCafeState()

  // Camera position: god view = elevated angle, customer view = eye level
  const cameraPos: [number, number, number] = viewMode === 'god'
    ? [0, 6, 9]
    : [0, 2.2, 7]

  return (
    <Canvas
      shadows
      camera={{ position: cameraPos, fov: 50, near: 0.1, far: 100 }}
      style={{ background: '#0d0805' }}
    >
      <Suspense fallback={null}>
        <CafeEnvironment />
        <BarCounter />
        <RobotBarista />
        <CoffeeMachine />
        <Grinder />
        <CoffeeCup />
        <ReceptionDesk />
        <PaymentTerminal />

        {allowOrbit && viewMode === 'god' && (
          <OrbitControls
            target={[0, 1, -2]}
            maxPolarAngle={Math.PI / 2.2}
            minDistance={4}
            maxDistance={16}
            enablePan={false}
          />
        )}
      </Suspense>
    </Canvas>
  )
}
```

- [ ] **Step 2: Verify 3D scene renders**

```bash
npm run dev
```

Open http://localhost:3000 — expected: dark 3D cafe with counter, robot, machines. You can drag to orbit in god view.

- [ ] **Step 3: Commit**

```bash
git add components/scene/CafeScene3D.tsx
git commit -m "feat: R3F Canvas with full 3D cafe scene assembled"
```

---

## Task 7: Customer Mode — Chat Panel

**Files:**
- Create: `components/customer/MessageBubble.tsx`
- Create: `components/customer/AgentChat.tsx`
- Create: `components/customer/CustomerMode.tsx`

- [ ] **Step 1: Create MessageBubble.tsx**

```tsx
'use client'
import { motion } from 'framer-motion'
import { Message } from '@/types/cafe'

const AGENT_COLORS: Record<string, string> = {
  receptionist: '#c8922a',
  barista: '#4a9eff',
  payment: '#4a7c59',
}

const AGENT_NAMES: Record<string, string> = {
  receptionist: 'MIA',
  barista: 'ROBO-1',
  payment: 'PAY-BOT',
}

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  const color = message.agentRole ? AGENT_COLORS[message.agentRole] : '#7a5c3a'
  const name = message.agentRole ? AGENT_NAMES[message.agentRole] : 'YOU'

  const display = message.content
    .replace(/\[ORDER_CONFIRMED:[^\]]+\]/g, '')
    .replace(/\[STEP:\w+\]/g, '')
    .replace(/\[PAYMENT_COMPLETE\]/g, '')
    .trim()

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}
    >
      <span className="text-xs font-bold px-1" style={{ color }}>
        {name}
      </span>
      <div
        className="max-w-xs px-4 py-2.5 text-sm leading-relaxed"
        style={{
          backgroundColor: isUser ? '#3d2510' : '#1a1208',
          color: '#f0e6d3',
          border: `1px solid ${isUser ? '#5a3820' : color + '30'}`,
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        }}
      >
        {display}
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 2: Create AgentChat.tsx**

```tsx
'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCafeState } from '@/lib/cafe-state'
import { MessageBubble } from './MessageBubble'
import { streamAgentMessage, ChatMessage } from '@/lib/stream-agent'
import { Message, AgentRole } from '@/types/cafe'
import { parseOrderConfirmation } from '@/lib/agents/receptionist'
import { parseCoffeeStep } from '@/lib/agents/barista'
import { parsePaymentComplete, calculateTotal } from '@/lib/agents/payment'

function buildHistory(messages: Message[], role: AgentRole): ChatMessage[] {
  return messages
    .filter((m) => m.agentRole === role || m.role === 'user')
    .map((m) => ({ role: (m.role === 'user' ? 'user' : 'assistant') as const, content: m.content }))
}

export function AgentChat() {
  const store = useCafeState()
  const [input, setInput] = useState('')
  const [streamText, setStreamText] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [store.messages, streamText])

  const callAgent = useCallback(async (role: AgentRole, userText: string, extraHistory?: ChatMessage[]) => {
    if (store.isAgentTyping) return
    store.setAgentTyping(true)
    setStreamText('')

    const history = extraHistory ?? buildHistory(store.messages, role)
    if (userText) history.push({ role: 'user', content: userText })

    let full = ''
    try {
      full = await streamAgentMessage(role, history, (chunk) => {
        setStreamText((p) => p + chunk)
      })
    } finally {
      setStreamText('')
      store.setAgentTyping(false)
    }

    store.addMessage({ id: crypto.randomUUID(), role: 'agent', agentRole: role, content: full, timestamp: Date.now() })

    if (role === 'receptionist') {
      const confirmed = parseOrderConfirmation(full)
      if (confirmed) {
        store.setOrderDetails(confirmed.name, confirmed.items)
        store.updateOrderStage('confirmed')
        store.setActiveAgent('barista')
        setTimeout(() => startBarista(confirmed.items), 600)
      } else {
        store.updateOrderStage('ordering')
      }
    }

    if (role === 'barista') {
      const step = parseCoffeeStep(full)
      if (step === 'done') {
        store.updateOrderStage('coffee_ready')
        store.updateCoffeeStep('done')
        store.setActiveAgent('payment')
        const items = useCafeState.getState().order?.items ?? []
        setTimeout(() => callAgent('payment', `Order complete: ${items.join(', ')}. Calculate total and request payment.`), 700)
      } else if (step) {
        store.updateOrderStage('making_coffee')
        store.updateCoffeeStep(step)
        setTimeout(() => continueBarista(), 2800)
      }
    }

    if (role === 'payment') {
      if (parsePaymentComplete(full)) {
        store.updateOrderStage('complete')
        store.setActiveAgent(null)
        const items = useCafeState.getState().order?.items ?? []
        store.setOrderTotal(calculateTotal(items))
      } else {
        store.updateOrderStage('payment')
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function startBarista(items: string[]) {
    await callAgent('barista', `New order received: ${items.join(', ')}. Begin making the coffee, start with the first step.`, [
      { role: 'user', content: `New order received: ${items.join(', ')}. Begin making the coffee, start with the first step.` },
    ])
  }

  async function continueBarista() {
    const state = useCafeState.getState()
    if (state.order?.stage === 'coffee_ready' || state.order?.stage === 'payment') return
    const history = buildHistory(state.messages, 'barista')
    history.push({ role: 'user', content: 'Continue to the next step.' })
    await callAgent('barista', '', history)
  }

  // Auto-greet
  useEffect(() => {
    const state = useCafeState.getState()
    if (state.order && state.messages.length === 0 && state.activeAgent === 'receptionist') {
      callAgent('receptionist', '', [{ role: 'user', content: 'A customer just walked in. Greet them warmly.' }])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.order?.id])

  async function handleSend() {
    if (!input.trim() || !store.activeAgent || store.isAgentTyping) return
    const text = input.trim()
    setInput('')
    store.addMessage({ id: crypto.randomUUID(), role: 'user', content: text, timestamp: Date.now() })
    await callAgent(store.activeAgent, text)
  }

  const agentName = store.activeAgent === 'receptionist' ? 'MIA'
    : store.activeAgent === 'barista' ? 'ROBO-1'
    : store.activeAgent === 'payment' ? 'PAY-BOT' : null

  const canType = !!store.activeAgent
    && store.order?.stage !== 'making_coffee'
    && store.order?.stage !== 'complete'
    && store.order?.stage !== 'confirmed'

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#0a0603', borderLeft: '1px solid #2a1a0d' }}>
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #2a1a0d' }}>
        <div>
          <div className="font-bold text-sm" style={{ color: '#f5d07a' }}>Brew & Bits</div>
          {agentName && <div className="text-xs mt-0.5" style={{ color: '#c8922a' }}>with {agentName}</div>}
        </div>
        {store.order?.stage === 'complete' && (
          <div className="text-xs px-3 py-1 rounded-full font-bold" style={{ backgroundColor: '#4a7c59', color: '#fff' }}>
            ✓ DONE
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {store.messages.map((m) => <MessageBubble key={m.id} message={m} />)}
        </AnimatePresence>

        {/* Streaming bubble */}
        {streamText && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-1 items-start">
            <span className="text-xs font-bold px-1" style={{ color: '#c8922a' }}>{agentName}</span>
            <div className="max-w-xs px-4 py-2.5 text-sm leading-relaxed"
              style={{ backgroundColor: '#1a1208', color: '#f0e6d3', border: '1px solid rgba(200,146,42,0.2)', borderRadius: '16px 16px 16px 4px' }}>
              {streamText.replace(/\[ORDER_CONFIRMED:[^\]]+\]/g, '').replace(/\[STEP:\w+\]/g, '').replace(/\[PAYMENT_COMPLETE\]/g, '')}
              <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.5 }}>▋</motion.span>
            </div>
          </motion.div>
        )}

        {store.isAgentTyping && !streamText && (
          <div className="flex gap-1 px-2">
            {[0,1,2].map((i) => (
              <motion.div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: '#c8922a' }}
                animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }} />
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="p-4" style={{ borderTop: '1px solid #2a1a0d' }}>
        {canType ? (
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={`Say something...`}
              disabled={store.isAgentTyping}
              className="flex-1 px-4 py-2 rounded-full text-sm outline-none disabled:opacity-40"
              style={{ backgroundColor: '#1a1208', color: '#f0e6d3', border: '1px solid #2a1a0d' }}
            />
            <button onClick={handleSend} disabled={store.isAgentTyping || !input.trim()}
              className="w-10 h-10 rounded-full font-bold flex items-center justify-center disabled:opacity-40"
              style={{ backgroundColor: '#c8922a', color: '#0d0805' }}>
              ↑
            </button>
          </div>
        ) : store.order?.stage === 'making_coffee' ? (
          <p className="text-xs text-center" style={{ color: '#7a5c3a' }}>☕ ROBO-1 is making your coffee...</p>
        ) : store.order?.stage === 'complete' ? (
          <p className="text-xs text-center" style={{ color: '#4a7c59' }}>Thanks for visiting! Come back soon ✨</p>
        ) : (
          <p className="text-xs text-center" style={{ color: '#5a3820' }}>Click "Enter Cafe" to start</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create CustomerMode.tsx**

```tsx
'use client'
import { CafeScene3D } from '@/components/scene/CafeScene3D'
import { AgentChat } from './AgentChat'

export function CustomerMode() {
  return (
    <div className="w-full h-full flex">
      <div className="flex-1">
        <CafeScene3D allowOrbit={false} />
      </div>
      <div className="w-96 flex-shrink-0">
        <AgentChat />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add components/customer/
git commit -m "feat: customer mode with chat panel and streaming GPT-4o agents"
```

---

## Task 8: UI Overlays + Root Assembly

**Files:**
- Create: `components/ui/ViewToggle.tsx`
- Create: `components/ui/OrderStatusBar.tsx`
- Create: `components/CafeApp.tsx`
- Modify: `app/page.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Create ViewToggle.tsx**

```tsx
'use client'
import { motion } from 'framer-motion'
import { useCafeState } from '@/lib/cafe-state'

export function ViewToggle() {
  const { viewMode, setViewMode, startOrder, order, resetCafe } = useCafeState()

  return (
    <div className="absolute top-5 right-5 z-10 flex flex-col items-end gap-2">
      <div className="flex rounded-full p-1 gap-1" style={{ backgroundColor: 'rgba(26,15,10,0.85)', border: '1px solid #3d2510', backdropFilter: 'blur(8px)' }}>
        {(['god', 'customer'] as const).map((mode) => (
          <button key={mode} onClick={() => setViewMode(mode)}
            className="px-4 py-1.5 rounded-full text-xs font-bold transition-all"
            style={{
              backgroundColor: viewMode === mode ? '#c8922a' : 'transparent',
              color: viewMode === mode ? '#0d0805' : '#7a5c3a',
            }}>
            {mode === 'god' ? '👁 GOD VIEW' : '🚶 CUSTOMER'}
          </button>
        ))}
      </div>

      {viewMode === 'customer' && (
        <motion.button
          initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
          onClick={order ? resetCafe : startOrder}
          className="px-5 py-2 rounded-full text-sm font-bold"
          style={{
            backgroundColor: order ? 'rgba(26,15,10,0.85)' : '#c8922a',
            color: order ? '#f0e6d3' : '#0d0805',
            border: `1px solid ${order ? '#5a3820' : '#c8922a'}`,
            backdropFilter: 'blur(8px)',
          }}>
          {order ? '↩ Reset' : '☕ Enter Cafe'}
        </motion.button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create OrderStatusBar.tsx**

```tsx
'use client'
import { motion } from 'framer-motion'
import { useCafeState } from '@/lib/cafe-state'
import { OrderStage } from '@/types/cafe'

const STAGES: { key: OrderStage; label: string }[] = [
  { key: 'greeting', label: 'Welcome' },
  { key: 'ordering', label: 'Order' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'making_coffee', label: 'Brewing' },
  { key: 'coffee_ready', label: 'Ready' },
  { key: 'payment', label: 'Payment' },
  { key: 'complete', label: '✓ Done' },
]

export function OrderStatusBar() {
  const { order } = useCafeState()
  if (!order || order.stage === 'idle') return null
  const idx = STAGES.findIndex((s) => s.key === order.stage)

  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1"
      style={{ backdropFilter: 'blur(8px)' }}>
      {STAGES.map((s, i) => (
        <div key={s.key} className="flex items-center">
          <motion.div
            className="px-3 py-1 rounded-full text-xs font-bold"
            style={{
              backgroundColor: i === idx ? '#c8922a' : i < idx ? '#4a7c59' : 'rgba(26,15,10,0.8)',
              color: i <= idx ? '#fff' : '#5a3820',
              border: `1px solid ${i === idx ? '#c8922a' : i < idx ? '#4a7c59' : '#3d2510'}`,
            }}
            animate={i === idx ? { scale: [1, 1.06, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            {s.label}
          </motion.div>
          {i < STAGES.length - 1 && (
            <div className="w-3 h-px mx-0.5" style={{ backgroundColor: i < idx ? '#4a7c59' : '#3d2510' }} />
          )}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Create CafeApp.tsx**

```tsx
'use client'
import { useCafeState } from '@/lib/cafe-state'
import { CafeScene3D } from './scene/CafeScene3D'
import { CustomerMode } from './customer/CustomerMode'
import { ViewToggle } from './ui/ViewToggle'
import { OrderStatusBar } from './ui/OrderStatusBar'

export function CafeApp() {
  const { viewMode } = useCafeState()

  return (
    <div className="w-screen h-screen overflow-hidden relative">
      {viewMode === 'god' ? <CafeScene3D allowOrbit={true} /> : <CustomerMode />}
      <ViewToggle />
      <OrderStatusBar />
    </div>
  )
}
```

- [ ] **Step 4: Update app/page.tsx**

```tsx
import { CafeApp } from '@/components/CafeApp'

export default function Home() {
  return <CafeApp />
}
```

- [ ] **Step 5: Update app/layout.tsx**

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Brew & Bits — Autonomous Cafe',
  description: 'Fully autonomous 3D AI cafe simulation',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 6: Final build and full test**

```bash
npm run build
```

Expected: Build completes with no type errors.

Manual test flow:
1. Open http://localhost:3000 — god view 3D cafe renders, can orbit with mouse
2. Click "CUSTOMER" → "Enter Cafe"
3. Chat opens, Mia greets you
4. Say your name and order a latte
5. Watch: Mia confirms → ROBO-1 takes over → **robot arm swings to grinder, grinder spins** → arm moves to tamp → arm reaches machine lever (lever animates) → arm moves to steam wand → cup fills with liquid → arm swings to cup, pours → coffee done, cup glows
6. PAY-BOT shows total, payment completes
7. Status bar tracks every stage

- [ ] **Step 7: Final commit**

```bash
git add components/CafeApp.tsx components/ui/ app/page.tsx app/layout.tsx
git commit -m "feat: root assembly — 3D cafe, agents, robot animation all connected"
```

---

## Build Order Summary

1. Task 1 — Setup (skeleton)
2. Task 2 — Types + state (data model)
3. Task 3 — OpenAI API + 3 agents (AI brain)
4. Task 4 — 3D cafe environment (world)
5. Task 5 — Robot with animated arm (star of the show)
6. Task 6 — R3F Canvas (scene assembled)
7. Task 7 — Chat panel (customer interaction)
8. Task 8 — UI overlays + root wiring

## What Breaks First

- **`OPENAI_API_KEY` missing** — agents 500 silently. Check `.env.local` first.
- **Robot arm overshoots** — if lerp speed (0.06) feels too fast/slow, tune it in `RobotBarista.tsx` `useFrame`
- **Barista step loop stalls** — if GPT-4o doesn't include `[STEP:xxx]` tag, `continueBarista()` won't advance. The barista system prompt enforces this strictly, but if it breaks, add a timeout fallback.
- **Three.js SSR** — Next.js may try to render R3F on server. If you see "document is not defined", add `'use client'` to `CafeScene3D.tsx` (already there) and ensure `dynamic` import isn't needed. The `transpilePackages: ['three']` in `next.config.ts` handles most cases.

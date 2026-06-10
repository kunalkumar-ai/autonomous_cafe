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

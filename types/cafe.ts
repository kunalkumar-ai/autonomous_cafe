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

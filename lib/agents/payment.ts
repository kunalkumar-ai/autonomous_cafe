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

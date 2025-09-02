export function calculateTransferFee(amount: number): number {
  if (amount <= 100000) return 0;
  if (amount <= 500000) return 100;
  return 200;
}
export function calculateCashInFee(amount: number): number {
  if (!Number.isInteger(amount) || amount < 0) {
    throw new Error("amount must be a non-negative integer");
  }
  if (amount <= 100_000) return 0;
  // 0.1% = 0.001
  return Math.floor(amount * 0.001);
}

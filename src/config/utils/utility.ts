import type { Transfer } from "../../models/transfer.model";

export function validateTransferPayload(item: Transfer) {
  const amount = Number(item.amount);

  if (!item) return "Invalid transfer item";
  if (!item.fromUserId) return "fromUserId required";
  if (!item.toUserId) return "toUserId required";
  if (!Number.isInteger(amount) || amount <= 0)
    return "amount must be a positive integer";
  if (item.fromUserId === item.toUserId) return "SELF_TRANSFER_NOT_ALLOWED";
  return null;
}

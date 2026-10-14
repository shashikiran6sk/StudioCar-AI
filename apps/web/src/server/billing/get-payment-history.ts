import { getWebDatabase } from "../db/web-database";
import { PrismaPaymentHistoryRepository } from "../db/repositories/payment-history-repository";

/** Read-only history remains available independently of payment-provider keys. */
export function getPaymentHistory(userId: string) {
  return new PrismaPaymentHistoryRepository(getWebDatabase()).findForUser(userId);
}

/** Bounded stage names; never use customer input as a timing key. */
export enum PerformanceStage {
  AUTHENTICATION = "authentication",
  RATE_LIMIT = "rateLimit",
  ENTITLEMENTS = "entitlements",
  RESERVATION = "reservation",
  RESERVATION_TRANSACTION = "reservationTransaction",
  OUTBOX_CREATION = "outboxCreation",
  DISPATCH = "dispatch",
  OUTBOX_CLAIM = "outboxClaim",
  SQS_PUBLICATION = "sqsPublication",
  PUBLICATION_BOOKKEEPING = "publicationBookkeeping",
}

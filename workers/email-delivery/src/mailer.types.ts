export interface MailRequest {
  html: string;
  idempotencyKey: string;
  recipient: string;
  subject: string;
  text: string;
}

export type MailDeliveryResult =
  | { kind: "DELIVERED"; providerMessageId: string }
  | { errorCode: string; kind: "FAILED"; retryable: boolean };

export interface MailerPort {
  send(request: MailRequest): Promise<MailDeliveryResult>;
}

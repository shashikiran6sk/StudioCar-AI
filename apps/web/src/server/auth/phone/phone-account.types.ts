import type { ActiveSession, PreparedSession } from "../session-service";

export interface VerifiedPhone {
  phoneNumber: string;
  expiresAt: Date;
}

export interface VerifiedPhoneQuery {
  challengeId: string;
  browserBindingHash: string;
  now: Date;
}

export interface CreatePhoneAccountCommand extends VerifiedPhoneQuery {
  displayName: string;
  session: PreparedSession;
}

export type CreatePhoneAccountResult =
  | { kind: "CREATED"; session: ActiveSession }
  | { kind: "INVALID_VERIFICATION" }
  | { kind: "PHONE_TAKEN" };

export interface PhoneAccountRepositoryPort {
  findVerified(query: VerifiedPhoneQuery): Promise<VerifiedPhone | null>;
  createAccount(command: CreatePhoneAccountCommand): Promise<CreatePhoneAccountResult>;
}

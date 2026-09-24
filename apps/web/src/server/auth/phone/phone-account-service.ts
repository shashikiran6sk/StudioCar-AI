import { UpdateProfileSchema, type UpdateProfile } from "@studiocar/contracts";

import { hashAuthSecret } from "../hash-auth-secret";
import type { IssuedSession, SessionService } from "../session-service";
import type {
  PhoneAccountRepositoryPort,
  VerifiedPhone,
} from "./phone-account.types";

export type PhoneAccountCreationResult =
  | { kind: "CREATED"; issuedSession: IssuedSession }
  | { kind: "INVALID_VERIFICATION" }
  | { kind: "PHONE_TAKEN" };

export class PhoneAccountService {
  public constructor(
    private readonly accounts: PhoneAccountRepositoryPort,
    private readonly sessions: Pick<SessionService, "prepareIssue">,
    private readonly now: () => Date = () => new Date(),
  ) {}

  public findVerified(
    challengeId: string,
    browserBinding: string,
  ): Promise<VerifiedPhone | null> {
    return this.accounts.findVerified({
      challengeId,
      browserBindingHash: hashAuthSecret(browserBinding),
      now: this.now(),
    });
  }

  public async createAccount(
    challengeId: string,
    browserBinding: string,
    input: UpdateProfile,
  ): Promise<PhoneAccountCreationResult> {
    const validated = UpdateProfileSchema.parse(input);
    const prepared = this.sessions.prepareIssue();
    const result = await this.accounts.createAccount({
      challengeId,
      browserBindingHash: hashAuthSecret(browserBinding),
      now: this.now(),
      displayName: validated.displayName,
      session: prepared,
    });
    if (result.kind !== "CREATED") return result;
    return {
      kind: "CREATED",
      issuedSession: {
        token: prepared.token,
        expiresAt: prepared.expiresAt,
        session: result.session,
      },
    };
  }
}

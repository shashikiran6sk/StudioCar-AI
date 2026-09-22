import { normalizeAdminEmail } from "./normalize-admin-email";
import type { AdminBootstrapOutcome } from "../db/repositories/admin-bootstrap-repository";

export interface AdminBootstrapStore {
  bootstrap(userId: string, now: Date): Promise<AdminBootstrapOutcome>;
}

export interface AdminInvitationStore {
  acceptForVerifiedEmail(command: {
    userId: string;
    email: string;
    now: Date;
  }): Promise<boolean>;
}

export interface AdminBootstrapServiceOptions {
  bootstrapEmail: string | undefined;
}

/**
 * Decides what administrator access a completed Google sign-in should confer.
 *
 * It accepts a pending invitation for the verified address, and otherwise
 * decides whether this sign-in should create the first administrator.
 *
 * It grants only when a configured email matches an email Google itself
 * verified. It never grants because an address appeared in a request, because
 * somebody typed one, or because a phone-only profile happens to hold one.
 */
export class AdminBootstrapService {
  public constructor(
    private readonly store: AdminBootstrapStore,
    private readonly invitations: AdminInvitationStore,
    private readonly options: AdminBootstrapServiceOptions,
  ) {}

  public async evaluate(
    userId: string,
    verifiedEmail: string,
    now: Date,
  ): Promise<AdminBootstrapOutcome | null> {
    /**
     * A pending invitation is accepted here because this is the only moment
     * that carries both a Google-verified address and a resolved internal user.
     * It is checked first, so an invited administrator is granted even on a
     * database where bootstrap already completed.
     */
    const accepted = await this.invitations.acceptForVerifiedEmail({
      userId,
      email: normalizeAdminEmail(verifiedEmail),
      now,
    });
    if (accepted) return { kind: "BOOTSTRAPPED" };

    const configured = this.options.bootstrapEmail;
    if (!configured) return null;
    if (normalizeAdminEmail(configured) !== normalizeAdminEmail(verifiedEmail)) {
      return null;
    }

    return this.store.bootstrap(userId, now);
  }
}

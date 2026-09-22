import { normalizeAdminEmail } from "./normalize-admin-email";
import type { AdminBootstrapOutcome } from "../db/repositories/admin-bootstrap-repository";

export interface AdminBootstrapStore {
  bootstrap(userId: string, now: Date): Promise<AdminBootstrapOutcome>;
}

export interface AdminBootstrapServiceOptions {
  bootstrapEmail: string | undefined;
}

/**
 * Decides whether a completed Google sign-in should create the first
 * administrator.
 *
 * It grants only when a configured email matches an email Google itself
 * verified. It never grants because an address appeared in a request, because
 * somebody typed one, or because a phone-only profile happens to hold one.
 */
export class AdminBootstrapService {
  public constructor(
    private readonly store: AdminBootstrapStore,
    private readonly options: AdminBootstrapServiceOptions,
  ) {}

  public async evaluate(
    userId: string,
    verifiedEmail: string,
    now: Date,
  ): Promise<AdminBootstrapOutcome | null> {
    const configured = this.options.bootstrapEmail;
    if (!configured) return null;
    if (normalizeAdminEmail(configured) !== normalizeAdminEmail(verifiedEmail)) {
      return null;
    }

    return this.store.bootstrap(userId, now);
  }
}

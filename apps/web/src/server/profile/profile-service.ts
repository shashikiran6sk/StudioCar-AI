import type {
  AccountProfile,
  AuthUser,
  UpdateProfile,
} from "@studiocar/contracts";

import type { ProfileRepositoryPort } from "./profile.types";

export interface ProfileServiceOptions {
  now?: () => Date;
}

export class ProfileService {
  private readonly now: () => Date;

  public constructor(
    private readonly profiles: ProfileRepositoryPort,
    options: ProfileServiceOptions = {},
  ) {
    this.now = options.now ?? (() => new Date());
  }

  public get(userId: string): Promise<AccountProfile | null> {
    return this.profiles.findByUserId(userId, this.now());
  }

  public update(
    userId: string,
    command: UpdateProfile,
  ): Promise<AuthUser | null> {
    return this.profiles.updateDisplayName(userId, command.displayName);
  }
}

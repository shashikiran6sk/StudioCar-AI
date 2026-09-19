import type {
  AccountProfile,
  AuthUser,
  UpdateProfile,
} from "@studiocar/contracts";

export interface ProfileRepositoryPort {
  findByUserId(userId: string, now: Date): Promise<AccountProfile | null>;
  updateDisplayName(
    userId: string,
    displayName: string,
  ): Promise<AuthUser | null>;
}

export interface ProfileApplication {
  get(userId: string): Promise<AccountProfile | null>;
  update(userId: string, command: UpdateProfile): Promise<AuthUser | null>;
}

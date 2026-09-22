export interface AccountIdentity {
  displayName: string | null;
  email: string | null;
  phoneNumber: string | null;
  userId: string;
}

/**
 * Names an account the way an administrator would recognise it.
 *
 * Falls back through the values an account actually has, ending at the
 * identifier, so a row is never rendered as an empty space.
 */
export function describeAccountName(account: AccountIdentity): string {
  return (
    account.displayName ?? account.email ?? account.phoneNumber ?? account.userId
  );
}

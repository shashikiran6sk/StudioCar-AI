import { requireAdministrator } from "../../../../server/admin/require-administrator";
import { getAdminManagementRepository } from "../../../../server/admin/admin-management-runtime";
import { getAdminRoleRepository } from "../../../../server/admin/admin-runtime";
import { AdministratorList } from "../../../../features/admin/administrator-list";
import { AdministratorInviteList } from "../../../../features/admin/administrator-invite-list";
import { GrantAdministratorForm } from "../../../../features/admin/grant-administrator-form";
import {
  ADMINS_DESCRIPTION,
  ADMINS_EYEBROW,
  ADMINS_TITLE,
} from "../../../../server/admin/admin.constants";

export const dynamic = "force-dynamic";

export default async function AdministratorsPage() {
  const session = await requireAdministrator();
  const [administrators, invites] = await Promise.all([
    getAdminRoleRepository().listAdministrators(),
    getAdminManagementRepository().listPendingInvites(),
  ]);

  return (
    <>
      <header className="app-page-header">
        <div>
          <p className="eyebrow">{ADMINS_EYEBROW}</p>
          <h1>{ADMINS_TITLE}</h1>
          <p>{ADMINS_DESCRIPTION}</p>
        </div>
      </header>
      <GrantAdministratorForm />
      <AdministratorList
        administrators={administrators.map((administrator) => ({
          ...administrator,
          grantedAt: administrator.grantedAt.toISOString(),
        }))}
        currentUserId={session.userId}
        onlyAdministrator={administrators.length <= 1}
      />
      <AdministratorInviteList
        invites={invites.map((invite) => ({
          ...invite,
          createdAt: invite.createdAt.toISOString(),
          expiresAt: invite.expiresAt.toISOString(),
        }))}
      />
    </>
  );
}

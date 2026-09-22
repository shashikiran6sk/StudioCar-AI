import { notFound, redirect } from "next/navigation";

import { LOGIN_PATH } from "../../../app-routes";
import { ProfileDetailsCard } from "../../../../features/profile/profile-details-card";
import { ProfileIdentitiesCard } from "../../../../features/profile/profile-identities-card";
import { ProfileSecurityCard } from "../../../../features/profile/profile-security-card";
import { getCurrentSession } from "../../../../server/auth/get-current-session";
import { getProfileService } from "../../../../server/profile/profile-runtime";
import { PROFILE_GOOGLE_LINKED_MESSAGE } from "../../../../features/profile/profile.constants";

const PAGE_EYEBROW = "Account";
const PAGE_TITLE = "Profile & security";
const PAGE_DESCRIPTION =
  "Manage your account details, sign-in methods, and active sessions.";

export interface ProfilePageProps {
  searchParams: Promise<{ linked?: string }>;
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const session = await getCurrentSession();
  if (!session) redirect(LOGIN_PATH);

  const { linked } = await searchParams;

  const profile = await getProfileService().get(session.userId);
  if (!profile) notFound();

  return (
    <div className="profile-page">
      <header className="app-page-header">
        <div>
          <p className="eyebrow">{PAGE_EYEBROW}</p>
          <h1>{PAGE_TITLE}</h1>
          <p>{PAGE_DESCRIPTION}</p>
        </div>
      </header>
      <div className="profile-grid">
        <ProfileDetailsCard user={profile.user} />
        <ProfileIdentitiesCard
          identities={profile.identities}
          {...(linked === "google"
            ? { notice: PROFILE_GOOGLE_LINKED_MESSAGE }
            : {})}
        />
        <ProfileSecurityCard
          activeSessionCount={profile.activeSessionCount}
          currentSessionExpiresAt={session.expiresAt}
        />
      </div>
    </div>
  );
}

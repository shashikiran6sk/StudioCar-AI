import { ButtonLink } from "@studiocar/ui";
import { redirect } from "next/navigation";

import { DASHBOARD_PATH } from "../../app-routes";
import { AuthCard } from "../../../features/auth/auth-card";
import { createGoogleAuthStartHref } from "../../../features/auth/create-google-auth-start-href";
import { getAuthReturnPath } from "../../../features/auth/get-auth-return-path";
import { PhoneSignInForm } from "../../../features/auth/phone-sign-in-form";
import { getCurrentSession } from "../../../server/auth/get-current-session";

const LOGIN_DESCRIPTION =
  "Use Google or your verified phone number to continue to your vehicle workspace.";
const AUTH_TERMS =
  "By continuing, you agree to secure account verification for StudioCar AI.";
const LOGIN_TITLE = "Sign in to StudioCar AI";
const GOOGLE_BUTTON_LABEL = "Continue with Google";
const GOOGLE_MARK = "G";
const AUTH_DIVIDER_LABEL = "or";

export interface LoginPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getCurrentSession();
  if (session) redirect(DASHBOARD_PATH);

  const query = await searchParams;
  const returnTo = getAuthReturnPath(query.returnTo);

  return (
    <AuthCard
      description={LOGIN_DESCRIPTION}
      footer={<p>{AUTH_TERMS}</p>}
      title={LOGIN_TITLE}
    >
      <ButtonLink
        className="auth-card__google"
        href={createGoogleAuthStartHref(returnTo)}
      >
        <span aria-hidden="true" className="auth-card__google-mark">
          {GOOGLE_MARK}
        </span>
        {GOOGLE_BUTTON_LABEL}
      </ButtonLink>
      <div className="auth-divider">
        <span>{AUTH_DIVIDER_LABEL}</span>
      </div>
      <PhoneSignInForm returnTo={returnTo} />
    </AuthCard>
  );
}

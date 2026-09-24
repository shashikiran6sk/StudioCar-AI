import { redirect } from "next/navigation";

import { DASHBOARD_PATH } from "../../app-routes";
import { AuthCard } from "../../../features/auth/auth-card";
import { getAuthReturnPath } from "../../../features/auth/get-auth-return-path";
import { PhoneSignInForm } from "../../../features/auth/phone-sign-in-form";
import { getCurrentSession } from "../../../server/auth/get-current-session";
import { getVerifiedPhoneForBrowser } from "../../../server/auth/phone/get-verified-phone-for-browser";

const LOGIN_DESCRIPTION =
  "Use Google or your verified phone number to continue to your vehicle workspace.";
const AUTH_TERMS =
  "By continuing, you agree to secure account verification for StudioCar AI.";
const LOGIN_TITLE = "Sign in to StudioCar AI";

export interface LoginPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getCurrentSession();
  if (session) redirect(DASHBOARD_PATH);

  const query = await searchParams;
  const returnTo = getAuthReturnPath(query.returnTo);
  const verifiedPhone = await getVerifiedPhoneForBrowser();
  const phoneSetupError =
    typeof query.phoneSetup === "string" ? query.phoneSetup : null;

  return (
    <AuthCard
      description={LOGIN_DESCRIPTION}
      footer={<p>{AUTH_TERMS}</p>}
      title={LOGIN_TITLE}
    >
      <PhoneSignInForm
        initialVerifiedPhone={verifiedPhone}
        phoneSetupError={phoneSetupError}
        returnTo={returnTo}
      />
    </AuthCard>
  );
}

import { ButtonLink } from "@studiocar/ui";

import { LOGIN_PATH } from "../../../app-routes";
import { AuthCard } from "../../../../features/auth/auth-card";
import { googleAuthErrorMessage } from "../../../../features/auth/google-auth-error-message";

const ERROR_DESCRIPTION =
  "Your account remains secure and no session was created.";
const ERROR_TITLE = "We could not sign you in";
const RETURN_TO_LOGIN_LABEL = "Return to sign in";

export interface AuthErrorPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AuthErrorPage({
  searchParams,
}: AuthErrorPageProps) {
  const query = await searchParams;
  const code = Array.isArray(query.code) ? query.code[0] : query.code;

  return (
    <AuthCard
      description={ERROR_DESCRIPTION}
      title={ERROR_TITLE}
    >
      <div className="auth-error" role="alert">
        {googleAuthErrorMessage(code)}
      </div>
      <ButtonLink href={LOGIN_PATH} variant="primary">
        {RETURN_TO_LOGIN_LABEL}
      </ButtonLink>
    </AuthCard>
  );
}

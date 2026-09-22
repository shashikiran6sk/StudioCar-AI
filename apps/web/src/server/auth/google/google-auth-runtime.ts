import {
  parseAdminBootstrapEnvironment,
  parseGoogleAuthEnvironment,
} from "@studiocar/config";
import { createDatabaseClient } from "@studiocar/database-runtime";
import { PrismaAdminBootstrapRepository } from "../../db/repositories/admin-bootstrap-repository";
import { PrismaAuthIdentityLinkRepository } from "../../db/repositories/auth-identity-link-repository";
import { AdminBootstrapService } from "../../admin/admin-bootstrap-service";
import { PrismaGoogleIdentityRepository } from "../../db/repositories/google-identity-repository";
import { PrismaGoogleOAuthChallengeRepository } from "../../db/repositories/google-oauth-challenge-repository";
import { PrismaSessionRepository } from "../../db/repositories/session-repository";

import { OAuthChallengeProtector } from "../oauth-challenge-protector";
import { SessionService } from "../session-service";
import type { GoogleOAuthApplication } from "./google-auth.types";
import { GoogleOAuthService } from "./google-oauth-service";
import { GoogleOpenIdProvider } from "./google-openid-provider";

let googleOAuthApplication: GoogleOAuthApplication | undefined;

export function getGoogleOAuthApplication(): GoogleOAuthApplication {
  if (googleOAuthApplication) return googleOAuthApplication;

  const environment = parseGoogleAuthEnvironment(process.env);
  const database = createDatabaseClient({
    connectionString: environment.DATABASE_URL,
  });
  const challenges = new PrismaGoogleOAuthChallengeRepository(database);
  const identities = new PrismaGoogleIdentityRepository(database);
  const provider = new GoogleOpenIdProvider({
    clientId: environment.GOOGLE_CLIENT_ID,
    clientSecret: environment.GOOGLE_CLIENT_SECRET,
    redirectUri: environment.GOOGLE_REDIRECT_URI,
  });
  const protector = new OAuthChallengeProtector(environment.SESSION_SECRET);
  const sessions = new SessionService(new PrismaSessionRepository(database));

  googleOAuthApplication = new GoogleOAuthService(
    challenges,
    identities,
    new PrismaAuthIdentityLinkRepository(database),
    provider,
    protector,
    sessions,
    new AdminBootstrapService(new PrismaAdminBootstrapRepository(database), {
      bootstrapEmail: parseAdminBootstrapEnvironment(process.env)
        .BOOTSTRAP_ADMIN_EMAIL,
    }),
    { challengeTtlSeconds: environment.OAUTH_CHALLENGE_TTL_SECONDS },
  );

  return googleOAuthApplication;
}

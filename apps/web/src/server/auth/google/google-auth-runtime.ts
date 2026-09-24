import {
  parseAdminBootstrapEnvironment,
  parseGoogleAuthEnvironment,
} from "@studiocar/config";
import { createDatabaseClient } from "@studiocar/database-runtime";
import { PrismaAdminBootstrapRepository } from "../../db/repositories/admin-bootstrap-repository";
import { PrismaAdminManagementRepository } from "../../db/repositories/admin-management-repository";
import { PrismaAuthIdentityLinkRepository } from "../../db/repositories/auth-identity-link-repository";
import { AdminBootstrapService } from "../../admin/admin-bootstrap-service";
import { PrismaGoogleIdentityRepository } from "../../db/repositories/google-identity-repository";
import { PrismaGoogleOAuthChallengeRepository } from "../../db/repositories/google-oauth-challenge-repository";
import { PrismaSessionRepository } from "../../db/repositories/session-repository";
import { PrismaPhoneAccountRepository } from "../../db/repositories/phone-account-repository";
import { PrismaVerifiedPhoneGoogleRepository } from "../../db/repositories/verified-phone-google-repository";

import { OAuthChallengeProtector } from "../oauth-challenge-protector";
import { SessionService } from "../session-service";
import type { GoogleOAuthApplication } from "./google-auth.types";
import { createGoogleIdentityProvider } from "./create-google-identity-provider";
import { GoogleOAuthService } from "./google-oauth-service";

let googleOAuthApplication: GoogleOAuthApplication | undefined;

export function getGoogleOAuthApplication(): GoogleOAuthApplication {
  if (googleOAuthApplication) return googleOAuthApplication;

  const environment = parseGoogleAuthEnvironment(process.env);
  const database = createDatabaseClient({
    connectionString: environment.DATABASE_URL,
  });
  const challenges = new PrismaGoogleOAuthChallengeRepository(database);
  const identities = new PrismaGoogleIdentityRepository(database);
  const provider = createGoogleIdentityProvider(environment);
  const protector = new OAuthChallengeProtector(environment.SESSION_SECRET);
  const sessions = new SessionService(new PrismaSessionRepository(database));

  googleOAuthApplication = new GoogleOAuthService(
    challenges,
    identities,
    new PrismaAuthIdentityLinkRepository(database),
    provider,
    protector,
    sessions,
    new AdminBootstrapService(
      new PrismaAdminBootstrapRepository(database),
      new PrismaAdminManagementRepository(database),
      {
        bootstrapEmail: parseAdminBootstrapEnvironment(process.env)
          .BOOTSTRAP_ADMIN_EMAIL,
      },
    ),
    new PrismaPhoneAccountRepository(database),
    new PrismaVerifiedPhoneGoogleRepository(database),
    { challengeTtlSeconds: environment.OAUTH_CHALLENGE_TTL_SECONDS },
  );

  return googleOAuthApplication;
}

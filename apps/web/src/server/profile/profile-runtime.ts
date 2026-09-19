import { parseSessionEnvironment } from "@studiocar/config";
import {
  createDatabaseClient,
  PrismaProfileRepository,
} from "@studiocar/database";

import { ProfileService } from "./profile-service";

let profileService: ProfileService | undefined;

export function getProfileService(): ProfileService {
  if (profileService) return profileService;

  const environment = parseSessionEnvironment(process.env);
  const database = createDatabaseClient({
    connectionString: environment.DATABASE_URL,
  });
  profileService = new ProfileService(new PrismaProfileRepository(database));
  return profileService;
}

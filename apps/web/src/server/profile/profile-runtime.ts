import { getWebDatabase } from "../db/web-database";
import { PrismaProfileRepository } from "../db/repositories/profile-repository";

import { ProfileService } from "./profile-service";

let profileService: ProfileService | undefined;

export function getProfileService(): ProfileService {
  if (profileService) return profileService;

  const database = getWebDatabase();
  profileService = new ProfileService(new PrismaProfileRepository(database));
  return profileService;
}

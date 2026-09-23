import { z } from "zod";

/**
 * An optional setting where an empty value means "not set".
 *
 * Environment files and docker-compose both deliver an optional value nobody
 * filled in as an empty string. Treating that as present-but-invalid made the
 * settings the example file says to leave empty fail validation — and made a
 * worker using one background-removal provider demand the keys of the other
 * two.
 */
export function emptyAsUnset<T extends z.ZodType>(schema: T) {
  return schema.optional().or(z.literal("").transform(() => undefined));
}

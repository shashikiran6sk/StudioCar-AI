import { createHmac } from "node:crypto";

const IDENTIFIER_HASH_ALGORITHM = "sha256";
const MINIMUM_HASH_KEY_LENGTH = 32;
const HASH_KEY_ERROR_MESSAGE =
  "Sensitive identifier hash key must contain at least 32 characters.";

export class SensitiveIdentifierHasher {
  public constructor(private readonly key: string) {
    if (key.length < MINIMUM_HASH_KEY_LENGTH) {
      throw new RangeError(HASH_KEY_ERROR_MESSAGE);
    }
  }

  public hash(value: string): string {
    return createHmac(IDENTIFIER_HASH_ALGORITHM, this.key)
      .update(value)
      .digest("hex");
  }
}

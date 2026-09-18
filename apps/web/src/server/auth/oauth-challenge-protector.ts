import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import {
  GoogleOAuthChallengePayloadSchema,
  type GoogleOAuthChallengePayload,
} from "@studiocar/contracts";

const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const KEY_DIGEST = "sha256";
const INITIALIZATION_VECTOR_BYTES = 12;
const AUTHENTICATION_TAG_BYTES = 16;
const PROTECTED_VALUE_SEPARATOR = ".";
const PROTECTED_VALUE_PARTS = 3;
const MINIMUM_SECRET_BYTES = 32;
const PROTECTION_ERROR_MESSAGE = "OAuth challenge payload could not be verified.";
const SECRET_LENGTH_ERROR_MESSAGE =
  "OAuth challenge secret must contain at least 32 bytes.";

export class OAuthChallengeProtectionError extends Error {
  public constructor(options?: ErrorOptions) {
    super(PROTECTION_ERROR_MESSAGE, options);
    this.name = "OAuthChallengeProtectionError";
  }
}

export class OAuthChallengeProtector {
  private readonly key: Buffer;

  public constructor(secret: string) {
    if (Buffer.byteLength(secret, "utf8") < MINIMUM_SECRET_BYTES) {
      throw new RangeError(SECRET_LENGTH_ERROR_MESSAGE);
    }

    this.key = createHash(KEY_DIGEST).update(secret, "utf8").digest();
  }

  public protect(payload: GoogleOAuthChallengePayload): string {
    const validatedPayload = GoogleOAuthChallengePayloadSchema.parse(payload);
    const initializationVector = randomBytes(INITIALIZATION_VECTOR_BYTES);
    const cipher = createCipheriv(
      ENCRYPTION_ALGORITHM,
      this.key,
      initializationVector,
      { authTagLength: AUTHENTICATION_TAG_BYTES },
    );
    const ciphertext = Buffer.concat([
      cipher.update(JSON.stringify(validatedPayload), "utf8"),
      cipher.final(),
    ]);
    const authenticationTag = cipher.getAuthTag();

    return [initializationVector, ciphertext, authenticationTag]
      .map((part) => part.toString("base64url"))
      .join(PROTECTED_VALUE_SEPARATOR);
  }

  public unprotect(value: string): GoogleOAuthChallengePayload {
    try {
      const parts = value.split(PROTECTED_VALUE_SEPARATOR);
      const initializationVectorValue = parts[0];
      const ciphertextValue = parts[1];
      const authenticationTagValue = parts[2];

      if (
        parts.length !== PROTECTED_VALUE_PARTS ||
        !initializationVectorValue ||
        !ciphertextValue ||
        !authenticationTagValue
      ) {
        throw new OAuthChallengeProtectionError();
      }

      const initializationVector = Buffer.from(initializationVectorValue, "base64url");
      const authenticationTag = Buffer.from(authenticationTagValue, "base64url");

      if (
        initializationVector.byteLength !== INITIALIZATION_VECTOR_BYTES ||
        authenticationTag.byteLength !== AUTHENTICATION_TAG_BYTES
      ) {
        throw new OAuthChallengeProtectionError();
      }

      const decipher = createDecipheriv(
        ENCRYPTION_ALGORITHM,
        this.key,
        initializationVector,
        { authTagLength: AUTHENTICATION_TAG_BYTES },
      );
      decipher.setAuthTag(authenticationTag);
      const plaintext = Buffer.concat([
        decipher.update(Buffer.from(ciphertextValue, "base64url")),
        decipher.final(),
      ]).toString("utf8");

      return GoogleOAuthChallengePayloadSchema.parse(JSON.parse(plaintext));
    } catch (error) {
      if (error instanceof OAuthChallengeProtectionError) throw error;
      throw new OAuthChallengeProtectionError({ cause: error });
    }
  }
}

export function hexSha256ToBase64(checksumSha256: string): string {
  return Buffer.from(checksumSha256, "hex").toString("base64");
}

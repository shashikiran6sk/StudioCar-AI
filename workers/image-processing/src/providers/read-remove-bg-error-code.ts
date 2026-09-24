export async function readRemoveBgErrorCode(
  response: Response,
): Promise<string | null> {
  const body: unknown = await response.json().catch(() => null);
  if (body === null || typeof body !== "object" || !("errors" in body)) {
    return null;
  }
  const errors = body.errors;
  if (!Array.isArray(errors)) return null;
  const firstError: unknown = errors[0];
  if (
    firstError === null ||
    typeof firstError !== "object" ||
    !("code" in firstError) ||
    typeof firstError.code !== "string"
  ) {
    return null;
  }
  return firstError.code;
}

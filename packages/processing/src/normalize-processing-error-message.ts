import {
  PROCESSING_ERROR_MESSAGE_FALLBACK,
  PROCESSING_ERROR_MESSAGE_MAX_LENGTH,
} from "./processing-worker.constants";

export function normalizeProcessingErrorMessage(message: string): string {
  const normalized = message.trim() || PROCESSING_ERROR_MESSAGE_FALLBACK;
  return normalized.slice(0, PROCESSING_ERROR_MESSAGE_MAX_LENGTH);
}

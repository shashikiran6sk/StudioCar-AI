import type { JobState } from "@studiocar/contracts";

import { USER_ATTENTION_JOB_STATES } from "./processing-attention.constants";

/** The one rule for whether a processing job is waiting for the user. */
export function jobRequiresUserAttention(state: JobState): boolean {
  return USER_ATTENTION_JOB_STATES.some((attention) => attention === state);
}

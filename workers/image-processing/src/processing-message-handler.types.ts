import type {
  ProcessWorkerMessageResult,
} from "@studiocar/processing";
import type { WorkerMessage } from "@studiocar/contracts";

export interface ProcessingMessageProcessorPort {
  process(message: WorkerMessage): Promise<ProcessWorkerMessageResult>;
}

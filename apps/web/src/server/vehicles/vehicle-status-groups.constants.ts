import { VehicleStatus } from "@studiocar/database-runtime";

/**
 * The single vehicle-level answer to "does this need the user?".
 *
 * The worker sets `PARTIALLY_FAILED` atomically when a vehicle's newest batch
 * finishes with at least one job in `USER_ATTENTION_JOB_STATES`, so automatic
 * retries never reach it. The dashboard count, the inventory filter and the
 * portfolio warning all read this one list.
 */
export const NEEDS_ATTENTION_VEHICLE_STATUSES: VehicleStatus[] = [
  VehicleStatus.PARTIALLY_FAILED,
];

/**
 * Vehicles a new batch may be started for: a fresh draft, or a finished
 * vehicle getting another studio version or a re-process. A vehicle already
 * processing must finish first, so one batch runs per vehicle at a time.
 */
export const PROCESSABLE_VEHICLE_STATUSES: VehicleStatus[] = [
  VehicleStatus.DRAFT,
  VehicleStatus.READY,
  VehicleStatus.PARTIALLY_FAILED,
];

/** Finished vehicles another studio version can be created from. */
export const STUDIO_VERSION_VEHICLE_STATUSES: VehicleStatus[] = [
  VehicleStatus.READY,
  VehicleStatus.PARTIALLY_FAILED,
];

/** Vehicles that have left the creation workflow and appear in inventory. */
export const OPERATIONAL_VEHICLE_STATUSES: VehicleStatus[] = [
  VehicleStatus.PROCESSING,
  VehicleStatus.READY,
  VehicleStatus.PARTIALLY_FAILED,
  VehicleStatus.ARCHIVED,
];

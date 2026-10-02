import type {
  BackgroundTreatment,
  FloorStyle,
  ProcessingOptions,
} from "../../packages/contracts/src/processing";

/**
 * The exhaustive "Customize treatment" test matrix: every switch combination
 * the Customize step can produce (6) with every studio background and floor
 * (6), 36 cases.
 *
 * Three switches remain: Image Enhancement, Studio Background and Maintain
 * Composition. Hide Number Plate was removed, and with Studio Background off
 * the photo keeps its own frame, so Maintain Composition is fixed on: 2 × 2
 * studio combinations plus 2 original-photo ones.
 */

export const TREATMENT_MATRIX_SIZE = 36;

/** The switches as the Customize step shows them. */
export interface TreatmentToggles {
  enhancement: boolean;
  maintainComposition: boolean;
  studioBackground: boolean;
}

export interface ToggleConfiguration {
  id: string;
  toggles: TreatmentToggles;
}

export interface StudioConfiguration {
  background: Exclude<BackgroundTreatment, "ORIGINAL">;
  floor: FloorStyle;
  id: string;
}

export interface TreatmentCase {
  id: string;
  /** The compact description stored as the batch label. */
  label: string;
  /**
   * The options the Customize step produces for this case. With Studio
   * Background off the background is ORIGINAL and the chosen background is
   * lost; the floor keeps whatever was chosen before the switch went off.
   */
  options: ProcessingOptions;
  studio: StudioConfiguration;
  toggles: TreatmentToggles;
  toggleId: string;
}

/** EN, BG, MC — the order each configuration is written in. */
const TOGGLE_ROWS: readonly (readonly [boolean, boolean, boolean])[] = [
  [true, true, true],
  [false, true, true],
  [true, true, false],
  [false, true, false],
  [true, false, true],
  [false, false, true],
];

export const TOGGLE_CONFIGURATIONS: readonly ToggleConfiguration[] =
  TOGGLE_ROWS.map(([enhancement, studioBackground, maintainComposition], index) => ({
    id: `T${String(index + 1).padStart(2, "0")}`,
    toggles: { enhancement, maintainComposition, studioBackground },
  }));

export const STUDIO_CONFIGURATIONS: readonly StudioConfiguration[] = [
  { background: "PREMIUM_WHITE", floor: "PLAIN", id: "S01" },
  { background: "PREMIUM_WHITE", floor: "HORIZON", id: "S02" },
  { background: "DARK_STUDIO", floor: "PLAIN", id: "S03" },
  { background: "DARK_STUDIO", floor: "HORIZON", id: "S04" },
  { background: "GREY_STUDIO", floor: "PLAIN", id: "S05" },
  { background: "GREY_STUDIO", floor: "HORIZON", id: "S06" },
];

const BACKGROUND_NAMES = {
  DARK_STUDIO: "Dark Studio",
  GREY_STUDIO: "Grey Studio",
  PREMIUM_WHITE: "Premium White",
} satisfies Record<StudioConfiguration["background"], string>;

const FLOOR_NAMES = {
  HORIZON: "Standard Floor",
  PLAIN: "Plain Background",
} satisfies Record<FloorStyle, string>;

/** Options the Customize step never exposes, at their contract defaults. */
const FIXED_OPTIONS = {
  paddingPercent: 8,
  quality: 90,
} satisfies Partial<ProcessingOptions>;

function onOff(value: boolean): string {
  return value ? "ON" : "OFF";
}

export function describeTreatmentCase(
  id: string,
  toggles: TreatmentToggles,
  studio: StudioConfiguration,
): string {
  return [
    id,
    `Enhance ${onOff(toggles.enhancement)}`,
    `Studio ${onOff(toggles.studioBackground)}`,
    `Composition ${onOff(toggles.maintainComposition)}`,
    BACKGROUND_NAMES[studio.background],
    FLOOR_NAMES[studio.floor],
  ].join(" | ");
}

export function expectedTreatmentOptions(
  toggles: TreatmentToggles,
  studio: StudioConfiguration,
): ProcessingOptions {
  return {
    ...FIXED_OPTIONS,
    background: toggles.studioBackground ? studio.background : "ORIGINAL",
    crop: toggles.maintainComposition ? "MAINTAIN_COMPOSITION" : "FIT_VEHICLE",
    enhancement: toggles.enhancement,
    floor: studio.floor,
  };
}

/** toggleConfigurations × backgrounds × floors, in plan order. */
export function createTreatmentMatrix(): TreatmentCase[] {
  return TOGGLE_CONFIGURATIONS.flatMap(({ id: toggleId, toggles }) =>
    STUDIO_CONFIGURATIONS.map((studio) => {
      const id = `${toggleId}-${studio.id}`;
      return {
        id,
        label: describeTreatmentCase(id, toggles, studio),
        options: expectedTreatmentOptions(toggles, studio),
        studio,
        toggleId,
        toggles,
      };
    }),
  );
}

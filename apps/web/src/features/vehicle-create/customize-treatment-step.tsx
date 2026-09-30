"use client";

import type { BackgroundTreatment, FloorStyle } from "@studiocar/contracts";
import { Button, ToggleOption } from "@studiocar/ui";

import { BackgroundTreatmentCard } from "./background-treatment-card";
import { BACKGROUND_TREATMENT_CHOICES } from "./background-treatment.constants";
import { FloorStyleCard } from "./floor-style-card";
import { FLOOR_STYLE_CHOICES } from "./floor-style.constants";
import {
  DEFAULT_BACKGROUND_TREATMENT,
  FIT_VEHICLE_CROP,
  MAINTAIN_COMPOSITION_CROP,
  ORIGINAL_BACKGROUND_TREATMENT,
  STUDIO_SCENE_BACKGROUNDS,
} from "./processing-option.constants";
import {
  CUSTOMIZE_BACKGROUND_HEADING,
  CUSTOMIZE_FLOOR_HEADING,
  CUSTOMIZE_BACK_LABEL,
  CUSTOMIZE_CONTINUE_LABEL,
  CUSTOMIZE_PRESERVATION_NOTE,
  ENHANCEMENT_DESCRIPTION,
  ENHANCEMENT_LABEL,
  MAINTAIN_COMPOSITION_DESCRIPTION,
  MAINTAIN_COMPOSITION_LABEL,
  STUDIO_BACKGROUND_DESCRIPTION,
  STUDIO_BACKGROUND_LABEL,
} from "./vehicle-create.constants";
import { useVehicleCreateStore } from "./vehicle-create-store";

export interface CustomizeTreatmentStepProps {
  onBack: () => void;
  onContinue: () => void;
}

export function CustomizeTreatmentStep({
  onBack,
  onContinue,
}: CustomizeTreatmentStepProps) {
  const options = useVehicleCreateStore((state) => state.options);
  const setOptions = useVehicleCreateStore((state) => state.setOptions);
  const studioBackgroundEnabled =
    options.background !== ORIGINAL_BACKGROUND_TREATMENT;
  const maintainComposition = options.crop === MAINTAIN_COMPOSITION_CROP;

  // Only a studio background is drawn with a wall and a floor to choose.
  const floorEnabled =
    studioBackgroundEnabled &&
    STUDIO_SCENE_BACKGROUNDS.includes(options.background);

  function selectBackground(background: BackgroundTreatment) {
    setOptions({ ...options, background });
  }

  function selectFloor(floor: FloorStyle) {
    setOptions({ ...options, floor });
  }

  return (
    <section className="customize-treatment-step">
      <div className="customize-treatment-step__toggles">
        <ToggleOption
          checked={options.enhancement}
          description={ENHANCEMENT_DESCRIPTION}
          label={ENHANCEMENT_LABEL}
          onCheckedChange={(enhancement) =>
            setOptions({ ...options, enhancement })
          }
        />
        <ToggleOption
          checked={studioBackgroundEnabled}
          description={STUDIO_BACKGROUND_DESCRIPTION}
          label={STUDIO_BACKGROUND_LABEL}
          onCheckedChange={(enabled) =>
            setOptions(
              enabled
                ? { ...options, background: DEFAULT_BACKGROUND_TREATMENT }
                : // The original photo keeps its own frame: there is no
                  // cutout to re-compose without a studio background.
                  {
                    ...options,
                    background: ORIGINAL_BACKGROUND_TREATMENT,
                    crop: MAINTAIN_COMPOSITION_CROP,
                  },
            )
          }
        />
        <ToggleOption
          checked={maintainComposition}
          description={MAINTAIN_COMPOSITION_DESCRIPTION}
          disabled={!studioBackgroundEnabled}
          label={MAINTAIN_COMPOSITION_LABEL}
          onCheckedChange={(enabled) =>
            setOptions({
              ...options,
              crop: enabled
                ? MAINTAIN_COMPOSITION_CROP
                : FIT_VEHICLE_CROP,
            })
          }
        />
      </div>
      <div className="customize-treatment-step__backgrounds">
        <h3>{CUSTOMIZE_BACKGROUND_HEADING}</h3>
        <div className="background-treatment-grid">
          {BACKGROUND_TREATMENT_CHOICES.map((choice) => (
            <BackgroundTreatmentCard
              choice={choice}
              disabled={!studioBackgroundEnabled}
              key={choice.value}
              onSelect={selectBackground}
              selected={options.background === choice.value}
            />
          ))}
        </div>
      </div>
      <div className="customize-treatment-step__backgrounds">
        <h3>{CUSTOMIZE_FLOOR_HEADING}</h3>
        <div className="background-treatment-grid">
          {FLOOR_STYLE_CHOICES.map((choice) => (
            <FloorStyleCard
              choice={choice}
              disabled={!floorEnabled}
              key={choice.value}
              onSelect={selectFloor}
              selected={options.floor === choice.value}
            />
          ))}
        </div>
      </div>
      <p className="vehicle-create-note">{CUSTOMIZE_PRESERVATION_NOTE}</p>
      <footer className="vehicle-create-step-footer">
        <Button onClick={onBack}>{CUSTOMIZE_BACK_LABEL}</Button>
        <Button onClick={onContinue} variant="primary">
          {CUSTOMIZE_CONTINUE_LABEL}
        </Button>
      </footer>
    </section>
  );
}

"use client";

import { Button, ToggleOption } from "@studiocar/ui";

import { buildProcessingOptions } from "../studio-treatment/build-processing-options";
import { STUDIO_BACKGROUND_CHOICES } from "../studio-treatment/studio-treatment.constants";
import {
  FIT_VEHICLE_CROP,
  MAINTAIN_COMPOSITION_CROP,
} from "./processing-option.constants";
import { StudioChoiceCard } from "./studio-choice-card";
import {
  CUSTOMIZE_BACKGROUND_HEADING,
  CUSTOMIZE_BACK_LABEL,
  CUSTOMIZE_CHOOSE_FLOOR_LABEL,
  CUSTOMIZE_CONTINUE_LABEL,
  CUSTOMIZE_FLOOR_HEADING,
  CUSTOMIZE_FLOOR_PENDING_NOTE,
  CUSTOMIZE_PRESERVATION_NOTE,
  ENHANCEMENT_DESCRIPTION,
  ENHANCEMENT_LABEL,
  MAINTAIN_COMPOSITION_DESCRIPTION,
  MAINTAIN_COMPOSITION_LABEL,
  PLATE_PRIVACY_DESCRIPTION,
  PLATE_PRIVACY_LABEL,
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
  const settings = useVehicleCreateStore((state) => state.settings);
  const studio = useVehicleCreateStore((state) => state.studio);
  const studioBackgroundEnabled = useVehicleCreateStore(
    (state) => state.studioBackgroundEnabled,
  );
  const setSettings = useVehicleCreateStore((state) => state.setSettings);
  const setStudioBackgroundEnabled = useVehicleCreateStore(
    (state) => state.setStudioBackgroundEnabled,
  );
  const selectBackground = useVehicleCreateStore(
    (state) => state.selectBackground,
  );
  const selectFloor = useVehicleCreateStore((state) => state.selectFloor);
  const selectedBackground = STUDIO_BACKGROUND_CHOICES.find(
    (choice) => choice.id === studio?.backgroundId,
  );
  const ready =
    buildProcessingOptions({ settings, studio, studioBackgroundEnabled }) !==
    null;

  return (
    <section className="customize-treatment-step">
      <div className="customize-treatment-step__toggles">
        <ToggleOption
          checked={settings.platePrivacy}
          description={PLATE_PRIVACY_DESCRIPTION}
          label={PLATE_PRIVACY_LABEL}
          onCheckedChange={(platePrivacy) =>
            setSettings({ ...settings, platePrivacy })
          }
        />
        <ToggleOption
          checked={settings.enhancement}
          description={ENHANCEMENT_DESCRIPTION}
          label={ENHANCEMENT_LABEL}
          onCheckedChange={(enhancement) =>
            setSettings({ ...settings, enhancement })
          }
        />
        <ToggleOption
          checked={studioBackgroundEnabled}
          description={STUDIO_BACKGROUND_DESCRIPTION}
          label={STUDIO_BACKGROUND_LABEL}
          onCheckedChange={setStudioBackgroundEnabled}
        />
        <ToggleOption
          checked={settings.crop === MAINTAIN_COMPOSITION_CROP}
          description={MAINTAIN_COMPOSITION_DESCRIPTION}
          label={MAINTAIN_COMPOSITION_LABEL}
          onCheckedChange={(enabled) =>
            setSettings({
              ...settings,
              crop: enabled ? MAINTAIN_COMPOSITION_CROP : FIT_VEHICLE_CROP,
            })
          }
        />
      </div>
      <div className="customize-treatment-step__backgrounds">
        <h3>{CUSTOMIZE_BACKGROUND_HEADING}</h3>
        <div className="studio-choice-grid studio-choice-grid--backgrounds">
          {STUDIO_BACKGROUND_CHOICES.map((choice) => (
            <StudioChoiceCard
              disabled={!studioBackgroundEnabled}
              key={choice.id}
              label={choice.label}
              onSelect={() => selectBackground(choice.id)}
              previewPath={choice.previewPath}
              selected={studioBackgroundEnabled && studio?.backgroundId === choice.id}
              variant="background"
            />
          ))}
        </div>
      </div>
      {studioBackgroundEnabled && selectedBackground ? (
        <div className="customize-treatment-step__backgrounds">
          <h3>
            {CUSTOMIZE_FLOOR_HEADING} ({selectedBackground.label})
          </h3>
          <div className="studio-choice-grid studio-choice-grid--floors">
            {selectedBackground.floors.map((floor) => (
              <StudioChoiceCard
                key={floor.id}
                label={floor.label}
                onSelect={() => selectFloor(floor.id)}
                previewPath={floor.previewPath}
                selected={studio?.floorId === floor.id}
                variant="floor"
              />
            ))}
          </div>
        </div>
      ) : null}
      {studioBackgroundEnabled && !selectedBackground ? (
        <p className="vehicle-create-note">{CUSTOMIZE_FLOOR_PENDING_NOTE}</p>
      ) : (
        <p className="vehicle-create-note">{CUSTOMIZE_PRESERVATION_NOTE}</p>
      )}
      <footer className="vehicle-create-step-footer">
        <Button onClick={onBack}>{CUSTOMIZE_BACK_LABEL}</Button>
        <Button disabled={!ready} onClick={onContinue} variant="primary">
          {ready ? CUSTOMIZE_CONTINUE_LABEL : CUSTOMIZE_CHOOSE_FLOOR_LABEL}
        </Button>
      </footer>
    </section>
  );
}

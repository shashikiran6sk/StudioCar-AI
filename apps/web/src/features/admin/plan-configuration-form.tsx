"use client";

import { Button, Card, Field, TextareaField } from "@studiocar/ui";
import { useActionState } from "react";

import { AdminActionMessage } from "./admin-action-message";
import { PLAN_BILLING_INTERVAL_OPTIONS } from "./plan-billing-interval-options";
import type { PlanConfigurationFields } from "./to-plan-configuration-fields";
import { savePlanConfigurationAction } from "../../server/admin/plan-configuration-actions";
import {
  ADMIN_PLAN_ACTIVE_LABEL,
  ADMIN_PLAN_BATCH_LIMIT_LABEL,
  ADMIN_PLAN_DESCRIPTION_LABEL,
  ADMIN_PLAN_FEATURED_LABEL,
  ADMIN_PLAN_FEATURES_LABEL,
  ADMIN_PLAN_INCLUDED_IMAGES_LABEL,
  ADMIN_PLAN_INTERVAL_LABEL,
  ADMIN_PLAN_NAME_LABEL,
  ADMIN_PLAN_ORDER_LABEL,
  ADMIN_PLAN_PRICE_HINT,
  ADMIN_PLAN_PRICE_LABEL,
  ADMIN_PLAN_PURCHASABLE_HINT,
  ADMIN_PLAN_PURCHASABLE_LABEL,
  ADMIN_PLAN_SAVE_LABEL,
  ADMIN_PLAN_SEGMENT_LABEL,
  ADMIN_PLAN_STORAGE_LABEL,
} from "../../server/admin/admin.constants";

export interface PlanConfigurationFormProps {
  plan: PlanConfigurationFields;
}

export function PlanConfigurationForm({ plan }: PlanConfigurationFormProps) {
  const [message, save, pending] = useActionState(
    savePlanConfigurationAction,
    null,
  );
  const fieldId = (field: string) => `plan-${plan.planKey}-${field}`;
  const intervalId = fieldId("interval");

  return (
    <Card className="admin-card">
      <header className="profile-section-card__header">
        <h2>{plan.displayName}</h2>
        <p>{plan.planKey}</p>
      </header>
      <form action={save} className="admin-plan-form">
        <input name="planKey" type="hidden" value={plan.planKey} />
        <Field
          defaultValue={plan.displayName}
          id={fieldId("name")}
          label={ADMIN_PLAN_NAME_LABEL}
          name="displayName"
          required
        />
        <Field
          defaultValue={plan.segment}
          id={fieldId("segment")}
          label={ADMIN_PLAN_SEGMENT_LABEL}
          name="segment"
          required
        />
        <TextareaField
          defaultValue={plan.description}
          id={fieldId("description")}
          label={ADMIN_PLAN_DESCRIPTION_LABEL}
          name="description"
          required
          rows={2}
        />
        <Field
          defaultValue={plan.priceRupees}
          hint={ADMIN_PLAN_PRICE_HINT}
          id={fieldId("price")}
          inputMode="numeric"
          label={ADMIN_PLAN_PRICE_LABEL}
          min={0}
          name="priceRupees"
          required
          type="number"
        />
        <div className="sc-field">
          <label className="sc-field__label" htmlFor={intervalId}>
            {ADMIN_PLAN_INTERVAL_LABEL}
          </label>
          <select
            className="sc-input"
            defaultValue={plan.billingInterval}
            id={intervalId}
            name="billingInterval"
          >
            {PLAN_BILLING_INTERVAL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <Field
          defaultValue={plan.includedImages}
          id={fieldId("images")}
          inputMode="numeric"
          label={ADMIN_PLAN_INCLUDED_IMAGES_LABEL}
          min={1}
          name="includedImages"
          required
          type="number"
        />
        <Field
          defaultValue={plan.maxImagesPerBatch}
          id={fieldId("batch")}
          inputMode="numeric"
          label={ADMIN_PLAN_BATCH_LIMIT_LABEL}
          min={1}
          name="maxImagesPerBatch"
          required
          type="number"
        />
        <Field
          defaultValue={plan.storageGigabytes}
          id={fieldId("storage")}
          inputMode="numeric"
          label={ADMIN_PLAN_STORAGE_LABEL}
          min={1}
          name="storageGigabytes"
          type="number"
        />
        <Field
          defaultValue={plan.displayOrder}
          id={fieldId("order")}
          inputMode="numeric"
          label={ADMIN_PLAN_ORDER_LABEL}
          min={0}
          name="displayOrder"
          required
          type="number"
        />
        <TextareaField
          defaultValue={plan.features}
          id={fieldId("features")}
          label={ADMIN_PLAN_FEATURES_LABEL}
          name="features"
          rows={4}
        />
        <div className="admin-plan-form__toggles">
          <label
            className="admin-plan-form__toggle"
            htmlFor={fieldId("active")}
          >
            <input
              defaultChecked={plan.active}
              id={fieldId("active")}
              name="active"
              type="checkbox"
            />
            {ADMIN_PLAN_ACTIVE_LABEL}
          </label>
          <label
            className="admin-plan-form__toggle"
            htmlFor={fieldId("featured")}
          >
            <input
              defaultChecked={plan.featured}
              id={fieldId("featured")}
              name="featured"
              type="checkbox"
            />
            {ADMIN_PLAN_FEATURED_LABEL}
          </label>
          <label
            className="admin-plan-form__toggle"
            htmlFor={fieldId("purchasable")}
          >
            <input
              defaultChecked={plan.purchasable}
              id={fieldId("purchasable")}
              name="purchasable"
              type="checkbox"
            />
            {ADMIN_PLAN_PURCHASABLE_LABEL}
          </label>
          <p className="sc-field__hint">{ADMIN_PLAN_PURCHASABLE_HINT}</p>
        </div>
        <Button disabled={pending} type="submit" variant="primary">
          {ADMIN_PLAN_SAVE_LABEL}
        </Button>
      </form>
      <AdminActionMessage message={message} />
    </Card>
  );
}

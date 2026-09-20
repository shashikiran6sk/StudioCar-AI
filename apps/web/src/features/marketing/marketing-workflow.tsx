import { ButtonLink } from "@studiocar/ui";

import {
  MARKETING_COPY,
  MARKETING_START_PATH,
  MARKETING_WORKFLOW_ID,
  MARKETING_WORKFLOW_STEPS,
} from "./marketing.constants";

export function MarketingWorkflow() {
  return (
    <section className="marketing-workflow" id={MARKETING_WORKFLOW_ID}>
      <div className="marketing-section-heading">
        <div>
          <p className="eyebrow">{MARKETING_COPY.workflow.eyebrow}</p>
          <h2>{MARKETING_COPY.workflow.title}</h2>
        </div>
        <p>
          {MARKETING_COPY.workflow.body}
        </p>
      </div>
      <ol className="marketing-workflow__steps">
        {MARKETING_WORKFLOW_STEPS.map((step, index) => (
          <li key={step.title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
            <strong>{step.detail}</strong>
          </li>
        ))}
      </ol>
      <div className="marketing-workflow__note">
        <div>
          <strong>{MARKETING_COPY.workflow.noteTitle}</strong>
          <span>{MARKETING_COPY.workflow.noteBody}</span>
        </div>
        <ButtonLink href={MARKETING_START_PATH} size="marketing" variant="secondary">
          {MARKETING_COPY.workflow.noteAction}
        </ButtonLink>
      </div>
    </section>
  );
}

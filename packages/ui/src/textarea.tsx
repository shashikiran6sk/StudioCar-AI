import { forwardRef, useId, type TextareaHTMLAttributes } from "react";

import { cx } from "./utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, invalid = false, ...props }, ref) {
    return (
      <textarea
        aria-invalid={invalid || undefined}
        className={cx("sc-input", "sc-textarea", className)}
        ref={ref}
        {...props}
      />
    );
  },
);

export interface TextareaFieldProps extends Omit<TextareaProps, "id" | "invalid"> {
  error?: string | undefined;
  hint?: string | undefined;
  id?: string | undefined;
  label: string;
}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  function TextareaField(
    { error, hint, id: suppliedId, label, required, ...textareaProps },
    ref,
  ) {
    const generatedId = useId();
    const id = suppliedId ?? generatedId;
    const descriptionId = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

    return (
      <div className="sc-field">
        <label className="sc-field__label" htmlFor={id}>
          {label}
          {required ? <span aria-hidden="true"> *</span> : null}
        </label>
        <Textarea
          aria-describedby={descriptionId}
          id={id}
          invalid={Boolean(error)}
          ref={ref}
          required={required}
          {...textareaProps}
        />
        {error ? (
          <p className="sc-field__error" id={descriptionId}>
            {error}
          </p>
        ) : hint ? (
          <p className="sc-field__hint" id={descriptionId}>
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);

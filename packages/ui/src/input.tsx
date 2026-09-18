import { forwardRef, useId, type InputHTMLAttributes } from "react";

import { cx } from "./utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid = false, ...props },
  ref,
) {
  return <input aria-invalid={invalid || undefined} className={cx("sc-input", className)} ref={ref} {...props} />;
});

export interface FieldProps extends Omit<InputProps, "id" | "invalid"> {
  error?: string;
  hint?: string;
  id?: string;
  label: string;
}

export function Field({ error, hint, id: suppliedId, label, required, ...inputProps }: FieldProps) {
  const generatedId = useId();
  const id = suppliedId ?? generatedId;
  const descriptionId = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="sc-field">
      <label className="sc-field__label" htmlFor={id}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      <Input
        aria-describedby={descriptionId}
        id={id}
        invalid={Boolean(error)}
        required={required}
        {...inputProps}
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
}


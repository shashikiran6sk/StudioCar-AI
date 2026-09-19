"use client";

import {
  ApiErrorSchema,
  UpdateProfileResponseSchema,
  UpdateProfileSchema,
} from "@studiocar/contracts";
import { Button, Field } from "@studiocar/ui";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { PROFILE_API_PATH } from "../../app/app-routes";
import { readResponseJson } from "../auth/read-response-json";

const DISPLAY_NAME_LABEL = "Display name";
const DISPLAY_NAME_PLACEHOLDER = "Your name";
const SAVE_LABEL = "Save profile";
const SAVING_LABEL = "Saving…";
const SUCCESS_MESSAGE = "Profile updated.";
const GENERIC_ERROR_MESSAGE = "We could not update your profile. Please try again.";
const JSON_CONTENT_TYPE = "application/json";

export interface ProfileFormProps {
  initialDisplayName: string;
}

export function ProfileForm({ initialDisplayName }: ProfileFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setSuccess(undefined);

    const input = UpdateProfileSchema.safeParse({ displayName });
    if (!input.success) {
      setError(input.error.issues[0]?.message ?? GENERIC_ERROR_MESSAGE);
      return;
    }

    setPending(true);
    try {
      const response = await fetch(PROFILE_API_PATH, {
        method: "PATCH",
        headers: { "content-type": JSON_CONTENT_TYPE },
        body: JSON.stringify(input.data),
      });
      const payload = await readResponseJson(response);
      if (!response.ok) {
        const apiError = ApiErrorSchema.safeParse(payload);
        setError(
          apiError.success ? apiError.data.error.message : GENERIC_ERROR_MESSAGE,
        );
        return;
      }

      const updated = UpdateProfileResponseSchema.safeParse(payload);
      if (!updated.success) {
        setError(GENERIC_ERROR_MESSAGE);
        return;
      }

      setDisplayName(updated.data.user.displayName ?? input.data.displayName);
      setSuccess(SUCCESS_MESSAGE);
      router.refresh();
    } catch {
      setError(GENERIC_ERROR_MESSAGE);
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="profile-form" onSubmit={submit}>
      <Field
        autoComplete="name"
        error={error}
        id="display-name"
        label={DISPLAY_NAME_LABEL}
        onChange={(event) => setDisplayName(event.currentTarget.value)}
        placeholder={DISPLAY_NAME_PLACEHOLDER}
        required
        value={displayName}
      />
      <div className="profile-form__actions">
        <Button disabled={pending} type="submit" variant="primary">
          {pending ? SAVING_LABEL : SAVE_LABEL}
        </Button>
        {success ? (
          <p className="profile-form__success" role="status">
            {success}
          </p>
        ) : null}
      </div>
    </form>
  );
}

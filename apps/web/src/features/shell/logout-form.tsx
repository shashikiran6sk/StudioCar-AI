import { LOGOUT_PATH } from "../../app/app-routes";
import { LOGOUT_LABEL } from "./app-shell.constants";

export interface LogoutFormProps {
  className?: string;
}

/** Ends the current session. A form post, so it works before hydration. */
export function LogoutForm({ className }: LogoutFormProps) {
  return (
    <form action={LOGOUT_PATH} className={className} method="post">
      <button type="submit">{LOGOUT_LABEL}</button>
    </form>
  );
}

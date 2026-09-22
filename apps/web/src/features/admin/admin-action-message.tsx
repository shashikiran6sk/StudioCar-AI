import type { AdminActionMessage as AdminActionMessageValue } from "../../server/admin/to-admin-action-message";

export interface AdminActionMessageProps {
  message: AdminActionMessageValue | null;
}

export function AdminActionMessage({ message }: AdminActionMessageProps) {
  if (!message) return null;

  return (
    <p
      className={
        message.kind === "success"
          ? "admin-message admin-message--success"
          : "admin-message admin-message--error"
      }
      role={message.kind === "success" ? "status" : "alert"}
    >
      {message.message}
    </p>
  );
}

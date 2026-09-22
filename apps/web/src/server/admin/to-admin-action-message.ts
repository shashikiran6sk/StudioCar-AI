import {
  ADMIN_ALREADY_ADMINISTRATOR_MESSAGE,
  ADMIN_ALREADY_INVITED_MESSAGE,
  ADMIN_GRANTED_MESSAGE,
  ADMIN_INVITED_MESSAGE,
  ADMIN_LAST_ADMINISTRATOR_MESSAGE,
  ADMIN_NOT_ADMINISTRATOR_MESSAGE,
  ADMIN_REVOKED_MESSAGE,
} from "./admin.constants";
import type {
  GrantAdministratorResult,
  RevokeAdministratorResult,
} from "../db/repositories/admin-management-repository";

export interface AdminActionMessage {
  kind: "success" | "error";
  message: string;
}

export function toGrantMessage(
  result: GrantAdministratorResult,
): AdminActionMessage {
  switch (result.kind) {
    case "GRANTED":
      return { kind: "success", message: ADMIN_GRANTED_MESSAGE };
    case "INVITED":
      return { kind: "success", message: ADMIN_INVITED_MESSAGE };
    case "ALREADY_ADMINISTRATOR":
      return { kind: "error", message: ADMIN_ALREADY_ADMINISTRATOR_MESSAGE };
    case "ALREADY_INVITED":
      return { kind: "error", message: ADMIN_ALREADY_INVITED_MESSAGE };
  }
}

export function toRevokeMessage(
  result: RevokeAdministratorResult,
): AdminActionMessage {
  switch (result.kind) {
    case "REVOKED":
      return { kind: "success", message: ADMIN_REVOKED_MESSAGE };
    case "NOT_ADMINISTRATOR":
      return { kind: "error", message: ADMIN_NOT_ADMINISTRATOR_MESSAGE };
    case "LAST_ADMINISTRATOR":
      return { kind: "error", message: ADMIN_LAST_ADMINISTRATOR_MESSAGE };
  }
}

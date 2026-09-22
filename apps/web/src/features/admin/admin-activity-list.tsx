import { Card } from "@studiocar/ui";

import { formatAdminDate } from "./format-admin-date";
import {
  ADMIN_ACTIVITY_EMPTY_LABEL,
  ADMIN_ACTIVITY_TITLE,
} from "../../server/admin/admin.constants";

export interface AdminActivityRow {
  actorLabel: string;
  id: string;
  occurredAt: string;
  summary: string;
}

export interface AdminActivityListProps {
  entries: readonly AdminActivityRow[];
}

export function AdminActivityList({ entries }: AdminActivityListProps) {
  return (
    <Card className="admin-card">
      <header className="profile-section-card__header">
        <h2>{ADMIN_ACTIVITY_TITLE}</h2>
      </header>
      {entries.length === 0 ? (
        <p>{ADMIN_ACTIVITY_EMPTY_LABEL}</p>
      ) : (
        <ol className="admin-list">
          {entries.map((entry) => (
            <li className="admin-list__item" key={entry.id}>
              <div>
                <strong>{entry.summary}</strong>
                <span>
                  {`${entry.actorLabel}, ${formatAdminDate(entry.occurredAt)}`}
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

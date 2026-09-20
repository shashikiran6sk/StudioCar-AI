export interface DashboardStatCardProps {
  inverted?: boolean;
  label: string;
  supportingText: string;
  value: string;
}

export function DashboardStatCard({
  inverted = false,
  label,
  supportingText,
  value,
}: DashboardStatCardProps) {
  return (
    <article
      className={
        inverted
          ? "dashboard-stat dashboard-stat--inverted"
          : "dashboard-stat"
      }
    >
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{supportingText}</span>
    </article>
  );
}

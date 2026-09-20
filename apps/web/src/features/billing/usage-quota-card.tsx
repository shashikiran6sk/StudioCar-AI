import { Progress } from "@studiocar/ui";

export interface UsageQuotaCardProps {
  capacity: number;
  label: string;
  value: string;
  valueAmount: number;
}

export function UsageQuotaCard({
  capacity,
  label,
  value,
  valueAmount,
}: UsageQuotaCardProps) {
  return (
    <article className="usage-quota-card">
      <strong>{value}</strong>
      <Progress label={label} max={capacity} value={valueAmount} />
    </article>
  );
}

import { BrandMark, Button, Card, Progress, StatusBadge } from "@studiocar/ui";

export default function HomePage() {
  return (
    <main className="foundation-shell">
      <div className="foundation-content">
        <BrandMark withName />
        <p className="eyebrow">Foundation ready</p>
        <h1>StudioCar AI</h1>
        <p className="summary">
          The production workspace and screenshot-derived interface primitives are ready for
          feature delivery.
        </p>
        <div className="foundation-actions">
          <Button variant="primary">Primary action</Button>
          <Button>Secondary action</Button>
        </div>
        <div className="foundation-status" aria-label="Supported status treatments">
          <StatusBadge status="processing">Processing</StatusBadge>
          <StatusBadge status="completed">Completed</StatusBadge>
          <StatusBadge status="failed">Failed</StatusBadge>
        </div>
        <Card className="foundation-card">
          <Progress label="Upload progress" value={65} valueLabel="65%" />
        </Card>
      </div>
    </main>
  );
}

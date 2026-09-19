const MORNING_END_HOUR = 12;
const AFTERNOON_END_HOUR = 18;

export function dashboardGreeting(date: Date): string {
  const hour = date.getHours();
  if (hour < MORNING_END_HOUR) return "Good morning";
  if (hour < AFTERNOON_END_HOUR) return "Good afternoon";
  return "Good evening";
}

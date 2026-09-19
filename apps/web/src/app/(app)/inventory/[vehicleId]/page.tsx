import { notFound, redirect } from "next/navigation";

import { LOGIN_PATH } from "../../../app-routes";
import { PortfolioFacts } from "../../../../features/portfolio/portfolio-facts";
import { PortfolioGallery } from "../../../../features/portfolio/portfolio-gallery";
import { PortfolioHeader } from "../../../../features/portfolio/portfolio-header";
import { getCurrentSession } from "../../../../server/auth/get-current-session";
import { getPortfolioService } from "../../../../server/portfolio/portfolio-runtime";

export const dynamic = "force-dynamic";

export interface VehiclePortfolioPageProps {
  params: Promise<{ vehicleId: string }>;
}

export default async function VehiclePortfolioPage({
  params,
}: VehiclePortfolioPageProps) {
  const session = await getCurrentSession();
  if (!session) redirect(LOGIN_PATH);

  const { vehicleId } = await params;
  const portfolio = await getPortfolioService().get(session.userId, vehicleId);
  if (!portfolio) notFound();

  return (
    <div className="portfolio-page">
      <PortfolioHeader portfolio={portfolio} />
      <PortfolioGallery portfolio={portfolio} />
      <PortfolioFacts portfolio={portfolio} />
    </div>
  );
}

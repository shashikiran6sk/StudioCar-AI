import { Skeleton } from "@studiocar/ui";

const PORTFOLIO_THUMBNAIL_SKELETONS = 6;

export default function VehiclePortfolioLoading() {
  return (
    <div aria-label="Loading vehicle portfolio" className="portfolio-page" role="status">
      <Skeleton className="portfolio-loading__header" />
      <div className="portfolio-loading__gallery">
        <Skeleton className="portfolio-loading__stage" />
        <div className="portfolio-loading__thumbnails">
          {Array.from({ length: PORTFOLIO_THUMBNAIL_SKELETONS }, (_, index) => (
            <Skeleton className="portfolio-loading__thumbnail" key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

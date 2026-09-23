import { BrandMark } from "@studiocar/ui";
import Link from "next/link";

import { HOME_PATH } from "../../app/app-routes";
import { MARKETING_COPY } from "../marketing/marketing.constants";

export interface BrandHomeLinkProps {
  className?: string;
}

/** The StudioCar AI logo, which takes you to the homepage wherever it appears. */
export function BrandHomeLink({ className }: BrandHomeLinkProps) {
  return (
    <Link
      aria-label={MARKETING_COPY.header.homeLabel}
      className="brand-home-link"
      href={HOME_PATH}
    >
      <BrandMark className={className} withName />
    </Link>
  );
}

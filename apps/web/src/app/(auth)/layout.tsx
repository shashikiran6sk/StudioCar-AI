import type { Metadata } from "next";
import type { ReactNode } from "react";

import { privateRobots } from "../../lib/private-robots";

export const metadata: Metadata = { robots: privateRobots };

export default function AuthLayout({ children }: Readonly<{ children: ReactNode }>) {
  return children;
}

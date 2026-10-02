import type { Metadata } from "next";

export const privateRobots: Metadata["robots"] = {
  index: false,
  follow: false,
};

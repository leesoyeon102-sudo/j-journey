import { Suspense } from "react";
import Planner from "@/components/Planner";

export default function HomePage() {
  return (
    <Suspense>
      <Planner />
    </Suspense>
  );
}

"use client";

import { useParams } from "next/navigation";
import { StoryBuilder } from "@/components/gate/StoryBuilder";

export default function ReadSectionPage() {
  const params = useParams<{ n: string }>();
  const n = Math.max(1, Math.min(4, Number(params.n) || 1));
  return <StoryBuilder mode="read" index={n - 1} />;
}

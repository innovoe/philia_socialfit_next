"use client";

import { useParams } from "next/navigation";
import { StoryBuilder } from "@/components/gate/StoryBuilder";

export default function StorySectionPage() {
  const params = useParams<{ n: string }>();
  const n = Math.max(1, Math.min(7, Number(params.n) || 1));
  return <StoryBuilder mode="story" index={n - 1} />;
}

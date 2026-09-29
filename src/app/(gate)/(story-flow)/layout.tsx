"use client";

import { usePathname } from "next/navigation";
import { StoryBuilder } from "@/components/gate/StoryBuilder";
import { videos } from "@/lib/assets";

function parseStoryFlow(path: string) {
  const story = path.match(/^\/story\/(\d+)/);
  if (story) {
    const n = Math.max(1, Math.min(7, Number(story[1]) || 1));
    return { mode: "story" as const, index: n - 1 };
  }
  const read = path.match(/^\/read\/(\d+)/);
  if (read) {
    const n = Math.max(1, Math.min(4, Number(read[1]) || 1));
    return { mode: "read" as const, index: n - 1 };
  }
  return null;
}

export default function StoryFlowLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const parsed = parseStoryFlow(path);

  return (
    <>
      <link rel="preload" as="video" href={videos.storyBg} type="video/mp4" />
      {parsed ? <StoryBuilder mode={parsed.mode} index={parsed.index} /> : children}
    </>
  );
}

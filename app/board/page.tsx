"use client";

import dynamic from "next/dynamic";

const BoardShell = dynamic(() => import("@/components/board/BoardShell"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-chrome-bg text-sm text-chrome-muted">
      Lade Taktikboard…
    </div>
  ),
});

export default function BoardPage() {
  return (
    <div className="h-full w-full overflow-hidden">
      <BoardShell />
    </div>
  );
}

import { Suspense } from "react";
import EntryClient from "@/components/EntryClient";

export const dynamic = "force-dynamic";

export default function EntryPage() {
  return (
    <Suspense fallback={<div className="text-[13px] text-[#909090]">Loading…</div>}>
      <EntryClient />
    </Suspense>
  );
}

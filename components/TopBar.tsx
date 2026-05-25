"use client";

import { Search24Regular, Alert24Regular } from "@fluentui/react-icons";

export function TopBar() {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return (
    <header className="flex h-16 items-center justify-between border-b border-[#E1E1E1] bg-white px-8">
      <div>
        <div className="text-[11px] font-medium uppercase tracking-wider text-[#909090]">
          Day to Day Status
        </div>
        <div className="text-[16px] font-semibold text-[#242424]">{today}</div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search24Regular className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#909090]" />
          <input
            type="text"
            placeholder="Search…"
            className="h-9 w-72 rounded-md border border-[#D1D1D1] bg-white pl-9 pr-3 text-[13px] placeholder:text-[#A0A0A0] focus:border-[#00abc0] focus:outline-none"
          />
        </div>
        <button className="flex h-9 w-9 items-center justify-center rounded-md text-[#909090] hover:bg-[#F5F5F5]">
          <Alert24Regular className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 rounded-md border border-[#E1E1E1] py-1.5 pl-2 pr-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#00abc0] text-[11px] font-semibold text-white">
            AF
          </div>
          <span className="text-[13px] font-medium text-[#242424]">Admin</span>
        </div>
      </div>
    </header>
  );
}

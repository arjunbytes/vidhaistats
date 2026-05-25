"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  DataBarVertical24Regular,
  ClipboardTextEdit24Regular,
  History24Regular,
  Home24Regular,
  ChevronLeft24Regular,
  ChevronRight24Regular,
} from "@fluentui/react-icons";

const NAV = [
  { href: "/", label: "Overview", icon: Home24Regular },
  { href: "/entry", label: "Daily Entry", icon: ClipboardTextEdit24Regular },
  { href: "/dashboard", label: "Dashboard", icon: DataBarVertical24Regular },
  { href: "/history", label: "History Log", icon: History24Regular },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`relative flex flex-col border-r border-[#E1E1E1] bg-white transition-all duration-200 ${
        collapsed ? "w-[60px]" : "w-64"
      }`}
    >
      {/* Logo / brand */}
      <div className={`flex h-16 items-center border-b border-[#E1E1E1] ${collapsed ? "justify-center px-0" : "gap-3 px-5"}`}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#00abc0] text-white shadow-sm">
          <span className="text-base font-semibold">V</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="truncate text-[15px] font-semibold leading-tight text-[#242424]">
              Vidhai Tracker
            </div>
            <div className="text-[11px] text-[#909090]">Agaram Foundation</div>
          </div>
        )}
      </div>

      {/* Nav links */}
      <nav className={`flex-1 py-4 ${collapsed ? "px-1.5" : "px-3"}`}>
        {!collapsed && (
          <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-[#909090]">
            Workspace
          </div>
        )}
        <ul className="flex flex-col gap-1">
          {NAV.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`group flex items-center rounded-md transition-colors ${
                    collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2"
                  } text-[14px] ${
                    active
                      ? "bg-[#e6f8fb] font-semibold text-[#00abc0]"
                      : "text-[#242424] hover:bg-[#F5F5F5]"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 shrink-0 ${active ? "text-[#00abc0]" : "text-[#909090]"}`}
                  />
                  {!collapsed && (
                    <>
                      <span>{item.label}</span>
                      {active && (
                        <span className="ml-auto h-5 w-1 rounded-full bg-[#00abc0]" />
                      )}
                    </>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom card — hide when collapsed */}
      {!collapsed && (
        <div className="border-t border-[#E1E1E1] px-5 py-4">
          <div className="rounded-md bg-[#00abc0] p-3 text-white shadow-sm">
            <div className="text-[13px] font-semibold">Vidhai Applications</div>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-[72px] z-10 flex h-6 w-6 items-center justify-center rounded-full border border-[#E1E1E1] bg-white text-[#909090] shadow-sm hover:bg-[#e6f8fb] hover:text-[#00abc0] transition-colors"
      >
        {collapsed ? (
          <ChevronRight24Regular className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft24Regular className="h-3.5 w-3.5" />
        )}
      </button>
    </aside>
  );
}

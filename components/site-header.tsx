"use client";

import { useState } from "react";
import Link from "next/link";
import Brand from "@/components/brand";
import { NAV_LINKS } from "@/lib/site-config";
import { Menu, X, Flame } from "lucide-react";

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Brand href="/" theme="light" />

        <nav className="hidden lg:flex items-center gap-6 text-[12px] font-semibold text-[#475569]">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-[#0F172A] transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/demo"
            className="px-4 py-2 rounded-lg text-[12px] font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-all shadow-xs inline-flex items-center gap-2"
          >
            <Flame className="w-3.5 h-3.5 text-[#BFDBFE]" />
            Explore the Demo
          </Link>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden p-2 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
          aria-label="Toggle navigation menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-[#E2E8F0] bg-white px-4 pt-3 pb-5 space-y-3 shadow-lg">
          <nav className="flex flex-col space-y-1 text-[13px] font-medium text-[#334155]">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-[#F8FAFC] hover:text-[#1D4ED8]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/demo"
            onClick={() => setOpen(false)}
            className="w-full text-center py-2.5 rounded-lg text-[13px] font-semibold bg-[#2563EB] text-white inline-flex items-center justify-center gap-2"
          >
            <Flame className="w-4 h-4 text-[#BFDBFE]" />
            Explore the Demo
          </Link>
        </div>
      )}
    </header>
  );
}

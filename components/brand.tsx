import Link from "next/link";
import { DEVELOPER } from "@/lib/site-config";

type BrandProps = {
  href?: string;
  theme?: "light" | "dark";
  className?: string;
};

/**
 * Personal brand wordmark for the marketing surface: "Wahab / Engineering".
 * The PermitImpact AI product mark lives in `components/logo.tsx` and is used
 * inside the workspace.
 */
export default function Brand({ href, theme = "light", className = "" }: BrandProps) {
  const isDark = theme === "dark";

  const content = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        className={`h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-[15px] font-extrabold tracking-tight ring-1 ring-inset ${
          isDark
            ? "bg-white text-[#0F172A] ring-white/20"
            : "bg-[#0F172A] text-white ring-[#0F172A]"
        }`}
        aria-hidden="true"
      >
        W
      </span>
      <span className="flex flex-col leading-none">
        <span className={`text-[15px] font-bold tracking-tight ${isDark ? "text-white" : "text-[#0F172A]"}`}>
          {DEVELOPER.name}
        </span>
        <span
          className={`mt-0.5 text-[10px] font-medium tracking-wide ${
            isDark ? "text-[#94A3B8]" : "text-[#64748B]"
          }`}
        >
          Engineering
        </span>
      </span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="transition-opacity hover:opacity-80" aria-label={`${DEVELOPER.name} — Engineering`}>
        {content}
      </Link>
    );
  }

  return content;
}

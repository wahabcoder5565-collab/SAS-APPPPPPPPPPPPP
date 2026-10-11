import Link from "next/link";

type LogoMarkProps = {
  className?: string;
};

/**
 * PermitImpact AI brand mark.
 * A shield enclosing an interconnected node graph — representing
 * permit-to-operations impact mapping across facility assets.
 */
export function LogoMark({ className = "h-8 w-8" }: LogoMarkProps) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#1D4ED8] shadow-sm ring-1 ring-inset ring-white/20 ${className}`}
    >
      <svg
        viewBox="0 0 28 28"
        fill="none"
        className="relative h-[68%] w-[68%] text-white"
        aria-hidden="true"
      >
        {/* Shield outline */}
        <path
          d="M14 3L5.5 7v5.5c0 5.5 3.7 10.3 8.5 12 4.8-1.7 8.5-6.5 8.5-12V7L14 3z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Central hub node */}
        <circle cx="14" cy="12" r="2" fill="currentColor" opacity="0.85" />
        {/* Top node + connection */}
        <circle cx="14" cy="6.5" r="1.1" fill="currentColor" />
        <line x1="14" y1="6.5" x2="14" y2="10" stroke="currentColor" strokeWidth="0.9" opacity="0.7" />
        {/* Left node + connection */}
        <circle cx="9" cy="15" r="1.1" fill="currentColor" />
        <line x1="9" y1="15" x2="12.2" y2="12.8" stroke="currentColor" strokeWidth="0.9" opacity="0.7" />
        {/* Right node + connection */}
        <circle cx="19" cy="15" r="1.1" fill="currentColor" />
        <line x1="19" y1="15" x2="15.8" y2="12.8" stroke="currentColor" strokeWidth="0.9" opacity="0.7" />
        {/* Bottom node + connection */}
        <circle cx="14" cy="18.5" r="1.1" fill="currentColor" />
        <line x1="14" y1="18.5" x2="14" y2="14" stroke="currentColor" strokeWidth="0.9" opacity="0.7" />
      </svg>
    </span>
  );
}

type LogoProps = {
  href?: string;
  className?: string;
  markClassName?: string;
  showText?: boolean;
  tagline?: string;
  theme?: "light" | "dark";
};

export default function Logo({
  href,
  className = "",
  markClassName = "h-8 w-8",
  showText = true,
  tagline,
  theme = "light",
}: LogoProps) {
  const isDark = theme === "dark";

  const content = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className={markClassName} />
      {showText && (
        <span className="flex flex-col leading-none">
          <span className="flex items-baseline gap-0.5 text-[15px] font-bold tracking-tight">
            <span className={isDark ? "text-white" : "text-[#0F172A]"}>Permit</span>
            <span className="text-[#1D4ED8]">Impact</span>
            <span
              className={`ml-1 rounded px-1 py-0.5 text-[9px] font-bold tracking-wider uppercase font-mono ${
                isDark
                  ? "bg-white/10 text-[#93C5FD] border border-white/10"
                  : "bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]"
              }`}
            >
              AI
            </span>
          </span>
          {tagline ? (
            <span
              className={`mt-0.5 text-[10px] font-medium tracking-normal ${
                isDark ? "text-[#94A3B8]" : "text-[#64748B]"
              }`}
            >
              {tagline}
            </span>
          ) : null}
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="transition-opacity hover:opacity-80" aria-label="PermitImpact AI Home">
        {content}
      </Link>
    );
  }
  return content;
}

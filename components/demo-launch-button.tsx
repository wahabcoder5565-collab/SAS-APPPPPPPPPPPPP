"use client";

import { useTransition } from "react";
import { demoLoginAction, type RefineryRole } from "@/app/auth/actions";
import { ArrowRight, Flame, Loader2 } from "lucide-react";

interface DemoLaunchButtonProps {
  role?: RefineryRole;
  label?: string;
  className?: string;
  variant?: "primary" | "secondary" | "card";
  children?: React.ReactNode;
}

export default function DemoLaunchButton({
  role = "engineer",
  label,
  className = "",
  variant = "primary",
  children,
}: DemoLaunchButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleLaunch = () => {
    startTransition(async () => {
      try {
        await demoLoginAction(role);
      } catch (err: any) {
        // Next.js redirect throws a digest error; if another error, fallback to /login
        if (!err?.digest?.startsWith("NEXT_REDIRECT")) {
          window.location.href = "/login";
        }
      }
    });
  };

  if (variant === "card") {
    return (
      <button
        onClick={handleLaunch}
        disabled={isPending}
        className={`w-full text-left transition-all cursor-pointer relative ${className}`}
      >
        {children}
        {isPending && (
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-[#1D4ED8] font-semibold animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1D4ED8]" />
            <span>Connecting to NorthRiver refinery console...</span>
          </div>
        )}
      </button>
    );
  }

  if (variant === "secondary") {
    return (
      <button
        onClick={handleLaunch}
        disabled={isPending}
        className={`forge-btn-outline ${className}`}
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Connecting Demo...</span>
          </>
        ) : (
          <>
            <Flame className="w-4 h-4 text-[#60A5FA]" />
            <span>{label || "View Interactive Demo"}</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleLaunch}
      disabled={isPending}
      className={`forge-btn-primary ${className}`}
    >
      {isPending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-white" />
          <span>Opening Refinery Console...</span>
        </>
      ) : (
        <>
          <Flame className="w-4 h-4 text-[#93C5FD]" />
          <span>{label || "Open Demo"}</span>
          <ArrowRight className="w-4 h-4" />
        </>
      )}
    </button>
  );
}

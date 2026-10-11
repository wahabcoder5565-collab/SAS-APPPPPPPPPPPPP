import { demoLoginAction, type RefineryRole } from "@/app/auth/actions";
import { redirect } from "next/navigation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const roleParam = url.searchParams.get("role") as RefineryRole | null;
  const role: RefineryRole =
    roleParam === "manager" || roleParam === "operations" || roleParam === "reviewer"
      ? roleParam
      : "engineer";

  try {
    await demoLoginAction(role);
  } catch (err: any) {
    // Next.js redirect throws a special internal error; re-throw so it works
    if (err?.digest?.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    // Fallback if network or Supabase error
    return redirect("/login");
  }
}

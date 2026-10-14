import { demoLoginAction, type RefineryRole } from "@/app/auth/actions";
import { redirect } from "next/navigation";

/**
 * Guest launcher: signs in the requested demo persona and lands in the
 * workspace. Kept separate from /demo so that /demo can be a public explainer.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const roleParam = url.searchParams.get("role") as RefineryRole | null;
  const role: RefineryRole =
    roleParam === "manager" || roleParam === "operations" || roleParam === "reviewer"
      ? roleParam
      : "engineer";

  try {
    await demoLoginAction(role);
  } catch (err) {
    const digest =
      typeof err === "object" && err !== null && "digest" in err
        ? (err as { digest?: unknown }).digest
        : undefined;
    if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    return redirect("/login");
  }
}

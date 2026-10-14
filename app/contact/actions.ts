"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const ContactSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(120),
  email: z.string().trim().email("Please enter a valid email address.").max(200),
  message: z
    .string()
    .trim()
    .min(10, "Please write at least 10 characters so I can respond usefully.")
    .max(4000),
  intent: z.enum(["opportunity", "collaboration", "general"]).default("general"),
});

export type ContactFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

export const initialContactState: ContactFormState = { status: "idle" };

export async function submitContactAction(
  _prev: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const parsed = ContactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
    intent: formData.get("intent") || "general",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { status: "error", message: "Please correct the highlighted fields.", fieldErrors };
  }

  // Basic bot deterrent: hidden honeypot field must remain empty.
  if ((formData.get("company") as string | null)?.trim()) {
    return { status: "success", message: "Thanks — your message has been received." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("pi_contact_messages").insert({
    name: parsed.data.name,
    email: parsed.data.email,
    message: parsed.data.message,
    intent: parsed.data.intent,
    source: "website",
  });

  if (error) {
    console.error("Contact submission failed:", error.message);
    return {
      status: "error",
      message: "Something went wrong storing your message. Please email me directly instead.",
    };
  }

  return {
    status: "success",
    message: "Thanks — your message has been stored and I'll get back to you.",
  };
}

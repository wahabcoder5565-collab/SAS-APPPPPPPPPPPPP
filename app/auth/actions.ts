"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData): Promise<void> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}

export async function signupAction(formData: FormData): Promise<void> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;
  const role = (formData.get("role") as string) || "engineer";

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: role,
      },
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  if (data.user) {
    await supabase.from("pi_users").upsert({
      id: data.user.id,
      full_name: fullName,
      role: role,
    });
  }

  redirect("/dashboard");
}

export type RefineryRole = "engineer" | "manager" | "operations" | "reviewer";

export async function demoLoginAction(role: RefineryRole): Promise<void> {
  const supabase = await createClient();
  const email = `demo.${role}@northriverrefining.com`;
  const password = "DemoPassword123!";

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // If sign in fails, attempt signup with auto-profile
    const roleMeta: Record<RefineryRole, { full_name: string; title: string; department: string }> = {
      engineer: {
        full_name: "Sarah Lin",
        title: "Senior Air Quality Engineer",
        department: "Environmental Compliance",
      },
      manager: {
        full_name: "Marcus Vance",
        title: "Environmental Compliance Manager",
        department: "Refinery Management",
      },
      operations: {
        full_name: "David Chen",
        title: "Utilities & Steam Plant Lead",
        department: "Plant Operations",
      },
      reviewer: {
        full_name: "Elena Rostova",
        title: "Lead Regulatory Auditor",
        department: "Quality Assurance & Audit",
      },
    };

    const meta = roleMeta[role];
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: meta.full_name,
          role: role,
          title: meta.title,
          department: meta.department,
        },
      },
    });

    if (signUpError) {
      redirect(`/login?error=${encodeURIComponent(signUpError.message)}`);
    }

    if (signUpData.user) {
      await supabase.from("pi_users").upsert({
        id: signUpData.user.id,
        email: email,
        full_name: meta.full_name,
        role: role,
        title: meta.title,
        department: meta.department,
      });
    }
  } else if (data.user) {
    // Keep profile fresh
    const roleMeta: Record<RefineryRole, { full_name: string; title: string; department: string }> = {
      engineer: {
        full_name: "Sarah Lin",
        title: "Senior Air Quality Engineer",
        department: "Environmental Compliance",
      },
      manager: {
        full_name: "Marcus Vance",
        title: "Environmental Compliance Manager",
        department: "Refinery Management",
      },
      operations: {
        full_name: "David Chen",
        title: "Utilities & Steam Plant Lead",
        department: "Plant Operations",
      },
      reviewer: {
        full_name: "Elena Rostova",
        title: "Lead Regulatory Auditor",
        department: "Quality Assurance & Audit",
      },
    };
    const meta = roleMeta[role];
    await supabase.from("pi_users").upsert({
      id: data.user.id,
      email: data.user.email,
      full_name: meta.full_name,
      role: role,
      title: meta.title,
      department: meta.department,
    });
  }

  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

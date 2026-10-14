"use client";

import { useActionState } from "react";
import {
  submitContactAction,
  initialContactState,
} from "@/app/contact/actions";
import { DEVELOPER } from "@/lib/site-config";
import { CheckCircle2, AlertCircle, Send, Mail } from "lucide-react";

const inputClass =
  "w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border border-[#CBD5E1] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all";

export default function ContactForm() {
  const [state, formAction, isPending] = useActionState(
    submitContactAction,
    initialContactState
  );

  if (state.status === "success") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="w-12 h-12 rounded-xl bg-white border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-[#0F172A]">Message received</h3>
        <p className="mt-2 text-sm text-[#475569] max-w-md mx-auto">
          {state.message}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <a
            href={`mailto:${DEVELOPER.links.email}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0F172A] text-white text-xs font-semibold"
          >
            <Mail className="w-3.5 h-3.5" /> {DEVELOPER.links.email}
          </a>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8 shadow-xs text-left">
      {state.status === "error" && state.message && (
        <div className="mb-5 flex items-start gap-2 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{state.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="contact-name" className="block text-xs font-bold text-[#334155] mb-1.5">
            Name
          </label>
          <input id="contact-name" name="name" type="text" required placeholder="Your name" className={inputClass} />
          {state.fieldErrors?.name && (
            <p className="mt-1 text-[11px] text-rose-600">{state.fieldErrors.name}</p>
          )}
        </div>
        <div>
          <label htmlFor="contact-email" className="block text-xs font-bold text-[#334155] mb-1.5">
            Email
          </label>
          <input id="contact-email" name="email" type="email" required placeholder="you@company.com" className={inputClass} />
          {state.fieldErrors?.email && (
            <p className="mt-1 text-[11px] text-rose-600">{state.fieldErrors.email}</p>
          )}
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="contact-intent" className="block text-xs font-bold text-[#334155] mb-1.5">
          What is this about?
        </label>
        <select id="contact-intent" name="intent" defaultValue="opportunity" className={inputClass}>
          <option value="opportunity">Engineering opportunity</option>
          <option value="collaboration">Custom software project</option>
          <option value="general">General question</option>
        </select>
      </div>

      <div className="mt-4">
        <label htmlFor="contact-message" className="block text-xs font-bold text-[#334155] mb-1.5">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={4}
          required
          placeholder="Tell me what you're working on, or which part of the project you'd like to discuss."
          className={`${inputClass} resize-none`}
        />
        {state.fieldErrors?.message && (
          <p className="mt-1 text-[11px] text-rose-600">{state.fieldErrors.message}</p>
        )}
      </div>

      {/* Honeypot — hidden from users, left empty by real submissions */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="contact-company">Company</label>
        <input id="contact-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-5 w-full sm:w-auto px-6 py-3 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
      >
        {isPending ? "Sending…" : "Send message"}
        <Send className="w-4 h-4" />
      </button>

      <p className="mt-3 text-[11px] text-[#64748B]">
        Submissions are stored in the project database. Prefer email?{" "}
        <a href={`mailto:${DEVELOPER.links.email}`} className="text-[#2563EB] font-medium inline-flex items-center gap-1">
          <Mail className="w-3 h-3" /> {DEVELOPER.links.email}
        </a>
      </p>
    </form>
  );
}

"use client";

import { useState } from "react";
import {
  Calendar,
  Clock,
  Video,
  CheckCircle2,
  X,
  Building2,
  Shield,
  ArrowRight,
  Flame,
  FileCheck,
} from "lucide-react";

interface WalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalkthroughModal({ isOpen, onClose }: WalkthroughModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    facilityType: "Petroleum Refining (Title V)",
    scope: "Revised Permit Delta & Limit Tightening",
    preferredTime: "Morning (9am - 12pm CT)",
    notes: "",
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const resetAndClose = () => {
    setSubmitted(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070B14]/60 backdrop-blur-sm"
      onClick={resetAndClose}
    >
      <div
        className="relative w-full max-w-xl rounded-2xl bg-white border border-[#E2E8F0] shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={resetAndClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#94A3B8] hover:text-[#334155] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {!submitted ? (
          <div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E40AF] text-xs font-semibold w-fit mb-3">
              <Video className="w-3.5 h-3.5 text-[#1D4ED8]" />
              Direct Technical Walkthrough · Google Meet
            </div>

            <h3 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight">
              Book a Google Meet Walkthrough
            </h3>
            <p className="text-xs sm:text-sm text-[#64748B] mt-2 leading-relaxed">
              No sales maze. No forced signups. We will walk through the working NorthRiver Refining demo, discuss your
              facility&apos;s permit structure, and explore how the workflow fits your operating units.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1.5" htmlFor="wt-name">
                    Full Name *
                  </label>
                  <input
                    id="wt-name"
                    type="text"
                    required
                    placeholder="e.g. Sarah Lin"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:bg-white focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1.5" htmlFor="wt-email">
                    Work Email *
                  </label>
                  <input
                    id="wt-email"
                    type="email"
                    required
                    placeholder="name@refinery-corp.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:bg-white focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8] transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1.5" htmlFor="wt-facility">
                    Facility Sector
                  </label>
                  <select
                    id="wt-facility"
                    value={formData.facilityType}
                    onChange={(e) => setFormData({ ...formData, facilityType: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] focus:outline-none focus:bg-white focus:border-[#1D4ED8] transition-all cursor-pointer font-medium"
                  >
                    <option value="Petroleum Refining (Title V)">Petroleum Refining (Title V)</option>
                    <option value="Petrochemicals & Polymers">Petrochemicals & Polymers</option>
                    <option value="Specialty Chemical Plant">Specialty Chemical Plant</option>
                    <option value="Power Generation / Cogeneration">Power Generation / Cogeneration</option>
                    <option value="Pulp & Paper / Heavy Industrial">Pulp & Paper / Heavy Industrial</option>
                    <option value="Other Industrial Facility">Other Industrial Facility</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1.5" htmlFor="wt-scope">
                    Primary Review Focus
                  </label>
                  <select
                    id="wt-scope"
                    value={formData.scope}
                    onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] focus:outline-none focus:bg-white focus:border-[#1D4ED8] transition-all cursor-pointer font-medium"
                  >
                    <option value="Revised Permit Delta & Limit Tightening">Permit Delta & Limit Tightening</option>
                    <option value="Equipment & Process Change Screening">Equipment Change Screening</option>
                    <option value="SOP, Alarm & Form Alignment">SOP & Form Alignment Auditing</option>
                    <option value="Monitoring & CEMS Readiness">Monitoring & CEMS Readiness</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1.5" htmlFor="wt-time">
                  Preferred Time Window
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["Morning (9-12 CT)", "Afternoon (1-4 CT)", "Late Afternoon (4-6 CT)"].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setFormData({ ...formData, preferredTime: slot })}
                      className={`px-2.5 py-2 rounded-xl text-[11px] font-semibold border text-center transition-all cursor-pointer ${
                        formData.preferredTime === slot
                          ? "bg-[#EFF6FF] border-[#1D4ED8] text-[#1E40AF] shadow-xs"
                          : "bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1.5" htmlFor="wt-notes">
                  Facility Context / Current Regulatory Challenge (Optional)
                </label>
                <textarea
                  id="wt-notes"
                  rows={2}
                  placeholder="e.g. Preparing for Title V renewal in Q3; screening upcoming SCR catalyst change against operating limits..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:bg-white focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8] transition-all resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs sm:text-sm font-semibold shadow-lg shadow-[#1D4ED8]/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Video className="w-4 h-4" />
                  Confirm Google Meet Request
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-[11px] text-center text-[#94A3B8] mt-2.5">
                  No payment gate · Direct technical walkthrough · Calendar invite within 2 business hours
                </p>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] flex items-center justify-center mx-auto mb-4 shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-[#0F172A]">Walkthrough Request Received</h3>
            <p className="text-xs sm:text-sm text-[#64748B] mt-2 max-w-md mx-auto leading-relaxed">
              Thank you, <strong className="text-[#0F172A]">{formData.name}</strong>. A calendar invite for your Google
              Meet walkthrough has been queued for <strong className="text-[#1D4ED8]">{formData.email}</strong> during
              your preferred window (<strong className="text-[#0F172A]">{formData.preferredTime}</strong>).
            </p>

            <div className="mt-5 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-left text-xs space-y-2 max-w-md mx-auto">
              <div className="text-[#64748B] font-bold uppercase tracking-wider text-[10px]">
                Session Overview
              </div>
              <div className="flex items-center gap-2 text-[#334155]">
                <Building2 className="w-3.5 h-3.5 text-[#1D4ED8]" />
                <span>
                  Sector: <strong className="text-[#0F172A]">{formData.facilityType}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 text-[#334155]">
                <FileCheck className="w-3.5 h-3.5 text-[#047857]" />
                <span>
                  Focus: <strong className="text-[#0F172A]">{formData.scope}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 text-[#334155]">
                <Shield className="w-3.5 h-3.5 text-[#1D4ED8]" />
                <span>Format: Direct technical walkthrough of NorthRiver Refining demo</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="/demo"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-semibold inline-flex items-center justify-center gap-2 transition-all shadow-md shadow-[#1D4ED8]/20"
              >
                Explore NorthRiver Demo in the Meantime
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={resetAndClose}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155] text-xs font-semibold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

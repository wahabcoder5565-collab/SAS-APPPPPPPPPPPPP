"use client";

import { useState } from "react";
import Link from "next/link";
import { createPermitAction, uploadPermitPdfAction } from "@/app/permits/actions";
import {
  ArrowLeft,
  Upload,
  Sparkles,
} from "lucide-react";

export default function NewPermitPage() {
  const [loading, setLoading] = useState(false);
  const [rawText, setRawText] = useState("");
  const [title, setTitle] = useState("");
  const [permitNumber, setPermitNumber] = useState("");
  const [agency, setAgency] = useState("State Department of Environmental Quality / EPA Region 6");
  const [type, setType] = useState<"current" | "revised">("revised");
  const [effectiveDate, setEffectiveDate] = useState("2024-10-01");
  const [error, setError] = useState("");

  const sampleTemplate = `TITLE V OPERATING PERMIT RENEWAL DRAFT T-V-2024-REV
Facility: NorthRiver Refining Complex 1

Section IV.B.1: Utility Boiler B-07 NOx emission limit shall not exceed 0.035 lb/MMBtu on a 24-hour rolling average, demonstrated by continuous emission monitoring system (CEMS).
Section VI.A.3: Cooling Tower CT-4 weekly VOC sampling via TCEQ Modified El Paso Method stripping column analysis.
Section VII.C.2: Flare FL-1 combustion zone net heating value (NHVcz) shall be maintained at or above 300 Btu/scf at all times on a 15-minute block average.
Section III.A.2: Fluid Catalytic Cracking Unit (FCCU-1) regenerator flue gas opacity shall not exceed 20% on a 6-minute average.
Section V.B.4: Sulfur Recovery Unit (SRU-2) Claus and tail gas treating unit shall maintain 99.8% sulfur recovery efficiency.`;

  function loadSample() {
    setTitle("NorthRiver Refining Title V Renewal Draft (Revised 2024)");
    setPermitNumber("T-V-2024-REV");
    setAgency("State Dept of Environmental Quality / EPA Region 6");
    setType("revised");
    setEffectiveDate("2024-10-01");
    setRawText(sampleTemplate);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link
          href="/permits"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Permits
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-800/50 text-cyan-400 text-xs font-semibold mb-2">
              <Upload className="w-3.5 h-3.5" /> New Ingestion Pipeline
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Ingest Air Operating Permit
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Upload PDF or paste regulatory permit clauses. Gemini AI automatically parses sections and extracts structured obligations.
            </p>
          </div>

          <button
            type="button"
            onClick={loadSample}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Load Sample Permit Data
          </button>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl border-slate-800">
        <form
          action={async (formData: FormData) => {
            const pdf = formData.get("pdfFile");
            if (pdf instanceof File && pdf.size > 0) {
              await uploadPermitPdfAction(formData);
            } else {
              await createPermitAction(formData);
            }
          }}
          onSubmit={(e) => {
            const pdf = new FormData(e.currentTarget).get("pdfFile");
            const hasPdf = pdf instanceof File && pdf.size > 0;
            if (!hasPdf && !rawText.trim()) {
              e.preventDefault();
              setError("Paste permit text or attach a PDF file to continue.");
              return;
            }
            setError("");
            setLoading(true);
          }}
          className="space-y-5"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Permit Document Title
              </label>
              <input
                type="text"
                name="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. NorthRiver Refining Title V Renewal Draft"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Permit Identification Number
              </label>
              <input
                type="text"
                name="permitNumber"
                required
                value={permitNumber}
                onChange={(e) => setPermitNumber(e.target.value)}
                placeholder="e.g. T-V-2024-REV"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs font-mono text-slate-100 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Permit Type
              </label>
              <select
                name="type"
                value={type}
                onChange={(e) => setType(e.target.value as "current" | "revised")}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-slate-100 outline-none"
              >
                <option value="revised">Revised / Renewal Draft</option>
                <option value="current">Current Baseline Permit</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Regulatory Agency
              </label>
              <input
                type="text"
                name="agency"
                required
                value={agency}
                onChange={(e) => setAgency(e.target.value)}
                placeholder="e.g. State DEQ / EPA Region 6"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Effective / Issued Date
              </label>
              <input
                type="date"
                name="effectiveDate"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-slate-100 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Permit Text / Provisions (or OCR Transcriptions)
            </label>
            <textarea
              name="rawText"
              rows={10}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste permit text with emission limits, monitoring frequencies, and regulatory conditions..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs font-mono text-slate-200 outline-none leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Or Attach Permit PDF (text-based, max 20 MB)
            </label>
            <input
              type="file"
              name="pdfFile"
              accept="application/pdf,.pdf"
              className="block w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-slate-800 file:text-cyan-400 file:text-xs file:font-semibold hover:file:bg-slate-700 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 mt-1.5">
              PDF text is extracted server-side (unpdf), then obligations are parsed with Gemini AI or the deterministic fallback parser. If both are provided, the PDF is used.
            </p>
          </div>

          {error && (
            <div className="px-3.5 py-2.5 rounded-xl bg-red-950/60 border border-red-800/60 text-red-300 text-xs">
              {error}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-cyan-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Extracting Obligations with Gemini AI...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Ingest Permit & Run AI Extraction
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

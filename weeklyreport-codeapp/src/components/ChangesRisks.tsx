import { useState } from "react";
import type { PumChangeRequest, PumRisk } from "../types/dataverse";
import type { Lang } from "../i18n/translations";
import { t } from "../i18n/translations";

// ── Changes ──────────────────────────────────────────────────

interface ChangesProps {
  changes: PumChangeRequest[];
  lang: Lang;
  readOnly?: boolean;
  onAdd?: (data: { pum_name: string; pum_description?: string }) => Promise<void>;
}

const APPROVED_BADGE: Record<string, string> = {
  yes: "bg-[#188c5b]/10 text-status-success",
  no:  "bg-audico-mid-grey-3 text-audico-mid-grey-1",
};

export function ChangesTable({ changes, lang, readOnly = false, onAdd }: ChangesProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!onAdd || !name.trim()) return;
    setSubmitting(true);
    try {
      await onAdd({ pum_name: name.trim(), pum_description: desc.trim() || undefined });
      setName("");
      setDesc("");
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    setOpen(false);
    setName("");
    setDesc("");
  }

  return (
    <section className="report-section">
      <h3 className="section-subtitle">{t("changes", lang)}</h3>
      {changes.length === 0 ? (
        <p className="text-sm text-audico-mid-grey-1 italic">{t("noChanges", lang)}</p>
      ) : (
        <table className="report-table">
          <thead>
            <tr>
              <th>{t("change", lang)}</th>
              <th className="w-32">{t("status", lang)}</th>
              <th className="w-32">{t("dateApproved", lang)}</th>
              <th>{t("note", lang)}</th>
            </tr>
          </thead>
          <tbody>
            {changes.map((c) => {
              const approved = c.pum_approved === true;
              const badgeClass = approved ? APPROVED_BADGE.yes : APPROVED_BADGE.no;
              return (
                <tr key={c.pum_changerequestid}>
                  <td>{c.pum_name}</td>
                  <td>
                    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full ${badgeClass}`}>
                      {approved ? t("statusApproved", lang) : t("statusNotApproved", lang)}
                    </span>
                  </td>
                  <td className="text-xs text-audico-dark-grey">
                    {c.pum_dateapproved ? new Date(c.pum_dateapproved).toLocaleDateString() : "—"}
                  </td>
                  <td>{c.pum_description ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {!readOnly && onAdd && (
        <div className="mt-3 print:hidden">
          {!open ? (
            <button
              className="text-sm font-semibold text-[var(--audico-accent)] hover:underline"
              onClick={() => setOpen(true)}
            >
              {t("addChange", lang)}
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="mt-2 p-4 bg-audico-light-grey rounded border border-audico-mid-grey-3 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-audico-dark-grey mb-1">
                  {t("change", lang)} *
                </label>
                <input
                  className="w-full px-3 py-1.5 text-sm border border-audico-mid-grey-3 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[var(--audico-accent)]"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-audico-dark-grey mb-1">
                  {t("description", lang)}
                </label>
                <textarea
                  className="w-full px-3 py-1.5 text-sm border border-audico-mid-grey-3 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[var(--audico-accent)] resize-none"
                  rows={2}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting || !name.trim()}
                  className="px-3 py-1.5 text-sm font-semibold rounded bg-[var(--audico-accent)] text-white
                             hover:bg-[var(--audico-accent-hover)] transition-colors
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? t("adding", lang) : t("add", lang)}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-3 py-1.5 text-sm font-semibold rounded bg-white text-audico-black
                             border border-audico-mid-grey-3 hover:bg-audico-light-grey transition-colors"
                >
                  {t("cancel", lang)}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </section>
  );
}

// ── Risks ─────────────────────────────────────────────────────

interface RisksProps {
  risks: PumRisk[];
  lang: Lang;
  readOnly?: boolean;
  onAdd?: (data: { pum_name: string; pum_riskdescription?: string; pum_riskimpact?: number; pum_probability?: number }) => Promise<void>;
}

const IMPACT_OPTIONS: { value: number; label: string }[] = [
  { value: 976880000, label: "1 — Very Low" },
  { value: 976880001, label: "2 — Low" },
  { value: 976880002, label: "3 — Medium" },
  { value: 976880003, label: "4 — High" },
  { value: 976880004, label: "5 — Very High" },
];

const PROBABILITY_OPTIONS: { value: number; label: string }[] = [
  { value: 976880000, label: "10 %" },
  { value: 976880001, label: "30 %" },
  { value: 976880002, label: "50 %" },
  { value: 976880003, label: "70 %" },
  { value: 976880004, label: "90 %" },
];

const IMPACT_LABELS: Record<number, string> = Object.fromEntries(IMPACT_OPTIONS.map((o) => [o.value, o.label]));
const PROBABILITY_LABELS: Record<number, string> = Object.fromEntries(PROBABILITY_OPTIONS.map((o) => [o.value, o.label]));

function impactLabel(impact?: number): string {
  if (impact == null) return "—";
  return IMPACT_LABELS[impact] ?? String(impact);
}

function probabilityLabel(prob?: number): string {
  if (prob == null) return "—";
  return PROBABILITY_LABELS[prob] ?? String(prob);
}

export function RisksTable({ risks, lang, readOnly = false, onAdd }: RisksProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [riskDesc, setRiskDesc] = useState("");
  const [impact, setImpact] = useState<string>("");
  const [probability, setProbability] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!onAdd || !name.trim()) return;
    setSubmitting(true);
    try {
      await onAdd({
        pum_name: name.trim(),
        pum_riskdescription: riskDesc.trim() || undefined,
        pum_riskimpact: impact !== "" ? Number(impact) : undefined,
        pum_probability: probability !== "" ? Number(probability) : undefined,
      });
      setName("");
      setRiskDesc("");
      setImpact("");
      setProbability("");
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    setOpen(false);
    setName("");
    setRiskDesc("");
    setImpact("");
    setProbability("");
  }

  return (
    <section className="report-section">
      <h3 className="section-subtitle">{t("risks", lang)}</h3>
      {risks.length === 0 ? (
        <p className="text-sm text-audico-mid-grey-1 italic">{t("noRisks", lang)}</p>
      ) : (
        <table className="report-table">
          <thead>
            <tr>
              <th>{t("risk", lang)}</th>
              <th className="col-num">{t("impact", lang)}</th>
              <th className="col-num">{t("probability", lang)}</th>
            </tr>
          </thead>
          <tbody>
            {risks.map((r) => (
              <tr key={r.pum_riskid}>
                <td>
                  <span className="font-semibold">{r.pum_name}</span>
                  {r.pum_riskdescription && (
                    <div className="text-xs text-audico-mid-grey-1 mt-0.5">{r.pum_riskdescription}</div>
                  )}
                </td>
                <td className="col-num">{impactLabel(r.pum_riskimpact)}</td>
                <td className="col-num">{probabilityLabel(r.pum_probability)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!readOnly && onAdd && (
        <div className="mt-3 print:hidden">
          {!open ? (
            <button
              className="text-sm font-semibold text-[var(--audico-accent)] hover:underline"
              onClick={() => setOpen(true)}
            >
              {t("addRisk", lang)}
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="mt-2 p-4 bg-audico-light-grey rounded border border-audico-mid-grey-3 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-audico-dark-grey mb-1">
                  {t("risk", lang)} *
                </label>
                <input
                  className="w-full px-3 py-1.5 text-sm border border-audico-mid-grey-3 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[var(--audico-accent)]"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-audico-dark-grey mb-1">
                  {t("description", lang)}
                </label>
                <textarea
                  className="w-full px-3 py-1.5 text-sm border border-audico-mid-grey-3 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[var(--audico-accent)] resize-none"
                  rows={2}
                  value={riskDesc}
                  onChange={(e) => setRiskDesc(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-audico-dark-grey mb-1">
                    {t("impact", lang)}
                  </label>
                  <select
                    className="w-full px-3 py-1.5 text-sm border border-audico-mid-grey-3 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[var(--audico-accent)]"
                    value={impact}
                    onChange={(e) => setImpact(e.target.value)}
                  >
                    <option value="">—</option>
                    {IMPACT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-audico-dark-grey mb-1">
                    {t("probability", lang)}
                  </label>
                  <select
                    className="w-full px-3 py-1.5 text-sm border border-audico-mid-grey-3 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[var(--audico-accent)]"
                    value={probability}
                    onChange={(e) => setProbability(e.target.value)}
                  >
                    <option value="">—</option>
                    {PROBABILITY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting || !name.trim()}
                  className="px-3 py-1.5 text-sm font-semibold rounded bg-[var(--audico-accent)] text-white
                             hover:bg-[var(--audico-accent-hover)] transition-colors
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? t("adding", lang) : t("add", lang)}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-3 py-1.5 text-sm font-semibold rounded bg-white text-audico-black
                             border border-audico-mid-grey-3 hover:bg-audico-light-grey transition-colors"
                >
                  {t("cancel", lang)}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </section>
  );
}

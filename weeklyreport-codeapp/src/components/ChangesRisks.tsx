import type { PumChangeRequest, PumRisk } from "../types/dataverse";
import type { Lang } from "../i18n/translations";
import { t } from "../i18n/translations";

// ── Changes ──────────────────────────────────────────────────

interface ChangesProps {
  changes: PumChangeRequest[];
  lang: Lang;
}

const APPROVED_BADGE: Record<string, string> = {
  yes: "bg-[#188c5b]/10 text-status-success",
  no:  "bg-audico-mid-grey-3 text-audico-mid-grey-1",
};

export function ChangesTable({ changes, lang }: ChangesProps) {
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
    </section>
  );
}

// ── Risks ─────────────────────────────────────────────────────

interface RisksProps {
  risks: PumRisk[];
  lang: Lang;
}

const IMPACT_LABELS: Record<number, string> = {
  976880000: "1 — Very Low",
  976880001: "2 — Low",
  976880002: "3 — Medium",
  976880003: "4 — High",
  976880004: "5 — Very High",
};

const PROBABILITY_LABELS: Record<number, string> = {
  976880000: "10 %",
  976880001: "30 %",
  976880002: "50 %",
  976880003: "70 %",
  976880004: "90 %",
};

function impactLabel(impact?: number): string {
  if (impact == null) return "—";
  return IMPACT_LABELS[impact] ?? String(impact);
}

function probabilityLabel(prob?: number): string {
  if (prob == null) return "—";
  return PROBABILITY_LABELS[prob] ?? String(prob);
}

export function RisksTable({ risks, lang }: RisksProps) {
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
    </section>
  );
}

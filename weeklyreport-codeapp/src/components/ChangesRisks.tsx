import React from "react";
import type { PumChangeRequest, PumRisk } from "../types/dataverse";
import type { Lang } from "../i18n/translations";
import { t } from "../i18n/translations";

// ── Changes ──────────────────────────────────────────────────

interface ChangesProps {
  changes: PumChangeRequest[];
  lang: Lang;
}

const STATUS_LABEL_KEYS: Record<number, "statusOpen" | "statusApproved" | "statusRejected" | "statusPending"> = {
  1: "statusOpen",
  2: "statusApproved",
  3: "statusRejected",
  4: "statusPending",
};

export function ChangesTable({ changes, lang }: ChangesProps) {
  return (
    <section className="report-section">
      <h3 className="report-section__subtitle">{t("changes", lang)}</h3>
      {changes.length === 0 ? (
        <p className="empty-state">{t("noChanges", lang)}</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>{t("change", lang)}</th>
              <th>{t("status", lang)}</th>
              <th>{t("note", lang)}</th>
            </tr>
          </thead>
          <tbody>
            {changes.map((c) => {
              const statusKey = STATUS_LABEL_KEYS[c.statuscode ?? 0];
              return (
                <tr key={c.pum_changerequestid}>
                  <td>{c.pum_name}</td>
                  <td>
                    {c.statuscode_label ?? (statusKey ? t(statusKey, lang) : "—")}
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

// pum_riskimpact option set labels (from xPM risk matrix)
const IMPACT_LABELS: Record<number, string> = {
  976880000: "1 - Very Low",
  976880001: "2 - Low",
  976880002: "3 - Medium",
  976880003: "4 - High",
  976880004: "5 - Very High",
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
      <h3 className="report-section__subtitle">{t("risks", lang)}</h3>
      {risks.length === 0 ? (
        <p className="empty-state">{t("noRisks", lang)}</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>{t("risk", lang)}</th>
              <th className="data-table__num">{t("impact", lang)}</th>
              <th className="data-table__num">{t("probability", lang)}</th>
            </tr>
          </thead>
          <tbody>
            {risks.map((r) => (
              <tr key={r.pum_riskid}>
                <td>
                  <strong>{r.pum_name}</strong>
                  {r.pum_riskdescription && (
                    <div className="risk-description">{r.pum_riskdescription}</div>
                  )}
                </td>
                <td className="data-table__num">{impactLabel(r.pum_riskimpact)}</td>
                <td className="data-table__num">
                  {probabilityLabel(r.pum_probability)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

import React from "react";
import type { PumChangeRequest, PumRisk } from "../types/dataverse";

// ── Changes ──────────────────────────────────────────────────

interface ChangesProps {
  changes: PumChangeRequest[];
}

const STATUS_LABELS: Record<number, string> = {
  1: "Open",
  2: "Approved",
  3: "Rejected",
  4: "Pending Approval",
};

export function ChangesTable({ changes }: ChangesProps) {
  return (
    <section className="report-section">
      <h3 className="report-section__subtitle">Changes</h3>
      {changes.length === 0 ? (
        <p className="empty-state">No recorded changes.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Change</th>
              <th>Status</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {changes.map((c) => (
              <tr key={c.pum_changerequestid}>
                <td>{c.pum_name}</td>
                <td>
                  {c.statuscode_label ??
                    STATUS_LABELS[c.statuscode ?? 0] ??
                    "—"}
                </td>
                <td>{c.pum_description ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

// ── Risks ─────────────────────────────────────────────────────

interface RisksProps {
  risks: PumRisk[];
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

export function RisksTable({ risks }: RisksProps) {
  return (
    <section className="report-section">
      <h3 className="report-section__subtitle">Risks</h3>
      {risks.length === 0 ? (
        <p className="empty-state">No active risks.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Risk</th>
              <th className="data-table__num">Impact</th>
              <th className="data-table__num">Probability</th>
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

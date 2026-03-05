import React from "react";
import type { PumChangeRequest, PumRisk } from "../types/dataverse";

// ── Changes ──────────────────────────────────────────────────

interface ChangesProps {
  changes: PumChangeRequest[];
}

const STATUS_LABELS: Record<number, string> = {
  1: "Avoin",
  2: "Hyväksytty",
  3: "Hylätty",
  4: "Odottaa hyväksyntää",
};

export function ChangesTable({ changes }: ChangesProps) {
  return (
    <section className="report-section">
      <h3 className="report-section__subtitle">Muutokset</h3>
      {changes.length === 0 ? (
        <p className="empty-state">Ei kirjattuja muutoksia.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Muutos</th>
              <th>Tila</th>
              <th>Huomio</th>
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
      <p className="data-source-note">
        Datalähde: xPM <code>pum_changerequest</code>. Automaattinen.
      </p>
    </section>
  );
}

// ── Risks ─────────────────────────────────────────────────────

interface RisksProps {
  risks: PumRisk[];
}

function impactLabel(impact?: number): string {
  if (!impact) return "—";
  return `${impact}/5`;
}

export function RisksTable({ risks }: RisksProps) {
  return (
    <section className="report-section">
      <h3 className="report-section__subtitle">Riskit</h3>
      {risks.length === 0 ? (
        <p className="empty-state">Ei aktiivisia riskejä.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Riski</th>
              <th className="data-table__num">Vaikutus</th>
              <th className="data-table__num">Todennäköisyys</th>
            </tr>
          </thead>
          <tbody>
            {risks.map((r) => (
              <tr key={r.pum_riskid}>
                <td>
                  <strong>{r.pum_name}</strong>
                  {r.pum_description && (
                    <div className="risk-description">{r.pum_description}</div>
                  )}
                </td>
                <td className="data-table__num">{impactLabel(r.pum_impact)}</td>
                <td className="data-table__num">
                  {r.pum_probability != null ? `${r.pum_probability} %` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="data-source-note">
        Datalähde: xPM <code>pum_risk</code> (Impact, Probability). Automaattinen.
      </p>
    </section>
  );
}

import React from "react";
import type { StaffingRow } from "../types/dataverse";
import { totalStaffing } from "../utils/staffingAggregator";

interface Props {
  rows: StaffingRow[];
  weekNumber: number;
}

export function StaffingTable({ rows, weekNumber }: Props) {
  const total = totalStaffing(rows);

  return (
    <section className="report-section">
      <h2 className="report-section__title">Vahvuus (viikko {weekNumber})</h2>
      {rows.length === 0 ? (
        <p className="empty-state">Ei resursseja tälle viikolle.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Rooli</th>
              <th className="data-table__num">Henkilöitä</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.role}>
                <td>{r.role}</td>
                <td className="data-table__num">{r.count}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="data-table__total">
              <td>
                <strong>Yhteensä</strong>
              </td>
              <td className="data-table__num">
                <strong>{total}</strong>
              </td>
            </tr>
          </tfoot>
        </table>
      )}
      <p className="data-source-note">
        Datalähde: xPM <code>pum_gantttask → pum_assignment → pum_resource → pum_role</code>.
        Vain Named-resurssit. Automaattinen.
      </p>
    </section>
  );
}

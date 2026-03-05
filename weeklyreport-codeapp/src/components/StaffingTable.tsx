import React from "react";
import type { StaffingRow } from "../types/dataverse";

interface Props {
  rows: StaffingRow[];
  weekNumber: number;
}

export function StaffingTable({ rows, weekNumber }: Props) {
  return (
    <section className="report-section">
      <h2 className="report-section__title">Staffing (week {weekNumber})</h2>
      {rows.length === 0 ? (
        <p className="empty-state">No resources for this week.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name}>
                <td>{r.name}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="data-table__total">
              <td colSpan={2}>
                <strong>Total: {rows.length}</strong>
              </td>
            </tr>
          </tfoot>
        </table>
      )}
    </section>
  );
}

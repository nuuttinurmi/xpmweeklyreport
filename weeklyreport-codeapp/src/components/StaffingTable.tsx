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
      <h2 className="report-section__title">Staffing (week {weekNumber})</h2>
      {rows.length === 0 ? (
        <p className="empty-state">No resources for this week.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Role</th>
              <th className="data-table__num">People</th>
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
                <strong>Total</strong>
              </td>
              <td className="data-table__num">
                <strong>{total}</strong>
              </td>
            </tr>
          </tfoot>
        </table>
      )}
      <p className="data-source-note">
        Data source: xPM <code>pum_gantttask → pum_assignment → pum_resource → pum_role</code>.
        Named resources only. Automatic.
      </p>
    </section>
  );
}

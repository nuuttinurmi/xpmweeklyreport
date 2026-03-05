import React from "react";
import type { StaffingRow } from "../types/dataverse";
import type { Lang } from "../i18n/translations";
import { t } from "../i18n/translations";

interface Props {
  rows: StaffingRow[];
  weekNumber: number;
  lang: Lang;
}

export function StaffingTable({ rows, weekNumber, lang }: Props) {
  return (
    <section className="report-section">
      <h2 className="report-section__title">{t("staffingWeek", lang, weekNumber)}</h2>
      {rows.length === 0 ? (
        <p className="empty-state">{t("noResources", lang)}</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>{t("name", lang)}</th>
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
                <strong>{t("total", lang)}: {rows.length}</strong>
              </td>
            </tr>
          </tfoot>
        </table>
      )}
    </section>
  );
}

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
      <h2 className="section-title">{t("staffingWeek", lang, weekNumber)}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-audico-mid-grey-1 italic">{t("noResources", lang)}</p>
      ) : (
        <table className="report-table">
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
            <tr>
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

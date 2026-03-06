import React from "react";
import type { PumStatusReporting, PumInitiative } from "../types/dataverse";
import type { Lang } from "../i18n/translations";
import { t } from "../i18n/translations";

interface Props {
  report: PumStatusReporting;
  initiative: PumInitiative | null;
  readOnly?: boolean;
  lang: Lang;
}

function fmtDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getUTCDate()}.${d.getUTCMonth() + 1}.${d.getUTCFullYear()}`;
}

export function ReportHeader({ report, initiative, readOnly = false, lang }: Props) {
  void readOnly; // reserved for future inline editing in header fields

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: t("date", lang), value: fmtDate(report.pum_statusdate) },
    { label: t("projectNumber", lang), value: initiative?.aud_projectno ?? "—" },
    {
      label: t("project", lang),
      value: initiative?.pum_name ?? "—",
    },
    {
      label: t("client", lang),
      value: initiative?.aud_customer ?? "—",
    },
    { label: t("projectManager", lang), value: initiative?.ownerName ?? "—" },
    { label: t("phase", lang), value: report.pum_currentphase ?? "—" },
    {
      label: t("scheduleProgress", lang),
      value: report.pum_scheduleprogress != null
        ? `${report.pum_scheduleprogress} %`
        : "—",
    },
  ];

  return (
    <section className="report-section">
      <h2 className="report-section__title">{t("projectInformation", lang)}</h2>
      <table className="header-table">
        <tbody>
          {rows.map(({ label, value }) => (
            <tr key={label}>
              <th className="header-table__label">{label}</th>
              <td className="header-table__value">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

import React from "react";
import type { PumStatusReporting, PumInitiative } from "../types/dataverse";

interface Props {
  report: PumStatusReporting;
  initiative: PumInitiative | null;
  readOnly?: boolean;
}

function fmtDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getUTCDate()}.${d.getUTCMonth() + 1}.${d.getUTCFullYear()}`;
}

export function ReportHeader({ report, initiative, readOnly = false }: Props) {
  void readOnly; // reserved for future inline editing in header fields

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "Date", value: fmtDate(report.pum_statusdate) },
    { label: "Project Number", value: initiative?.aud_projectno ?? "—" },
    {
      label: "Project",
      value: initiative?.pum_name ?? "—",
    },
    {
      label: "Client",
      value: initiative?.aud_customer ?? "—",
    },
    { label: "Phase", value: report.pum_currentphase ?? "—" },
    {
      label: "Schedule Progress",
      value: report.pum_scheduleprogress != null
        ? `${report.pum_scheduleprogress} %`
        : "—",
    },
  ];

  return (
    <section className="report-section">
      <h2 className="report-section__title">Header</h2>
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

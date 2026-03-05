import React from "react";
import type { PumStatusReporting, EcrProjectPortfolio2 } from "../types/dataverse";

interface Props {
  report: PumStatusReporting;
  project: EcrProjectPortfolio2 | null;
  readOnly?: boolean;
}

function fmtDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getUTCDate()}.${d.getUTCMonth() + 1}.${d.getUTCFullYear()}`;
}

export function ReportHeader({ report, project, readOnly = false }: Props) {
  void readOnly; // reserved for future inline editing in header fields

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "Date", value: fmtDate(report.pum_statusdate) },
    { label: "Project Number", value: project?.ecr_projectnumber ?? "—" },
    {
      label: "Project",
      value: project?.ecr_name ?? "—",
    },
    { label: "Project Manager", value: project?.ecr_projectmanager ?? "—" },
    {
      label: "Client",
      value: project?.ecr_customerid_account?.name ?? "—",
    },
    {
      label: "Client Contact",
      value: project?.ecr_contactid_contact?.fullname ?? "—",
    },
    { label: "Phase", value: report.pum_currentphase ?? "—" },
    { label: "Contract", value: project?.aud_agreement ?? "—" },
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
      <p className="data-source-note">
        Data source: xPM <code>pum_statusreporting</code> + Dynamics <code>ecr_projectportfolio2</code>. Automatic.
      </p>
    </section>
  );
}

import React from "react";
import type { AudWeeklyReport, EcrProjectPortfolio2 } from "../types/dataverse";

interface Props {
  report: AudWeeklyReport;
  project: EcrProjectPortfolio2 | null;
  onAdditionalInfoChange: (value: string) => void;
  readOnly?: boolean;
  sequenceNumber?: number;
}

export function ReportHeader({
  report,
  project,
  onAdditionalInfoChange,
  readOnly = false,
  sequenceNumber,
}: Props) {
  const reportNum = sequenceNumber
    ? `${String(sequenceNumber).padStart(3, "0")}/${report.aud_year}`
    : `—/${report.aud_year}`;

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "Date / Seq. No.", value: reportNum },
    { label: "Project Number", value: project?.ecr_projectnumber ?? "—" },
    {
      label: "Project",
      value: project?.ecr_name ?? report.aud_initiative?.pum_name ?? "—",
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
    { label: "Week", value: `Wk ${report.aud_weeknumber} / ${report.aud_year}` },
    { label: "Contract", value: project?.aud_agreement ?? "—" },
    {
      label: "Additional Info",
      value: readOnly ? (
        report.aud_additionalinfo || "—"
      ) : (
        <input
          type="text"
          value={report.aud_additionalinfo ?? ""}
          onChange={(e) => onAdditionalInfoChange(e.target.value)}
          placeholder="Optional"
          className="field-input field-input--inline"
        />
      ),
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
        Data source: Dynamics <code>ecr_projectportfolio2</code>. Automatic.
      </p>
    </section>
  );
}

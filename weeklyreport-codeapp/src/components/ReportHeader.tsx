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
    { label: "Päivämäärä / Järj. nro", value: reportNum },
    { label: "Projektinumero", value: project?.ecr_projectnumber ?? "—" },
    {
      label: "Projekti",
      value: project?.ecr_name ?? report.aud_initiative?.pum_name ?? "—",
    },
    { label: "Projektipäällikkö", value: project?.ecr_projectmanager ?? "—" },
    {
      label: "Asiakas",
      value: project?.ecr_customerid_account?.name ?? "—",
    },
    {
      label: "Asiakkaan yhteyshenkilö",
      value: project?.ecr_contactid_contact?.fullname ?? "—",
    },
    { label: "Viikko", value: `Vko ${report.aud_weeknumber} / ${report.aud_year}` },
    { label: "Urakka", value: project?.aud_agreement ?? "—" },
    {
      label: "Lisätietoja",
      value: readOnly ? (
        report.aud_additionalinfo || "—"
      ) : (
        <input
          type="text"
          value={report.aud_additionalinfo ?? ""}
          onChange={(e) => onAdditionalInfoChange(e.target.value)}
          placeholder="Vapaaehtoinen"
          className="field-input field-input--inline"
        />
      ),
    },
  ];

  return (
    <section className="report-section">
      <h2 className="report-section__title">Otsikkotiedot</h2>
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
        Datalähde: Dynamics <code>ecr_projectportfolio2</code>. Automaattinen.
      </p>
    </section>
  );
}

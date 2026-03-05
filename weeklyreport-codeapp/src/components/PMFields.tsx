import React from "react";
import type { AudWeeklyReport } from "../types/dataverse";

interface Props {
  report: AudWeeklyReport;
  onFieldChange: (field: keyof AudWeeklyReport, value: string) => void;
  readOnly?: boolean;
}

interface FieldConfig {
  field: keyof AudWeeklyReport;
  label: string;
  placeholder: string;
  source?: string;
  rows: number;
}

const FIELDS: FieldConfig[] = [
  {
    field: "aud_actionitems",
    label: "Actions required from other parties",
    placeholder: "E.g. Client: deliver measurements (DL wk 11), Electrical contractor: pull feeds...",
    rows: 4,
  },
  {
    field: "aud_safetynotes",
    label: "Safety",
    placeholder: "No incidents.",
    rows: 2,
  },
  {
    field: "aud_situationsummary",
    label: "Situation summary",
    placeholder: "Brief description of project status, critical issues, next steps...",
    rows: 5,
  },
];

export function PMFields({ report, onFieldChange, readOnly = false }: Props) {
  return (
    <section className="report-section">
      <h2 className="report-section__title">Additional</h2>
      {FIELDS.map(({ field, label, placeholder, rows }) => (
        <div key={field} className="pm-field">
          <label className="pm-field__label">{label}</label>
          {readOnly ? (
            <div className="pm-field__readonly">
              {(report[field] as string) || <span className="empty-note">—</span>}
            </div>
          ) : (
            <textarea
              className="pm-field__textarea"
              value={(report[field] as string) ?? ""}
              onChange={(e) => onFieldChange(field, e.target.value)}
              placeholder={placeholder}
              rows={rows}
            />
          )}
        </div>
      ))}

      {/* Status selector — always editable even when readOnly is used for PDF view */}
      {!readOnly && (
        <div className="pm-field">
          <label className="pm-field__label">Status</label>
          <select
            className="pm-field__select"
            value={report.aud_status}
            onChange={(e) =>
              onFieldChange("aud_status", e.target.value)
            }
          >
            <option value="Draft">Draft</option>
            <option value="Ready">Ready</option>
            <option value="Sent">Sent</option>
          </select>
        </div>
      )}
    </section>
  );
}

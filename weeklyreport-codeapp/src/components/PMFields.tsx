import React from "react";
import type { PumStatusReporting } from "../types/dataverse";

interface Props {
  report: PumStatusReporting;
  onFieldChange: (field: keyof PumStatusReporting, value: string | number) => void;
  readOnly?: boolean;
}

// KPI option set: 493840000 = Not Set.
// Other values are set by xPM when PM makes a proposal.
// hasComment: whether pum_kpinew{key}comment exists on the entity
const KPI_DIMS: { key: string; label: string; hasComment: boolean }[] = [
  { key: "resources", label: "Resources", hasComment: true },
  { key: "summary",   label: "Summary",   hasComment: false }, // no pum_kpinewsummarycomment field
  { key: "quality",   label: "Quality",   hasComment: true },
  { key: "cost",      label: "Cost",      hasComment: true },
  { key: "scope",     label: "Scope",     hasComment: true },
  { key: "schedule",  label: "Schedule",  hasComment: true },
];

const KPI_OPTIONS: { value: number; label: string }[] = [
  { value: 493840000, label: "⚪ Not Set" },
  { value: 493840001, label: "🔴 Need help" },
  { value: 493840002, label: "🟡 At risk" },
  { value: 493840003, label: "🟢 No issue" },
];
const KPI_NOT_SET = 493840000;

function kpiLabel(value?: number): string {
  if (value == null) return "⚪ Not Set";
  return KPI_OPTIONS.find((o) => o.value === value)?.label ?? "⚪ Not Set";
}

export function PMFields({ report, onFieldChange, readOnly = false }: Props) {
  return (
    <section className="report-section">
      <h2 className="report-section__title">Additional</h2>

      {/* ── Situation comment ── */}
      <div className="pm-field">
        <label className="pm-field__label">Comment / Situation summary</label>
        {readOnly ? (
          <div className="pm-field__readonly">
            {report.pum_comment || <span className="empty-note">—</span>}
          </div>
        ) : (
          <textarea
            className="pm-field__textarea"
            value={report.pum_comment ?? ""}
            onChange={(e) => onFieldChange("pum_comment", e.target.value)}
            placeholder="Brief description of project status, critical issues, next steps…"
            rows={5}
          />
        )}
      </div>

      {/* ── KPI table ── */}
      <div className="pm-field" style={{ marginTop: "16px" }}>
        <label className="pm-field__label">KPI Status</label>
        <table className="data-table" style={{ marginTop: "4px" }}>
          <thead>
            <tr>
              <th>Dimension</th>
              <th>Current</th>
              <th>Proposed</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {KPI_DIMS.map(({ key, label, hasComment }) => {
              const currentField = `pum_kpicurrent${key}` as keyof PumStatusReporting;
              const newField = `pum_kpinew${key}` as keyof PumStatusReporting;
              const commentField = `pum_kpinew${key}comment` as keyof PumStatusReporting;
              const currentVal = report[currentField] as number | undefined;
              const newVal = report[newField] as number | undefined;
              const commentVal = hasComment
                ? (report[commentField] as string | undefined)
                : undefined;
              return (
                <tr key={key}>
                  <td>{label}</td>
                  <td style={{ color: "#666", fontSize: "0.85em" }}>
                    {kpiLabel(currentVal)}
                  </td>
                  <td style={{ fontSize: "0.85em" }}>
                    {readOnly ? (
                      kpiLabel(newVal)
                    ) : (
                      <select
                        value={newVal ?? KPI_NOT_SET}
                        onChange={(e) =>
                          onFieldChange(newField, Number(e.target.value))
                        }
                        className="pm-field__select"
                        style={{ fontSize: "0.85em" }}
                      >
                        {KPI_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td>
                    {!hasComment ? (
                      <span style={{ fontSize: "0.85em", color: "#aaa" }}>—</span>
                    ) : readOnly ? (
                      <span style={{ fontSize: "0.85em", color: "#666" }}>
                        {commentVal || "—"}
                      </span>
                    ) : (
                      <input
                        type="text"
                        className="field-input field-input--inline"
                        value={commentVal ?? ""}
                        onChange={(e) =>
                          onFieldChange(commentField, e.target.value)
                        }
                        placeholder="Note…"
                        style={{ fontSize: "0.85em", width: "100%" }}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

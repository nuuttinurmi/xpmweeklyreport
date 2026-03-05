import React from "react";
import type { PumStatusReporting } from "../types/dataverse";
import type { Lang } from "../i18n/translations";
import { t } from "../i18n/translations";

interface Props {
  report: PumStatusReporting;
  onFieldChange: (field: keyof PumStatusReporting, value: string | number) => void;
  readOnly?: boolean;
  lang: Lang;
}

// KPI option set: 493840000 = Not Set.
// Other values are set by xPM when PM makes a proposal.
// hasComment: whether pum_kpinew{key}comment exists on the entity
type KpiDimKey = "summary" | "resources" | "quality" | "cost" | "scope" | "schedule";
const KPI_DIMS: { key: KpiDimKey; labelKey: "kpiSummary" | "kpiResources" | "kpiQuality" | "kpiCost" | "kpiScope" | "kpiSchedule"; hasComment: boolean; isSummary?: boolean }[] = [
  { key: "summary",   labelKey: "kpiSummary",   hasComment: false, isSummary: true },
  { key: "resources", labelKey: "kpiResources", hasComment: true },
  { key: "quality",   labelKey: "kpiQuality",   hasComment: true },
  { key: "cost",      labelKey: "kpiCost",      hasComment: true },
  { key: "scope",     labelKey: "kpiScope",     hasComment: true },
  { key: "schedule",  labelKey: "kpiSchedule",  hasComment: true },
];

const KPI_OPTION_KEYS: { value: number; icon: string; labelKey: "kpiNotSet" | "kpiNeedHelp" | "kpiAtRisk" | "kpiNoIssue" }[] = [
  { value: 493840000, icon: "⚪", labelKey: "kpiNotSet" },
  { value: 493840001, icon: "🔴", labelKey: "kpiNeedHelp" },
  { value: 493840002, icon: "🟡", labelKey: "kpiAtRisk" },
  { value: 493840003, icon: "🟢", labelKey: "kpiNoIssue" },
];
const KPI_NOT_SET = 493840000;

function kpiLabel(value: number | undefined, lang: Lang): string {
  if (value == null) return `⚪ ${t("kpiNotSet", lang)}`;
  const opt = KPI_OPTION_KEYS.find((o) => o.value === value);
  return opt ? `${opt.icon} ${t(opt.labelKey, lang)}` : `⚪ ${t("kpiNotSet", lang)}`;
}

export function PMFields({ report, onFieldChange, readOnly = false, lang }: Props) {
  return (
    <section className="report-section">
      <h2 className="report-section__title">{t("statusComments", lang)}</h2>

      {/* ── Situation comment ── */}
      <div className="pm-field">
        <label className="pm-field__label">{t("commentSummary", lang)}</label>
        {readOnly ? (
          <div className="pm-field__readonly">
            {report.pum_comment || <span className="empty-note">—</span>}
          </div>
        ) : (
          <textarea
            className="pm-field__textarea"
            value={report.pum_comment ?? ""}
            onChange={(e) => onFieldChange("pum_comment", e.target.value)}
            placeholder={t("commentPlaceholder", lang)}
            rows={5}
          />
        )}
      </div>

      {/* ── KPI table ── */}
      <div className="pm-field" style={{ marginTop: "16px" }}>
        <label className="pm-field__label">{t("kpiStatus", lang)}</label>
        <table className="data-table" style={{ marginTop: "4px" }}>
          <thead>
            <tr>
              <th>{t("dimension", lang)}</th>
              <th>{t("current", lang)}</th>
              <th>{t("proposed", lang)}</th>
              <th>{t("note", lang)}</th>
            </tr>
          </thead>
          <tbody>
            {KPI_DIMS.map(({ key, labelKey, hasComment, isSummary }) => {
              const currentField = `pum_kpicurrent${key}` as keyof PumStatusReporting;
              const newField = `pum_kpinew${key}` as keyof PumStatusReporting;
              const commentField = `pum_kpinew${key}comment` as keyof PumStatusReporting;
              const currentVal = report[currentField] as number | undefined;
              const newVal = report[newField] as number | undefined;
              const commentVal = hasComment
                ? (report[commentField] as string | undefined)
                : undefined;
              return (
                <tr key={key} style={isSummary ? { borderBottom: "2px solid #333", fontWeight: "bold" } : undefined}>
                  <td><strong>{t(labelKey, lang)}</strong></td>
                  <td style={{ color: "#666", fontSize: "0.85em" }}>
                    {kpiLabel(currentVal, lang)}
                  </td>
                  <td style={{ fontSize: "0.85em" }}>
                    <span className="print-only">{kpiLabel(newVal, lang)}</span>
                    {readOnly ? (
                      <span className="no-print">{kpiLabel(newVal, lang)}</span>
                    ) : (
                      <select
                        value={newVal ?? KPI_NOT_SET}
                        onChange={(e) =>
                          onFieldChange(newField, Number(e.target.value))
                        }
                        className="pm-field__select no-print"
                        title={t("proposed", lang)}
                        style={{ fontSize: "0.85em" }}
                      >
                        {KPI_OPTION_KEYS.map((o) => (
                          <option key={o.value} value={o.value}>{o.icon} {t(o.labelKey, lang)}</option>
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
                      <>
                        <span className="print-only" style={{ fontSize: "0.85em" }}>
                          {commentVal || "—"}
                        </span>
                        <input
                          type="text"
                          className="field-input field-input--inline no-print"
                          value={commentVal ?? ""}
                          onChange={(e) =>
                            onFieldChange(commentField, e.target.value)
                          }
                          placeholder={`${t("note", lang)}…`}
                          style={{ fontSize: "0.85em", width: "100%" }}
                        />
                      </>
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

import type { PumStatusReporting } from "../types/dataverse";
import type { Lang } from "../i18n/translations";
import { t } from "../i18n/translations";

interface Props {
  report: PumStatusReporting;
  onFieldChange: (field: keyof PumStatusReporting, value: string | number) => void;
  readOnly?: boolean;
  lang: Lang;
}

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
      <h2 className="section-title">{t("statusComments", lang)}</h2>

      {/* Situation comment */}
      <div className="mb-5">
        <label className="block text-sm font-semibold text-audico-black mb-1.5">
          {t("commentSummary", lang)}
        </label>
        {readOnly ? (
          <div className="text-sm text-audico-black bg-audico-light-grey border border-audico-mid-grey-3 rounded px-3 py-2 whitespace-pre-wrap min-h-[60px]">
            {report.pum_comment || <span className="text-audico-mid-grey-1">—</span>}
          </div>
        ) : (
          <textarea
            className="w-full text-sm text-audico-black font-sans bg-white border border-audico-mid-grey-3 rounded px-3 py-2 resize-y
                       focus:outline-none focus:border-[var(--audico-accent)] focus:ring-2 focus:ring-[var(--audico-accent)]/20
                       placeholder:text-audico-mid-grey-2"
            value={report.pum_comment ?? ""}
            onChange={(e) => onFieldChange("pum_comment", e.target.value)}
            placeholder={t("commentPlaceholder", lang)}
            rows={5}
          />
        )}
      </div>

      {/* KPI table */}
      <div>
        <label className="block text-sm font-semibold text-audico-black mb-1.5">
          {t("kpiStatus", lang)}
        </label>
        <table className="report-table">
          <thead>
            <tr>
              <th>{t("dimension", lang)}</th>
              <th className="w-36">{t("current", lang)}</th>
              <th className="w-40">{t("proposed", lang)}</th>
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
                <tr
                  key={key}
                  className={isSummary ? "border-b-2 border-audico-dark-grey font-semibold" : undefined}
                >
                  <td><strong>{t(labelKey, lang)}</strong></td>
                  <td className="text-audico-mid-grey-1 text-xs">{kpiLabel(currentVal, lang)}</td>
                  <td className="text-xs">
                    <span className="hidden print:inline">{kpiLabel(newVal, lang)}</span>
                    {readOnly || isSummary ? (
                      <span className="print:hidden">{kpiLabel(newVal, lang)}</span>
                    ) : (
                      <select
                        value={newVal ?? KPI_NOT_SET}
                        onChange={(e) => onFieldChange(newField, Number(e.target.value))}
                        className="print:hidden h-7 px-1.5 text-xs font-sans text-audico-black bg-white border border-audico-mid-grey-3 rounded
                                   focus:outline-none focus:border-[var(--audico-accent)]"
                        title={t("proposed", lang)}
                      >
                        {KPI_OPTION_KEYS.map((o) => (
                          <option key={o.value} value={o.value}>{o.icon} {t(o.labelKey, lang)}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td>
                    {!hasComment ? (
                      <span className="text-xs text-audico-mid-grey-2">—</span>
                    ) : readOnly ? (
                      <span className="text-xs text-audico-dark-grey">{commentVal || "—"}</span>
                    ) : (
                      <>
                        <span className="hidden print:inline text-xs">{commentVal || "—"}</span>
                        <input
                          type="text"
                          className="print:hidden w-full h-7 px-2 text-xs font-sans text-audico-black bg-white border border-audico-mid-grey-3 rounded
                                     focus:outline-none focus:border-[var(--audico-accent)]
                                     placeholder:text-audico-mid-grey-2"
                          value={commentVal ?? ""}
                          onChange={(e) => onFieldChange(commentField, e.target.value)}
                          placeholder={`${t("note", lang)}…`}
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

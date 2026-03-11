import { useState } from "react";
import { generateReportPdf } from "../components/ReportPDF";
import { ReportHeader } from "../components/ReportHeader";
import { StaffingTable } from "../components/StaffingTable";
import { ScheduleGrid } from "../components/ScheduleGrid";
import { ChangesTable, RisksTable } from "../components/ChangesRisks";
import { PMFields } from "../components/PMFields";
import { useWeeklyReport } from "../hooks/useWeeklyReport";
import { getISOWeek } from "../utils/weekUtils";
import type { Lang } from "../i18n/translations";
import { t } from "../i18n/translations";
import audicoLogo from "../assets/audico-logo.png";

interface Props {
  reportId: string;
  initiativeId: string;
  onBack: () => void;
  powerAutomateFlowUrl?: string;
}

export function ReportEditor({
  reportId,
  initiativeId,
  onBack,
  powerAutomateFlowUrl,
}: Props) {
  const {
    loading,
    error,
    report,
    initiative,
    staffing,
    scheduleCells,
    scheduleColumns,
    changes,
    risks,
    isLargeProject,
    updateField,
    save,
    saving,
    dirty,
  } = useWeeklyReport(reportId, initiativeId);

  const [lang, setLang] = useState<Lang>("en");
  const [downloading, setDownloading] = useState(false);
  const [triggeringFlow, setTriggeringFlow] = useState(false);
  const [flowError, setFlowError] = useState<string | null>(null);
  const [flowSuccess, setFlowSuccess] = useState(false);

  async function handleDownloadPDF() {
    if (!report) return;
    if (dirty) await save();

    setDownloading(true);
    try {
      // audicoLogo is already a base64 data URL after Vite inlines it at build time
      const blob = generateReportPdf({
        report,
        initiative,
        staffing,
        scheduleCells,
        scheduleColumns,
        changes,
        risks,
        isLargeProject,
        lang,
        week,
        year,
        logoDataUrl: audicoLogo,
      });

      const projectSlug = (initiative?.pum_name ?? "report")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectSlug}-weekly-report-wk${week}-${year}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  async function handleTriggerFlow() {
    if (!powerAutomateFlowUrl || !report) return;
    setTriggeringFlow(true);
    setFlowError(null);
    setFlowSuccess(false);
    try {
      const res = await fetch(powerAutomateFlowUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: report.pum_statusreportingid,
          initiativeId,
          statusDate: report.pum_statusdate,
        }),
      });
      if (!res.ok) throw new Error(`Flow responded: ${res.status}`);
      setFlowSuccess(true);
    } catch (err: unknown) {
      setFlowError(err instanceof Error ? err.message : String(err));
    } finally {
      setTriggeringFlow(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-audico-light-grey flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-audico-mid-grey-3 border-t-[var(--audico-accent)] animate-spin" />
        <p className="text-sm text-audico-mid-grey-1">{t("loadingReport", lang)}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-audico-light-grey p-8">
        <div className="bg-[#fde7e9] border border-[#f4abaa] text-[#a80000] px-4 py-3 rounded text-sm mb-4">
          {error}
        </div>
        <button
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded
                     bg-white text-audico-black border border-audico-mid-grey-3
                     hover:bg-audico-light-grey transition-colors"
          onClick={onBack}
        >
          ← Back
        </button>
      </div>
    );
  }

  if (!report) return null;

  const isReadOnly = report.statecode !== 0;

  const { week, year } = report.pum_statusdate
    ? getISOWeek(new Date(report.pum_statusdate))
    : { week: 0, year: 0 };

  const titleLabel = week > 0 ? `${t("wk", lang)} ${week}/${year}` : t("statusReport", lang);

  return (
    <div className="min-h-screen bg-audico-light-grey">
      {/* ── Toolbar ── */}
      <div className="h-12 bg-white border-b border-audico-mid-grey-3 flex items-center gap-3 px-6 print:hidden sticky top-0 z-10">
        <button
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded
                     bg-white text-audico-black border border-audico-mid-grey-3
                     hover:bg-audico-light-grey transition-colors"
          onClick={onBack}
        >
          ← {t("back", lang)}
        </button>

        <span className="flex-1 text-base font-semibold text-audico-black truncate">
          {titleLabel}
          {dirty && <span className="ml-1 text-status-warning">●</span>}
        </span>

        <div className="flex items-center gap-2">
          <select
            className="h-8 px-2 text-sm font-semibold text-audico-black bg-white border border-audico-mid-grey-3 rounded
                       hover:bg-audico-light-grey transition-colors cursor-pointer"
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            title={t("language", lang)}
          >
            <option value="en">EN</option>
            <option value="fi">FI</option>
            <option value="sv">SV</option>
          </select>

          {!isReadOnly && (
            <button
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded
                         bg-white text-audico-black border border-audico-mid-grey-3
                         hover:bg-audico-light-grey transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => save()}
              disabled={saving || !dirty}
            >
              {saving ? t("saving", lang) : t("save", lang)}
            </button>
          )}

          <button
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded
                       bg-white text-audico-black border border-audico-mid-grey-3
                       hover:bg-audico-light-grey transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleDownloadPDF}
            disabled={downloading}
          >
            {downloading ? t("generating", lang) : t("downloadPdf", lang)}
          </button>

          {powerAutomateFlowUrl && (
            <button
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded
                         bg-[var(--audico-accent)] text-white
                         hover:bg-[var(--audico-accent-hover)] active:bg-[var(--audico-accent-active)]
                         transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleTriggerFlow}
              disabled={triggeringFlow || dirty}
              title={dirty ? t("saveFirst", lang) : t("generatePdf", lang)}
            >
              {triggeringFlow ? t("generating", lang) : `${t("generatePdf", lang)} →`}
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {flowError && (
        <div className="max-w-content mx-auto px-6 pt-4 print:hidden">
          <div className="bg-[#fde7e9] border border-[#f4abaa] text-[#a80000] px-4 py-3 rounded text-sm">
            {flowError}
          </div>
        </div>
      )}
      {flowSuccess && (
        <div className="max-w-content mx-auto px-6 pt-4 print:hidden">
          <div className="bg-[#dff6dd] border border-[#107c10] text-[#107c10] px-4 py-3 rounded text-sm">
            {t("pdfSuccess", lang)}
          </div>
        </div>
      )}

      {/* ── Report document ── */}
      <div className="max-w-content mx-auto px-6 py-8">
        <div className="report-document bg-white rounded-md border border-audico-mid-grey-3 shadow-sm px-10 py-8">

          {/* Report header: logo + title */}
          <div className="report-header-row flex items-center mb-8 pb-4 border-b-2 border-audico-black">
            <img src={audicoLogo} alt="Audico" className="report-logo h-9 w-auto" />
            <h1 className="report-title flex-1 text-xl font-bold text-audico-black text-center uppercase tracking-widest">
              {t("reportTitle", lang)}
            </h1>
          </div>

          <ReportHeader
            report={report}
            initiative={initiative}
            readOnly={isReadOnly}
            lang={lang}
          />

          <StaffingTable rows={staffing} weekNumber={week} lang={lang} />

          <ScheduleGrid cells={scheduleCells} columns={scheduleColumns} lang={lang} />

          <PMFields
            report={report}
            onFieldChange={updateField}
            readOnly={isReadOnly}
            lang={lang}
          />

          {isLargeProject && <ChangesTable changes={changes} lang={lang} />}
          {isLargeProject && <RisksTable risks={risks} lang={lang} />}
        </div>
      </div>
    </div>
  );
}

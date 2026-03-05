import { useState } from "react";
import { ReportHeader } from "../components/ReportHeader";
import { StaffingTable } from "../components/StaffingTable";
import { ScheduleGrid } from "../components/ScheduleGrid";
import { ChangesTable, RisksTable } from "../components/ChangesRisks";
import { PMFields } from "../components/PMFields";
import { useWeeklyReport } from "../hooks/useWeeklyReport";
import { getISOWeek } from "../utils/weekUtils";
import type { Lang } from "../i18n/translations";
import { t } from "../i18n/translations";

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
  const [triggeringFlow, setTriggeringFlow] = useState(false);
  const [flowError, setFlowError] = useState<string | null>(null);
  const [flowSuccess, setFlowSuccess] = useState(false);

  async function handlePrint() {
    if (dirty) await save();
    window.print();
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
      <div className="page page--loading">
        <div className="loading-spinner" />
        <p>{t("loadingReport", lang)}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="error-banner">{error}</div>
        <button className="btn" onClick={onBack}>
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
    <div className="page page--editor">
      {/* ── Toolbar (hidden in print) ── */}
      <div className="editor-toolbar no-print">
        <button className="btn" onClick={onBack}>
          &larr; {t("back", lang)}
        </button>
        <div className="editor-toolbar__title">
          {titleLabel}
          {dirty && <span className="dirty-indicator"> ●</span>}
        </div>
        <div className="editor-toolbar__actions">
          <select
            className="btn btn--secondary lang-select"
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
              className="btn btn--secondary"
              onClick={() => save()}
              disabled={saving || !dirty}
            >
              {saving ? t("saving", lang) : t("save", lang)}
            </button>
          )}
          <button className="btn btn--secondary" onClick={handlePrint}>
            {t("printPreview", lang)}
          </button>
          {powerAutomateFlowUrl && (
            <button
              className="btn btn--primary"
              onClick={handleTriggerFlow}
              disabled={triggeringFlow || dirty}
              title={dirty ? t("saveFirst", lang) : t("generatePdf", lang)}
            >
              {triggeringFlow ? t("generating", lang) : `${t("generatePdf", lang)} →`}
            </button>
          )}
        </div>
      </div>

      {flowError && <div className="error-banner no-print">{flowError}</div>}
      {flowSuccess && (
        <div className="success-banner no-print">
          {t("pdfSuccess", lang)}
        </div>
      )}

      {/* ── Report content ── */}
      <div className="report-document">
        <div className="report-header-row">
          <img src="/audico-logo.png" alt="Audico" className="report-logo" />
          <h1 className="report-title">{t("reportTitle", lang)}</h1>
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
  );
}

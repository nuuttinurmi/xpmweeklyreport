import { useState } from "react";
import { ReportHeader } from "../components/ReportHeader";
import { StaffingTable } from "../components/StaffingTable";
import { ScheduleGrid } from "../components/ScheduleGrid";
import { ChangesTable, RisksTable } from "../components/ChangesRisks";
import { PMFields } from "../components/PMFields";
import { useWeeklyReport } from "../hooks/useWeeklyReport";
import { getISOWeek } from "../utils/weekUtils";

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
        <p>Loading report…</p>
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

  const titleLabel = week > 0 ? `Wk ${week}/${year}` : "Status Report";

  return (
    <div className="page page--editor">
      {/* ── Toolbar (hidden in print) ── */}
      <div className="editor-toolbar no-print">
        <button className="btn" onClick={onBack}>
          ← Back
        </button>
        <div className="editor-toolbar__title">
          {titleLabel}
          {dirty && <span className="dirty-indicator"> ●</span>}
        </div>
        <div className="editor-toolbar__actions">
          {!isReadOnly && (
            <button
              className="btn btn--secondary"
              onClick={() => save()}
              disabled={saving || !dirty}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          )}
          <button className="btn btn--secondary" onClick={handlePrint}>
            Print / Preview
          </button>
          {powerAutomateFlowUrl && (
            <button
              className="btn btn--primary"
              onClick={handleTriggerFlow}
              disabled={triggeringFlow || dirty}
              title={dirty ? "Save first" : "Generate PDF to SharePoint"}
            >
              {triggeringFlow ? "Generating…" : "Generate PDF →"}
            </button>
          )}
        </div>
      </div>

      {flowError && <div className="error-banner no-print">{flowError}</div>}
      {flowSuccess && (
        <div className="success-banner no-print">
          PDF generated and saved to SharePoint.
        </div>
      )}

      {/* ── Report content ── */}
      <div className="report-document">
        <h1 className="report-title">WORK PHASE REPORT</h1>

        <ReportHeader
          report={report}
          initiative={initiative}
          readOnly={isReadOnly}
        />

        <StaffingTable rows={staffing} weekNumber={week} />

        <ScheduleGrid cells={scheduleCells} columns={scheduleColumns} />

        <PMFields
          report={report}
          onFieldChange={updateField}
          readOnly={isReadOnly}
        />

        {isLargeProject && <ChangesTable changes={changes} />}
        {isLargeProject && <RisksTable risks={risks} />}
      </div>
    </div>
  );
}

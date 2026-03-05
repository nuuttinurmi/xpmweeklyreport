import React, { useState } from "react";
import { ReportHeader } from "../components/ReportHeader";
import { StaffingTable } from "../components/StaffingTable";
import { TaskStatusTable } from "../components/TaskStatusTable";
import { ScheduleGrid } from "../components/ScheduleGrid";
import { ChangesTable, RisksTable } from "../components/ChangesRisks";
import { PMFields } from "../components/PMFields";
import { useWeeklyReport } from "../hooks/useWeeklyReport";
import type { AudWeeklyReport } from "../types/dataverse";

interface Props {
  reportId: string;
  initiativeId: string;
  onBack: () => void;
  powerAutomateFlowUrl?: string; // HTTP-triggered PA flow URL for SharePoint PDF
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
    project,
    staffing,
    taskRows,
    scheduleCells,
    scheduleColumns,
    changes,
    risks,
    updateField,
    updateTaskNote,
    save,
    saving,
    dirty,
  } = useWeeklyReport(reportId, initiativeId);

  const [triggeringFlow, setTriggeringFlow] = useState(false);
  const [flowError, setFlowError] = useState<string | null>(null);
  const [flowSuccess, setFlowSuccess] = useState(false);

  async function handlePrint() {
    // Auto-save before print
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
          reportId: report.aud_weeklyreportid,
          initiativeId,
          weekNumber: report.aud_weeknumber,
          year: report.aud_year,
        }),
      });
      if (!res.ok) throw new Error(`Flow vastasi: ${res.status}`);
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
        <p>Ladataan raporttia…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="error-banner">{error}</div>
        <button className="btn" onClick={onBack}>
          ← Takaisin
        </button>
      </div>
    );
  }

  if (!report) return null;

  const isReadOnly = report.aud_status === "Lähetetty";

  return (
    <div className="page page--editor">
      {/* ── Toolbar (hidden in print) ── */}
      <div className="editor-toolbar no-print">
        <button className="btn" onClick={onBack}>
          ← Takaisin
        </button>
        <div className="editor-toolbar__title">
          Vko {report.aud_weeknumber}/{report.aud_year}
          {dirty && <span className="dirty-indicator"> ●</span>}
        </div>
        <div className="editor-toolbar__actions">
          {!isReadOnly && (
            <button
              className="btn btn--secondary"
              onClick={() => save()}
              disabled={saving || !dirty}
            >
              {saving ? "Tallennetaan…" : "Tallenna"}
            </button>
          )}
          <button className="btn btn--secondary" onClick={handlePrint}>
            Tulosta / Esikatsele
          </button>
          {powerAutomateFlowUrl && (
            <button
              className="btn btn--primary"
              onClick={handleTriggerFlow}
              disabled={triggeringFlow || dirty}
              title={dirty ? "Tallenna ensin" : "Generoi PDF SharePointiin"}
            >
              {triggeringFlow ? "Generoidaan…" : "Generoi PDF →"}
            </button>
          )}
        </div>
      </div>

      {flowError && (
        <div className="error-banner no-print">{flowError}</div>
      )}
      {flowSuccess && (
        <div className="success-banner no-print">
          PDF generoitu ja tallennettu SharePointiin.
          {report.aud_outputfileurl && (
            <>
              {" "}
              <a href={report.aud_outputfileurl} target="_blank" rel="noreferrer">
                Avaa PDF
              </a>
            </>
          )}
        </div>
      )}

      {/* ── Report content ── */}
      <div className="report-document">
        <h1 className="report-title">TYÖVAIHEILMOITUS</h1>

        <ReportHeader
          report={report}
          project={project}
          onAdditionalInfoChange={(v) => updateField("aud_additionalinfo", v)}
          readOnly={isReadOnly}
        />

        <StaffingTable rows={staffing} weekNumber={report.aud_weeknumber} />

        <TaskStatusTable
          rows={taskRows}
          onNoteChange={updateTaskNote}
          readOnly={isReadOnly}
        />

        <ScheduleGrid cells={scheduleCells} columns={scheduleColumns} />

        <PMFields
          report={report}
          onFieldChange={(field, value) =>
            updateField(field as keyof AudWeeklyReport, value)
          }
          readOnly={isReadOnly}
        />

        <ChangesTable changes={changes} />
        <RisksTable risks={risks} />
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import type {
  PumInitiative,
  PumStatusReporting,
  PumGanttTask,
  PumChangeRequest,
  PumRisk,
} from "../types/dataverse";
import { InitiativeSelector } from "../components/InitiativeSelector";
import { ChangesTable, RisksTable } from "../components/ChangesRisks";
import {
  fetchStatusReports,
  createStatusReport,
  fetchAllGanttTasks,
  fetchChangeRequests,
  fetchRisks,
  fetchAssignmentsForInitiative,
  fetchInitiativeWithType,
  type AssignmentRow,
} from "../utils/dataverseClient";
import { toISODateString } from "../utils/weekUtils";

import audicoLogo from "../assets/audico-logo.png";

function fmtDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getUTCDate()}.${d.getUTCMonth() + 1}.${d.getUTCFullYear()}`;
}

interface Props {
  onOpenReport: (reportId: string, initiativeId: string) => void;
}

export function ReportList({ onOpenReport }: Props) {
  const [initiativeId, setInitiativeId] = useState<string | null>(null);
  const [initiative, setInitiative] = useState<PumInitiative | null>(null);
  const [reports, setReports] = useState<PumStatusReporting[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tasks, setTasks] = useState<PumGanttTask[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [changes, setChanges] = useState<PumChangeRequest[]>([]);
  const [risks, setRisks] = useState<PumRisk[]>([]);

  useEffect(() => {
    if (!initiativeId) return;
    loadReports(initiativeId);
  }, [initiativeId]);

  async function loadReports(id: string) {
    setLoading(true);
    setError(null);
    setReports([]);
    setInitiative(null);
    setTasks([]);
    setAssignments([]);
    setChanges([]);
    setRisks([]);

    const [reportsResult, initiativeResult, tasksResult, assignmentsResult, changesResult, risksResult] =
      await Promise.allSettled([
        fetchStatusReports(id),
        fetchInitiativeWithType(id),
        fetchAllGanttTasks(id, "2020-01-01", "2030-12-31"),
        fetchAssignmentsForInitiative(id),
        fetchChangeRequests(id),
        fetchRisks(id),
      ]);

    if (reportsResult.status === "fulfilled") {
      setReports(reportsResult.value);
    } else {
      const msg =
        reportsResult.reason instanceof Error
          ? reportsResult.reason.message
          : String(reportsResult.reason);
      setError(msg);
    }

    if (initiativeResult.status === "fulfilled") setInitiative(initiativeResult.value);
    if (tasksResult.status === "fulfilled") setTasks(tasksResult.value);
    if (assignmentsResult.status === "fulfilled") setAssignments(assignmentsResult.value);
    if (changesResult.status === "fulfilled") setChanges(changesResult.value);
    if (risksResult.status === "fulfilled") setRisks(risksResult.value);

    setLoading(false);
  }

  async function handleNewReport() {
    if (!initiativeId) return;
    const today = toISODateString(new Date());

    const duplicate = reports.find((r) => r.pum_statusdate?.slice(0, 10) === today);
    if (duplicate) {
      alert(`A report for ${today} already exists.`);
      onOpenReport(duplicate.pum_statusreportingid, initiativeId);
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const newReport = await createStatusReport({
        pum_statusdate: today,
        "pum_Initiative@odata.bind": `/pum_initiatives(${initiativeId})`,
      });
      // Dataverse returns 204 No Content on create; result.data may be null.
      // Fall back to finding the new report by date from a fresh list.
      let reportId = newReport.pum_statusreportingid;
      if (!reportId) {
        const freshReports = await fetchStatusReports(initiativeId);
        const match = freshReports.find((r) => r.pum_statusdate?.slice(0, 10) === today);
        reportId = match?.pum_statusreportingid ?? "";
      }
      if (!reportId) throw new Error("Report created but ID could not be retrieved. Please refresh.");
      await loadReports(initiativeId);
      onOpenReport(reportId, initiativeId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreating(false);
    }
  }

  const assignmentsByTask = assignments.reduce<Map<string, AssignmentRow[]>>((map, a) => {
    if (!map.has(a.taskId)) map.set(a.taskId, []);
    map.get(a.taskId)!.push(a);
    return map;
  }, new Map());

  const hasOverviewData =
    tasks.length > 0 || assignments.length > 0 || changes.length > 0 || risks.length > 0;

  return (
    <div className="min-h-screen bg-audico-light-grey">
      {/* App header */}
      <header className="h-12 bg-white border-b border-audico-mid-grey-3 flex items-center px-6 print:hidden">
        <img src={audicoLogo} alt="Audico" className="h-6" />
        <span className="ml-4 text-base font-semibold text-audico-black">Weekly Report</span>
      </header>

      {/* Page content */}
      <main className="max-w-content mx-auto px-6 py-8 space-y-6">

        {/* Project selector card */}
        <div className="bg-white rounded-md border border-audico-mid-grey-3 p-6">
          <InitiativeSelector
            value={initiativeId}
            onChange={(id, ini) => {
              setInitiativeId(id);
              setInitiative(ini);
            }}
          />

          {initiativeId && (
            <div className="mt-4">
              <button
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded
                           bg-[var(--audico-accent)] text-white
                           hover:bg-[var(--audico-accent-hover)] active:bg-[var(--audico-accent-active)]
                           transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleNewReport}
                disabled={creating}
              >
                {creating ? "Creating…" : "+ New Status Report"}
              </button>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-[#fde7e9] border border-[#f4abaa] text-[#a80000] px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-3 text-audico-mid-grey-1 py-2">
            <div className="w-5 h-5 rounded-full border-2 border-audico-mid-grey-3 border-t-[var(--audico-accent)] animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        )}

        {/* Reports table */}
        {!loading && reports.length > 0 && (
          <div className="bg-white rounded-md border border-audico-mid-grey-3 overflow-hidden">
            <div className="px-6 py-4 border-b border-audico-mid-grey-3">
              <h2 className="text-base font-semibold text-audico-black">Status Reports</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-audico-light-grey border-b border-audico-mid-grey-3">
                  <th className="px-4 py-3 text-xs font-semibold text-audico-dark-grey uppercase tracking-wide text-left">Date</th>
                  <th className="px-4 py-3 text-xs font-semibold text-audico-dark-grey uppercase tracking-wide text-left">Phase</th>
                  <th className="px-4 py-3 text-xs font-semibold text-audico-dark-grey uppercase tracking-wide text-right">Progress</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.pum_statusreportingid} className="border-b border-audico-light-grey hover:bg-audico-light-grey transition-colors">
                    <td className="px-4 py-3 text-sm text-audico-black whitespace-nowrap">{fmtDate(r.pum_statusdate)}</td>
                    <td className="px-4 py-3 text-sm text-audico-black">{initiative?.pum_currentstagetextfield ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-audico-black text-right tabular-nums">
                      {initiative?.pum_scheduleprogressin
                        ? `${initiative.pum_scheduleprogressin.replace(/%\s*$/, "").trim()} %`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="px-3 py-1 text-xs font-semibold rounded bg-white text-audico-black
                                   border border-audico-mid-grey-3 hover:bg-audico-light-grey transition-colors"
                        onClick={() => onOpenReport(r.pum_statusreportingid, initiativeId!)}
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty state */}
        {!loading && initiativeId && reports.length === 0 && !error && (
          <div className="bg-white rounded-md border border-audico-mid-grey-3 py-16 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-audico-light-grey flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-audico-mid-grey-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-base font-semibold text-audico-black">No reports yet</p>
            <p className="text-sm text-audico-mid-grey-1 mt-1">Create the first status report for this project.</p>
          </div>
        )}

        {/* Project overview */}
        {!loading && initiativeId && hasOverviewData && (
          <div className="bg-white rounded-md border border-audico-mid-grey-3 overflow-hidden">
            <div className="px-6 py-4 border-b border-audico-mid-grey-3">
              <h2 className="text-base font-semibold text-audico-black">Project Overview</h2>
            </div>
            <div className="p-6 space-y-6">
              {tasks.length > 0 && (
                <div>
                  <h3 className="section-subtitle">Tasks ({tasks.length})</h3>
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th className="w-20">WBS</th>
                        <th>Name</th>
                        <th>Start</th>
                        <th>End</th>
                        <th className="col-num">Planned (h)</th>
                        <th className="col-num">Actual (h)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((t) => {
                        const taskAssignments = assignmentsByTask.get(t.pum_gantttaskid) ?? [];
                        return (
                          <React.Fragment key={t.pum_gantttaskid}>
                            <tr>
                              <td className="whitespace-nowrap text-audico-mid-grey-1">{t.pum_wbs ?? "—"}</td>
                              <td>{t.pum_name}</td>
                              <td className="whitespace-nowrap">{fmtDate(t.pum_startdate)}</td>
                              <td className="whitespace-nowrap">{fmtDate(t.pum_enddate)}</td>
                              <td /><td />
                            </tr>
                            {taskAssignments.map((a) => (
                              <tr key={a.pum_assignmentid} className="bg-audico-light-grey/50">
                                <td />
                                <td className="pl-6 text-audico-mid-grey-1 text-xs">↳ {a.resourceName}</td>
                                <td colSpan={2} />
                                <td className="text-right text-xs tabular-nums">{a.plannedHours}</td>
                                <td className="text-right text-xs tabular-nums">{a.actualHours}</td>
                              </tr>
                            ))}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <ChangesTable changes={changes} lang="en" />
              <RisksTable risks={risks} lang="en" />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

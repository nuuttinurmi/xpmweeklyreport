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
  type AssignmentRow,
} from "../utils/dataverseClient";
import { toISODateString } from "../utils/weekUtils";

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
  const [_initiative, setInitiative] = useState<PumInitiative | null>(null);
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
    setTasks([]);
    setAssignments([]);
    setChanges([]);
    setRisks([]);

    const [reportsResult, tasksResult, assignmentsResult, changesResult, risksResult] =
      await Promise.allSettled([
        fetchStatusReports(id),
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
      const reportId = newReport.pum_statusreportingid;
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
    <div className="page page--list">
      <header className="page__header">
        <h1 className="page__title">Weekly Reports</h1>
      </header>

      <InitiativeSelector
        value={initiativeId}
        onChange={(id, ini) => {
          setInitiativeId(id);
          setInitiative(ini);
        }}
      />

      {initiativeId && (
        <div className="list-actions">
          <button
            className="btn btn--primary"
            onClick={handleNewReport}
            disabled={creating}
          >
            {creating ? "Creating…" : "+ New Status Report"}
          </button>
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}
      {loading && <div className="loading-indicator">Loading…</div>}

      {!loading && reports.length > 0 && (
        <table className="data-table report-list-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Phase</th>
              <th>Progress</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.pum_statusreportingid}>
                <td style={{ whiteSpace: "nowrap" }}>{fmtDate(r.pum_statusdate)}</td>
                <td>{r.pum_currentphase ?? "—"}</td>
                <td>{r.pum_scheduleprogress != null ? `${r.pum_scheduleprogress} %` : "—"}</td>
                <td>
                  <button
                    className="btn btn--small"
                    onClick={() => onOpenReport(r.pum_statusreportingid, initiativeId!)}
                  >
                    Open
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!loading && initiativeId && reports.length === 0 && !error && (
        <p className="empty-state">
          No reports for this project. Create the first report.
        </p>
      )}

      {!loading && initiativeId && hasOverviewData && (
        <section style={{ marginTop: "32px" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "12px" }}>
            Project Overview
          </h2>

          {tasks.length > 0 && (
            <>
              <h3 style={{ fontSize: "0.875rem", fontWeight: 600, margin: "12px 0 6px" }}>
                Tasks ({tasks.length})
              </h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>WBS</th>
                    <th>Name</th>
                    <th>Start</th>
                    <th>End</th>
                    <th style={{ textAlign: "right" }}>Planned (h)</th>
                    <th style={{ textAlign: "right" }}>Actual (h)</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t) => {
                    const taskAssignments = assignmentsByTask.get(t.pum_gantttaskid) ?? [];
                    return (
                      <React.Fragment key={t.pum_gantttaskid}>
                        <tr>
                          <td style={{ whiteSpace: "nowrap", color: "#666" }}>{t.pum_wbs ?? "—"}</td>
                          <td>{t.pum_name}</td>
                          <td style={{ whiteSpace: "nowrap" }}>{fmtDate(t.pum_startdate)}</td>
                          <td style={{ whiteSpace: "nowrap" }}>{fmtDate(t.pum_enddate)}</td>
                          <td /><td />
                        </tr>
                        {taskAssignments.map((a) => (
                          <tr key={a.pum_assignmentid} style={{ background: "#f9f9f9" }}>
                            <td />
                            <td style={{ paddingLeft: "24px", color: "#444", fontSize: "0.85em" }}>
                              ↳ {a.resourceName}
                            </td>
                            <td colSpan={2} />
                            <td style={{ textAlign: "right", fontSize: "0.85em" }}>{a.plannedHours}</td>
                            <td style={{ textAlign: "right", fontSize: "0.85em" }}>{a.actualHours}</td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}

          <ChangesTable changes={changes} lang="en" />
          <RisksTable risks={risks} lang="en" />
        </section>
      )}
    </div>
  );
}

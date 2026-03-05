import React, { useState, useEffect } from "react";
import type {
  PumInitiative,
  AudWeeklyReport,
  PumGanttTask,
  PumChangeRequest,
  PumRisk,
} from "../types/dataverse";
import { InitiativeSelector } from "../components/InitiativeSelector";
import { ChangesTable, RisksTable } from "../components/ChangesRisks";
import {
  fetchWeeklyReports,
  createWeeklyReport,
  fetchAllGanttTasks,
  upsertTaskNote,
  fetchChangeRequests,
  fetchRisks,
  fetchAssignmentsForInitiative,
  type AssignmentRow,
} from "../utils/dataverseClient";
import { getISOWeek } from "../utils/weekUtils";

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
  const [reports, setReports] = useState<AudWeeklyReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tablesMissing, setTablesMissing] = useState(false);

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
    setTablesMissing(false);
    setReports([]);
    setTasks([]);
    setAssignments([]);
    setChanges([]);
    setRisks([]);

    const [reportsResult, tasksResult, assignmentsResult, changesResult, risksResult] =
      await Promise.allSettled([
        fetchWeeklyReports(id),
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
      if (msg.includes("404")) {
        setTablesMissing(true);
      } else {
        setError(msg);
      }
    }

    if (tasksResult.status === "fulfilled") {
      setTasks(tasksResult.value);
    }
    if (assignmentsResult.status === "fulfilled") {
      setAssignments(assignmentsResult.value);
    }
    if (changesResult.status === "fulfilled") {
      setChanges(changesResult.value);
    }
    if (risksResult.status === "fulfilled") {
      setRisks(risksResult.value);
    }

    setLoading(false);
  }

  async function handleNewReport() {
    if (!initiativeId) return;
    const now = new Date();
    const { week, year } = getISOWeek(now);

    // Guard: prevent duplicate for same week
    const duplicate = reports.find(
      (r) => r.aud_weeknumber === week && r.aud_year === year
    );
    if (duplicate) {
      alert(`Viikon ${week}/${year} raportti on jo olemassa.`);
      onOpenReport(duplicate.aud_weeklyreportid!, initiativeId);
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const newReport = await createWeeklyReport({
        aud_weeknumber: week,
        aud_year: year,
        aud_status: "Luonnos",
        aud_safetynotes: "Ei poikkeamia.",
        // Associate with initiative via OData bind
        "aud_initiative@odata.bind": `/pum_initiatives(${initiativeId})`,
      } as Omit<AudWeeklyReport, "aud_weeklyreportid">);

      const reportId = newReport.aud_weeklyreportid!;

      // Auto-create task note stubs for active tasks
      try {
        const startOfYear = `${year}-01-01`;
        const endOfYear = `${year}-12-31`;
        const tasks = await fetchAllGanttTasks(initiativeId, startOfYear, endOfYear);
        await Promise.all(
          tasks.map((t) =>
            upsertTaskNote(undefined, reportId, t.pum_gantttaskid, "")
          )
        );
      } catch {
        // Non-fatal — task stubs can be created manually
      }

      await loadReports(initiativeId);
      onOpenReport(reportId, initiativeId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreating(false);
    }
  }

  const STATUS_BADGE: Record<string, string> = {
    Luonnos: "badge--draft",
    Valmis: "badge--ready",
    Lähetetty: "badge--sent",
  };

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
        <h1 className="page__title">Työvaiheilmoitukset</h1>
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
            {creating ? "Luodaan…" : "+ Uusi viikkoraportti"}
          </button>
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}

      {tablesMissing && (
        <div className="info-banner">
          Raportit eivät ole saatavilla —{" "}
          <code>aud_weeklyreport</code>-taulukko puuttuu ympäristöstä.
        </div>
      )}

      {loading && <div className="loading-indicator">Ladataan…</div>}

      {!loading && reports.length > 0 && (
        <table className="data-table report-list-table">
          <thead>
            <tr>
              <th>Viikko</th>
              <th>Vuosi</th>
              <th>Status</th>
              <th>Luotu</th>
              <th>PDF</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.aud_weeklyreportid}>
                <td>Vko {r.aud_weeknumber}</td>
                <td>{r.aud_year}</td>
                <td>
                  <span className={`badge ${STATUS_BADGE[r.aud_status] ?? ""}`}>
                    {r.aud_status}
                  </span>
                </td>
                <td>—</td>
                <td>
                  {r.aud_outputfileurl ? (
                    <a
                      href={r.aud_outputfileurl}
                      target="_blank"
                      rel="noreferrer"
                      className="link"
                    >
                      Avaa PDF
                    </a>
                  ) : (
                    <span className="empty-note">—</span>
                  )}
                </td>
                <td>
                  <button
                    className="btn btn--small"
                    onClick={() =>
                      onOpenReport(r.aud_weeklyreportid!, initiativeId)
                    }
                  >
                    Avaa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!loading && initiativeId && reports.length === 0 && !tablesMissing && (
        <p className="empty-state">
          Ei raportteja tälle projektille. Luo ensimmäinen raportti.
        </p>
      )}

      {!loading && initiativeId && hasOverviewData && (
        <section style={{ marginTop: "32px" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "12px" }}>
            Projektin tiedot
          </h2>

          {tasks.length > 0 && (
            <>
              <h3 style={{ fontSize: "0.875rem", fontWeight: 600, margin: "12px 0 6px" }}>
                Tehtävät ({tasks.length})
              </h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>WBS</th>
                    <th>Nimi</th>
                    <th>Alkaa</th>
                    <th>Päättyy</th>
                    <th style={{ textAlign: "right" }}>Suunn. (h)</th>
                    <th style={{ textAlign: "right" }}>Tot. (h)</th>
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
                          <td />
                          <td />
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

          <ChangesTable changes={changes} />
          <RisksTable risks={risks} />
        </section>
      )}
    </div>
  );
}

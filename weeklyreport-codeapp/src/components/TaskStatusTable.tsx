import { useState } from "react";
import type { TaskStatusRow } from "../types/dataverse";

interface Props {
  rows: TaskStatusRow[];
  onNoteChange: (taskId: string, noteId: string | undefined, notes: string) => void;
  readOnly?: boolean;
}

export function TaskStatusTable({ rows, onNoteChange, readOnly = false }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  function startEdit(row: TaskStatusRow) {
    if (readOnly) return;
    setEditingId(row.taskId);
    setEditValue(row.notes);
  }

  function commitEdit(row: TaskStatusRow) {
    onNoteChange(row.taskId, row.noteId, editValue);
    setEditingId(null);
  }

  function formatCompletion(pct: number): string {
    if (pct === 100) return "100 % — Complete";
    if (pct === 0) return "0 %";
    return `${pct} %`;
  }

  return (
    <section className="report-section">
      <h2 className="report-section__title">Project Status</h2>
      {rows.length === 0 ? (
        <p className="empty-state">No active tasks.</p>
      ) : (
        <table className="data-table data-table--tasks">
          <thead>
            <tr>
              <th>Task</th>
              <th>Area</th>
              <th className="data-table__num">Completion</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.taskId}>
                <td>{row.taskName}</td>
                <td className="data-table__area">{row.area || "—"}</td>
                <td className="data-table__num">
                  <span
                    className={`completion-badge completion-badge--${
                      row.completionPct === 100
                        ? "done"
                        : row.completionPct >= 50
                        ? "mid"
                        : "low"
                    }`}
                  >
                    {formatCompletion(row.completionPct)}
                  </span>
                </td>
                <td className="data-table__notes">
                  {readOnly ? (
                    row.notes || <span className="empty-note">—</span>
                  ) : editingId === row.taskId ? (
                    <textarea
                      autoFocus
                      className="notes-textarea"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => commitEdit(row)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          commitEdit(row);
                        }
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      rows={2}
                    />
                  ) : (
                    <span
                      className="notes-display"
                      onClick={() => startEdit(row)}
                      title="Click to edit"
                    >
                      {row.notes || (
                        <span className="notes-placeholder">Add note…</span>
                      )}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="data-source-note">
        Data source: xPM <code>pum_gantttask</code> (Work / Actual work). Automatic.
        Notes = entered by PM.
      </p>
    </section>
  );
}

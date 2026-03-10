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
      <h2 className="section-title">Project Status</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-audico-mid-grey-1 italic">No active tasks.</p>
      ) : (
        <table className="report-table">
          <thead>
            <tr>
              <th>Task</th>
              <th className="col-area">Area</th>
              <th className="col-num">Completion</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.taskId}>
                <td>{row.taskName}</td>
                <td className="col-area">{row.area || "—"}</td>
                <td className="col-num">
                  <span className={
                    row.completionPct === 100 ? "badge-done"
                    : row.completionPct >= 50 ? "badge-mid"
                    : "badge-low"
                  }>
                    {formatCompletion(row.completionPct)}
                  </span>
                </td>
                <td>
                  {readOnly ? (
                    row.notes || <span className="text-audico-mid-grey-2">—</span>
                  ) : editingId === row.taskId ? (
                    <textarea
                      autoFocus
                      className="w-full text-sm text-audico-black font-sans border border-[var(--audico-accent)] rounded px-2 py-1 resize-y
                                 focus:outline-none focus:ring-2 focus:ring-[var(--audico-accent)]/20"
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
                        <span className="text-audico-mid-grey-1 italic">Add note…</span>
                      )}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

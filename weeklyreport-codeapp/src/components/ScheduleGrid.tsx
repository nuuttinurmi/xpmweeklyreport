import React from "react";
import type { ScheduleCell } from "../types/dataverse";
import type { buildScheduleColumns } from "../utils/weekUtils";

interface Props {
  cells: ScheduleCell[];
  columns: ReturnType<typeof buildScheduleColumns>;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export function ScheduleGrid({ cells, columns }: Props) {
  const { weeks, days } = columns;
  // Filter out rows where no day is active (task outside entire 3-week window)
  const activeCells = cells.filter((c) => c.days.some(Boolean));

  return (
    <section className="report-section">
      <h2 className="report-section__title">3-Week Schedule</h2>
      {activeCells.length === 0 ? (
        <p className="empty-state">No tasks in the selected time range.</p>
      ) : (
        <div className="schedule-wrapper">
          <table className="schedule-table">
            <thead>
              {/* Week header row */}
              <tr>
                <th className="schedule-table__task-col" rowSpan={2}>
                  Task
                </th>
                <th className="schedule-table__area-col" rowSpan={2}>
                  Area
                </th>
                {weeks.map((w) => (
                  <th
                    key={`${w.week}-${w.year}`}
                    colSpan={5}
                    className="schedule-table__week-header"
                  >
                    {w.label}
                  </th>
                ))}
              </tr>
              {/* Day header row */}
              <tr>
                {days.map((d) => (
                  <th key={d.isoDate} className="schedule-table__day-header">
                    {d.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeCells.map((cell) => (
                <tr key={cell.taskId}>
                  <td className="schedule-table__task-name">{cell.taskName}</td>
                  <td className="schedule-table__area">
                    {cell.area || "—"}
                  </td>
                  {cell.days.map((active, i) => (
                    <td
                      key={i}
                      className={
                        active
                          ? "schedule-table__cell schedule-table__cell--active"
                          : "schedule-table__cell"
                      }
                    >
                      {active ? "×" : ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

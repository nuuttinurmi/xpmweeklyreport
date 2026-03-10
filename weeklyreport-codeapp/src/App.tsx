import { useState, useEffect } from "react";
import { ReportList } from "./pages/ReportList";
import { ReportEditor } from "./pages/ReportEditor";
import "./styles/app.css";

const PA_FLOW_URL = (import.meta.env.VITE_PA_FLOW_URL as string) || "";

type View =
  | { type: "list" }
  | { type: "editor"; reportId: string; initiativeId: string };

export default function App() {
  const [view, setView] = useState<View>({ type: "list" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reportIdParam = params.get("reportId");
    const initiativeIdParam = params.get("initiativeId");
    if (reportIdParam && initiativeIdParam) {
      setView({ type: "editor", reportId: reportIdParam, initiativeId: initiativeIdParam });
    }
    // Generated services handle auth via the Power Apps runtime — no init needed.
  }, []);

  return (
    <div className="min-h-screen bg-audico-light-grey font-sans text-audico-black">
      {view.type === "list" ? (
        <ReportList
          onOpenReport={(reportId, initiativeId) =>
            setView({ type: "editor", reportId, initiativeId })
          }
        />
      ) : (
        <ReportEditor
          reportId={view.reportId}
          initiativeId={view.initiativeId}
          onBack={() => setView({ type: "list" })}
          powerAutomateFlowUrl={PA_FLOW_URL || undefined}
        />
      )}
    </div>
  );
}

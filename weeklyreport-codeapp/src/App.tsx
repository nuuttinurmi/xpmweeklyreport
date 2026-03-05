import React, { useState, useEffect } from "react";
import { ReportList } from "./pages/ReportList";
import { ReportEditor } from "./pages/ReportEditor";
import { initDataverseClient } from "./utils/dataverseClient";
import { getDataverseToken } from "./utils/msalClient";
import "./styles/app.css";

const DATAVERSE_URL = (import.meta.env.VITE_DATAVERSE_URL as string) || "";
const PA_FLOW_URL = (import.meta.env.VITE_PA_FLOW_URL as string) || "";

type View =
  | { type: "list" }
  | { type: "editor"; reportId: string; initiativeId: string };

export default function App() {
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [view, setView] = useState<View>({ type: "list" });

  useEffect(() => {
    console.debug("[Auth] startup url:", window.location.href, "hash:", window.location.hash);

    const params = new URLSearchParams(window.location.search);
    const reportIdParam = params.get("reportId");
    const initiativeIdParam = params.get("initiativeId");
    if (reportIdParam && initiativeIdParam) {
      setView({ type: "editor", reportId: reportIdParam, initiativeId: initiativeIdParam });
    }

    if (!DATAVERSE_URL) {
      setSdkError(
        "DATAVERSE_URL ei ole asetettu. Lisää VITE_DATAVERSE_URL .env.local-tiedostoon."
      );
      return;
    }

    initDataverseClient(DATAVERSE_URL, () => getDataverseToken(DATAVERSE_URL));

    // Eagerly acquire a token so that:
    // 1. If this is the MSAL popup window returning from AAD, handleRedirectPromise()
    //    runs immediately, processes the auth code, and closes the popup.
    // 2. On the main window, the token is warmed up before the first search.
    getDataverseToken(DATAVERSE_URL)
      .then(() => setSdkReady(true))
      .catch((err) => setSdkError(String(err)));
  }, []);

  if (sdkError) {
    return (
      <div className="app-error">
        <h2>Konfigurointivirhe</h2>
        <p>{sdkError}</p>
        <pre>
          {`# .env.local
VITE_DATAVERSE_URL=https://yourorg.crm.dynamics.com
VITE_PA_FLOW_URL=https://prod-xx.logic.azure.com/...`}
        </pre>
      </div>
    );
  }

  if (!sdkReady) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
        <p>Alustetaan…</p>
      </div>
    );
  }

  return (
    <div className="app">
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

import { useState, useEffect } from "react";
import { ReportList } from "./pages/ReportList";
import { ReportEditor } from "./pages/ReportEditor";
import { initDataverseClient } from "./utils/dataverseClient";
import { getDataverseToken } from "./utils/msalClient";
import { getContext } from "@microsoft/power-apps/app";
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
    void (async () => {
      console.debug("[Auth] startup url:", window.location.href, "hash:", window.location.hash);

      const params = new URLSearchParams(window.location.search);
      const reportIdParam = params.get("reportId");
      const initiativeIdParam = params.get("initiativeId");
      if (reportIdParam && initiativeIdParam) {
        setView({ type: "editor", reportId: reportIdParam, initiativeId: initiativeIdParam });
      }

      if (!DATAVERSE_URL) {
        setSdkError(
          "DATAVERSE_URL is not set. Add VITE_DATAVERSE_URL to your .env.local file."
        );
        return;
      }

      // When running inside Power Apps player, get the user's UPN so that MSAL
      // ssoSilent can target the right account without requiring interactive login.
      let loginHint: string | undefined;
      try {
        // In local dev getContext() may never reject — race it against a timeout
        // so we don't block the auth flow when not inside Power Apps player.
        const ctx = await Promise.race([
          getContext(),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 1000)),
        ]);
        loginHint = ctx.user.userPrincipalName;
      } catch {
        // Not inside Power Apps (local dev) — loginHint stays undefined.
      }

      initDataverseClient(DATAVERSE_URL, () => getDataverseToken(DATAVERSE_URL, loginHint));

      // Eagerly acquire a token so that:
      // 1. If this is the MSAL popup window returning from AAD, handleRedirectPromise()
      //    runs immediately, processes the auth code, and closes the popup.
      // 2. On the main window, the token is warmed up before the first search.
      getDataverseToken(DATAVERSE_URL, loginHint)
        .then(() => setSdkReady(true))
        .catch((err) => setSdkError(String(err)));
    })();
  }, []);

  if (sdkError) {
    return (
      <div className="app-error">
        <h2>Configuration Error</h2>
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
        <p>Initializing…</p>
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

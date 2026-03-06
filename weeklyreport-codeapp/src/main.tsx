import ReactDOM from "react-dom/client";
import App from "./App";

// StrictMode is intentionally omitted: it double-invokes effects in dev,
// which causes MSAL to fire acquireTokenPopup twice simultaneously.
ReactDOM.createRoot(document.getElementById("root")!).render(<App />);

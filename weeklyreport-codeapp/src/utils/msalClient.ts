import { PublicClientApplication, InteractionRequiredAuthError } from "@azure/msal-browser";

const clientId = import.meta.env.VITE_MSAL_CLIENT_ID as string;
const tenantId = import.meta.env.VITE_MSAL_TENANT_ID as string;

const msalInstance = new PublicClientApplication({
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "localStorage",
  },
});

let initPromise: Promise<void> | null = null;

function clearStaleInteraction() {
  // If a PKCE request is in flight (request.params key present), don't clear
  // interaction.status — handleRedirectPromise() needs it to process the redirect.
  const hasPendingRequest = Array.from(
    { length: sessionStorage.length },
    (_, i) => sessionStorage.key(i)
  ).some((key) => key?.includes("request.params"));

  if (!hasPendingRequest) {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (key?.includes("interaction.status")) sessionStorage.removeItem(key);
    }
  }
}

// Must NOT start with "msal." — MSAL v5 clears its own namespace on init.
const REDIRECT_COUNT_KEY = "auth.redirect.count";

function checkRedirectLoop(): void {
  const count = parseInt(sessionStorage.getItem(REDIRECT_COUNT_KEY) ?? "0", 10);
  if (count >= 3) {
    sessionStorage.removeItem(REDIRECT_COUNT_KEY);
    throw new Error(
      "Kirjautuminen epäonnistui toistuvasti. Tarkista sovelluksen rekisteröinti Entra ID:ssä: " +
      "onko Dynamics CRM -käyttöoikeus lisätty ja hyväksytty?"
    );
  }
  sessionStorage.setItem(REDIRECT_COUNT_KEY, String(count + 1));
}

export function ensureInitialized(): Promise<void> {
  if (!initPromise) {
    clearStaleInteraction();
    initPromise = msalInstance
      .initialize()
      .then(() =>
        msalInstance.handleRedirectPromise().then((result) => {
          if (result) {
            // Successful redirect — reset the loop counter
            sessionStorage.removeItem(REDIRECT_COUNT_KEY);
          }
        })
      )
      .then(() => undefined);
  }
  return initPromise;
}

const isInIframe = () => window.self !== window.top;

export async function getDataverseToken(dataverseUrl: string, loginHint?: string): Promise<string> {
  await ensureInitialized();

  const scope = `${dataverseUrl.replace(/\/$/, "")}/.default`;
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0) {
    try {
      const result = await msalInstance.acquireTokenSilent({
        scopes: [scope],
        account: accounts[0],
      });
      return result.accessToken;
    } catch (err) {
      if (err instanceof InteractionRequiredAuthError) {
        clearStaleInteraction();
        checkRedirectLoop();
        await msalInstance.acquireTokenRedirect({ scopes: [scope] });
        return "";
      }
      throw err;
    }
  } else {
    if (isInIframe()) {
      // No cached accounts. Try ssoSilent (works in production Power Apps player where the
      // user already has an AAD session). If it fails (e.g. local dev), open a popup.
      // Note: acquireTokenRedirect is blocked in iframes; popup windows are handled via
      // the early-return in App.tsx so they never reach this code path.
      try {
        const result = await msalInstance.ssoSilent({ scopes: [scope], loginHint });
        return result.accessToken;
      } catch {
        // ssoSilent fails in the local play URL (apps.powerapps.com) because:
        // - Power Apps CSP blocks the AAD hidden iframe (timed_out)
        // - localStorage is partitioned from the direct-tab session
        // For local dev, use http://localhost:3000 directly.
        // In production (deployed app), ssoSilent works because the user is
        // already authenticated with Power Apps (active AAD session allowed by PA CSP).
        throw new Error(
          "Authentication failed inside the Power Apps play URL. " +
          "For local dev, use http://localhost:3000 directly instead of the play URL."
        );
      }
    }
    clearStaleInteraction();
    checkRedirectLoop();
    await msalInstance.acquireTokenRedirect({ scopes: [scope], prompt: "login" });
    return "";
  }
}

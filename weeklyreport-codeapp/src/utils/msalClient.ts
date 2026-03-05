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
const isInPopup = () => !!window.opener && window.opener !== window;

export async function getDataverseToken(dataverseUrl: string): Promise<string> {
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
        if (isInIframe() || isInPopup()) {
          throw new Error(
            "Sessio vanhentunut. Avaa sovellus suoraan osoitteessa http://localhost:3000 " +
            "kirjautuaksesi uudelleen."
          );
        }
        await msalInstance.acquireTokenRedirect({ scopes: [scope] });
        return "";
      }
      throw err;
    }
  } else {
    if (isInIframe()) {
      throw new Error(
        "Kirjautuminen vaaditaan. Avaa sovellus ensin suoraan osoitteessa " +
        "http://localhost:3000 kirjautuaksesi sisään."
      );
    }
    if (isInPopup()) {
      throw new Error(
        "Sulje tämä ikkuna ja avaa sovellus uudessa välilehdessä osoitteessa http://localhost:3000"
      );
    }
    clearStaleInteraction();
    checkRedirectLoop();
    await msalInstance.acquireTokenRedirect({ scopes: [scope], prompt: "login" });
    return "";
  }
}

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const SESSION_STORAGE_KEY = "popeye_psid_token";

export type MessengerContextValue = {
  psid: string | null;
  token: string | null;
  isMessengerContext: boolean;
  isReady: boolean;
  debugError: string | null;
};

const initial: MessengerContextValue = {
  psid: null,
  token: null,
  isMessengerContext: false,
  isReady: false,
  debugError: null,
};

const MessengerContext = createContext<MessengerContextValue>(initial);

type VerifyResponse = { ok: boolean; psid?: string; error?: string };

export function MessengerContextProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<MessengerContextValue>(initial);

  useEffect(() => {
    let cancelled = false;

    const fail = (debugError: string) => {
      if (cancelled) return;
      if (process.env.NODE_ENV !== "production") {
        // DEV-ONLY BYPASS: lets checkout be tested outside Messenger.
        // Remove before shipping to production.
        setValue({
          psid: "TEST_PSID_LOCAL_DEV",
          token: "TEST_TOKEN_LOCAL_DEV",
          isMessengerContext: true,
          isReady: true,
          debugError,
        });
        return;
      }
      setValue({
        psid: null,
        token: null,
        isMessengerContext: false,
        isReady: true,
        debugError,
      });
    };

    (async () => {
      const url = new URL(window.location.href);
      let token = url.searchParams.get("t");

      if (!token) {
        try {
          token = sessionStorage.getItem(SESSION_STORAGE_KEY);
        } catch {
          token = null;
        }
      }

      if (!token) {
        fail("no order token in URL or session");
        return;
      }

      try {
        const res = await fetch("/api/verify-psid-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = (await res.json()) as VerifyResponse;
        if (cancelled) return;

        if (!res.ok || !data.ok || !data.psid) {
          fail(data.error ?? `verify failed (http ${res.status})`);
          return;
        }

        try {
          sessionStorage.setItem(SESSION_STORAGE_KEY, token);
        } catch {
          // ignore storage failures (private browsing, etc.)
        }

        setValue({
          psid: data.psid,
          token,
          isMessengerContext: true,
          isReady: true,
          debugError: null,
        });
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        fail(`verify request threw: ${message}`);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <MessengerContext.Provider value={value}>
      {children}
    </MessengerContext.Provider>
  );
}

export function useMessengerContext(): MessengerContextValue {
  return useContext(MessengerContext);
}

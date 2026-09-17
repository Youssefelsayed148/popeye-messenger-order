"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const SDK_SRC = "https://connect.facebook.net/en_US/messenger.Extensions.js";
const SDK_LOAD_TIMEOUT_MS = 3000;

export type MessengerContextValue = {
  psid: string | null;
  threadId: string | null;
  isMessengerContext: boolean;
  isReady: boolean;
};

const initial: MessengerContextValue = {
  psid: null,
  threadId: null,
  isMessengerContext: false,
  isReady: false,
};

const MessengerContext = createContext<MessengerContextValue>(initial);

type SdkContextPayload = {
  psid?: string;
  thread_id?: string;
};

type SdkContextError = {
  error?: string;
  error_message?: string;
};

declare global {
  interface Window {
    MessengerExtensions?: {
      getContext: (
        appId: string,
        success: (ctx: SdkContextPayload) => void,
        error: (err: SdkContextError) => void
      ) => void;
    };
  }
}

let sdkLoadStarted = false;

function loadSdk(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (sdkLoadStarted) return Promise.resolve();
  sdkLoadStarted = true;

  return new Promise((resolve) => {
    const existing = document.querySelector(
      `script[src="${SDK_SRC}"]`
    ) as HTMLScriptElement | null;

    const script = existing ?? document.createElement("script");
    if (!existing) {
      script.src = SDK_SRC;
      script.async = true;
      document.head.appendChild(script);
    }

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    script.addEventListener("load", finish, { once: true });
    script.addEventListener("error", finish, { once: true });

    if (window.MessengerExtensions) finish();
  });
}

export function MessengerContextProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<MessengerContextValue>(initial);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const fallback = () => {
      if (cancelled) return;
      if (process.env.NODE_ENV !== "production") {
        // DEV-ONLY BYPASS: lets checkout be tested outside Messenger's webview.
        // Remove before shipping to production.
        setValue({
          psid: "TEST_PSID_LOCAL_DEV",
          threadId: null,
          isMessengerContext: true,
          isReady: true,
        });
        return;
      }
      setValue({
        psid: null,
        threadId: null,
        isMessengerContext: false,
        isReady: true,
      });
    };

    timeoutId = setTimeout(fallback, SDK_LOAD_TIMEOUT_MS);

    const tryGetContext = () => {
      const appId = process.env.NEXT_PUBLIC_MESSENGER_APP_ID;
      const sdk = window.MessengerExtensions;
      if (!sdk || !appId) {
        fallback();
        return;
      }
      try {
        sdk.getContext(
          appId,
          (ctx) => {
            if (cancelled) return;
            if (timeoutId) clearTimeout(timeoutId);
            setValue({
              psid: ctx.psid ?? null,
              threadId: ctx.thread_id ?? null,
              isMessengerContext: true,
              isReady: true,
            });
          },
          (err) => {
            console.warn(
              "[messenger-context] getContext error:",
              err?.error_message ?? err?.error ?? "unknown"
            );
            fallback();
          }
        );
      } catch (err) {
        console.warn("[messenger-context] getContext threw:", err);
        fallback();
      }
    };

    const handleReady = () => tryGetContext();

    window.addEventListener("MessengerExtensionReady", handleReady);

    loadSdk().then(() => {
      if (cancelled) return;
      if (window.MessengerExtensions) {
        tryGetContext();
      }
    });

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener("MessengerExtensionReady", handleReady);
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

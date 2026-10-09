import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  getCurrentPhoneAccount,
  loginPhoneAccount,
  logoutPhoneAccount,
  registerPhoneAccount,
  type PhoneAccountResponse,
  type PhonePasswordInput,
  type RegisterPhoneAccountInput,
} from "@workspace/api-client-react";

export type PortalUser = PhoneAccountResponse["user"];
export type PhoneCredentials = PhonePasswordInput;
export type PhoneRegistrationCredentials = RegisterPhoneAccountInput;

type AuthState = "loading" | "ready" | "error";

type AuthContextValue = {
  user: PortalUser | null;
  status: AuthState;
  signIn: (credentials: PhoneCredentials) => Promise<void>;
  register: (credentials: PhoneRegistrationCredentials) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStatus(error: unknown): number | null {
  if (!error || typeof error !== "object" || !("status" in error)) return null;
  const status = error.status;
  return typeof status === "number" ? status : null;
}

export function getAuthErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "data" in error) {
    const data = error.data;
    if (data && typeof data === "object" && "error" in data && typeof data.error === "string") {
      return data.error;
    }
  }
  if (readStatus(error) === 429) return "Too many attempts. Wait a little while and try again.";
  return fallback;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PortalUser | null>(null);
  const [status, setStatus] = useState<AuthState>("loading");

  useEffect(() => {
    let active = true;

    getCurrentPhoneAccount({ credentials: "include" })
      .then((response) => {
        if (!active) return;
        setUser(response.user);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (!active) return;
        setUser(null);
        setStatus(readStatus(error) === 401 ? "ready" : "error");
      });

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      async signIn(credentials) {
        const response = await loginPhoneAccount(credentials, { credentials: "include" });
        setUser(response.user);
        setStatus("ready");
      },
      async register(credentials) {
        const response = await registerPhoneAccount(credentials, { credentials: "include" });
        setUser(response.user);
        setStatus("ready");
      },
      async signOut() {
        await logoutPhoneAccount({ credentials: "include" });
        setUser(null);
        setStatus("ready");
      },
    }),
    [user, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

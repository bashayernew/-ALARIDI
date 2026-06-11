"use client";

import * as React from "react";
import {
  registerCustomer,
  loginCustomer,
  logoutCustomer,
  getMe,
  type AuthErrorCode,
} from "@/actions/customer-auth";
import type { PublicCustomer } from "@/lib/customer-auth/types";

type CustomerAuthContextValue = {
  user: PublicCustomer | null;
  ready: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ ok: true } | { ok: false; code: AuthErrorCode }>;
  register: (input: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    referralCode?: string;
  }) => Promise<{ ok: true } | { ok: false; code: AuthErrorCode }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const CustomerAuthContext = React.createContext<CustomerAuthContextValue | null>(
  null
);

export function useCustomerAuth(): CustomerAuthContextValue {
  const ctx = React.useContext(CustomerAuthContext);
  if (!ctx) {
    throw new Error("useCustomerAuth must be used within CustomerAuthProvider");
  }
  return ctx;
}

export function CustomerAuthProvider({
  children,
  initialUser = null,
}: {
  children: React.ReactNode;
  initialUser?: PublicCustomer | null;
}) {
  const [user, setUser] = React.useState<PublicCustomer | null>(initialUser);
  const [ready, setReady] = React.useState(initialUser !== null);

  const refreshUser = React.useCallback(async () => {
    const next = await getMe();
    setUser(next);
  }, []);

  React.useEffect(() => {
    if (initialUser !== null) {
      setReady(true);
      return;
    }
    let alive = true;
    (async () => {
      const next = await getMe();
      if (!alive) return;
      setUser(next);
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [initialUser]);

  const login = React.useCallback(
    async (email: string, password: string) => {
      const res = await loginCustomer(email, password);
      if (res.ok) {
        setUser(res.customer);
      }
      return res.ok ? { ok: true as const } : { ok: false as const, code: res.code };
    },
    []
  );

  const register = React.useCallback(
    async (input: {
      fullName: string;
      email: string;
      phone: string;
      password: string;
      referralCode?: string;
    }) => {
      const res = await registerCustomer(input);
      if (res.ok) {
        setUser(res.customer);
      }
      return res.ok ? { ok: true as const } : { ok: false as const, code: res.code };
    },
    []
  );

  const logout = React.useCallback(async () => {
    await logoutCustomer();
    setUser(null);
  }, []);

  const value = React.useMemo(
    () => ({ user, ready, login, register, logout, refreshUser }),
    [user, ready, login, register, logout, refreshUser]
  );

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

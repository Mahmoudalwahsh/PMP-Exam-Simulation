import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface AccessContextType {
  hasAccess: boolean;
  setAccess: (value: boolean) => void;
  checkAccess: () => boolean;
  logout: () => void;
}

const AccessContext = createContext<AccessContextType | null>(null);

const STORAGE_KEY = "pmp_site_access";

export function AccessProvider({ children }: { children: ReactNode }) {
  const [hasAccess, setHasAccess] = useState<boolean>(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored === "true";
  });

  const setAccess = (value: boolean) => {
    setHasAccess(value);
    if (value) {
      sessionStorage.setItem(STORAGE_KEY, "true");
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  };

  const checkAccess = () => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored === "true";
  };

  const logout = () => {
    setAccess(false);
  };

  return (
    <AccessContext.Provider value={{ hasAccess, setAccess, checkAccess, logout }}>
      {children}
    </AccessContext.Provider>
  );
}

export function useAccess() {
  const context = useContext(AccessContext);
  if (!context) {
    throw new Error("useAccess must be used within an AccessProvider");
  }
  return context;
}

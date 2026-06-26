'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

interface MobileNavValue {
  open: boolean;
  setOpen: (v: boolean) => void;
}

const MobileNavContext = createContext<MobileNavValue>({ open: false, setOpen: () => {} });

export function MobileNavProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <MobileNavContext.Provider value={{ open, setOpen }}>{children}</MobileNavContext.Provider>;
}

export const useMobileNav = () => useContext(MobileNavContext);

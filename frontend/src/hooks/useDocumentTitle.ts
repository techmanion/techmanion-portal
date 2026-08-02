import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { EXECUTIVE_NAV_ITEMS, NAV_ITEMS } from "../lib/nav";

const APP_NAME = "Techmanion";

function sectionTitle(pathname: string): string | null {
  if (pathname === "/login") return "Sign in";
  if (pathname.startsWith("/profile")) return "My Profile";
  const match = [...NAV_ITEMS, ...EXECUTIVE_NAV_ITEMS]
    .filter((item) => pathname.startsWith(item.to))
    .sort((a, b) => b.to.length - a.to.length)[0];
  return match?.label ?? null;
}

export function useDocumentTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    const section = sectionTitle(pathname);
    document.title = section ? `${section} · ${APP_NAME}` : APP_NAME;
  }, [pathname]);
}

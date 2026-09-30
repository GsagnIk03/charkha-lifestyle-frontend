import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";

/**
 * Shared page frame. Renders the storefront header (logo + category nav)
 * above every page except the admin dashboard and its sub-routes — the
 * dashboard is an internal tool for the store owner/team, not somewhere a
 * customer should be shopping from, so it intentionally gets no category
 * buttons and no link back into the storefront nav.
 */
export default function Layout() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <>
      {!isAdminRoute && <Header />}
      <Outlet />
    </>
  );
}

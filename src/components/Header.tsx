import { Link } from "react-router-dom";
import { PRODUCT_CATEGORIES } from "../api/types";
import logo from "../assets/logo.jpg";

/**
 * Shared site header — shown on every storefront page via Layout.tsx.
 * Deliberately does NOT link to /admin: the dashboard is for the store
 * owner/team, not a customer-facing nav item, so it stays reachable only
 * by typing the URL directly.
 */
export default function Header() {
  return (
    <header
      style={{
        padding: "20px 48px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 16,
      }}
    >
      <Link to="/" style={{ display: "flex", alignItems: "center" }}>
        <img
          src={logo}
          alt="Charkha — nurses your style"
          style={{ height: 48, width: 48, borderRadius: 6 }}
        />
      </Link>

      <nav style={{ display: "flex", gap: 8 }}>
        {PRODUCT_CATEGORIES.map((category) => (
          <Link
            key={category}
            to={`/category/${category}`}
            style={{
              color: "inherit",
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 600,
              padding: "8px 16px",
              border: "1px solid var(--border)",
              borderRadius: 4,
            }}
          >
            {category}
          </Link>
        ))}
      </nav>
    </header>
  );
}

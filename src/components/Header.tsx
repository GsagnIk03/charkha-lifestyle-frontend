import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { STOREFRONT_CATEGORIES } from "../api/types";
import { useCart } from "../context/CartContext";
import logo from "../assets/logo.jpg";

/**
 * Shared site header — shown on every storefront page via Layout.tsx.
 * Visual reference: Myntra-style header (logo + plain-text category nav +
 * search bar + profile/address/wishlist/bag icon group).
 *
 * The wishlist icon is still visual-only — there's no wishlist concept
 * yet. Search is functional (see SearchResults.tsx); Profile links to
 * /login, Address links to the localStorage-backed address book
 * (Addresses.tsx / AddressContext), and Bag links to /cart and shows a
 * live item-count badge from CartContext. Nav items use only the
 * storefront's garment categories (STOREFRONT_CATEGORIES) — Accessories is
 * deliberately excluded from customer browsing, though it stays in the
 * admin's full category list for inventory management.
 *
 * Deliberately does NOT link to /admin: the dashboard is for the store
 * owner/team, not a customer-facing nav item, so it stays reachable only
 * by typing the URL directly.
 */
export default function Header() {
  const navigate = useNavigate();
  const { itemCount } = useCart();
  const [query, setQuery] = useState("");

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <header
      style={{
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
      }}
    >
      <div
        style={{
          padding: "14px 48px",
          display: "flex",
          alignItems: "center",
          gap: 40,
          flexWrap: "wrap",
        }}
      >
        <Link
          to="/"
          style={{ display: "flex", alignItems: "center", flexShrink: 0 }}
        >
          <img
            src={logo}
            alt="Charkha — nurses your style"
            style={{ height: 44, width: 44, borderRadius: 6 }}
          />
        </Link>

        <nav style={{ display: "flex", gap: 28, flexShrink: 0 }}>
          {STOREFRONT_CATEGORIES.map((category) => (
            <Link
              key={category}
              to={`/category/${category}`}
              style={{
                color: "var(--ink)",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              {category}
            </Link>
          ))}
        </nav>

        <form
          onSubmit={handleSearchSubmit}
          style={{
            flex: "1 1 240px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: 4,
            padding: "9px 14px",
            minWidth: 200,
            maxWidth: 480,
          }}
        >
          <button
            type="submit"
            style={{
              background: "none",
              border: "none",
              padding: 0,
              display: "flex",
            }}
            aria-label="Search"
          >
            <SearchIcon />
          </button>
          <input
            type="text"
            placeholder="Search for pants, shirts, kurtas and more"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: 13,
              fontFamily: "var(--font-body)",
              color: "var(--ink)",
              width: "100%",
            }}
          />
        </form>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            marginLeft: "auto",
            flexShrink: 0,
          }}
        >
          <HeaderIcon icon={<ProfileIcon />} label="Profile" to="/login" />
          <HeaderIcon icon={<AddressIcon />} label="Address" to="/addresses" />
          <HeaderIcon icon={<HeartIcon />} label="Wishlist" />
          <HeaderIcon
            icon={<BagIcon />}
            label="Bag"
            to="/cart"
            badge={itemCount}
          />
        </div>
      </div>
    </header>
  );
}

/**
 * One icon + small caption, stacked — matches the reference's icon group.
 * Renders as a link when `to` is given (Profile → /login, Address →
 * /addresses, Bag → /cart); otherwise as an inert placeholder (Wishlist,
 * until that concept exists). `badge` overlays a small count circle
 * (used for the bag's item count) and is hidden when 0.
 */
function HeaderIcon({
  icon,
  label,
  to,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  to?: string;
  badge?: number;
}) {
  const style: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    color: "var(--ink)",
    cursor: to ? "pointer" : "default",
  };
  const content = (
    <>
      <div style={{ position: "relative" }}>
        {icon}
        {!!badge && (
          <span
            style={{
              position: "absolute",
              top: -6,
              right: -8,
              minWidth: 16,
              height: 16,
              padding: "0 3px",
              borderRadius: 8,
              background: "var(--accent)",
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
            }}
          >
            {badge}
          </span>
        )}
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.02em" }}>
        {label}
      </span>
    </>
  );
  return to ? (
    <Link to={to} style={style}>
      {content}
    </Link>
  ) : (
    <div style={style}>{content}</div>
  );
}

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--ink-muted)"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--ink)"
      strokeWidth="1.8"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </svg>
  );
}

function AddressIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--ink)"
      strokeWidth="1.8"
    >
      <path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--ink)"
      strokeWidth="1.8"
    >
      <path d="M12 20s-7-4.35-9.5-8.5C.8 8.2 2.3 4.5 6 4.5c2.1 0 3.5 1.2 6 3.8 2.5-2.6 3.9-3.8 6-3.8 3.7 0 5.2 3.7 3.5 7C19 15.65 12 20 12 20z" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--ink)"
      strokeWidth="1.8"
    >
      <path d="M6 8h12l-1 12H7L6 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

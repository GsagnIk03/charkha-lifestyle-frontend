import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiRequest } from "../api/client";
import { runSearch } from "../api/catalog";
import { STOREFRONT_CATEGORIES } from "../api/types";
import type { Product } from "../api/types";
import { useShopperProfile } from "../context/ShopperProfileContext";
import ProductTile from "../components/ProductTile";

/**
 * Search results page. There's no search endpoint on the backend, so this
 * fetches the live storefront catalog (garments only — Accessories is
 * excluded, matching the header nav) and matches/ranks it client-side; see
 * src/api/catalog.ts for the matching + gender-bias logic this calls into.
 *
 * The "Shopping for" toggle stands in for a real profile field (no
 * accounts are wired up yet) and is what a generic garment query like
 * "pants" or "shirt" is personalized against.
 */
export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { gender, setGender } = useShopperProfile();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiRequest<Product[]>("/products?status=live&limit=200")
      .then((data) => {
        if (!cancelled) {
          setCatalog(
            data.filter((p) =>
              (STOREFRONT_CATEGORIES as readonly string[]).includes(p.category),
            ),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const outcome = useMemo(
    () => runSearch(query, catalog, gender),
    [query, catalog, gender],
  );

  return (
    <div className="page-shell">
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 8,
        }}
      >
        <h1 style={{ fontSize: 24 }}>
          {query ? <>Results for &ldquo;{query}&rdquo;</> : "Search"}
        </h1>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
          }}
        >
          <span style={{ color: "var(--ink-muted)" }}>Shopping for:</span>
          {(["Men", "Women"] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGender(gender === g ? null : g)}
              style={{
                padding: "5px 12px",
                borderRadius: 14,
                border: "1px solid var(--border)",
                background: gender === g ? "var(--accent)" : "none",
                color: gender === g ? "#fff" : "var(--ink)",
                fontWeight: 600,
                fontSize: 12,
              }}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {outcome.biasApplied && (
        <p
          style={{ color: "var(--ink-muted)", fontSize: 13, marginBottom: 20 }}
        >
          Showing mostly {outcome.biasApplied === "Men" ? "men's" : "women's"}{" "}
          picks, with a few{" "}
          {outcome.biasApplied === "Men" ? "women's" : "men's"} picks mixed in.
        </p>
      )}
      {outcome.explicitCategory && (
        <p
          style={{ color: "var(--ink-muted)", fontSize: 13, marginBottom: 20 }}
        >
          Filtered to {outcome.explicitCategory}.
        </p>
      )}

      {loading ? (
        <p style={{ color: "var(--ink-muted)" }}>Loading&hellip;</p>
      ) : outcome.results.length === 0 ? (
        <p style={{ color: "var(--ink-muted)" }}>
          {query
            ? "No matching products found."
            : "Type something in the search bar above to get started."}
        </p>
      ) : (
        <div className="product-grid">
          {outcome.results.map((p) => (
            <ProductTile key={p.productId} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../api/client";
import { findColorVariants, parseProductName } from "../api/catalog";
import type { Product } from "../api/types";
import { useCart } from "../context/CartContext";
import ProductTile from "../components/ProductTile";

/**
 * Product detail page, redesigned Amazon-style: a buy-box (price, color
 * swatches, quantity, Add to Bag) next to the image, with a related-
 * products rail below.
 *
 * Color swatches aren't a separate data model — the catalog was generated
 * as "{color} {garment}" products (see scripts/gen_products.py in the
 * backend), so sibling colors of the same garment are real, independently
 * -priced-and-stocked products (see findColorVariants in api/catalog.ts).
 * Picking a swatch just navigates to that sibling product's own page,
 * which is also why availability per color is exact rather than
 * simulated: it's that product's real `stock`.
 */
export default function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [categoryCatalog, setCategoryCatalog] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const { items, addToCart } = useCart();

  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    setLoading(true);
    setJustAdded(false);
    apiRequest<Product>(`/products/${productId}`)
      .then((p) => {
        if (cancelled) return;
        setProduct(p);
        setQuantity(1);
        // Same-category catalog powers both the color-variant swatches and
        // the related-products rail below.
        return apiRequest<Product[]>(
          `/products?category=${encodeURIComponent(p.category)}&status=live&limit=100`,
        ).then((catalog) => {
          if (!cancelled) setCategoryCatalog(catalog);
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (loading || !product) {
    return (
      <div className="page-shell" style={{ color: "var(--ink-muted)" }}>
        Loading&hellip;
      </div>
    );
  }

  const { color: currentColor, garment } = parseProductName(product.name);
  const colorVariants = findColorVariants(product, categoryCatalog).sort(
    (a, b) => a.name.localeCompare(b.name),
  );
  const relatedProducts = categoryCatalog
    .filter(
      (p) =>
        p.productId !== product.productId &&
        parseProductName(p.name).garment !== garment,
    )
    .slice(0, 8);

  const inCartQty =
    items.find((i) => i.productId === product.productId)?.quantity ?? 0;
  const remainingStock = Math.max(0, product.stock - inCartQty);
  const canAdd = remainingStock > 0;

  function handleAddToBag() {
    if (!canAdd) return;
    addToCart(product!.productId, quantity);
    setJustAdded(true);
    setQuantity(1);
  }

  return (
    <div className="page-shell">
      <div className="pd-layout">
        <div
          className="pd-image"
          style={{
            background: "var(--border)",
            backgroundImage: product.imageKeys[0]
              ? `url(${product.imageKeys[0]})`
              : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        <div className="pd-info">
          <h1 style={{ fontSize: 26 }}>{product.name}</h1>
          <div style={{ fontSize: 26, fontWeight: 600, margin: "10px 0" }}>
            &#8377;{product.price.toLocaleString("en-IN")}
          </div>

          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color:
                product.stock > 0
                  ? "var(--accent-secondary)"
                  : "var(--ink-muted)",
              marginBottom: 16,
            }}
          >
            {product.stock > 0
              ? `In stock (${product.stock} left)`
              : "Out of stock"}
          </div>

          {colorVariants.length > 1 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                Color: {currentColor ?? "—"}
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {colorVariants.map((variant) => {
                  const { color } = parseProductName(variant.name);
                  const isSelected = variant.productId === product.productId;
                  const isAvailable = variant.stock > 0;
                  return (
                    <button
                      key={variant.productId}
                      onClick={() =>
                        isAvailable && navigate(`/product/${variant.productId}`)
                      }
                      disabled={!isAvailable}
                      title={
                        isAvailable
                          ? (color ?? "")
                          : `${color ?? ""} — out of stock`
                      }
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 6,
                        border: isSelected
                          ? "2px solid var(--accent)"
                          : "1px solid var(--border)",
                        backgroundImage: variant.imageKeys[0]
                          ? `url(${variant.imageKeys[0]})`
                          : undefined,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        position: "relative",
                        cursor: isAvailable ? "pointer" : "not-allowed",
                        opacity: isAvailable ? 1 : 0.4,
                      }}
                    >
                      {!isAvailable && (
                        <span
                          style={{
                            position: "absolute",
                            inset: 0,
                            background: "rgba(255,255,255,0.5)",
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              Quantity
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                }}
              >
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  style={{
                    width: 36,
                    height: 36,
                    background: "none",
                    border: "none",
                    fontSize: 16,
                  }}
                >
                  −
                </button>
                <span
                  style={{
                    width: 32,
                    textAlign: "center",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {quantity}
                </span>
                <button
                  onClick={() =>
                    setQuantity((q) => Math.min(remainingStock, q + 1))
                  }
                  disabled={quantity >= remainingStock}
                  style={{
                    width: 36,
                    height: 36,
                    background: "none",
                    border: "none",
                    fontSize: 16,
                  }}
                >
                  +
                </button>
              </div>
              {inCartQty > 0 && (
                <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>
                  {inCartQty} already in your bag
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleAddToBag}
            disabled={!canAdd}
            style={{
              height: 48,
              padding: "0 24px",
              background: canAdd ? "var(--accent)" : "var(--border)",
              color: canAdd ? "#fff" : "var(--ink-muted)",
              border: "none",
              fontWeight: 600,
              cursor: canAdd ? "pointer" : "not-allowed",
              width: "100%",
            }}
          >
            {canAdd
              ? "Add to Bag"
              : remainingStock === 0 && product.stock > 0
                ? "Max quantity in bag"
                : "Out of Stock"}
          </button>
          {justAdded && (
            <p
              style={{
                color: "var(--accent-secondary)",
                fontSize: 13,
                marginTop: 8,
              }}
            >
              Added to your bag.
            </p>
          )}

          <p style={{ color: "var(--ink-muted)", marginTop: 20 }}>
            {product.description}
          </p>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div style={{ marginTop: 56 }}>
          <h2 style={{ fontSize: 20, marginBottom: 20 }}>You may also like</h2>
          <div className="product-grid">
            {relatedProducts.map((p) => (
              <ProductTile key={p.productId} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

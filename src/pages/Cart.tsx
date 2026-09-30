import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../api/client";
import type { Product } from "../api/types";
import { useCart } from "../context/CartContext";

/**
 * Visual reference: artboard "Shopping Bag" at
 * https://claude.ai/code/artifact/0a1f84d7-6dee-43e5-8d32-6c514f68b1a1
 * Reads real items from CartContext (localStorage-backed — see that file);
 * each item's current price/stock is re-fetched here rather than trusted
 * from whenever it was added, so quantity stays capped to live stock.
 */
export default function Cart() {
  const { items, updateQuantity, removeFromCart } = useCart();
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (items.length === 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all(
      items.map((i) => apiRequest<Product>(`/products/${i.productId}`)),
    )
      .then((fetched) => {
        if (cancelled) return;
        const byId: Record<string, Product> = {};
        fetched.forEach((p) => {
          byId[p.productId] = p;
        });
        setProducts(byId);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // Only re-fetch when the set of product ids in the cart changes, not on
    // every quantity tweak.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map((i) => i.productId).join(",")]);

  const total = items.reduce((sum, i) => {
    const product = products[i.productId];
    return product ? sum + product.price * i.quantity : sum;
  }, 0);

  if (loading) {
    return (
      <div style={{ padding: "32px 48px", color: "var(--ink-muted)" }}>
        Loading&hellip;
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={{ padding: "32px 48px" }}>
        <h1 style={{ fontSize: 24, marginBottom: 24 }}>Shopping Bag</h1>
        <p style={{ color: "var(--ink-muted)" }}>Your bag is empty.</p>
        <Link
          to="/"
          style={{ display: "inline-block", marginTop: 16, fontWeight: 600 }}
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: "32px 48px", maxWidth: 720 }}>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>Shopping Bag</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {items.map((item) => {
          const product = products[item.productId];
          if (!product) return null;
          const atMaxStock = item.quantity >= product.stock;
          return (
            <div
              key={item.productId}
              style={{
                display: "flex",
                gap: 16,
                borderBottom: "1px solid var(--border)",
                paddingBottom: 16,
              }}
            >
              <Link
                to={`/product/${product.productId}`}
                style={{
                  flex: "0 0 100px",
                  aspectRatio: "3 / 4",
                  background: "var(--border)",
                  backgroundImage: product.imageKeys[0]
                    ? `url(${product.imageKeys[0]})`
                    : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <div style={{ flex: 1 }}>
                <Link
                  to={`/product/${product.productId}`}
                  style={{ color: "inherit", fontWeight: 600, fontSize: 15 }}
                >
                  {product.name}
                </Link>
                <div style={{ fontWeight: 600, margin: "6px 0" }}>
                  &#8377;{product.price.toLocaleString("en-IN")}
                </div>
                {product.stock === 0 ? (
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--ink-muted)",
                      marginBottom: 8,
                    }}
                  >
                    No longer in stock — remove from bag.
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        border: "1px solid var(--border)",
                        borderRadius: 4,
                      }}
                    >
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1)
                        }
                        style={{
                          width: 32,
                          height: 32,
                          background: "none",
                          border: "none",
                          fontSize: 15,
                        }}
                      >
                        −
                      </button>
                      <span
                        style={{
                          width: 28,
                          textAlign: "center",
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                      >
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1)
                        }
                        disabled={atMaxStock}
                        style={{
                          width: 32,
                          height: 32,
                          background: "none",
                          border: "none",
                          fontSize: 15,
                        }}
                      >
                        +
                      </button>
                    </div>
                    {atMaxStock && (
                      <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>
                        Max available quantity
                      </span>
                    )}
                  </div>
                )}
                <button
                  onClick={() => removeFromCart(item.productId)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--ink-muted)",
                    fontSize: 13,
                    padding: 0,
                    textDecoration: "underline",
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 24,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 600 }}>
          Total: &#8377;{total.toLocaleString("en-IN")}
        </div>
        <Link
          to="/checkout"
          style={{
            display: "inline-block",
            height: 48,
            lineHeight: "48px",
            padding: "0 24px",
            background: "var(--accent)",
            color: "#fff",
          }}
        >
          Proceed to Checkout
        </Link>
      </div>
    </div>
  );
}

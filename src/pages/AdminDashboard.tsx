import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { apiRequest, ApiError } from "../api/client";
import { PRODUCT_CATEGORIES } from "../api/types";
import type {
  InventoryChangeRequest,
  Product,
  ProductStatus,
} from "../api/types";

/**
 * Owner-only dashboard — the single place inventory is managed. The
 * storefront (Home/Listing/ProductDetail) only ever reads what's saved
 * here (via GET /products), so adding/editing/deleting a product on this
 * page is what puts it in front of customers.
 *
 * Visual reference: artboard "Owner Dashboard" at
 * https://claude.ai/code/artifact/0a1f84d7-6dee-43e5-8d32-6c514f68b1a1
 *
 * TODO: gate this route on the signed-in user's Cognito group being
 * "owner" — a team member hitting this URL directly should be redirected
 * to /admin/inventory/:productId/edit instead. Also TODO: attach the
 * Cognito access token to these apiRequest calls once auth is wired up —
 * right now they rely on LOCAL_DEV bypassing auth entirely.
 */

type Tab = "inventory" | "approvals";

type NewProductForm = {
  name: string;
  category: string;
  price: string;
  stock: string;
  description: string;
  imageUrl: string;
};

const EMPTY_FORM: NewProductForm = {
  name: "",
  category: PRODUCT_CATEGORIES[0],
  price: "",
  stock: "",
  description: "",
  imageUrl: "",
};

const thStyle: CSSProperties = {
  textAlign: "left",
  fontSize: 12,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "var(--ink-muted)",
  fontWeight: 600,
  padding: "0 0 10px",
};

const tdStyle: CSSProperties = {
  padding: "12px 0",
  verticalAlign: "middle",
};

const inputStyle: CSSProperties = {
  font: "inherit",
  fontSize: 13,
  padding: "6px 8px",
  border: "1px solid var(--border)",
  borderRadius: 4,
  background: "var(--surface)",
  color: "var(--ink)",
  width: "100%",
};

const buttonStyle: CSSProperties = {
  font: "inherit",
  fontSize: 13,
  fontWeight: 600,
  padding: "7px 14px",
  border: "1px solid var(--border)",
  borderRadius: 4,
  background: "var(--surface)",
  color: "var(--ink)",
};

const primaryButtonStyle: CSSProperties = {
  ...buttonStyle,
  background: "var(--accent)",
  borderColor: "var(--accent)",
  color: "#fff",
};

const dangerButtonStyle: CSSProperties = {
  ...buttonStyle,
  color: "oklch(45% 0.18 25)",
  borderColor: "oklch(85% 0.05 25)",
};

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("inventory");
  const [pending, setPending] = useState<InventoryChangeRequest[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ProductStatus>(
    "all",
  );

  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState<NewProductForm>(EMPTY_FORM);
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  // Inline-edit buffers, keyed by productId — lets price/stock inputs be
  // controlled without re-fetching on every keystroke.
  const [edits, setEdits] = useState<
    Record<string, { price: string; stock: string }>
  >({});

  function refresh() {
    setLoading(true);
    setError(null);
    Promise.all([
      apiRequest<InventoryChangeRequest[]>(
        "/inventory-requests?status=pending",
      ),
      apiRequest<Product[]>("/products?limit=500"),
    ])
      .then(([reqs, prods]) => {
        setPending(reqs);
        setProducts(prods);
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : String(err)),
      )
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  function withBusy<T>(id: string, fn: () => Promise<T>) {
    setBusyIds((prev) => new Set(prev).add(id));
    return fn().finally(() =>
      setBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      }),
    );
  }

  async function decide(requestId: string, decision: "approved" | "rejected") {
    await withBusy(requestId, () =>
      apiRequest(`/inventory-requests/${requestId}`, {
        method: "PATCH",
        body: { status: decision },
      }),
    );
    refresh();
  }

  function editBuffer(p: Product) {
    return (
      edits[p.productId] ?? { price: String(p.price), stock: String(p.stock) }
    );
  }

  function setEditBuffer(
    productId: string,
    field: "price" | "stock",
    value: string,
  ) {
    const current = edits[productId] ?? {
      price: String(
        products.find((x) => x.productId === productId)?.price ?? "",
      ),
      stock: String(
        products.find((x) => x.productId === productId)?.stock ?? "",
      ),
    };
    setEdits((prev) => ({
      ...prev,
      [productId]: { ...current, [field]: value },
    }));
  }

  async function commitEdit(p: Product) {
    const buf = editBuffer(p);
    const price = Number(buf.price);
    const stock = Number(buf.stock);
    if (Number.isNaN(price) || Number.isNaN(stock) || price < 0 || stock < 0) {
      setError("Price and stock must be non-negative numbers.");
      return;
    }
    if (price === p.price && stock === p.stock) return;

    await withBusy(p.productId, () =>
      apiRequest(`/products/${p.productId}`, {
        method: "PATCH",
        body: {
          name: p.name,
          category: p.category,
          price,
          stock,
          description: p.description,
          imageKeys: p.imageKeys,
        },
      }),
    );
    setProducts((prev) =>
      prev.map((x) =>
        x.productId === p.productId ? { ...x, price, stock } : x,
      ),
    );
  }

  async function toggleStatus(p: Product) {
    const next: ProductStatus = p.status === "live" ? "draft" : "live";
    await withBusy(p.productId, () =>
      apiRequest(`/products/${p.productId}/status?status=${next}`, {
        method: "PATCH",
      }),
    );
    setProducts((prev) =>
      prev.map((x) =>
        x.productId === p.productId ? { ...x, status: next } : x,
      ),
    );
  }

  async function deleteProduct(p: Product) {
    if (
      !window.confirm(
        `Remove "${p.name}" from the catalog? This can't be undone.`,
      )
    )
      return;
    await withBusy(p.productId, () =>
      apiRequest(`/products/${p.productId}`, { method: "DELETE" }),
    );
    setProducts((prev) => prev.filter((x) => x.productId !== p.productId));
  }

  async function submitNewProduct() {
    setAddError(null);
    const price = Number(newProduct.price);
    const stock = Number(newProduct.stock);
    if (!newProduct.name.trim()) return setAddError("Name is required.");
    if (!newProduct.category.trim())
      return setAddError("Category is required.");
    if (Number.isNaN(price) || price < 0)
      return setAddError("Price must be a non-negative number.");
    if (Number.isNaN(stock) || stock < 0)
      return setAddError("Stock must be a non-negative number.");

    setAdding(true);
    try {
      const created = await apiRequest<Product>("/products", {
        method: "POST",
        body: {
          name: newProduct.name.trim(),
          category: newProduct.category,
          price,
          stock,
          description: newProduct.description.trim(),
          imageKeys: newProduct.imageUrl.trim()
            ? [newProduct.imageUrl.trim()]
            : [],
        },
      });
      setProducts((prev) => [created, ...prev]);
      setNewProduct(EMPTY_FORM);
      setShowAddForm(false);
    } catch (err) {
      setAddError(err instanceof ApiError ? err.message : String(err));
    } finally {
      setAdding(false);
    }
  }

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (categoryFilter !== "all" && p.category !== categoryFilter)
        return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (
        q &&
        !p.name.toLowerCase().includes(q) &&
        !p.productId.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [products, search, categoryFilter, statusFilter]);

  const lowStockCount = products.filter((p) => p.stock <= 5).length;

  return (
    <div style={{ padding: "32px 48px", maxWidth: 1200, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <h1 className="serif" style={{ fontSize: 28 }}>
          Dashboard
        </h1>
        <div
          style={{
            display: "flex",
            gap: 24,
            fontSize: 13,
            color: "var(--ink-muted)",
          }}
        >
          <span>{products.length} products</span>
          <span>
            {pending.length} pending approval{pending.length === 1 ? "" : "s"}
          </span>
          <span
            style={
              lowStockCount > 0
                ? { color: "var(--accent)", fontWeight: 600 }
                : undefined
            }
          >
            {lowStockCount} low stock
          </span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 4,
          borderBottom: "1px solid var(--border)",
          marginBottom: 24,
        }}
      >
        {(["inventory", "approvals"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              font: "inherit",
              fontSize: 14,
              fontWeight: 600,
              padding: "10px 16px",
              border: "none",
              borderBottom:
                tab === t ? "2px solid var(--accent)" : "2px solid transparent",
              background: "transparent",
              color: tab === t ? "var(--ink)" : "var(--ink-muted)",
            }}
          >
            {t === "inventory"
              ? "Inventory"
              : `Pending Approvals${pending.length ? ` (${pending.length})` : ""}`}
          </button>
        ))}
      </div>

      {error && (
        <div
          style={{
            padding: "10px 14px",
            marginBottom: 16,
            background: "oklch(96% 0.03 25)",
            color: "oklch(40% 0.15 25)",
            fontSize: 13,
            borderRadius: 4,
          }}
        >
          {error}
        </div>
      )}

      {tab === "inventory" && (
        <>
          <div
            style={{
              display: "flex",
              gap: 12,
              marginBottom: 20,
              alignItems: "center",
            }}
          >
            <input
              placeholder="Search by name or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...inputStyle, maxWidth: 240 }}
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ ...inputStyle, maxWidth: 160 }}
            >
              <option value="all">All categories</option>
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | ProductStatus)
              }
              style={{ ...inputStyle, maxWidth: 140 }}
            >
              <option value="all">All statuses</option>
              <option value="live">Live</option>
              <option value="draft">Draft</option>
            </select>
            <div style={{ flex: 1 }} />
            <button
              style={primaryButtonStyle}
              onClick={() => setShowAddForm((v) => !v)}
            >
              {showAddForm ? "Cancel" : "+ Add Product"}
            </button>
          </div>

          {showAddForm && (
            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: 20,
                marginBottom: 24,
                background: "var(--surface)",
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 12,
              }}
            >
              <label style={{ fontSize: 12, color: "var(--ink-muted)" }}>
                Name
                <input
                  style={inputStyle}
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </label>
              <label style={{ fontSize: 12, color: "var(--ink-muted)" }}>
                Category
                <select
                  style={inputStyle}
                  value={newProduct.category}
                  onChange={(e) =>
                    setNewProduct((f) => ({ ...f, category: e.target.value }))
                  }
                >
                  {PRODUCT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ fontSize: 12, color: "var(--ink-muted)" }}>
                Image URL
                <input
                  style={inputStyle}
                  placeholder="https://…"
                  value={newProduct.imageUrl}
                  onChange={(e) =>
                    setNewProduct((f) => ({ ...f, imageUrl: e.target.value }))
                  }
                />
              </label>
              <label style={{ fontSize: 12, color: "var(--ink-muted)" }}>
                Price (₹)
                <input
                  style={inputStyle}
                  type="number"
                  min={0}
                  value={newProduct.price}
                  onChange={(e) =>
                    setNewProduct((f) => ({ ...f, price: e.target.value }))
                  }
                />
              </label>
              <label style={{ fontSize: 12, color: "var(--ink-muted)" }}>
                Stock
                <input
                  style={inputStyle}
                  type="number"
                  min={0}
                  value={newProduct.stock}
                  onChange={(e) =>
                    setNewProduct((f) => ({ ...f, stock: e.target.value }))
                  }
                />
              </label>
              <label
                style={{
                  fontSize: 12,
                  color: "var(--ink-muted)",
                  gridColumn: "span 3",
                }}
              >
                Description
                <input
                  style={inputStyle}
                  value={newProduct.description}
                  onChange={(e) =>
                    setNewProduct((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                />
              </label>
              {addError && (
                <div
                  style={{
                    gridColumn: "span 3",
                    fontSize: 13,
                    color: "oklch(45% 0.18 25)",
                  }}
                >
                  {addError}
                </div>
              )}
              <div style={{ gridColumn: "span 3", display: "flex", gap: 8 }}>
                <button
                  style={primaryButtonStyle}
                  disabled={adding}
                  onClick={submitNewProduct}
                >
                  {adding ? "Saving…" : "Save Product"}
                </button>
                <button
                  style={buttonStyle}
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <p style={{ color: "var(--ink-muted)" }}>Loading…</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Product</th>
                  <th style={thStyle}>Category</th>
                  <th style={{ ...thStyle, width: 110 }}>Price (₹)</th>
                  <th style={{ ...thStyle, width: 90 }}>Stock</th>
                  <th style={{ ...thStyle, width: 90 }}>Status</th>
                  <th style={{ ...thStyle, width: 160 }} />
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  const buf = editBuffer(p);
                  const busy = busyIds.has(p.productId);
                  return (
                    <tr
                      key={p.productId}
                      style={{
                        borderTop: "1px solid var(--border)",
                        opacity: busy ? 0.5 : 1,
                      }}
                    >
                      <td style={tdStyle}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              width: 40,
                              height: 52,
                              flexShrink: 0,
                              background: "var(--border)",
                              backgroundImage: p.imageKeys[0]
                                ? `url(${p.imageKeys[0]})`
                                : undefined,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                              borderRadius: 3,
                            }}
                          />
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>
                              {p.name}
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: "var(--ink-faint)",
                              }}
                            >
                              {p.productId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span
                          style={{ fontSize: 13, color: "var(--ink-muted)" }}
                        >
                          {p.category}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <input
                          style={inputStyle}
                          type="number"
                          min={0}
                          value={buf.price}
                          disabled={busy}
                          onChange={(e) =>
                            setEditBuffer(p.productId, "price", e.target.value)
                          }
                          onBlur={() => commitEdit(p)}
                        />
                      </td>
                      <td style={tdStyle}>
                        <input
                          style={{
                            ...inputStyle,
                            ...(p.stock <= 5
                              ? {
                                  borderColor: "var(--accent)",
                                  color: "var(--accent)",
                                }
                              : {}),
                          }}
                          type="number"
                          min={0}
                          value={buf.stock}
                          disabled={busy}
                          onChange={(e) =>
                            setEditBuffer(p.productId, "stock", e.target.value)
                          }
                          onBlur={() => commitEdit(p)}
                        />
                      </td>
                      <td style={tdStyle}>
                        <button
                          disabled={busy}
                          onClick={() => toggleStatus(p)}
                          style={{
                            ...buttonStyle,
                            padding: "4px 10px",
                            fontSize: 11,
                            textTransform: "uppercase",
                            letterSpacing: "0.03em",
                            color:
                              p.status === "live"
                                ? "var(--accent-secondary)"
                                : "var(--ink-muted)",
                            borderColor:
                              p.status === "live"
                                ? "var(--accent-secondary)"
                                : "var(--border)",
                          }}
                        >
                          {p.status}
                        </button>
                      </td>
                      <td style={tdStyle}>
                        <button
                          disabled={busy}
                          style={dangerButtonStyle}
                          onClick={() => deleteProduct(p)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{ padding: "20px 0", color: "var(--ink-muted)" }}
                    >
                      No products match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </>
      )}

      {tab === "approvals" && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>Submitted By</th>
              <th style={thStyle}>Product</th>
              <th style={thStyle}>Change</th>
              <th style={{ ...thStyle, width: 180 }} />
            </tr>
          </thead>
          <tbody>
            {pending.map((req) => {
              const busy = busyIds.has(req.requestId);
              return (
                <tr
                  key={req.requestId}
                  style={{
                    borderTop: "1px solid var(--border)",
                    opacity: busy ? 0.5 : 1,
                  }}
                >
                  <td style={tdStyle}>{req.submittedBy}</td>
                  <td style={tdStyle}>{req.productId}</td>
                  <td style={tdStyle}>
                    <div style={{ fontSize: 13 }}>
                      {req.changeType.replace(/_/g, " ")}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--ink-faint)" }}>
                      {JSON.stringify(req.payload)}
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <button
                      disabled={busy}
                      style={{ ...primaryButtonStyle, marginRight: 8 }}
                      onClick={() => decide(req.requestId, "approved")}
                    >
                      Approve
                    </button>
                    <button
                      disabled={busy}
                      style={dangerButtonStyle}
                      onClick={() => decide(req.requestId, "rejected")}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              );
            })}
            {pending.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  style={{ padding: "20px 0", color: "var(--ink-muted)" }}
                >
                  Nothing waiting on you right now.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

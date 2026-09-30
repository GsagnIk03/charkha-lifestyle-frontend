import { useState } from "react";
import { useAddresses } from "../context/AddressContext";
import type { Address } from "../context/AddressContext";

const EMPTY_FORM = {
  label: "",
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
};

/**
 * Address book — reachable from the "Address" icon in the header, next to
 * Profile. Backed by AddressContext (localStorage) since there's no
 * account system to attach saved addresses to yet; see that file's comment
 * for the migration path once one exists.
 */
export default function Addresses() {
  const {
    addresses,
    addAddress,
    updateAddress,
    removeAddress,
    setDefaultAddress,
  } = useAddresses();
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  function startAdd() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  }

  function startEdit(address: Address) {
    setForm({
      label: address.label,
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 ?? "",
      city: address.city,
      state: address.state,
      pincode: address.pincode,
    });
    setEditingId(address.addressId);
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingId) {
      updateAddress(editingId, form);
    } else {
      addAddress(form);
    }
    setShowForm(false);
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  return (
    <div className="page-shell" style={{ maxWidth: 640 }}>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>Your Addresses</h1>

      {addresses.length === 0 && !showForm && (
        <p style={{ color: "var(--ink-muted)", marginBottom: 20 }}>
          No addresses saved yet.
        </p>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {addresses.map((address) => (
          <div
            key={address.addressId}
            className="address-card"
            style={{
              border: "1px solid var(--border)",
              borderRadius: 4,
              padding: 16,
            }}
          >
            <div>
              <div
                style={{
                  fontWeight: 600,
                  marginBottom: 4,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {address.label}
                {address.isDefault && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--accent)",
                      border: "1px solid var(--accent)",
                      borderRadius: 3,
                      padding: "2px 6px",
                    }}
                  >
                    DEFAULT
                  </span>
                )}
              </div>
              <div style={{ fontSize: 14 }}>{address.fullName}</div>
              <div style={{ fontSize: 14, color: "var(--ink-muted)" }}>
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}, {address.city},{" "}
                {address.state} {address.pincode}
              </div>
              <div style={{ fontSize: 14, color: "var(--ink-muted)" }}>
                {address.phone}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                flexShrink: 0,
              }}
            >
              {!address.isDefault && (
                <button
                  onClick={() => setDefaultAddress(address.addressId)}
                  style={{
                    background: "none",
                    border: "1px solid var(--border)",
                    padding: "6px 10px",
                    fontSize: 13,
                  }}
                >
                  Set default
                </button>
              )}
              <button
                onClick={() => startEdit(address)}
                style={{
                  background: "none",
                  border: "1px solid var(--border)",
                  padding: "6px 10px",
                  fontSize: 13,
                }}
              >
                Edit
              </button>
              <button
                onClick={() => removeAddress(address.addressId)}
                style={{
                  background: "none",
                  border: "1px solid var(--border)",
                  padding: "6px 10px",
                  fontSize: 13,
                }}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {!showForm && (
        <button
          onClick={startAdd}
          style={{
            height: 44,
            padding: "0 20px",
            background: "var(--accent)",
            color: "#fff",
            border: "none",
            fontWeight: 600,
          }}
        >
          Add new address
        </button>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginTop: 8,
          }}
        >
          <input
            required
            placeholder="Label (e.g. Home, Work)"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            style={{ border: "1px solid var(--border)", padding: 12 }}
          />
          <input
            required
            placeholder="Full name"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            style={{ border: "1px solid var(--border)", padding: 12 }}
          />
          <input
            required
            placeholder="Phone number"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            style={{ border: "1px solid var(--border)", padding: 12 }}
          />
          <input
            required
            placeholder="Address line 1"
            value={form.line1}
            onChange={(e) => setForm({ ...form, line1: e.target.value })}
            style={{ border: "1px solid var(--border)", padding: 12 }}
          />
          <input
            placeholder="Address line 2 (optional)"
            value={form.line2}
            onChange={(e) => setForm({ ...form, line2: e.target.value })}
            style={{ border: "1px solid var(--border)", padding: 12 }}
          />
          <div className="form-row">
            <input
              required
              placeholder="City"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              style={{
                border: "1px solid var(--border)",
                padding: 12,
                flex: 1,
              }}
            />
            <input
              required
              placeholder="State"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              style={{
                border: "1px solid var(--border)",
                padding: 12,
                flex: 1,
              }}
            />
            <input
              required
              placeholder="Pincode"
              value={form.pincode}
              onChange={(e) => setForm({ ...form, pincode: e.target.value })}
              style={{
                border: "1px solid var(--border)",
                padding: 12,
                flex: 1,
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="submit"
              style={{
                height: 44,
                padding: "0 20px",
                background: "var(--accent)",
                color: "#fff",
                border: "none",
                fontWeight: 600,
              }}
            >
              {editingId ? "Save changes" : "Save address"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{
                height: 44,
                padding: "0 20px",
                background: "none",
                border: "1px solid var(--border)",
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

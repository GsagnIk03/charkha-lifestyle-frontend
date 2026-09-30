import { createContext, useContext, useEffect, useState } from "react";

export interface Address {
  addressId: string;
  label: string; // "Home", "Work", or whatever the customer names it
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

interface AddressContextValue {
  addresses: Address[];
  addAddress: (address: Omit<Address, "addressId" | "isDefault">) => void;
  updateAddress: (
    addressId: string,
    address: Omit<Address, "addressId" | "isDefault">,
  ) => void;
  removeAddress: (addressId: string) => void;
  setDefaultAddress: (addressId: string) => void;
}

const AddressContext = createContext<AddressContextValue | null>(null);

const STORAGE_KEY = "charkha_addresses";

function readStoredAddresses(): Address[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Address book, kept client-side in localStorage for now. There's no user
 * account/profile table on the backend yet (auth is Cognito but isn't
 * wired up — see src/pages/Login.tsx), so there's nowhere server-side to
 * attach a saved address to. Once real accounts exist, this should move to
 * an authenticated /addresses backend resource keyed by the Cognito user
 * id, and this context can just become the fetch/cache layer over that.
 */
export function AddressProvider({ children }: { children: React.ReactNode }) {
  const [addresses, setAddresses] = useState<Address[]>(() =>
    readStoredAddresses(),
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
    } catch {
      // Best-effort persistence only — see CartContext for the same tradeoff.
    }
  }, [addresses]);

  function addAddress(address: Omit<Address, "addressId" | "isDefault">) {
    setAddresses((prev) => [
      ...prev,
      {
        ...address,
        addressId: crypto.randomUUID(),
        isDefault: prev.length === 0,
      },
    ]);
  }

  function updateAddress(
    addressId: string,
    address: Omit<Address, "addressId" | "isDefault">,
  ) {
    setAddresses((prev) =>
      prev.map((a) => (a.addressId === addressId ? { ...a, ...address } : a)),
    );
  }

  function removeAddress(addressId: string) {
    setAddresses((prev) => {
      const next = prev.filter((a) => a.addressId !== addressId);
      // If the removed address was the default, promote the next one so
      // there's always a default whenever at least one address exists.
      if (next.length > 0 && !next.some((a) => a.isDefault)) {
        next[0] = { ...next[0], isDefault: true };
      }
      return next;
    });
  }

  function setDefaultAddress(addressId: string) {
    setAddresses((prev) =>
      prev.map((a) => ({ ...a, isDefault: a.addressId === addressId })),
    );
  }

  return (
    <AddressContext.Provider
      value={{
        addresses,
        addAddress,
        updateAddress,
        removeAddress,
        setDefaultAddress,
      }}
    >
      {children}
    </AddressContext.Provider>
  );
}

export function useAddresses(): AddressContextValue {
  const ctx = useContext(AddressContext);
  if (!ctx)
    throw new Error("useAddresses must be used within an AddressProvider");
  return ctx;
}

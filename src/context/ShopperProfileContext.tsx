import { createContext, useContext, useEffect, useState } from "react";

export type ShopperGender = "Men" | "Women" | null;

interface ShopperProfileContextValue {
  gender: ShopperGender;
  setGender: (gender: ShopperGender) => void;
}

const ShopperProfileContext = createContext<ShopperProfileContextValue | null>(
  null,
);

const STORAGE_KEY = "charkha_shopper_gender";

function readStoredGender(): ShopperGender {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === "Men" || raw === "Women" ? raw : null;
  } catch {
    return null;
  }
}

/**
 * Stand-in for a real user profile field. There's no account system wired
 * up yet (see src/pages/Login.tsx), so there's no signed-in user record to
 * read a stored gender from — this keeps the same one preference in
 * localStorage instead, set via the small toggle on the search results
 * page, and used to bias unisex-ish search results (see
 * src/pages/SearchResults.tsx). Once accounts exist, replace this with the
 * real profile field and drop the localStorage fallback.
 */
export function ShopperProfileProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [gender, setGenderState] = useState<ShopperGender>(() =>
    readStoredGender(),
  );

  useEffect(() => {
    try {
      if (gender) localStorage.setItem(STORAGE_KEY, gender);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Best-effort persistence only.
    }
  }, [gender]);

  return (
    <ShopperProfileContext.Provider
      value={{ gender, setGender: setGenderState }}
    >
      {children}
    </ShopperProfileContext.Provider>
  );
}

export function useShopperProfile(): ShopperProfileContextValue {
  const ctx = useContext(ShopperProfileContext);
  if (!ctx)
    throw new Error(
      "useShopperProfile must be used within a ShopperProfileProvider",
    );
  return ctx;
}

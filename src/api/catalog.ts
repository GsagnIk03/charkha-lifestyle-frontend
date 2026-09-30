// Everything in this file is derived from how charkha-lifestyle-backend's
// scripts/gen_products.py actually generates product names and categories
// (name = "{color} {item}", drawn from fixed COLORS/ITEMS vocab lists). It
// lets the frontend do two things without any backend schema change:
//   1. Recover a product's color and "garment type" from its name, so
//      sibling products (same garment, different color) can be shown as
//      color-variant swatches on the product page — each one a real,
//      independently-stocked catalog item.
//   2. Match a free-text search query (e.g. "pants") against the catalog's
//      actual item names (e.g. "Cotton Chinos", "Formal Trousers"), since a
//      literal substring search would otherwise miss the real names.
// If gen_products.py's vocab ever changes, update the lists below to match.

import type { Product } from "./types";

// Mirrors scripts/gen_products.py COLORS. Order doesn't matter, but every
// multi-word color must be checked before assuming a name starts with a
// bare single-word color (parseProductName below relies on this list, not
// on word order, since it always tries 2-word colors first).
export const COLORS = [
  "Ivory",
  "Charcoal",
  "Rust",
  "Forest Green",
  "Indigo",
  "Terracotta",
  "Slate Blue",
  "Mustard",
  "Maroon",
  "Olive",
  "Sand",
  "Onyx Black",
  "Blush Pink",
  "Deep Teal",
  "Warm Beige",
  "Burgundy",
  "Stone Grey",
  "Saffron",
  "Emerald",
  "Dusty Rose",
] as const;

/**
 * Splits a generated product name ("Deep Teal Handloom Saree") into its
 * color ("Deep Teal") and garment type ("Handloom Saree"). Falls back to
 * treating the whole name as the garment with no detected color if nothing
 * in COLORS matches (e.g. a future hand-entered product that doesn't
 * follow the generator's naming convention).
 */
export function parseProductName(name: string): {
  color: string | null;
  garment: string;
} {
  const sortedColors = [...COLORS].sort(
    (a, b) => b.split(" ").length - a.split(" ").length,
  );
  for (const color of sortedColors) {
    if (name.toLowerCase().startsWith(color.toLowerCase() + " ")) {
      return { color, garment: name.slice(color.length).trim() };
    }
  }
  return { color: null, garment: name };
}

/**
 * Given one product, finds its color-variant siblings: other live products
 * in the same category with the same garment type but a different color.
 * Each "swatch" is a real product with its own id/price/stock, so
 * availability is exact, not simulated.
 *
 * The seed catalog occasionally has more than one listing in the exact
 * same color (a generator quirk, not a real color variant) — those are
 * deduped down to one swatch per color, keeping whichever listing has the
 * most stock, except the color the caller is currently viewing always
 * keeps `product` itself as the representative so the swatch grid never
 * swaps out from under the page you're already on.
 */
export function findColorVariants(
  product: Product,
  catalog: Product[],
): Product[] {
  const { garment, color: currentColor } = parseProductName(product.name);
  const siblings = catalog.filter(
    (p) =>
      p.category === product.category &&
      parseProductName(p.name).garment === garment,
  );

  const byColor = new Map<string, Product>();
  for (const sibling of siblings) {
    const { color } = parseProductName(sibling.name);
    const key = color ?? sibling.productId;
    const existing = byColor.get(key);
    if (!existing || sibling.stock > existing.stock) {
      byColor.set(key, sibling);
    }
  }
  // Always represent the current color with the exact product being
  // viewed, even if a same-color sibling has more stock.
  if (currentColor) byColor.set(currentColor, product);

  return [...byColor.values()];
}

/**
 * Maps common free-text garment queries ("pants", "shirt", "kurta", ...) to
 * the actual item-name vocab used across MEN_ITEMS/WOMEN_ITEMS/KIDS_ITEMS in
 * gen_products.py, so search finds real products even though none of them
 * literally contain the word "pant" in their name. Keys are singular; the
 * search tokenizer strips a trailing "s" before lookup, so plurals match
 * automatically.
 */
export const GARMENT_SYNONYMS: Record<string, string[]> = {
  pant: [
    "Cotton Chinos",
    "Formal Trousers",
    "Joggers",
    "Palazzo Co-ord Set",
    "Pyjama Set",
    "Dungaree Set",
  ],
  trouser: ["Cotton Chinos", "Formal Trousers"],
  jogger: ["Joggers"],
  shirt: ["Tailored Shirt", "Polo T-Shirt", "Blouse", "Printed T-Shirt Set"],
  tshirt: ["Polo T-Shirt", "Printed T-Shirt Set"],
  "t-shirt": ["Polo T-Shirt", "Printed T-Shirt Set"],
  kurta: ["Kurta", "Kurti", "Straight-Fit Kurta Set", "Ethnic Set"],
  kurti: ["Kurti"],
  jacket: ["Nehru Jacket", "Bandhgala Jacket", "Denim Jacket", "Cape Jacket"],
  dress: ["Wrap Midi Dress", "Maxi Dress", "Anarkali Suit"],
  sweater: ["Crew Neck Sweater"],
  saree: ["Handloom Saree"],
  sari: ["Handloom Saree"],
  skirt: ["Pleated Skirt"],
  suit: ["Anarkali Suit", "Sherwani", "Straight-Fit Kurta Set"],
  sherwani: ["Sherwani"],
  frock: ["Party Frock"],
  dungaree: ["Dungaree Set"],
  waistcoat: ["Waistcoat"],
  blouse: ["Blouse"],
  dupatta: ["Dupatta"],
  top: ["Tunic Top", "Blouse"],
};

/** Storefront-relevant gender/age tokens a search query might explicitly name. */
export const CATEGORY_KEYWORDS: Record<string, "Men" | "Women" | "Kids"> = {
  men: "Men",
  man: "Men",
  mens: "Men",
  "men's": "Men",
  male: "Men",
  gents: "Men",
  women: "Women",
  woman: "Women",
  womens: "Women",
  "women's": "Women",
  female: "Women",
  ladies: "Women",
  kids: "Kids",
  kid: "Kids",
  child: "Kids",
  children: "Kids",
  childrens: "Kids",
  kidswear: "Kids",
};

export interface SearchOutcome {
  results: Product[];
  explicitCategory: "Men" | "Women" | "Kids" | null;
  biasApplied: "Men" | "Women" | null;
}

function normalizeToken(token: string): string {
  return token.toLowerCase().replace(/[^a-z']/g, "");
}

/** Strips a trailing "s" so plurals ("pants", "shirts") hit the singular GARMENT_SYNONYMS keys. */
function singularize(token: string): string {
  return token.endsWith("s") && token.length > 3 ? token.slice(0, -1) : token;
}

/**
 * Runs a search query against the (already accessories-filtered) storefront
 * catalog. See the module comment for the two matching strategies:
 *   - An explicit gender/age token ("men", "kids", ...) filters strictly to
 *     that category, combined with any garment token also in the query.
 *   - A generic garment token with no explicit category ("pants", "shirt",
 *     "kurta") matches across categories, then — if a shopper gender
 *     preference is known — is reordered so most results come from that
 *     preferred category with a small share from the other one, per the
 *     "male profile -> mostly men's, very few women's" behavior requested.
 *     Kids matches are included but not part of that men/women bias.
 * Falls back to a plain substring match on name/description when no
 * garment synonym matches any token, so specific words (a color, an exact
 * item name already in the catalog) still work.
 */
export function runSearch(
  query: string,
  catalog: Product[],
  shopperGender: "Men" | "Women" | null,
): SearchOutcome {
  const tokens = query.split(/\s+/).map(normalizeToken).filter(Boolean);

  let explicitCategory: "Men" | "Women" | "Kids" | null = null;
  const garmentNames = new Set<string>();
  const freeTextTokens: string[] = [];

  for (const token of tokens) {
    const asCategory = CATEGORY_KEYWORDS[token];
    if (asCategory) {
      explicitCategory = asCategory;
      continue;
    }
    const synonymMatch =
      GARMENT_SYNONYMS[token] ?? GARMENT_SYNONYMS[singularize(token)];
    if (synonymMatch) {
      synonymMatch.forEach((name) => garmentNames.add(name));
    } else {
      freeTextTokens.push(token);
    }
  }

  let matches: Product[];
  if (garmentNames.size > 0) {
    matches = catalog.filter((p) => {
      const nameLower = p.name.toLowerCase();
      return [...garmentNames].some((g) => nameLower.includes(g.toLowerCase()));
    });
  } else if (freeTextTokens.length > 0) {
    matches = catalog.filter((p) => {
      const haystack = `${p.name} ${p.description}`.toLowerCase();
      return freeTextTokens.some((t) => haystack.includes(t));
    });
  } else {
    matches = [];
  }

  if (explicitCategory) {
    return {
      results: matches.filter((p) => p.category === explicitCategory),
      explicitCategory,
      biasApplied: null,
    };
  }

  // No explicit category named — apply the men/women bias (if a preference
  // is known) without touching Kids matches, which just ride along.
  const kidsMatches = matches.filter((p) => p.category === "Kids");
  const menMatches = matches.filter((p) => p.category === "Men");
  const womenMatches = matches.filter((p) => p.category === "Women");

  if (!shopperGender || menMatches.length === 0 || womenMatches.length === 0) {
    return {
      results: [...menMatches, ...womenMatches, ...kidsMatches],
      explicitCategory: null,
      biasApplied: null,
    };
  }

  const preferred = shopperGender === "Men" ? menMatches : womenMatches;
  const other = shopperGender === "Men" ? womenMatches : menMatches;
  // "Mostly preferred, very few other": cap the other category to a small
  // slice (~20%, at least one) rather than showing it in full.
  const otherCapped = other.slice(
    0,
    Math.max(1, Math.round(preferred.length * 0.2)),
  );

  const interleaved: Product[] = [];
  let oi = 0;
  preferred.forEach((p, i) => {
    interleaved.push(p);
    if ((i + 1) % 4 === 0 && oi < otherCapped.length) {
      interleaved.push(otherCapped[oi]);
      oi += 1;
    }
  });
  while (oi < otherCapped.length) {
    interleaved.push(otherCapped[oi]);
    oi += 1;
  }

  return {
    results: [...interleaved, ...kidsMatches],
    explicitCategory: null,
    biasApplied: shopperGender,
  };
}

import { Link } from "react-router-dom";
import type { Product } from "../api/types";

/**
 * Shared product grid tile — image, name, price, linking to the product's
 * detail page. Used by SearchResults and ProductDetail's "related
 * products" rail; Home.tsx/Listing.tsx have their own inline copies of the
 * same markup predating this component.
 */
export default function ProductTile({ product }: { product: Product }) {
  return (
    <Link to={`/product/${product.productId}`} style={{ color: "inherit" }}>
      <div
        style={{
          aspectRatio: "3 / 4",
          background: "var(--border)",
          backgroundImage: product.imageKeys[0]
            ? `url(${product.imageKeys[0]})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div style={{ fontSize: 14, fontWeight: 600, marginTop: 8 }}>
        {product.name}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>
        &#8377;{product.price.toLocaleString("en-IN")}
      </div>
      {product.stock === 0 && (
        <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>
          Out of stock
        </div>
      )}
    </Link>
  );
}

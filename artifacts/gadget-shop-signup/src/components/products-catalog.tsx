import { ShoppingBag } from 'lucide-react';
import { ProductIllustration } from '@/components/product-illustration';
import type { ProductCatalogItem } from '@/data/product-catalog';

type ProductsCatalogProps = {
  products: readonly ProductCatalogItem[];
  formatPrice: (amount: number) => string;
  imageUrl: string;
};

export function ProductsCatalog({ products, formatPrice, imageUrl }: ProductsCatalogProps) {
  const prices = products.map((product) => product.price);
  const lowestPrice = Math.min(...prices);
  const highestPrice = Math.max(...prices);

  return (
    <>
      <section className="product-summary-banner" aria-label="Catalog summary">
        <img className="product-summary-photo" src={imageUrl} alt="" aria-hidden="true" loading="lazy" />
        <div>
          <p className="product-summary-eyebrow">Samsung Gadgets · Uganda</p>
          <p className="product-summary-value">{products.length}</p>
          <p className="product-summary-label">Catalog products</p>
        </div>
        <div className="product-summary-range">
          <p className="product-summary-eyebrow">Sale price range</p>
          <p className="product-summary-value">{formatPrice(lowestPrice)}–{formatPrice(highestPrice)}</p>
          <p className="product-summary-label">UGX · Prices only</p>
        </div>
      </section>

      <section className="product-catalog-list" aria-labelledby="catalog-title">
        <div className="product-list-heading">
          <div>
            <p className="product-list-eyebrow">Browse products</p>
            <h2 id="catalog-title">Samsung product catalog</h2>
          </div>
          <span className="product-brand-mark" aria-hidden="true">S</span>
        </div>

        {products.map((product, index) => (
          <article
            key={product.id}
            className="product-card"
            style={{ animationDelay: `${Math.min(index * 28, 300)}ms` }}
          >
            <h3 className="product-card-title">{product.name}</h3>
            <div className="product-card-art">
              <ProductIllustration kind={product.illustration} name={product.name} />
              <span>Illustration · exact model to confirm</span>
            </div>
            <div className="product-card-price-row">
              <div>
                <p className="product-card-price-label">Sale price</p>
                <p className="product-card-price">{formatPrice(product.price)} UGX</p>
              </div>
              <button
                type="button"
                disabled
                aria-describedby="product-checkout-note"
                aria-label={`Purchase ${product.name}; checkout unavailable`}
                title="Checkout is unavailable"
                className="product-buy-button"
              >
                <ShoppingBag aria-hidden="true" />
                Buy
              </button>
            </div>
            <div className="product-card-details">
              <div><span>Brand</span><strong>Samsung</strong></div>
              <div><span>Availability</span><strong>To confirm</strong></div>
            </div>
          </article>
        ))}
      </section>

      <p id="product-checkout-note" className="product-checkout-note">
        Checkout is not connected yet. Product pictures are illustrations; exact product models and stock need confirmation before ordering.
      </p>
    </>
  );
}

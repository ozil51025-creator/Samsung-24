import { ShoppingBag } from 'lucide-react';
import { ProductIllustration } from '@/components/product-illustration';
import type { ProductCatalogItem } from '@/data/product-catalog';

type ProductsCatalogProps = {
  products: readonly ProductCatalogItem[];
  formatPrice: (amount: number) => string;
  imageUrl: string;
  productImages: Readonly<Record<string, string>>;
};

export function ProductsCatalog({ products, formatPrice, imageUrl, productImages }: ProductsCatalogProps) {
  const estimatedDurationDays = 150;
  return (
    <>
      <header className="product-page-heading">
        <h1>Product</h1>
        <span className="product-page-mark" aria-label="Samsung">S</span>
      </header>
      <section className="product-summary-banner" aria-label="Product account summary">
        <img className="product-summary-photo" src={imageUrl} alt="Samsung Galaxy devices" fetchPriority="high" />
        <div>
          <p className="product-summary-value">—</p>
          <p className="product-summary-label">My products</p>
        </div>
        <div className="product-summary-range">
          <p className="product-summary-value">UGX —</p>
          <p className="product-summary-label">Total earnings</p>
        </div>
      </section>
      <section className="product-catalog-list" aria-label="Samsung products">
        {products.map((product) => (
          <article key={product.id} className="product-card">
            <h2 className="product-card-title">{product.name}</h2>
            <div className="product-card-art">
              {productImages[product.id]
                ? <img src={productImages[product.id]} alt={product.name} loading="lazy" />
                : <ProductIllustration kind={product.illustration} name={product.name} />}
            </div>
            <div className="product-card-price-row">
              <p className="product-card-price">{formatPrice(product.price)} UGX</p>
              <button className="product-buy-button" type="button" disabled aria-label={`Buy ${product.name}; checkout unavailable`} title="Checkout is unavailable">
                <ShoppingBag aria-hidden="true" /> Buy
              </button>
            </div>
            <div className="product-card-details">
              <div><span>Duration:</span><strong>{estimatedDurationDays} days</strong></div>
              <div><span>Daily earnings estimate:</span><strong>UGX {formatPrice(product.daily)}</strong></div>
              <div><span>Total earnings estimate:</span><strong>UGX {formatPrice(product.daily * estimatedDurationDays)}</strong></div>
            </div>
          </article>
        ))}
      </section>
      <p className="product-checkout-note">
        Earnings shown are estimates only. Reward terms and payouts are not active until confirmed.
      </p>
    </>
  );
}

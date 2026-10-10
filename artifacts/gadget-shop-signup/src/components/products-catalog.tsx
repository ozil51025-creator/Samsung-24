import { ProductIllustration } from '@/components/product-illustration';
import type { ProductCatalogItem } from '@/data/product-catalog';

type ProductsCatalogProps = {
  products: readonly ProductCatalogItem[];
  formatPrice: (amount: number) => string;
  imageUrl: string;
  productImages: Readonly<Record<string, string>>;
};

export function ProductsCatalog({ products, formatPrice, imageUrl, productImages }: ProductsCatalogProps) {
  const prices = products.map((product) => product.price);
  const lowestPrice = prices.length ? Math.min(...prices) : 0;
  const highestPrice = prices.length ? Math.max(...prices) : 0;

  return (
    <>
      <header className="product-page-heading">
        <h1>Product</h1>
        <span className="product-page-mark" aria-label="Samsung">S</span>
      </header>
      <section className="product-summary-banner" aria-label="Catalog information">
        <img className="product-summary-photo" src={imageUrl} alt="Samsung Galaxy devices" fetchPriority="high" />
        <div>
          <p className="product-summary-eyebrow">Samsung</p>
          <p className="product-summary-value">{products.length}</p>
          <p className="product-summary-label">Catalog products</p>
        </div>
        <div className="product-summary-range">
          <p className="product-summary-eyebrow">Sale price range</p>
          <p className="product-summary-value">{formatPrice(lowestPrice)}–{formatPrice(highestPrice)}</p>
          <p className="product-summary-label">UGX · Listed prices only</p>
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
              <p className="product-card-price">UGX {formatPrice(product.price)}</p>
              <button className="product-buy-button" type="button" disabled aria-label={`Buy ${product.name}; checkout unavailable`} title="Checkout is unavailable">
                Buy
              </button>
            </div>
            <div className="product-card-details">
              <div><span>Availability:</span><strong>Not confirmed</strong></div>
              <div><span>Checkout:</span><strong>Not active</strong></div>
              <div><span>Earnings:</span><strong>No guaranteed returns</strong></div>
            </div>
          </article>
        ))}
      </section>
      <p className="product-checkout-note">
        Listed prices are for catalog display only. Product models, stock, and checkout must be confirmed before sale.
      </p>
    </>
  );
}

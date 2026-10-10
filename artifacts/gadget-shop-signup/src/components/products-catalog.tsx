import { ProductIllustration } from '@/components/product-illustration';
import type { ProductIllustrationKind } from '@/data/product-catalog';

type CatalogProduct = { id: string; name: string; price: number; illustration: ProductIllustrationKind };

type ProductsCatalogProps = {
  products: readonly CatalogProduct[];
  formatPrice: (amount: number) => string;
  imageUrl: string;
  productImages: Readonly<Record<string, string>>;
  purchaseCount: number;
  totalCollectedUgx: number;
  buyingProductId: string | null;
  purchaseMessage: string;
  onPurchase: (productId: string) => void;
};

export function ProductsCatalog({ products, formatPrice, imageUrl, productImages, purchaseCount, totalCollectedUgx, buyingProductId, purchaseMessage, onPurchase }: ProductsCatalogProps) {
  return (
    <>
      <header className="product-page-heading">
        <h1>Product</h1>
        <span className="product-page-mark" aria-label="Samsung">S</span>
      </header>
      <section className="product-summary-banner" aria-label="Product purchase summary">
        <img className="product-summary-photo" src={imageUrl} alt="Samsung Galaxy devices" fetchPriority="high" />
        <div>
          <p className="product-summary-eyebrow">Purchase count</p>
          <p className="product-summary-value">{purchaseCount.toLocaleString()}</p>
          <p className="product-summary-label">Purchased products</p>
        </div>
        <div className="product-summary-collected">
          <p className="product-summary-eyebrow">Total collected</p>
          <p className="product-summary-value">UGX {formatPrice(totalCollectedUgx)}</p>
          <p className="product-summary-label">Product earnings received</p>
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
              <button className="product-buy-button" type="button" disabled={buyingProductId !== null} onClick={() => onPurchase(product.id)} aria-label={`Buy ${product.name}`}>
                {buyingProductId === product.id ? 'Processing…' : 'Buy'}
              </button>
            </div>
            <div className="product-card-details">
              <div><span>Daily estimate (25%):</span><strong>UGX {formatPrice(Math.floor(product.price * 0.25))}</strong></div>
              <div><span>Total estimate (150 days):</span><strong>UGX {formatPrice(Math.floor(product.price * 0.25) * 150)}</strong></div>
              <div><span>Order fulfillment:</span><strong>Pending</strong></div>
            </div>
          </article>
        ))}
      </section>
      {purchaseMessage && <p className="product-checkout-note" role="status" aria-live="polite">{purchaseMessage}</p>}
      {totalCollectedUgx === 0 && <p className="product-checkout-note">No product earnings have been credited to your wallet yet.</p>}
      <p className="product-checkout-note">Daily and total figures are estimates only, not guaranteed returns. Purchased orders are recorded as pending fulfillment.</p>
    </>
  );
}

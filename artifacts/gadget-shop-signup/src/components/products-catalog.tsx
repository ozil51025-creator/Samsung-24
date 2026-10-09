import { CreditCard } from 'lucide-react';
import { ProductIllustration } from '@/components/product-illustration';
import type { ProductCatalogItem } from '@/data/product-catalog';

type ProductsCatalogProps = {
  products: readonly ProductCatalogItem[];
  formatPrice: (amount: number) => string;
};

export function ProductsCatalog({ products, formatPrice }: ProductsCatalogProps) {
  return (
    <>
      <section className="mb-5 rounded-[19px] border border-[#a3c8d7] bg-white/40 p-4 shadow-sm sm:p-5" aria-labelledby="catalog-title">
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#31586b]">Uganda · UGX</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
          <h2 id="catalog-title" className="font-[Syne] text-[21px] font-bold tracking-[-.04em] text-[#173448]">Suggested Samsung gadgets</h2>
          <span className="rounded-full border border-[#7397aa]/30 bg-white/55 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.08em] text-[#405e6c]">Checkout unavailable</span>
        </div>
        <p className="mt-2 text-[11px] leading-5 text-[#3e6070]">
          Daily and hourly figures are the amounts you supplied. They are unverified estimates, not guaranteed returns, and no payouts are active. Product art is illustrative; confirm exact models and stock before sale.
        </p>
      </section>

      <div className="grid gap-3 lg:grid-cols-2">
        {products.map((product, index) => (
          <article
            key={product.id}
            className="product-row rounded-[19px] border border-[#98bfd0] bg-[#a9cfe0] p-3 shadow-[0_8px_18px_rgba(27,67,89,.14)] sm:p-4"
            style={{ animationDelay: `${Math.min(index * 28, 300)}ms` }}
          >
            <h3 className="text-center font-[Syne] text-[16px] font-bold leading-6 text-[#172b3a]">{product.name}</h3>
            <div className="mt-2 grid grid-cols-[94px_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[130px_minmax(0,1fr)] sm:gap-4">
              <div className="product-photo-placeholder flex min-h-[134px] flex-col items-center justify-center overflow-hidden rounded-[15px] text-[#244657]">
                <ProductIllustration kind={product.illustration} name={product.name} />
                <span className="mt-1 text-center text-[8px] font-semibold uppercase leading-3 tracking-[.08em] text-[#456474]">Illustrative art</span>
              </div>
              <div className="rounded-[15px] border border-[#5489bd] bg-[#5c94d1] px-3 py-3 text-white shadow-[0_5px_12px_rgba(31,69,102,.16)] sm:px-4 sm:py-4">
                <dl className="space-y-2.5 text-[11px] sm:space-y-3 sm:text-[13px]">
                  <div className="flex items-baseline justify-between gap-2">
                    <dt className="text-white/90">Sale price:</dt>
                    <dd className="price-figure text-right font-semibold text-[#102c44]">{formatPrice(product.price)} UGX</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <dt className="text-white/90">Brand:</dt>
                    <dd className="text-right font-medium text-[#102c44]">Samsung</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <dt className="text-white/90">Exact model:</dt>
                    <dd className="text-right font-medium text-[#102c44]">To confirm</dd>
                  </div>
                </dl>
                <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-white/20 pt-2 text-[9px] sm:text-[10px]">
                  <div>
                    <dt className="text-white/90">Daily · 25%</dt>
                    <dd className="price-figure mt-1 font-semibold text-[#102c44]">{formatPrice(product.daily)} UGX</dd>
                  </div>
                  <div>
                    <dt className="text-white/90">Hourly · 1.0417%</dt>
                    <dd className="price-figure mt-1 font-semibold text-[#102c44]">{formatPrice(product.hourly)} UGX</dd>
                  </div>
                </dl>
                <p className="mt-2 text-right text-[9px] font-medium text-[#102c44]">Payouts not active</p>
              </div>
            </div>
            <button
              type="button"
              disabled
              aria-describedby="product-checkout-note"
              aria-label={`Purchase product ${index + 1}; checkout unavailable`}
              title="Checkout is unavailable"
              className="ml-auto mt-3 flex min-h-10 w-[calc(100%-107px)] cursor-not-allowed items-center justify-center gap-2 rounded-full bg-[#142438]/75 px-3 text-[11px] font-bold text-white/85 shadow-sm sm:w-[calc(100%-146px)] sm:text-[12px]"
            >
              <CreditCard className="h-4 w-4" aria-hidden="true" />
              Purchase unavailable
            </button>
          </article>
        ))}
      </div>

      <p id="product-checkout-note" className="mt-5 rounded-[14px] border border-[#8db5c7] bg-white/45 px-4 py-3 text-[11px] leading-5 text-[#315466]">
        Checkout is disabled until verified product listings and a real payment provider are available. The pictures above are illustrations, not exact product photos.
      </p>
    </>
  );
}

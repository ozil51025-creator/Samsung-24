import './_group.css';
import { CreditCard, LockKeyhole } from 'lucide-react';
import { ProductPreviewFrame } from './_shared/ProductPreviewFrame';

const products = [
  30_000, 50_000, 115_000, 250_000, 370_000, 250_000,
  775_000, 1_650_000, 3_000_000, 5_000_000, 8_000_000, 12_000_000,
];
const money = new Intl.NumberFormat('en-UG', { maximumFractionDigits: 0 });

export function Current() {
  return (
    <ProductPreviewFrame>
      <div className="mb-5 flex flex-col justify-between gap-3 rounded-[18px] border border-[#ddcdbb] bg-[#f4eadb] p-5 sm:flex-row sm:items-center sm:px-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#9a6749]">Sale prices · Uganda</p>
          <p className="mt-1 text-[13px] leading-5 text-[#625e53]">The catalog shows price tiers only; product names and specifications are not available.</p>
        </div>
        <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-[#d9bda5] bg-[#fff9ef] px-3 py-2 text-[10px] font-bold uppercase tracking-[.08em] text-[#8d6347]">
          <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" /> Checkout unavailable
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((price, index) => (
          <article key={`${index}-${price}`} className="product-row flex min-h-[158px] flex-col justify-between rounded-[18px] border border-[#dedbce] bg-[#fffdf7]/90 p-5 transition-colors hover:border-[#9eae9a]" style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#819080]">Product {index + 1}</p>
              <p className="price-figure mt-3 text-[24px] font-medium tracking-[-.07em] text-[#294637]"><span className="mr-1 text-[11px] tracking-normal text-[#728073]">UGX</span>{money.format(price)}</p>
            </div>
            <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#ece8dc] pt-3">
              <span className="text-[11px] text-[#778177]">Sale price only</span>
              <button type="button" disabled aria-label={`Purchase product ${index + 1}, checkout unavailable`} className="inline-flex h-9 cursor-not-allowed items-center gap-2 rounded-full border border-[#d8d4c7] bg-[#f0eee6] px-3.5 text-[11px] font-semibold text-[#92968a]">
                <CreditCard className="h-3.5 w-3.5" aria-hidden="true" /> Purchase
              </button>
            </div>
          </article>
        ))}
      </div>
      <p className="mt-5 rounded-[14px] border border-[#d8d4c7] bg-[#eeece2] px-4 py-3 text-[12px] leading-5 text-[#657168]">
        Purchase controls are disabled. No checkout integration is connected, and this page does not accept payments.
      </p>
    </ProductPreviewFrame>
  );
}

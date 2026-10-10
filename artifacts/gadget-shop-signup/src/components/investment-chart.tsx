import type { ProductCatalogItem } from '@/data/product-catalog';

type InvestmentChartProps = {
  products: readonly ProductCatalogItem[];
  formatPrice: (amount: number) => string;
  imageUrl: string;
};

export function InvestmentChart({ products, formatPrice, imageUrl }: InvestmentChartProps) {
  return (
    <section className="investment-chart" aria-labelledby="investment-chart-title">
      <div className="investment-chart-banner">
        <img src={imageUrl} alt="Samsung Galaxy devices" loading="lazy" />
        <h2 id="investment-chart-title">Investment chart</h2>
      </div>
      <div className="investment-chart-table-wrap">
        <table className="investment-chart-table">
          <thead>
            <tr>
              <th scope="col">Product</th>
              <th scope="col">Price (UGX)</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <th scope="row">{product.name}</th>
                <td>UGX {formatPrice(product.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

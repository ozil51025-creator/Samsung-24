export const productCatalog = [
  { id: 'usb-c-cable', price: 30_000, daily: 7_500, hourly: 312, name: 'Samsung USB-C Cable', illustration: 'cable' },
  { id: 'usb-c-adapter', price: 50_000, daily: 12_500, hourly: 520, name: 'Samsung 25W USB-C Adapter', illustration: 'charger' },
  { id: 'usb-c-earphones', price: 115_000, daily: 28_750, hourly: 1_197, name: 'Samsung USB-C Earphones', illustration: 'earphones' },
  { id: 'smarttag2', price: 250_000, daily: 62_500, hourly: 2_604, name: 'Galaxy SmartTag2 Tracker', illustration: 'tag' },
  { id: 'galaxy-buds', price: 370_000, daily: 92_500, hourly: 3_854, name: 'Galaxy Buds Wireless Earbuds', illustration: 'buds' },
  { id: 'galaxy-fit', price: 250_000, daily: 62_500, hourly: 2_604, name: 'Galaxy Fit Fitness Band', illustration: 'band' },
  { id: 'galaxy-a-lte', price: 775_000, daily: 193_750, hourly: 8_072, name: 'Galaxy A Series LTE Phone', illustration: 'phone' },
  { id: 'galaxy-a-5g', price: 1_650_000, daily: 412_500, hourly: 17_187, name: 'Galaxy A Series 5G Phone', illustration: 'phone5g' },
  { id: 'galaxy-tab-a', price: 3_000_000, daily: 750_000, hourly: 31_250, name: 'Galaxy Tab A Series Tablet', illustration: 'tablet' },
  { id: 'galaxy-s-fe', price: 5_000_000, daily: 1_250_000, hourly: 52_083, name: 'Galaxy S FE Smartphone', illustration: 'sfe' },
  { id: 'galaxy-s-ultra', price: 8_000_000, daily: 2_000_000, hourly: 83_333, name: 'Galaxy S Ultra Smartphone', illustration: 'ultra' },
  { id: 'galaxy-z-fold', price: 12_000_000, daily: 3_000_000, hourly: 125_000, name: 'Galaxy Z Fold Smartphone', illustration: 'fold' },
] as const;

export type ProductCatalogItem = (typeof productCatalog)[number];
export type ProductIllustrationKind = ProductCatalogItem['illustration'];

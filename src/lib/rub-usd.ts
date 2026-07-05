/** Taxa aproximada RUB → USD (atualize conforme necessário). */
export const RUB_PER_USD = 90;

export function rubToUsd(rub: number): number {
  return rub / RUB_PER_USD;
}

export function usdToRub(usd: number): number {
  return Math.round(usd * RUB_PER_USD);
}

export function formatRub(amount: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export const RECOMMENDED_USD_MIN = 6;
export const RECOMMENDED_USD_MAX = 12;

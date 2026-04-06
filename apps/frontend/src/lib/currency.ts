export type CurrencyCode = 'THB' | 'RUB' | 'USD' | 'EUR';

export interface CurrencyConfig {
  symbol: string;
  locale: string;
  name: string;
  position: 'before' | 'after';
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  THB: { symbol: '฿', locale: 'th-TH', name: 'Тайский бат', position: 'before' },
  RUB: { symbol: '₽', locale: 'ru-RU', name: 'Российский рубль', position: 'after' },
  USD: { symbol: '$', locale: 'en-US', name: 'Доллар США', position: 'before' },
  EUR: { symbol: '€', locale: 'de-DE', name: 'Евро', position: 'after' },
};

export const CURRENCY_OPTIONS = Object.entries(CURRENCIES).map(([code, config]) => ({
  value: code as CurrencyCode,
  label: `${config.symbol} ${config.name}`,
}));

/**
 * Format amount with currency symbol
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currency: CurrencyCode = 'THB'
): string {
  if (amount === null || amount === undefined) return '—';

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return '—';

  const config = CURRENCIES[currency];
  const formatted = new Intl.NumberFormat(config.locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numAmount);

  return config.position === 'before'
    ? `${config.symbol}${formatted}`
    : `${formatted} ${config.symbol}`;
}

/**
 * Format amount in compact form (K, M, B)
 */
export function formatCurrencyCompact(
  amount: number | string | null | undefined,
  currency: CurrencyCode = 'THB'
): string {
  if (amount === null || amount === undefined) return '—';

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return '—';

  const config = CURRENCIES[currency];

  let formatted: string;
  let suffix = '';

  if (numAmount >= 1_000_000_000) {
    formatted = (numAmount / 1_000_000_000).toFixed(1);
    suffix = 'B';
  } else if (numAmount >= 1_000_000) {
    formatted = (numAmount / 1_000_000).toFixed(1);
    suffix = 'M';
  } else if (numAmount >= 1_000) {
    formatted = (numAmount / 1_000).toFixed(1);
    suffix = 'K';
  } else {
    formatted = numAmount.toFixed(0);
  }

  // Remove trailing .0
  formatted = formatted.replace(/\.0$/, '');

  return config.position === 'before'
    ? `${config.symbol}${formatted}${suffix}`
    : `${formatted}${suffix} ${config.symbol}`;
}

/**
 * Get currency symbol only
 */
export function getCurrencySymbol(currency: CurrencyCode = 'THB'): string {
  return CURRENCIES[currency].symbol;
}

/**
 * Format amount without symbol (just localized number)
 */
export function formatAmount(
  amount: number | string | null | undefined,
  currency: CurrencyCode = 'THB'
): string {
  if (amount === null || amount === undefined) return '—';

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return '—';

  const config = CURRENCIES[currency];
  return new Intl.NumberFormat(config.locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numAmount);
}

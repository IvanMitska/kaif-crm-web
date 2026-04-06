import { useAuthStore } from '@/store/auth';
import {
  CurrencyCode,
  CURRENCIES,
  formatCurrency,
  formatCurrencyCompact,
  formatAmount,
  getCurrencySymbol,
} from '@/lib/currency';

export function useCurrency() {
  const { organization } = useAuthStore();
  const currency = (organization?.currency || 'THB') as CurrencyCode;
  const config = CURRENCIES[currency];

  return {
    currency,
    symbol: config.symbol,
    name: config.name,
    format: (amount: number | string | null | undefined) => formatCurrency(amount, currency),
    formatCompact: (amount: number | string | null | undefined) => formatCurrencyCompact(amount, currency),
    formatAmount: (amount: number | string | null | undefined) => formatAmount(amount, currency),
    getSymbol: () => getCurrencySymbol(currency),
  };
}

import { useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import { formatCurrency, formatPercent } from '../utils/formatCurrency';

const DEFAULT_SETTINGS = {
  business_name: 'My Retail Shop',
  currency: 'USD',
  tax_rate: 10,
  receipt_footer: 'Thank you for shopping with us!',
  low_stock_threshold: 10,
  preset: 'classic-blue',
};

export function useBusinessSettings() {
  const { businessSettings } = useAppStore();
  const settings = businessSettings || DEFAULT_SETTINGS;

  const formatMoney = useCallback(
    (amount) => formatCurrency(amount, settings.currency),
    [settings.currency]
  );

  return {
    settings,
    currency: settings.currency,
    taxRate: settings.tax_rate ?? 10,
    businessName: settings.business_name,
    receiptFooter: settings.receipt_footer,
    lowStockThreshold: settings.low_stock_threshold ?? 10,
    preset: settings.preset ?? 'classic-blue',
    formatMoney,
    formatPercent,
    ready: !!businessSettings,
  };
}

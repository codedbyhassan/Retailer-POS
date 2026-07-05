import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLowStockProducts } from '../../services/indexeddb/productsStore';

export function SkeletonLoader() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-2xl bg-black/[0.04] dark:bg-white/[0.06]" />
      ))}
    </div>
  );
}

export function LowStockAlert({ products, isLoading }) {
  if (isLoading) return <SkeletonLoader />;

  if (!products.length) {
    return (
      <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/80 p-4 dark:border-emerald-900/40 dark:bg-emerald-900/20">
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">✓ All inventory levels healthy</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {products.slice(0, 3).map((product) => (
        <Link
          key={product.id}
          to="/admin/inventory"
          className="flex items-center justify-between rounded-2xl border border-amber-200/60 bg-amber-50/80 p-3 transition-all duration-200 ease-ios hover:bg-amber-100/80 dark:border-amber-900/40 dark:bg-amber-900/20 dark:hover:bg-amber-900/30"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-amber-900 dark:text-amber-300">{product.name}</p>
            <p className="text-xs text-amber-700/70 dark:text-amber-400/70">Only {product.quantity} left in stock</p>
          </div>
          <span className="ml-2 flex-shrink-0 rounded-lg bg-amber-200/60 px-2 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-900/40 dark:text-amber-300">
            {product.quantity}
          </span>
        </Link>
      ))}
      {products.length > 3 && (
        <Link
          to="/admin/inventory"
          className="text-xs font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
        >
          +{products.length - 3} more items
        </Link>
      )}
    </div>
  );
}

export function SyncStatus({ lastSync, isSyncing }) {
  const formatTime = (date) => {
    if (!date) return 'Never';
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex items-center gap-2 rounded-full bg-black/[0.04] px-3 py-1 dark:bg-white/[0.06]">
      <div className={`h-2 w-2 rounded-full ${isSyncing ? 'animate-pulse bg-blue-500' : 'bg-emerald-500'}`} />
      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
        {isSyncing ? 'Syncing...' : `Synced ${formatTime(lastSync)}`}
      </span>
    </div>
  );
}

export function HourlySalesSparkline({ sales }) {
  const hours = Array(24)
    .fill(0)
    .map((_, i) => {
      const hour = new Date();
      hour.setHours(i, 0, 0, 0);
      const nextHour = new Date(hour.getTime() + 3600000);
      return sales
        .filter((s) => {
          const saleTime = new Date(s.created_at);
          return saleTime >= hour && saleTime < nextHour;
        })
        .reduce((sum, s) => sum + s.total, 0);
    });

  const maxSale = Math.max(...hours, 1);

  return (
    <div className="flex items-end gap-0.5">
      {hours.map((amount, i) => (
        <div
          key={i}
          className="flex-1 rounded-t bg-gradient-to-t from-brand-500 to-brand-400 transition-all duration-200 ease-ios hover:from-brand-600 hover:to-brand-500"
          style={{
            height: `${Math.max(2, (amount / maxSale) * 40)}px`,
          }}
          title={`${i}:00 - $${amount.toFixed(2)}`}
        />
      ))}
    </div>
  );
}

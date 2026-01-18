import { useState, useMemo } from 'react';
import type { Alert, AlertFilters } from '@/types/alerts';

export const useAlertsFilters = (alerts: Alert[], initialFilters?: Partial<AlertFilters>) => {
  const [filters, setFilters] = useState<AlertFilters>({
    searchTerm: initialFilters?.searchTerm || '',
    severity: initialFilters?.severity || 'all',
    type: initialFilters?.type || 'all',
  });

  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      // Search filter
      if (filters.searchTerm) {
        const search = filters.searchTerm.toLowerCase();
        if (
          !(alert.ip?.toLowerCase().includes(search)) &&
          !alert.message.toLowerCase().includes(search) &&
          !alert.type.toLowerCase().includes(search)
        ) {
          return false;
        }
      }

      // Severity filter
      if (filters.severity !== 'all' && alert.severity !== filters.severity) {
        return false;
      }

      // Type filter
      if (filters.type !== 'all' && alert.type !== filters.type) {
        return false;
      }

      return true;
    });
  }, [alerts, filters]);

  const resetFilters = () => {
    setFilters({
      searchTerm: '',
      severity: 'all',
      type: 'all',
    });
  };

  const updateFilter = <K extends keyof AlertFilters>(key: K, value: AlertFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return {
    filters,
    setFilters,
    filteredAlerts,
    resetFilters,
    updateFilter,
  };
};

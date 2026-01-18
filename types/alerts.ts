export type AlertSeverity = 'critical' | 'warning';
export type AlertType = string; // Flexible type to match usePnodeDashboard

export interface Alert {
  ip: string | null;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  value: string;
  timestamp?: string;
}

export interface AlertFilters {
  searchTerm: string;
  severity: 'all' | AlertSeverity;
  type: 'all' | AlertType;
}

export interface AlertsHubProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: Alert[];
  totalNodes: number;
  isLight: boolean;
  defaultTab?: 'alerts' | 'analytics';
  defaultFilters?: Partial<AlertFilters>;
}

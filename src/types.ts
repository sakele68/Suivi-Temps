export interface Trip {
  id: string;
  date: string; // YYYY-MM-DD
  lieu: string; // Destination or site or trip name
  motif?: string; // Purpose / reason for the trip
  heureDepart: string; // HH:mm
  heureArrivee: string; // HH:mm
  notes?: string;
  createdAt: number;
}

export interface TripCalculated extends Trip {
  durationMinutes: number;
  durationFormatted: string; // e.g. "1h 45m"
  durationDecimal: number; // e.g. 1.75
  isOvernight: boolean; // if arrival is on the next day
}

export interface LocationSummary {
  lieu: string;
  count: number;
  totalMinutes: number;
  totalFormatted: string;
  totalDecimal: number;
  percentage: number;
  averageMinutes: number;
  averageFormatted: string;
}

export interface DateSummary {
  date: string;
  formattedDate: string;
  count: number;
  totalMinutes: number;
  totalFormatted: string;
  totalDecimal: number;
}

export type ViewTab = 'list' | 'summary-lieu' | 'summary-date';

export interface FilterOptions {
  searchQuery: string;
  dateFilter: 'all' | 'today' | 'this_week' | 'this_month' | 'custom';
  startDate?: string;
  endDate?: string;
  selectedLieu?: string;
}

import { Trip, TripCalculated, LocationSummary, DateSummary } from '../types';

/**
 * Converts a time string "HH:mm" to total minutes from midnight (0..1439)
 */
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [hoursStr, minutesStr] = timeStr.split(':');
  const hours = parseInt(hoursStr, 10) || 0;
  const minutes = parseInt(minutesStr, 10) || 0;
  return hours * 60 + minutes;
}

/**
 * Calculates duration in minutes between departure and arrival.
 * Handles crossing midnight (e.g. 23:00 to 02:00 = 180 min).
 */
export function calculateDurationMinutes(heureDepart: string, heureArrivee: string): {
  minutes: number;
  isOvernight: boolean;
} {
  if (!heureDepart || !heureArrivee) {
    return { minutes: 0, isOvernight: false };
  }

  const startMinutes = timeStringToMinutes(heureDepart);
  const endMinutes = timeStringToMinutes(heureArrivee);

  if (endMinutes >= startMinutes) {
    return {
      minutes: endMinutes - startMinutes,
      isOvernight: false,
    };
  } else {
    // Crosses midnight: remainder of day 1 + hours into day 2
    const minutes = (24 * 60 - startMinutes) + endMinutes;
    return {
      minutes,
      isOvernight: true,
    };
  }
}

/**
 * Formats minutes into human-readable French format: "2 h 15 min" or "45 min" or "0 min"
 */
export function formatMinutesToHuman(minutes: number): string {
  if (minutes <= 0) return '0 min';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins} min`;
  }
  if (mins === 0) {
    return `${hours} h`;
  }
  return `${hours} h ${mins.toString().padStart(2, '0')} min`;
}

/**
 * Formats minutes into standard HH:mm notation (e.g. "02:15")
 */
export function formatMinutesToClock(minutes: number): string {
  if (minutes < 0) return '00:00';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Converts minutes to decimal hours with 2 decimal places (e.g. 90 min -> 1.50)
 */
export function minutesToDecimal(minutes: number): number {
  return Number((minutes / 60).toFixed(2));
}

/**
 * Augments a Trip with its calculated duration metrics
 */
export function enrichTrip(trip: Trip): TripCalculated {
  const { minutes, isOvernight } = calculateDurationMinutes(trip.heureDepart, trip.heureArrivee);
  return {
    ...trip,
    durationMinutes: minutes,
    durationFormatted: formatMinutesToHuman(minutes),
    durationDecimal: minutesToDecimal(minutes),
    isOvernight,
  };
}

/**
 * Formats a date string "YYYY-MM-DD" into French date representation
 */
export function formatDateFr(dateStr: string, withDayOfWeek = false): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) return dateStr;

    if (withDayOfWeek) {
      return new Intl.DateTimeFormat('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(date);
    }

    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

/**
 * Calculates a summary grouped by Lieu
 */
export function getSummaryByLocation(trips: TripCalculated[]): LocationSummary[] {
  const map = new Map<string, { count: number; totalMinutes: number }>();
  let grandTotalMinutes = 0;

  for (const trip of trips) {
    const key = (trip.lieu || 'Non spécifié').trim();
    grandTotalMinutes += trip.durationMinutes;

    const current = map.get(key) || { count: 0, totalMinutes: 0 };
    map.set(key, {
      count: current.count + 1,
      totalMinutes: current.totalMinutes + trip.durationMinutes,
    });
  }

  const summaries: LocationSummary[] = [];

  map.forEach((data, lieu) => {
    const percentage = grandTotalMinutes > 0 ? (data.totalMinutes / grandTotalMinutes) * 100 : 0;
    const avgMinutes = data.count > 0 ? Math.round(data.totalMinutes / data.count) : 0;

    summaries.push({
      lieu,
      count: data.count,
      totalMinutes: data.totalMinutes,
      totalFormatted: formatMinutesToHuman(data.totalMinutes),
      totalDecimal: minutesToDecimal(data.totalMinutes),
      percentage: Number(percentage.toFixed(1)),
      averageMinutes: avgMinutes,
      averageFormatted: formatMinutesToHuman(avgMinutes),
    });
  });

  // Sort by highest total duration first
  return summaries.sort((a, b) => b.totalMinutes - a.totalMinutes);
}

/**
 * Calculates a summary grouped by Date
 */
export function getSummaryByDate(trips: TripCalculated[]): DateSummary[] {
  const map = new Map<string, { count: number; totalMinutes: number }>();

  for (const trip of trips) {
    const key = trip.date;
    const current = map.get(key) || { count: 0, totalMinutes: 0 };
    map.set(key, {
      count: current.count + 1,
      totalMinutes: current.totalMinutes + trip.durationMinutes,
    });
  }

  const summaries: DateSummary[] = [];

  map.forEach((data, date) => {
    summaries.push({
      date,
      formattedDate: formatDateFr(date, true),
      count: data.count,
      totalMinutes: data.totalMinutes,
      totalFormatted: formatMinutesToHuman(data.totalMinutes),
      totalDecimal: minutesToDecimal(data.totalMinutes),
    });
  });

  // Sort chronologically descending (most recent first)
  return summaries.sort((a, b) => b.date.localeCompare(a.date));
}

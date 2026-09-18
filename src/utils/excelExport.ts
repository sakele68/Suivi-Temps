import * as XLSX from 'xlsx';
import { TripCalculated } from '../types';
import {
  formatDateFr,
  formatMinutesToClock,
  formatMinutesToHuman,
  getSummaryByLocation,
  getSummaryByDate,
  minutesToDecimal,
} from './timeCalculations';

export interface ExportOptions {
  filename?: string;
  includeSummarySheets?: boolean;
}

export function exportTripsToExcel(
  trips: TripCalculated[],
  options: ExportOptions = {}
): void {
  const wb = XLSX.utils.book_new();

  // 1. DETAIL SHEET
  const detailRows = trips.map((t) => ({
    'Date': formatDateFr(t.date),
    'Date (ISO)': t.date,
    'Période': t.periode || '',
    'Lieu / Trajet': t.lieu,
    'Motif': t.motif || '',
    'Heure Départ': t.heureDepart,
    'Heure Arrivée': t.heureArrivee + (t.isOvernight ? ' (+1j)' : ''),
    'Durée (HH:MM)': formatMinutesToClock(t.durationMinutes),
    'Durée (Heures)': t.durationDecimal,
    'Remarques': t.notes || '',
  }));

  // Calculate grand totals for detail sheet
  const totalMinutes = trips.reduce((acc, t) => acc + t.durationMinutes, 0);
  const totalHoursDecimal = minutesToDecimal(totalMinutes);

  // Append total row
  detailRows.push({
    'Date': 'TOTAL CUMULÉ',
    'Date (ISO)': '',
    'Période': '',
    'Lieu / Trajet': `${trips.length} trajet(s)`,
    'Motif': '',
    'Heure Départ': '',
    'Heure Arrivée': '',
    'Durée (HH:MM)': formatMinutesToClock(totalMinutes),
    'Durée (Heures)': totalHoursDecimal,
    'Remarques': formatMinutesToHuman(totalMinutes),
  });

  const wsDetail = XLSX.utils.json_to_sheet(detailRows);

  // Column width auto-sizing
  wsDetail['!cols'] = [
    { wch: 14 }, // Date
    { wch: 12 }, // Date ISO
    { wch: 34 }, // Lieu
    { wch: 26 }, // Motif
    { wch: 14 }, // Heure Depart
    { wch: 15 }, // Heure Arrivee
    { wch: 15 }, // Duree HH:MM
    { wch: 16 }, // Duree Heures
    { wch: 36 }, // Remarques
  ];

  XLSX.utils.book_append_sheet(wb, wsDetail, 'Détail des Trajets');

  // 2. SUMMARY BY LOCATION SHEET
  const locationSummaries = getSummaryByLocation(trips);
  const locationRows = locationSummaries.map((loc) => ({
    'Lieu': loc.lieu,
    'Nb Trajets': loc.count,
    'Durée Totale (HH:MM)': formatMinutesToClock(loc.totalMinutes),
    'Durée Totale (Heures)': loc.totalDecimal,
    'Part du temps (%)': `${loc.percentage} %`,
    'Durée Moyenne': loc.averageFormatted,
  }));

  locationRows.push({
    'Lieu': 'TOTAL GÉNÉRAL',
    'Nb Trajets': trips.length,
    'Durée Totale (HH:MM)': formatMinutesToClock(totalMinutes),
    'Durée Totale (Heures)': totalHoursDecimal,
    'Part du temps (%)': '100 %',
    'Durée Moyenne': formatMinutesToHuman(trips.length > 0 ? Math.round(totalMinutes / trips.length) : 0),
  });

  const wsLocation = XLSX.utils.json_to_sheet(locationRows);
  wsLocation['!cols'] = [
    { wch: 36 }, // Lieu
    { wch: 12 }, // Nb
    { wch: 22 }, // Total HH:MM
    { wch: 22 }, // Total Heures
    { wch: 18 }, // Part %
    { wch: 18 }, // Moyenne
  ];
  XLSX.utils.book_append_sheet(wb, wsLocation, 'Récapitulatif par Lieu');

  // 3. SUMMARY BY DATE SHEET
  const dateSummaries = getSummaryByDate(trips);
  const dateRows = dateSummaries.map((d) => ({
    'Date': d.formattedDate,
    'Date (ISO)': d.date,
    'Nb Trajets': d.count,
    'Durée Totale (HH:MM)': formatMinutesToClock(d.totalMinutes),
    'Durée Totale (Heures)': d.totalDecimal,
  }));

  const wsDate = XLSX.utils.json_to_sheet(dateRows);
  wsDate['!cols'] = [
    { wch: 20 },
    { wch: 14 },
    { wch: 14 },
    { wch: 22 },
    { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(wb, wsDate, 'Récapitulatif par Date');

  // Trigger download
  const dateSuffix = new Date().toISOString().slice(0, 10);
  const filename = options.filename || `recapitulatif_trajets_${dateSuffix}.xlsx`;

  XLSX.writeFile(wb, filename);
}

/**
 * Exports directly to CSV with UTF-8 BOM (compatible with Excel in French locale)
 */
export function exportTripsToCsv(trips: TripCalculated[]): void {
  const headers = ['Date', 'Lieu', 'Motif', 'Heure Départ', 'Heure Arrivée', 'Durée (HH:MM)', 'Durée (Heures)', 'Remarques'];
  
  const rows = trips.map((t) => [
    `"${formatDateFr(t.date)}"`,
    `"${t.lieu.replace(/"/g, '""')}"`,
    `"${(t.motif || '').replace(/"/g, '""')}"`,
    `"${t.heureDepart}"`,
    `"${t.heureArrivee}${t.isOvernight ? ' (+1j)' : ''}"`,
    `"${formatMinutesToClock(t.durationMinutes)}"`,
    `"${t.durationDecimal.toString().replace('.', ',')}"`,
    `"${(t.notes || '').replace(/"/g, '""')}"`,
  ]);

  const totalMinutes = trips.reduce((acc, t) => acc + t.durationMinutes, 0);
  rows.push([
    '"TOTAL"',
    `"${trips.length} trajets"`,
    '""',
    '""',
    '""',
    `"${formatMinutesToClock(totalMinutes)}"`,
    `"${minutesToDecimal(totalMinutes).toString().replace('.', ',')}"`,
    `"${formatMinutesToHuman(totalMinutes)}"`,
  ]);

  // Semicolon separator is standard for French Excel CSV
  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateSuffix = new Date().toISOString().slice(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', `trajets_${dateSuffix}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

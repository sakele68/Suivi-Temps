import React from 'react';
import { Clock, Navigation, MapPin, Gauge } from 'lucide-react';
import { TripCalculated } from '../types';
import {
  formatMinutesToHuman,
  formatMinutesToClock,
  minutesToDecimal,
} from '../utils/timeCalculations';

interface SummaryCardsProps {
  trips: TripCalculated[];
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ trips }) => {
  const totalMinutes = trips.reduce((acc, t) => acc + t.durationMinutes, 0);
  const totalHoursDecimal = minutesToDecimal(totalMinutes);
  const uniqueLocations = new Set(trips.map((t) => (t.lieu || '').trim().toLowerCase())).size;
  const avgMinutes = trips.length > 0 ? Math.round(totalMinutes / trips.length) : 0;

  return (
    <div id="summary-cards-container" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Duration */}
      <div id="kpi-card-total-duration" className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Durée Totale
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900">
            {formatMinutesToHuman(totalMinutes)}
          </span>
          <span className="text-sm font-medium text-slate-500">
            ({totalHoursDecimal} h)
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Total cumulé sur {trips.length} trajet{trips.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Trips Count */}
      <div id="kpi-card-trips-count" className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Nombre de Trajets
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Navigation className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold text-slate-900">
            {trips.length}
          </span>
          <span className="text-sm font-medium text-slate-500 ml-1.5">
            enregistré{trips.length > 1 ? 's' : ''}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Prêts pour l'export Excel
        </p>
      </div>

      {/* Unique Locations */}
      <div id="kpi-card-locations-count" className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Lieux Uniques
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <MapPin className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold text-slate-900">
            {uniqueLocations}
          </span>
          <span className="text-sm font-medium text-slate-500 ml-1.5">
            destination{uniqueLocations > 1 ? 's' : ''}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Sites, clients ou chantiers
        </p>
      </div>

      {/* Average Duration */}
      <div id="kpi-card-avg-duration" className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Durée Moyenne
          </span>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Gauge className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900">
            {formatMinutesToHuman(avgMinutes)}
          </span>
          <span className="text-sm font-medium text-slate-500">
            / trajet
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {formatMinutesToClock(avgMinutes)} (HH:MM)
        </p>
      </div>
    </div>
  );
};

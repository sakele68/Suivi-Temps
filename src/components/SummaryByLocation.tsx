import React from 'react';
import { MapPin, Clock, BarChart2, Eye, TrendingUp } from 'lucide-react';
import { LocationSummary } from '../types';

interface SummaryByLocationProps {
  summaries: LocationSummary[];
  grandTotalMinutes: number;
  onFilterByLieu: (lieu: string) => void;
}

export const SummaryByLocation: React.FC<SummaryByLocationProps> = ({
  summaries,
  grandTotalMinutes,
  onFilterByLieu,
}) => {
  if (summaries.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <MapPin className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm font-medium text-slate-700">Aucun trajet à récapituler</p>
        <p className="text-xs text-slate-500 mt-1">Ajoutez des trajets pour afficher les cumuls par destination.</p>
      </div>
    );
  }

  return (
    <div id="summary-by-location-card" className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-blue-600" />
            <span>Récapitulatif des durées totales par Lieu / Trajet</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Calcul automatique du temps cumulé et de la répartition par destination
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md">
          {summaries.length} destination{summaries.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Lieu / Destination</th>
              <th className="py-3 px-4 text-center">Nb Trajets</th>
              <th className="py-3 px-4">Durée Totale (HH:MM)</th>
              <th className="py-3 px-4">Durée Décimale</th>
              <th className="py-3 px-4 w-44">Part du Temps</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {summaries.map((loc, idx) => (
              <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4 font-semibold text-slate-900">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{loc.lieu}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-center font-medium text-slate-700">
                  <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px]">
                    {loc.count}
                  </span>
                </td>
                <td className="py-3 px-4 font-bold text-slate-900">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{loc.totalFormatted}</span>
                  </div>
                </td>
                <td className="py-3 px-4 font-medium text-slate-600">
                  {loc.totalDecimal} h
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(loc.percentage, 100)}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 w-11 text-right">
                      {loc.percentage}%
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => onFilterByLieu(loc.lieu)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
                    title={`Filtrer la liste pour afficher uniquement "${loc.lieu}"`}
                  >
                    <Eye className="w-3 h-3" />
                    <span>Filtrer</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

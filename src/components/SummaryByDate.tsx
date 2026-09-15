import React from 'react';
import { Calendar, Clock, CalendarDays } from 'lucide-react';
import { DateSummary } from '../types';

interface SummaryByDateProps {
  summaries: DateSummary[];
  onFilterByDate?: (date: string) => void;
}

export const SummaryByDate: React.FC<SummaryByDateProps> = ({ summaries }) => {
  if (summaries.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm font-medium text-slate-700">Aucun trajet à récapituler par date</p>
      </div>
    );
  }

  return (
    <div id="summary-by-date-card" className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-emerald-600" />
            <span>Récapitulatif des heures par Journée</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Cumul quotidien des temps de déplacement ou d'intervention
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md">
          {summaries.length} journée{summaries.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4 text-center">Nombre de Trajets</th>
              <th className="py-3 px-4">Durée Totale de la Journée</th>
              <th className="py-3 px-4">Durée Décimale (h)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {summaries.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4 font-semibold text-slate-900">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{item.formattedDate}</span>
                    <span className="text-[11px] text-slate-400 font-normal">({item.date})</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-center font-medium text-slate-700">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px]">
                    {item.count} trajet{item.count > 1 ? 's' : ''}
                  </span>
                </td>
                <td className="py-3 px-4 font-bold text-slate-900">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.totalFormatted}</span>
                  </div>
                </td>
                <td className="py-3 px-4 font-semibold text-emerald-700">
                  {item.totalDecimal} h
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

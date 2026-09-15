import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Calendar,
  Clock,
  MapPin,
  Edit2,
  Trash2,
  Copy,
  Plus,
  ArrowRight,
  Moon,
  RotateCcw,
  Tag,
} from 'lucide-react';
import { TripCalculated, FilterOptions } from '../types';
import { formatDateFr } from '../utils/timeCalculations';

interface TripListProps {
  trips: TripCalculated[];
  locations: string[];
  activeLieuFilter?: string;
  onClearLieuFilter: () => void;
  onEdit: (trip: TripCalculated) => void;
  onDuplicate: (trip: TripCalculated) => void;
  onDelete: (id: string) => void;
  onAddClick: () => void;
}

export const TripList: React.FC<TripListProps> = ({
  trips,
  locations,
  activeLieuFilter,
  onClearLieuFilter,
  onEdit,
  onDuplicate,
  onDelete,
  onAddClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'this_week' | 'this_month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedLieu, setSelectedLieu] = useState(activeLieuFilter || 'all');

  // Keep local filter synced with prop
  React.useEffect(() => {
    setSelectedLieu(activeLieuFilter || 'all');
  }, [activeLieuFilter]);

  const filteredTrips = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);

    return trips.filter((t) => {
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchLieu = t.lieu.toLowerCase().includes(query);
        const matchMotif = (t.motif || '').toLowerCase().includes(query);
        const matchNotes = (t.notes || '').toLowerCase().includes(query);
        if (!matchLieu && !matchMotif && !matchNotes) return false;
      }

      // Location filter
      if (selectedLieu !== 'all' && t.lieu !== selectedLieu) {
        return false;
      }

      // Date filter
      if (dateFilter === 'today') {
        if (t.date !== todayStr) return false;
      } else if (dateFilter === 'this_week') {
        const tripDate = new Date(t.date);
        const now = new Date();
        const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)));
        firstDayOfWeek.setHours(0, 0, 0, 0);
        if (tripDate < firstDayOfWeek) return false;
      } else if (dateFilter === 'this_month') {
        const currentMonth = new Date().toISOString().slice(0, 7);
        if (!t.date.startsWith(currentMonth)) return false;
      } else if (dateFilter === 'custom') {
        if (startDate && t.date < startDate) return false;
        if (endDate && t.date > endDate) return false;
      }

      return true;
    });
  }, [trips, searchQuery, selectedLieu, dateFilter, startDate, endDate]);

  const isFiltering =
    searchQuery.trim() !== '' ||
    selectedLieu !== 'all' ||
    dateFilter !== 'all' ||
    Boolean(startDate) ||
    Boolean(endDate);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedLieu('all');
    setDateFilter('all');
    setStartDate('');
    setEndDate('');
    onClearLieuFilter();
  };

  return (
    <div id="trip-list-card" className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Filters Toolbar */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par lieu, motif, note..."
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Location selector */}
          <div className="w-full md:w-56">
            <select
              value={selectedLieu}
              onChange={(e) => {
                setSelectedLieu(e.target.value);
                if (e.target.value === 'all') onClearLieuFilter();
              }}
              className="w-full px-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-700"
            >
              <option value="all">Tous les lieux ({trips.length})</option>
              {locations.map((loc, i) => (
                <option key={i} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Date range quick selector */}
          <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setDateFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                dateFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setDateFilter('today')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                dateFilter === 'today'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Aujourd'hui
            </button>
            <button
              onClick={() => setDateFilter('this_week')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                dateFilter === 'this_week'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cette semaine
            </button>
            <button
              onClick={() => setDateFilter('this_month')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                dateFilter === 'this_month'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ce mois
            </button>
            <button
              onClick={() => setDateFilter('custom')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                dateFilter === 'custom'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dates...
            </button>
          </div>
        </div>

        {/* Custom date range picker if dateFilter === 'custom' */}
        {dateFilter === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
            <span className="text-slate-500 font-medium">Du :</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs"
            />
            <span className="text-slate-500 font-medium">Au :</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs"
            />
          </div>
        )}

        {/* Active filter badge & reset button */}
        {isFiltering && (
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-200">
            <span>
              Affichage de <strong className="text-slate-800">{filteredTrips.length}</strong> sur {trips.length} trajet(s)
            </span>
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Réinitialiser les filtres</span>
            </button>
          </div>
        )}
      </div>

      {/* Trips Content */}
      {filteredTrips.length === 0 ? (
        <div className="p-12 text-center">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">Aucun trajet trouvé</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {isFiltering
              ? 'Aucun trajet ne correspond à vos filtres actuels. Essayez de réinitialiser la recherche.'
              : 'Commencez par enregistrer votre premier trajet pour voir les calculs automatiques.'}
          </p>
          <div className="mt-4 flex justify-center gap-3">
            {isFiltering ? (
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Effacer les filtres
              </button>
            ) : (
              <button
                onClick={onAddClick}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter un trajet</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Lieu / Destination</th>
                <th className="py-3 px-4">Motif</th>
                <th className="py-3 px-4">Horaires (Départ ➔ Arrivée)</th>
                <th className="py-3 px-4">Durée Calculée</th>
                <th className="py-3 px-4">Remarques</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredTrips.map((trip) => (
                <tr
                  key={trip.id}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  {/* Date */}
                  <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-900">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDateFr(trip.date, true)}</span>
                    </div>
                  </td>

                  {/* Lieu */}
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{trip.lieu}</span>
                    </div>
                  </td>

                  {/* Motif */}
                  <td className="py-3 px-4 text-slate-700">
                    {trip.motif ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200/80">
                        <Tag className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate max-w-[180px]" title={trip.motif}>
                          {trip.motif}
                        </span>
                      </span>
                    ) : (
                      <span className="text-slate-300 italic">—</span>
                    )}
                  </td>

                  {/* Horaires */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5 text-slate-700 font-mono text-xs">
                      <span>{trip.heureDepart}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span>{trip.heureArrivee}</span>
                      {trip.isOvernight && (
                        <span
                          title="Arrivée le lendemain"
                          className="inline-flex items-center text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded ml-1"
                        >
                          <Moon className="w-2.5 h-2.5 mr-0.5" /> +1j
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Durée Calculée Badge */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200/80">
                      <Clock className="w-3 h-3 text-blue-600" />
                      <span>{trip.durationFormatted}</span>
                      <span className="text-[11px] text-blue-500 font-medium">
                        ({trip.durationDecimal} h)
                      </span>
                    </span>
                  </td>

                  {/* Notes */}
                  <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                    {trip.notes || <span className="text-slate-300 italic">—</span>}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1">
                      {/* Duplicate */}
                      <button
                        onClick={() => onDuplicate(trip)}
                        title="Dupliquer ce trajet"
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => onEdit(trip)}
                        title="Modifier ce trajet"
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => onDelete(trip.id)}
                        title="Supprimer ce trajet"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

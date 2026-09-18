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
  Sparkles,
  LayoutGrid,
  List,
  Sun,
  Sunset,
  CalendarDays,
} from 'lucide-react';
import { TripCalculated, FilterOptions } from '../types';
import {
  formatDateFr,
  formatMinutesToHuman,
  minutesToDecimal,
} from '../utils/timeCalculations';

interface TripListProps {
  trips: TripCalculated[];
  locations: string[];
  activeLieuFilter?: string;
  onClearLieuFilter: () => void;
  onEdit: (trip: TripCalculated) => void;
  onDuplicate: (trip: TripCalculated) => void;
  onDelete: (id: string) => void;
  onAddClick: () => void;
  onPurgeDemos?: () => void;
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
  onPurgeDemos,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'this_week' | 'this_month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedLieu, setSelectedLieu] = useState(activeLieuFilter || 'all');
  const [viewMode, setViewMode] = useState<'grouped' | 'table'>('grouped');

  // Keep local filter synced with prop
  React.useEffect(() => {
    if (activeLieuFilter) {
      setSelectedLieu(activeLieuFilter);
    }
  }, [activeLieuFilter]);

  // Filter logic
  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      // 1. Text Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchLieu = trip.lieu.toLowerCase().includes(q);
        const matchMotif = trip.motif?.toLowerCase().includes(q);
        const matchNotes = trip.notes?.toLowerCase().includes(q);
        const matchDate = trip.date.includes(q);
        const matchPeriode = trip.periode?.toLowerCase().includes(q);
        if (!matchLieu && !matchMotif && !matchNotes && !matchDate && !matchPeriode) {
          return false;
        }
      }

      // 2. Lieu selector filter
      if (selectedLieu !== 'all' && trip.lieu !== selectedLieu) {
        return false;
      }

      // 3. Date presets
      if (dateFilter === 'today') {
        const today = new Date().toISOString().slice(0, 10);
        if (trip.date !== today) return false;
      } else if (dateFilter === 'this_week') {
        const now = new Date();
        const startOfWeek = new Date(now);
        const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // Mon = 0
        startOfWeek.setDate(now.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);

        const tripDate = new Date(trip.date);
        if (tripDate < startOfWeek) return false;
      } else if (dateFilter === 'this_month') {
        const currentMonth = new Date().toISOString().slice(0, 7);
        if (!trip.date.startsWith(currentMonth)) return false;
      } else if (dateFilter === 'custom') {
        if (startDate && trip.date < startDate) return false;
        if (endDate && trip.date > endDate) return false;
      }

      return true;
    });
  }, [trips, searchQuery, selectedLieu, dateFilter, startDate, endDate]);

  // Grouped trips by date with daily cumulative total
  const dayGroups = useMemo(() => {
    const map = new Map<string, TripCalculated[]>();
    for (const t of filteredTrips) {
      if (!map.has(t.date)) {
        map.set(t.date, []);
      }
      map.get(t.date)!.push(t);
    }

    const sortedDates = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));
    return sortedDates.map((d) => {
      const dayTrips = map.get(d)!;
      // Sort trips by departure time
      dayTrips.sort((a, b) => a.heureDepart.localeCompare(b.heureDepart));
      const totalMinutes = dayTrips.reduce((sum, t) => sum + t.durationMinutes, 0);
      return {
        date: d,
        formattedDate: formatDateFr(d, true),
        totalMinutes,
        totalFormatted: formatMinutesToHuman(totalMinutes),
        totalDecimal: minutesToDecimal(totalMinutes),
        trips: dayTrips,
      };
    });
  }, [filteredTrips]);

  const isFiltering =
    Boolean(searchQuery.trim()) ||
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

  const hasDemoTrips = trips.some((t) => t.id.startsWith('demo-'));

  return (
    <div id="trip-list-card" className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Demo trips notice banner */}
      {hasDemoTrips && onPurgeDemos && (
        <div className="bg-amber-50/90 border-b border-amber-200/80 px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-950">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Trajets d'exemple détectés</strong> : Vous pouvez les supprimer en un clic pour démarrer avec votre propre liste.
            </span>
          </div>
          <button
            id="btn-purge-demos"
            onClick={onPurgeDemos}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-semibold rounded-lg text-xs transition-colors shrink-0 cursor-pointer shadow-xs"
          >
            Purger les exemples
          </button>
        </div>
      )}

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
              placeholder="Rechercher par lieu, motif, note, période..."
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
              {locations.map((loc, idx) => (
                <option key={idx} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* View mode toggle (Grouped by day / Flat Table) */}
          <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-lg shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setViewMode('grouped')}
              title="Vue groupée par journée avec cumul"
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'grouped'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Par Jour</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Vue tableau linéaire classique"
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tableau</span>
            </button>
          </div>
        </div>

        {/* Date presets row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap items-center gap-1 text-xs">
            <span className="text-slate-500 font-medium mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              <span>Période :</span>
            </span>
            <button
              onClick={() => setDateFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                dateFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Toutes les dates
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
      ) : viewMode === 'grouped' ? (
        /* ================= VUE GROUPÉE PAR JOUR AVEC CUMUL ================= */
        <div className="p-4 sm:p-5 space-y-4">
          {dayGroups.map((group) => (
            <div
              key={group.date}
              className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white"
            >
              {/* Day Header Bar with Cumulative Time */}
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm capitalize">
                      {group.formattedDate}
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      {group.trips.length} trajet{group.trips.length > 1 ? 's rassemblés' : ''} ({group.date})
                    </span>
                  </div>
                </div>

                {/* Day Cumulative Total Pill */}
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs">
                    <Clock className="w-3.5 h-3.5 text-blue-200" />
                    <span className="text-xs font-medium">Cumul du jour :</span>
                    <strong className="text-sm font-black">{group.totalFormatted}</strong>
                    <span className="text-xs text-blue-200 font-semibold">
                      ({group.totalDecimal} h)
                    </span>
                  </div>
                </div>
              </div>

              {/* Day Trips List */}
              <div className="divide-y divide-slate-100">
                {group.trips.map((trip, idx) => (
                  <div
                    key={trip.id}
                    className="p-3.5 sm:px-4 sm:py-3 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                      {/* Period Badge (Trajet 1 / Trajet 2) */}
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                        {trip.periode ? (
                          trip.periode
                        ) : idx === 0 ? (
                          <>
                            <Sun className="w-3 h-3 text-amber-500" />
                            <span>Trajet 1</span>
                          </>
                        ) : (
                          <>
                            <Sunset className="w-3 h-3 text-emerald-600" />
                            <span>Trajet 2</span>
                          </>
                        )}
                      </span>

                      {/* Lieu & Motif */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>{trip.lieu}</span>
                          </span>

                          {trip.motif && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
                              <Tag className="w-2.5 h-2.5" />
                              <span>{trip.motif}</span>
                            </span>
                          )}
                        </div>

                        {trip.notes && (
                          <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-lg">
                            📝 {trip.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Schedule & Duration & Actions */}
                    <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-1 md:pt-0 border-t md:border-t-0 border-slate-100">
                      {/* Times */}
                      <div className="inline-flex items-center gap-1 text-xs font-mono text-slate-700 bg-slate-100/70 px-2 py-1 rounded">
                        <span>{trip.heureDepart}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span>{trip.heureArrivee}</span>
                        {trip.isOvernight && (
                          <span className="text-[10px] text-amber-600 ml-0.5" title="Arrivée lendemain">
                            +1j
                          </span>
                        )}
                      </div>

                      {/* Duration */}
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        <Clock className="w-3 h-3 text-blue-600" />
                        <span>{trip.durationFormatted}</span>
                        <span className="text-[10px] text-blue-600 font-normal">
                          ({trip.durationDecimal} h)
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onDuplicate(trip)}
                          title="Dupliquer"
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEdit(trip)}
                          title="Modifier"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(trip.id)}
                          title="Supprimer"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ================= VUE TABLEAU DÉTAILLÉ CLASSIQUE ================= */
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Date & Période</th>
                <th className="py-3 px-4">Lieu / Destination</th>
                <th className="py-3 px-4">Motif</th>
                <th className="py-3 px-4">Horaires (Départ ➔ Arrivée)</th>
                <th className="py-3 px-4">Durée Trajet</th>
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
                  {/* Date & Période */}
                  <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-900">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDateFr(trip.date, true)}</span>
                      </div>
                      {trip.periode && (
                        <span className="text-[10px] text-blue-600 font-semibold mt-0.5 ml-5">
                          {trip.periode}
                        </span>
                      )}
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
                      <button
                        onClick={() => onDuplicate(trip)}
                        title="Dupliquer ce trajet"
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onEdit(trip)}
                        title="Modifier ce trajet"
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
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

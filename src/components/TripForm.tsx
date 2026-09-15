import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Calendar,
  Clock,
  ArrowRight,
  Sparkles,
  Save,
  X,
  FileText,
  AlertCircle,
  Moon,
  Tag,
} from 'lucide-react';
import { Trip, TripCalculated } from '../types';
import {
  calculateDurationMinutes,
  formatMinutesToHuman,
  minutesToDecimal,
} from '../utils/timeCalculations';

interface TripFormProps {
  initialTrip?: Trip | null;
  existingLocations: string[];
  onSubmit: (tripData: Omit<Trip, 'id' | 'createdAt'>, editingId?: string) => void;
  onCancel: () => void;
}

export const TripForm: React.FC<TripFormProps> = ({
  initialTrip,
  existingLocations,
  onSubmit,
  onCancel,
}) => {
  const today = new Date().toISOString().slice(0, 10);

  const [lieu, setLieu] = useState(initialTrip?.lieu || '');
  const [motif, setMotif] = useState(initialTrip?.motif || '');
  const [date, setDate] = useState(initialTrip?.date || today);
  const [heureDepart, setHeureDepart] = useState(initialTrip?.heureDepart || '08:00');
  const [heureArrivee, setHeureArrivee] = useState(initialTrip?.heureArrivee || '09:30');
  const [notes, setNotes] = useState(initialTrip?.notes || '');
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTrip) {
      setLieu(initialTrip.lieu);
      setMotif(initialTrip.motif || '');
      setDate(initialTrip.date);
      setHeureDepart(initialTrip.heureDepart);
      setHeureArrivee(initialTrip.heureArrivee);
      setNotes(initialTrip.notes || '');
    }
  }, [initialTrip]);

  // Live calculation of duration
  const { minutes: durationMinutes, isOvernight } = calculateDurationMinutes(
    heureDepart,
    heureArrivee
  );
  const durationHuman = formatMinutesToHuman(durationMinutes);
  const durationDecimal = minutesToDecimal(durationMinutes);

  const filteredLocations = existingLocations.filter(
    (loc) => loc.toLowerCase().includes(lieu.toLowerCase()) && loc !== lieu
  );

  const setTimeNow = (field: 'depart' | 'arrivee') => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hh}:${mm}`;
    if (field === 'depart') {
      setHeureDepart(timeStr);
    } else {
      setHeureArrivee(timeStr);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lieu.trim()) {
      setError('Veuillez renseigner le lieu du trajet.');
      return;
    }
    if (!date) {
      setError('Veuillez renseigner la date.');
      return;
    }
    if (!heureDepart || !heureArrivee) {
      setError('Veuillez indiquer les heures de départ et d\'arrivée.');
      return;
    }

    setError(null);
    onSubmit(
      {
        lieu: lieu.trim(),
        motif: motif.trim(),
        date,
        heureDepart,
        heureArrivee,
        notes: notes.trim(),
      },
      initialTrip?.id
    );
  };

  return (
    <div
      id="trip-form-card"
      className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6 mb-6"
    >
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {initialTrip ? 'Modifier le trajet' : 'Enregistrer un nouveau trajet'}
            </h2>
            <p className="text-xs text-slate-500">
              Renseignez les informations pour le calcul automatique de la durée
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Champ Lieu */}
          <div className="relative">
            <label
              htmlFor="field-lieu"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Lieu / Destination <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <MapPin className="w-4 h-4" />
              </div>
              <input
                id="field-lieu"
                type="text"
                required
                value={lieu}
                onChange={(e) => {
                  setLieu(e.target.value);
                  setShowLocationSuggestions(true);
                }}
                onFocus={() => setShowLocationSuggestions(true)}
                placeholder="Ex: Chantier Voltaire, Client Dupont, Dépôt..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Suggestions dropdown */}
            {showLocationSuggestions && filteredLocations.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto py-1">
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase">
                  Lieux récents
                </div>
                {filteredLocations.slice(0, 5).map((loc, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setLieu(loc);
                      setShowLocationSuggestions(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2"
                  >
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{loc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Champ Date */}
          <div>
            <label
              htmlFor="field-date"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                id="field-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Heure départ et Heure arrivée */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Heure Départ */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="field-heure-depart"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
              >
                Heure de départ <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setTimeNow('depart')}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
              >
                Maintenant
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Clock className="w-4 h-4" />
              </div>
              <input
                id="field-heure-depart"
                type="time"
                required
                value={heureDepart}
                onChange={(e) => setHeureDepart(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Heure Arrivée */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="field-heure-arrivee"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
              >
                Heure d'arrivée <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setTimeNow('arrivee')}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
              >
                Maintenant
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Clock className="w-4 h-4" />
              </div>
              <input
                id="field-heure-arrivee"
                type="time"
                required
                value={heureArrivee}
                onChange={(e) => setHeureArrivee(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Live Automatic Duration Pill & Calculation Preview */}
        <div
          id="live-duration-preview"
          className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-medium text-slate-600">
              Durée calculée automatiquement :
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-bold bg-blue-100 text-blue-800 border border-blue-200">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>{durationHuman}</span>
              <span className="text-xs font-medium text-blue-600">
                ({durationDecimal} h)
              </span>
            </span>
          </div>

          {isOvernight && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
              <Moon className="w-3.5 h-3.5 text-amber-600" />
              <span>Arrivée le lendemain (+1 jour)</span>
            </div>
          )}
        </div>

        {/* Motif du déplacement */}
        <div>
          <label
            htmlFor="field-motif"
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            Motif
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 pt-2.5 pointer-events-none text-slate-400">
              <Tag className="w-4 h-4" />
            </div>
            <input
              id="field-motif"
              type="text"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Ex: Rendez-vous client, Intervention dépannage, Réunion chantier, Livraison..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Remarques / Notes */}
        <div>
          <label
            htmlFor="field-notes"
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            Notes complémentaires (facultatif)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 pt-2.5 pointer-events-none text-slate-400">
              <FileText className="w-4 h-4" />
            </div>
            <input
              id="field-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Détails supplémentaires, numéros d'ordre, observations..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Annuler
          </button>
          <button
            id="btn-submit-trip"
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{initialTrip ? 'Enregistrer les modifications' : 'Ajouter le trajet'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

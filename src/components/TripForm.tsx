import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Calendar,
  Clock,
  Sparkles,
  Save,
  X,
  FileText,
  AlertCircle,
  Moon,
  Tag,
  Sun,
  Sunset,
  PlusCircle,
  MinusCircle,
  Copy,
  CalendarDays,
} from 'lucide-react';
import { Trip, TripCalculated } from '../types';
import {
  calculateDurationMinutes,
  formatMinutesToHuman,
  minutesToDecimal,
  formatDateFr,
} from '../utils/timeCalculations';

interface TripFormProps {
  initialTrip?: Trip | null;
  existingLocations: string[];
  existingTrips?: TripCalculated[];
  onSubmit: (tripData: Omit<Trip, 'id' | 'createdAt'> | Array<Omit<Trip, 'id' | 'createdAt'>>, editingId?: string) => void;
  onCancel: () => void;
}

const COMMON_MOTIFS = [
  'Tournée courrier',
  'Distribution',
  'Livraison colis',
  'Intervention technique',
  'Chantier',
  'Rendez-vous client',
  'Réapprovisionnement dépôt',
];

export const TripForm: React.FC<TripFormProps> = ({
  initialTrip,
  existingLocations,
  existingTrips = [],
  onSubmit,
  onCancel,
}) => {
  const today = new Date().toISOString().slice(0, 10);

  // Common Date
  const [date, setDate] = useState(initialTrip?.date || today);

  // --- Possibilité 1 (ex. Matin / Trajet 1) ---
  const [lieu1, setLieu1] = useState(initialTrip?.lieu || '');
  const [motif1, setMotif1] = useState(initialTrip?.motif || 'Tournée courrier');
  const [heureDepart1, setHeureDepart1] = useState(initialTrip?.heureDepart || '08:00');
  const [heureArrivee1, setHeureArrivee1] = useState(initialTrip?.heureArrivee || '11:45');
  const [notes1, setNotes1] = useState(initialTrip?.notes || '');
  const [label1, setLabel1] = useState(initialTrip?.periode || 'Trajet 1 (Matin)');
  const [showLocationSuggestions1, setShowLocationSuggestions1] = useState(false);

  // --- Possibilité 2 (ex. Après-midi / Trajet 2) ---
  // If editing an existing single trip, possibility 2 is off by default.
  // When creating a new day, possibility 2 can be enabled with 1 click or is open by default.
  const [enableTrip2, setEnableTrip2] = useState(false);
  const [lieu2, setLieu2] = useState('');
  const [motif2, setMotif2] = useState('Distribution');
  const [heureDepart2, setHeureDepart2] = useState('13:15');
  const [heureArrivee2, setHeureArrivee2] = useState('16:30');
  const [notes2, setNotes2] = useState('');
  const [label2, setLabel2] = useState('Trajet 2 (Après-midi)');
  const [showLocationSuggestions2, setShowLocationSuggestions2] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTrip) {
      setDate(initialTrip.date);
      setLieu1(initialTrip.lieu);
      setMotif1(initialTrip.motif || '');
      setHeureDepart1(initialTrip.heureDepart);
      setHeureArrivee1(initialTrip.heureArrivee);
      setNotes1(initialTrip.notes || '');
      setLabel1(initialTrip.periode || 'Trajet 1');
      setEnableTrip2(false);
    }
  }, [initialTrip]);

  // Durations calculation
  const dur1 = calculateDurationMinutes(heureDepart1, heureArrivee1);
  const dur1Human = formatMinutesToHuman(dur1.minutes);
  const dur1Decimal = minutesToDecimal(dur1.minutes);

  const dur2 = calculateDurationMinutes(heureDepart2, heureArrivee2);
  const dur2Human = formatMinutesToHuman(dur2.minutes);
  const dur2Decimal = minutesToDecimal(dur2.minutes);

  // Daily Total calculation
  const totalDayMinutes = enableTrip2 ? dur1.minutes + dur2.minutes : dur1.minutes;
  const totalDayHuman = formatMinutesToHuman(totalDayMinutes);
  const totalDayDecimal = minutesToDecimal(totalDayMinutes);

  // Existing trips for this date already in app (excluding currently edited trip)
  const existingDayTrips = existingTrips.filter(
    (t) => t.date === date && (!initialTrip || t.id !== initialTrip.id)
  );
  const existingDayMinutes = existingDayTrips.reduce((acc, t) => acc + t.durationMinutes, 0);

  const grandDayMinutes = existingDayMinutes + totalDayMinutes;
  const grandDayHuman = formatMinutesToHuman(grandDayMinutes);
  const grandDayDecimal = minutesToDecimal(grandDayMinutes);

  const setYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setDate(d.toISOString().slice(0, 10));
  };

  const setToday = () => {
    setDate(today);
  };

  const setTimeNow = (field: 'depart1' | 'arrivee1' | 'depart2' | 'arrivee2') => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hh}:${mm}`;
    if (field === 'depart1') setHeureDepart1(timeStr);
    if (field === 'arrivee1') setHeureArrivee1(timeStr);
    if (field === 'depart2') setHeureDepart2(timeStr);
    if (field === 'arrivee2') setHeureArrivee2(timeStr);
  };

  const handleCopyLieu1To2 = () => {
    setLieu2(lieu1);
  };

  const handleSetRetourLieu2 = () => {
    if (lieu1.startsWith('Retour ')) {
      setLieu2(lieu1.replace('Retour ', ''));
    } else {
      setLieu2(`Retour ${lieu1}`);
    }
  };

  const filteredLocations1 = existingLocations.filter(
    (loc) => loc.toLowerCase().includes(lieu1.toLowerCase()) && loc !== lieu1
  );

  const filteredLocations2 = existingLocations.filter(
    (loc) => loc.toLowerCase().includes(lieu2.toLowerCase()) && loc !== lieu2
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!date) {
      setError('Veuillez renseigner la date.');
      return;
    }

    // Validation Trajet 1
    if (!lieu1.trim()) {
      setError('Veuillez renseigner le lieu pour le premier trajet.');
      return;
    }
    if (!heureDepart1 || !heureArrivee1) {
      setError('Veuillez renseigner les horaires de départ et d\'arrivée pour le premier trajet.');
      return;
    }

    // Validation Trajet 2 if enabled
    if (enableTrip2) {
      if (!lieu2.trim()) {
        setError('Veuillez renseigner le lieu pour le deuxième trajet ou désactiver la possibilité 2.');
        return;
      }
      if (!heureDepart2 || !heureArrivee2) {
        setError('Veuillez renseigner les horaires pour le deuxième trajet.');
        return;
      }
    }

    setError(null);

    const trip1Data: Omit<Trip, 'id' | 'createdAt'> = {
      date,
      lieu: lieu1.trim(),
      motif: motif1.trim(),
      heureDepart: heureDepart1,
      heureArrivee: heureArrivee1,
      notes: notes1.trim(),
      periode: label1.trim(),
    };

    if (initialTrip) {
      // Editing existing single trip
      onSubmit(trip1Data, initialTrip.id);
    } else if (enableTrip2) {
      // Saving both trips for the day
      const trip2Data: Omit<Trip, 'id' | 'createdAt'> = {
        date,
        lieu: lieu2.trim(),
        motif: motif2.trim(),
        heureDepart: heureDepart2,
        heureArrivee: heureArrivee2,
        notes: notes2.trim(),
        periode: label2.trim(),
      };
      onSubmit([trip1Data, trip2Data]);
    } else {
      // Saving single trip
      onSubmit(trip1Data);
    }
  };

  return (
    <div
      id="trip-form-card"
      className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6 mb-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {initialTrip ? 'Modifier le trajet' : 'Saisie journalière des trajets'}
            </h2>
            <p className="text-xs text-slate-500">
              {initialTrip
                ? 'Modifiez les informations du trajet sélectionné'
                : 'Deux possibilités rassemblées pour chaque jour avec calcul automatique du cumul de temps'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date Selector Row */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
              <label htmlFor="field-date" className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Date de la journée <span className="text-red-500">*</span>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={setYesterday}
                className={`px-2.5 py-1 text-xs rounded-md border font-medium transition-colors cursor-pointer ${
                  date === new Date(Date.now() - 86400000).toISOString().slice(0, 10)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                }`}
              >
                Hier
              </button>
              <button
                type="button"
                onClick={setToday}
                className={`px-2.5 py-1 text-xs rounded-md border font-medium transition-colors cursor-pointer ${
                  date === today
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                }`}
              >
                Aujourd'hui
              </button>
              <input
                id="field-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="mt-2 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
            <span className="capitalize font-medium text-slate-700">
              📅 {formatDateFr(date, true)}
            </span>
            {existingDayTrips.length > 0 && (
              <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px] font-medium">
                {existingDayTrips.length} trajet(s) déjà enregistré(s) à cette date ({formatMinutesToHuman(existingDayMinutes)})
              </span>
            )}
          </div>
        </div>

        {/* Both Trips Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* ================= POSSIBILITÉ 1 ================= */}
          <div className="border border-blue-200 bg-blue-50/20 rounded-xl p-4 sm:p-5 space-y-4 relative">
            <div className="flex items-center justify-between pb-2 border-b border-blue-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <div className="flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <input
                    type="text"
                    value={label1}
                    onChange={(e) => setLabel1(e.target.value)}
                    className="font-bold text-slate-900 text-sm bg-transparent border-b border-dashed border-slate-300 hover:border-blue-500 focus:border-blue-600 focus:bg-white px-1 py-0.5 outline-none rounded"
                    title="Cliquer pour personnaliser l'intitulé"
                  />
                </div>
              </div>

              {/* Calculated duration badge for trip 1 */}
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>{dur1Human}</span>
                <span className="text-[10px] text-blue-600 font-normal">({dur1Decimal} h)</span>
              </div>
            </div>

            {/* Lieu 1 */}
            <div className="relative">
              <label htmlFor="field-lieu-1" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Lieu / Destination <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  id="field-lieu-1"
                  type="text"
                  required
                  value={lieu1}
                  onChange={(e) => {
                    setLieu1(e.target.value);
                    setShowLocationSuggestions1(true);
                  }}
                  onFocus={() => setShowLocationSuggestions1(true)}
                  placeholder="Ex: Centre de distribution, Chantier Voltaire, Dépôt..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {showLocationSuggestions1 && filteredLocations1.length > 0 && (
                <div className="absolute z-30 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto py-1">
                  {filteredLocations1.slice(0, 5).map((loc, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setLieu1(loc);
                        setShowLocationSuggestions1(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 cursor-pointer"
                    >
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{loc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Motif 1 */}
            <div>
              <label htmlFor="field-motif-1" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Motif
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Tag className="w-4 h-4" />
                </div>
                <input
                  id="field-motif-1"
                  type="text"
                  value={motif1}
                  onChange={(e) => setMotif1(e.target.value)}
                  placeholder="Ex: Tournée courrier, Livraison, Intervention..."
                  className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              {/* Quick chips for Motif 1 */}
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {COMMON_MOTIFS.slice(0, 4).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMotif1(m)}
                    className="text-[10px] px-2 py-0.5 rounded bg-white text-slate-600 hover:bg-blue-100 hover:text-blue-700 border border-slate-200 transition-colors cursor-pointer"
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Heures 1 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="field-heure-depart-1" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Départ <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setTimeNow('depart1')}
                    className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                  >
                    Maintenant
                  </button>
                </div>
                <input
                  id="field-heure-depart-1"
                  type="time"
                  required
                  value={heureDepart1}
                  onChange={(e) => setHeureDepart1(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="field-heure-arrivee-1" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Arrivée <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setTimeNow('arrivee1')}
                    className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                  >
                    Maintenant
                  </button>
                </div>
                <input
                  id="field-heure-arrivee-1"
                  type="time"
                  required
                  value={heureArrivee1}
                  onChange={(e) => setHeureArrivee1(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {dur1.isOvernight && (
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] bg-amber-50 text-amber-800 border border-amber-200">
                <Moon className="w-3 h-3 text-amber-600" />
                <span>Arrivée le lendemain (+1j)</span>
              </div>
            )}

            {/* Notes 1 */}
            <div>
              <label htmlFor="field-notes-1" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Remarques (facultatif)
              </label>
              <input
                id="field-notes-1"
                type="text"
                value={notes1}
                onChange={(e) => setNotes1(e.target.value)}
                placeholder="Détails, anomalies, observations..."
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* ================= POSSIBILITÉ 2 ================= */}
          <div
            className={`border rounded-xl p-4 sm:p-5 space-y-4 relative transition-all ${
              enableTrip2
                ? 'border-emerald-200 bg-emerald-50/20'
                : 'border-dashed border-slate-300 bg-slate-50/60'
            }`}
          >
            {/* Toggle header for Trip 2 */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs ${
                    enableTrip2 ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-600'
                  }`}
                >
                  2
                </div>
                <div className="flex items-center gap-1.5">
                  <Sunset className={`w-4 h-4 ${enableTrip2 ? 'text-emerald-600' : 'text-slate-400'}`} />
                  {enableTrip2 ? (
                    <input
                      type="text"
                      value={label2}
                      onChange={(e) => setLabel2(e.target.value)}
                      className="font-bold text-slate-900 text-sm bg-transparent border-b border-dashed border-slate-300 hover:border-emerald-500 focus:border-emerald-600 focus:bg-white px-1 py-0.5 outline-none rounded"
                      title="Cliquer pour personnaliser l'intitulé"
                    />
                  ) : (
                    <span className="font-semibold text-slate-500 text-sm">
                      Deuxième trajet du jour (optionnel)
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEnableTrip2(!enableTrip2)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  enableTrip2
                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                }`}
              >
                {enableTrip2 ? (
                  <>
                    <MinusCircle className="w-3.5 h-3.5" />
                    <span>Désactiver le 2ème trajet</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>+ Activer la possibilité 2</span>
                  </>
                )}
              </button>
            </div>

            {enableTrip2 ? (
              <>
                {/* Raccourcis rapides de remplissage */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-500 font-medium text-[11px]">Remplissage rapide :</span>
                  {lieu1 && (
                    <>
                      <button
                        type="button"
                        onClick={handleCopyLieu1To2}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer"
                      >
                        <Copy className="w-3 h-3 text-slate-400" />
                        <span>Même lieu que le 1er trajet</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSetRetourLieu2}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer"
                      >
                        <span>Trajet Retour</span>
                      </button>
                    </>
                  )}
                </div>

                {/* Lieu 2 */}
                <div className="relative">
                  <label htmlFor="field-lieu-2" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Lieu / Destination <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <input
                      id="field-lieu-2"
                      type="text"
                      required={enableTrip2}
                      value={lieu2}
                      onChange={(e) => {
                        setLieu2(e.target.value);
                        setShowLocationSuggestions2(true);
                      }}
                      onFocus={() => setShowLocationSuggestions2(true)}
                      placeholder="Ex: Siège, Dépôt retour, Deuxième client..."
                      className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  {showLocationSuggestions2 && filteredLocations2.length > 0 && (
                    <div className="absolute z-30 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto py-1">
                      {filteredLocations2.slice(0, 5).map((loc, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setLieu2(loc);
                            setShowLocationSuggestions2(false);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2 cursor-pointer"
                        >
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{loc}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Motif 2 */}
                <div>
                  <label htmlFor="field-motif-2" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Motif
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Tag className="w-4 h-4" />
                    </div>
                    <input
                      id="field-motif-2"
                      type="text"
                      value={motif2}
                      onChange={(e) => setMotif2(e.target.value)}
                      placeholder="Ex: Distribution après-midi, Retour chantier..."
                      className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  {/* Quick chips for Motif 2 */}
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {COMMON_MOTIFS.slice(1, 5).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMotif2(m)}
                        className="text-[10px] px-2 py-0.5 rounded bg-white text-slate-600 hover:bg-emerald-100 hover:text-emerald-700 border border-slate-200 transition-colors cursor-pointer"
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Heures 2 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="field-heure-depart-2" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Départ <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setTimeNow('depart2')}
                        className="text-[10px] text-emerald-600 hover:underline cursor-pointer"
                      >
                        Maintenant
                      </button>
                    </div>
                    <input
                      id="field-heure-depart-2"
                      type="time"
                      required={enableTrip2}
                      value={heureDepart2}
                      onChange={(e) => setHeureDepart2(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="field-heure-arrivee-2" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Arrivée <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setTimeNow('arrivee2')}
                        className="text-[10px] text-emerald-600 hover:underline cursor-pointer"
                      >
                        Maintenant
                      </button>
                    </div>
                    <input
                      id="field-heure-arrivee-2"
                      type="time"
                      required={enableTrip2}
                      value={heureArrivee2}
                      onChange={(e) => setHeureArrivee2(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                {/* Duration badge for trip 2 */}
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Durée trajet 2 : {dur2Human}</span>
                    <span className="text-[10px] text-emerald-600 font-normal">({dur2Decimal} h)</span>
                  </div>

                  {dur2.isOvernight && (
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] bg-amber-50 text-amber-800 border border-amber-200">
                      <Moon className="w-3 h-3 text-amber-600" />
                      <span>+1j</span>
                    </div>
                  )}
                </div>

                {/* Notes 2 */}
                <div>
                  <label htmlFor="field-notes-2" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Remarques (facultatif)
                  </label>
                  <input
                    id="field-notes-2"
                    type="text"
                    value={notes2}
                    onChange={(e) => setNotes2(e.target.value)}
                    placeholder="Détails, anomalies, observations..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </>
            ) : (
              <div className="py-8 px-4 text-center">
                <p className="text-xs text-slate-500 max-w-xs mx-auto mb-3">
                  Vous pouvez enregistrer un deuxième trajet (ex: après-midi, 2ème tournée ou retour) pour regrouper votre journée en une seule saisie.
                </p>
                <button
                  type="button"
                  onClick={() => setEnableTrip2(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Ajouter le 2ème trajet pour cette journée</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ================= CUMUL DE TEMPS PAR JOUR ================= */}
        <div
          id="daily-cumulative-summary-banner"
          className="rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50/80 via-blue-50/60 to-emerald-50/60 p-4 sm:p-5 shadow-xs"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>Cumul de temps calculé pour cette journée</span>
                </h3>
              </div>
              <p className="text-xs text-slate-600">
                {enableTrip2 ? (
                  <span>
                    {label1} (<strong>{dur1Human}</strong>) + {label2} (<strong>{dur2Human}</strong>)
                  </span>
                ) : (
                  <span>
                    {label1} (<strong>{dur1Human}</strong>)
                  </span>
                )}
                {existingDayTrips.length > 0 && (
                  <span> • {existingDayTrips.length} autre(s) trajet(s) ce jour (+{formatMinutesToHuman(existingDayMinutes)})</span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-white/90 border border-indigo-200 rounded-xl px-4 py-2.5 shadow-xs text-right">
                <span className="text-[11px] text-slate-500 font-semibold block uppercase">
                  {enableTrip2 ? 'Total des 2 trajets saisie' : 'Total trajet saisie'}
                </span>
                <div className="text-lg font-black text-indigo-900 leading-tight">
                  {totalDayHuman}
                  <span className="text-xs font-semibold text-indigo-600 ml-1.5">
                    ({totalDayDecimal} h)
                  </span>
                </div>
              </div>

              {existingDayTrips.length > 0 && (
                <div className="bg-emerald-100/90 border border-emerald-300 rounded-xl px-4 py-2.5 shadow-xs text-right">
                  <span className="text-[11px] text-emerald-800 font-semibold block uppercase">
                    Cumul Journée Complet
                  </span>
                  <div className="text-lg font-black text-emerald-950 leading-tight">
                    {grandDayHuman}
                    <span className="text-xs font-semibold text-emerald-700 ml-1.5">
                      ({grandDayDecimal} h)
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
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
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs hover:shadow cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>
              {initialTrip
                ? 'Enregistrer les modifications'
                : enableTrip2
                ? `Enregistrer les 2 trajets (Cumul : ${totalDayHuman})`
                : `Enregistrer le trajet (${dur1Human})`}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};

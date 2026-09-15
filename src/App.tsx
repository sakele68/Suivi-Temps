import React, { useState, useEffect, useMemo } from 'react';
import {
  Car,
  Clock,
  Plus,
  BarChart3,
  ListFilter,
  CalendarDays,
  FileSpreadsheet,
  Server,
  Info,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Trip, TripCalculated, ViewTab } from './types';
import {
  loadTripsFromStorage,
  saveTripsToStorage,
} from './utils/storage';
import {
  enrichTrip,
  getSummaryByLocation,
  getSummaryByDate,
} from './utils/timeCalculations';
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { TripForm } from './components/TripForm';
import { TripList } from './components/TripList';
import { SummaryByLocation } from './components/SummaryByLocation';
import { SummaryByDate } from './components/SummaryByDate';
import { ProxmoxLxcModal } from './components/ProxmoxLxcModal';
import { GitHubInstallModal } from './components/GitHubInstallModal';

export default function App() {
  const [rawTrips, setRawTrips] = useState<Trip[]>(() => loadTripsFromStorage());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [isProxmoxModalOpen, setIsProxmoxModalOpen] = useState(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ViewTab>('list');
  const [activeLieuFilter, setActiveLieuFilter] = useState<string | undefined>(undefined);

  // Save trips to storage on change
  useEffect(() => {
    saveTripsToStorage(rawTrips);
  }, [rawTrips]);

  // Enrich trips with calculated duration metrics
  const calculatedTrips: TripCalculated[] = useMemo(() => {
    return rawTrips
      .map(enrichTrip)
      .sort((a, b) => {
        // Sort chronologically descending: date then departure time
        if (a.date !== b.date) {
          return b.date.localeCompare(a.date);
        }
        return b.heureDepart.localeCompare(a.heureDepart);
      });
  }, [rawTrips]);

  // List of unique location names for autocompletion
  const existingLocations = useMemo(() => {
    const locSet = new Set<string>();
    for (const t of rawTrips) {
      if (t.lieu) locSet.add(t.lieu.trim());
    }
    return Array.from(locSet);
  }, [rawTrips]);

  // Summaries
  const locationSummaries = useMemo(() => {
    return getSummaryByLocation(calculatedTrips);
  }, [calculatedTrips]);

  const dateSummaries = useMemo(() => {
    return getSummaryByDate(calculatedTrips);
  }, [calculatedTrips]);

  const grandTotalMinutes = useMemo(() => {
    return calculatedTrips.reduce((acc, t) => acc + t.durationMinutes, 0);
  }, [calculatedTrips]);

  // Add or update trip
  const handleSaveTrip = (
    data: Omit<Trip, 'id' | 'createdAt'>,
    editingId?: string
  ) => {
    if (editingId) {
      setRawTrips((prev) =>
        prev.map((t) =>
          t.id === editingId
            ? { ...t, ...data }
            : t
        )
      );
    } else {
      const newTrip: Trip = {
        ...data,
        id: 'trip-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        createdAt: Date.now(),
      };
      setRawTrips((prev) => [newTrip, ...prev]);
    }
    setIsFormOpen(false);
    setEditingTrip(null);
  };

  // Duplicate a trip (prefill with today's date)
  const handleDuplicate = (trip: TripCalculated) => {
    const duplicated: Trip = {
      id: 'trip-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      date: new Date().toISOString().slice(0, 10),
      lieu: trip.lieu,
      motif: trip.motif,
      heureDepart: trip.heureDepart,
      heureArrivee: trip.heureArrivee,
      notes: trip.notes,
      createdAt: Date.now(),
    };
    setRawTrips((prev) => [duplicated, ...prev]);
  };

  // Edit trip
  const handleEdit = (trip: TripCalculated) => {
    setEditingTrip(trip);
    setIsFormOpen(true);
    // Scroll to form smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete trip
  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce trajet ?')) {
      setRawTrips((prev) => prev.filter((t) => t.id !== id));
    }
  };

  // Filter by lieu from summary table
  const handleFilterByLieuFromSummary = (lieu: string) => {
    setActiveLieuFilter(lieu);
    setActiveTab('list');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Header */}
      <Header
        trips={calculatedTrips}
        onAddClick={() => {
          setEditingTrip(null);
          setIsFormOpen(true);
        }}
        onOpenProxmoxModal={() => setIsProxmoxModalOpen(true)}
        onOpenGitHubModal={() => setIsGitHubModalOpen(true)}
        onTripsImported={(imported) => setRawTrips(imported)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPI Summary Cards */}
        <SummaryCards trips={calculatedTrips} />

        {/* Collapsible / Floating Form */}
        {isFormOpen && (
          <div className="animate-in fade-in slide-in-from-top-3 duration-200">
            <TripForm
              initialTrip={editingTrip}
              existingLocations={existingLocations}
              onSubmit={handleSaveTrip}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingTrip(null);
              }}
            />
          </div>
        )}

        {/* Navigation Tabs between List & Automatic Summaries */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl">
            <button
              id="tab-btn-list"
              onClick={() => setActiveTab('list')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'list'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <ListFilter className="w-4 h-4" />
              <span>Détail des trajets ({calculatedTrips.length})</span>
            </button>

            <button
              id="tab-btn-summary-lieu"
              onClick={() => setActiveTab('summary-lieu')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'summary-lieu'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Récapitulatif par Lieu ({locationSummaries.length})</span>
            </button>

            <button
              id="tab-btn-summary-date"
              onClick={() => setActiveTab('summary-date')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'summary-date'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Par Journée ({dateSummaries.length})</span>
            </button>
          </div>

          {!isFormOpen && (
            <button
              id="btn-quick-add-trip"
              onClick={() => {
                setEditingTrip(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer border border-blue-200 self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter un trajet</span>
            </button>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'list' && (
          <TripList
            trips={calculatedTrips}
            locations={existingLocations}
            activeLieuFilter={activeLieuFilter}
            onClearLieuFilter={() => setActiveLieuFilter(undefined)}
            onEdit={handleEdit}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onAddClick={() => {
              setEditingTrip(null);
              setIsFormOpen(true);
            }}
          />
        )}

        {activeTab === 'summary-lieu' && (
          <div className="space-y-4">
            <SummaryByLocation
              summaries={locationSummaries}
              grandTotalMinutes={grandTotalMinutes}
              onFilterByLieu={handleFilterByLieuFromSummary}
            />
          </div>
        )}

        {activeTab === 'summary-date' && (
          <div className="space-y-4">
            <SummaryByDate summaries={dateSummaries} />
          </div>
        )}
      </main>

      {/* Footer with Proxmox Note */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span>Suivi des Trajets • Calcul automatique des durées • Export Excel</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsGitHubModalOpen(true)}
              className="text-slate-600 hover:text-slate-900 font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Installation GitHub</span>
            </button>
            <span>•</span>
            <button
              onClick={() => setIsProxmoxModalOpen(true)}
              className="text-slate-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Server className="w-3.5 h-3.5 text-emerald-600" />
              <span>Hébergement Proxmox LXC</span>
            </button>
            <span>•</span>
            <span>Sauvegarde 100% locale</span>
          </div>
        </div>
      </footer>

      {/* GitHub Installation Modal */}
      <GitHubInstallModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
      />

      {/* Proxmox LXC Deployment Modal */}
      <ProxmoxLxcModal
        isOpen={isProxmoxModalOpen}
        onClose={() => setIsProxmoxModalOpen(false)}
      />
    </div>
  );
}

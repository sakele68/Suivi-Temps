import React, { useRef } from 'react';
import {
  FileSpreadsheet,
  Server,
  Download,
  Upload,
  Plus,
  Clock,
  Car,
  FileText,
  FolderGit2,
} from 'lucide-react';
import { TripCalculated } from '../types';
import { exportTripsToExcel, exportTripsToCsv } from '../utils/excelExport';
import { exportBackupJSON, importBackupJSON } from '../utils/storage';

interface HeaderProps {
  trips: TripCalculated[];
  onAddClick: () => void;
  onOpenProxmoxModal: () => void;
  onOpenGitHubModal: () => void;
  onTripsImported: (trips: any[]) => void;
}

export const Header: React.FC<HeaderProps> = ({
  trips,
  onAddClick,
  onOpenProxmoxModal,
  onOpenGitHubModal,
  onTripsImported,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportExcel = () => {
    exportTripsToExcel(trips);
  };

  const handleExportCsv = () => {
    exportTripsToCsv(trips);
  };

  const handleBackup = () => {
    exportBackupJSON(trips);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importBackupJSON(file);
      onTripsImported(imported);
    } catch (err: any) {
      alert('Erreur lors de l\'importation : ' + (err?.message || 'fichier invalide'));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <header id="app-header" className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Brand & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Suivi des Trajets
                </h1>
                <button
                  id="btn-open-proxmox-badge"
                  onClick={onOpenProxmoxModal}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                  title="Cliquez pour voir les instructions d'installation Proxmox LXC"
                >
                  <Server className="w-3 h-3 text-emerald-600" />
                  <span>Proxmox LXC</span>
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Calcul automatique des durées et export Excel
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Guide GitHub */}
            <button
              id="btn-github-guide"
              onClick={onOpenGitHubModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer border border-slate-200"
              title="Guide d'installation depuis GitHub"
            >
              <FolderGit2 className="w-4 h-4 text-slate-700" />
              <span>GitHub</span>
            </button>

            {/* Proxmox LXC Guide button */}
            <button
              id="btn-proxmox-guide"
              onClick={onOpenProxmoxModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer border border-slate-200"
            >
              <Server className="w-4 h-4 text-slate-600" />
              <span className="hidden md:inline">Déploiement</span> LXC
            </button>

            {/* Backup & Restore */}
            <div className="flex items-center border-r border-slate-200 pr-2 mr-1 gap-1">
              <button
                id="btn-backup-json"
                onClick={handleBackup}
                title="Télécharger une sauvegarde JSON"
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                id="btn-import-json"
                onClick={() => fileInputRef.current?.click()}
                title="Restaurer des trajets depuis un fichier JSON"
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Export buttons */}
            <button
              id="btn-export-csv"
              onClick={handleExportCsv}
              title="Exporter au format CSV"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              <span>CSV</span>
            </button>

            <button
              id="btn-export-excel"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Export Excel (.xlsx)</span>
            </button>

            {/* Add new trip */}
            <button
              id="btn-header-add-trip"
              onClick={onAddClick}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer ml-1"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau trajet</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

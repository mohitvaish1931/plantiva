import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, TrendingUp, AlertTriangle, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';
import { useData } from '../context/DataContext';
import { averageHealth, plantStatus } from '../utils';

function csvCell(value: unknown): string {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function ReportsPage() {
  const { plants, alerts, userName } = useData();

  const overall = averageHealth(plants);
  const activeAlerts = alerts.filter(a => a.type !== 'resolved').length;
  const healthy = plants.filter(p => plantStatus(p) === 'Healthy').length;

  const downloadCsv = () => {
    if (plants.length === 0) {
      toast.error('No scans to export yet');
      return;
    }
    const header = ['Date', 'Plant', 'Species', 'Health Score', 'Status', 'Main Issue', 'AI Confidence %', 'Last Watered'];
    const rows = plants.map(p => [
      new Date(p.addedAt).toLocaleString(),
      p.name,
      p.species || '',
      p.healthScore,
      plantStatus(p),
      p.disease || '',
      p.confidence ?? '',
      p.lastWatered ? new Date(p.lastWatered).toLocaleString() : '',
    ]);
    const csv = [header, ...rows].map(r => r.map(csvCell).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `plantiva-scans-${userName.replace(/\s+/g, '-').toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reports = [
    { id: 'csv', title: 'Scan History', subtitle: `${plants.length} scans · CSV spreadsheet`, icon: FileSpreadsheet, onClick: downloadCsv },
    { id: 'pdf', title: 'Health Summary', subtitle: 'Print or save this page as PDF', icon: FileText, onClick: () => window.print() },
  ];

  return (
    <div className="max-w-[1000px] mx-auto space-y-8 pb-20">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-light text-white mb-2">Reports & Analytics</h1>
          <p className="text-gray-400">Download your scan history and a summary of your garden.</p>
        </div>

        <button
          onClick={downloadCsv}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-black font-semibold rounded-xl hover:bg-accent-secondary transition-colors shadow-glow-accent"
        >
          <Download className="w-4 h-4" />
          Export Scans
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Summary Cards */}
        <div className="glass-card border border-border rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-4 text-accent">
            <TrendingUp className="w-5 h-5" />
            <h3 className="font-semibold text-white">Overall Health</h3>
          </div>
          <p className="text-3xl font-light text-white mb-1">{overall === null ? '--' : `${overall}/100`}</p>
          <p className="text-sm text-gray-400">Average of {plants.length} {plants.length === 1 ? 'scan' : 'scans'}</p>
        </div>

        <div className="glass-card border border-border rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-4 text-yellow-500">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-semibold text-white">Active Alerts</h3>
          </div>
          <p className="text-3xl font-light text-white mb-1">{activeAlerts}</p>
          <p className="text-sm text-gray-400">From weather and plant health</p>
        </div>

        <div className="glass-card border border-border rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-4 text-blue-500">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="font-semibold text-white">Healthy Plants</h3>
          </div>
          <p className="text-3xl font-light text-white mb-1">{healthy}</p>
          <p className="text-sm text-gray-400">{plants.length ? `${Math.round((healthy / plants.length) * 100)}% of scans` : 'No scans yet'}</p>
        </div>
      </div>

      {/* Available Reports List */}
      <div className="glass-card border border-border rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-border/50">
          <h2 className="text-lg font-medium text-white">Available Downloads</h2>
        </div>
        <div className="divide-y divide-border/50">
          {reports.map((report) => (
            <motion.div
              key={report.id}
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
              onClick={report.onClick}
              className="p-4 sm:p-6 flex items-center justify-between gap-4 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center shrink-0">
                  <report.icon className="w-6 h-6 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium">{report.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{report.subtitle}</p>
                </div>
              </div>

              <button className="p-2 text-gray-400 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors">
                <Download className="w-5 h-5" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>

    </div>
  );
}

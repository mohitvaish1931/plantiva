import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, TrendingUp, AlertTriangle, ShieldCheck, FileSpreadsheet } from 'lucide-react';

const mockReports = [
  { id: 1, title: 'Monthly Health Summary', date: 'Jul 2026', type: 'PDF', size: '2.4 MB', icon: FileText },
  { id: 2, title: 'Quarterly Sensor Data', date: 'Q2 2026', type: 'CSV', size: '1.1 MB', icon: FileSpreadsheet },
  { id: 3, title: 'Pest Incident Report', date: 'Jun 2026', type: 'PDF', size: '0.8 MB', icon: FileText },
  { id: 4, title: 'Annual Growth Analytics', date: '2025', type: 'PDF', size: '4.2 MB', icon: FileText },
];

export function ReportsPage() {
  return (
    <div className="max-w-[1000px] mx-auto space-y-8 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-light text-white mb-2">Reports & Analytics</h1>
          <p className="text-gray-400">Generate and download comprehensive insights about your garden.</p>
        </div>
        
        <button className="flex items-center gap-2 px-4 py-2 bg-accent text-black font-semibold rounded-xl hover:bg-accent-secondary transition-colors shadow-glow-accent">
          <Download className="w-4 h-4" />
          Generate New Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Summary Cards */}
        <div className="glass-card border border-border rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-4 text-accent">
            <TrendingUp className="w-5 h-5" />
            <h3 className="font-semibold text-white">Overall Health</h3>
          </div>
          <p className="text-3xl font-light text-white mb-1">92%</p>
          <p className="text-sm text-gray-400">+5% from last month</p>
        </div>

        <div className="glass-card border border-border rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-4 text-yellow-500">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-semibold text-white">Alerts Triggered</h3>
          </div>
          <p className="text-3xl font-light text-white mb-1">14</p>
          <p className="text-sm text-gray-400">-2 from last month</p>
        </div>

        <div className="glass-card border border-border rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-4 text-blue-500">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="font-semibold text-white">Issues Resolved</h3>
          </div>
          <p className="text-3xl font-light text-white mb-1">12</p>
          <p className="text-sm text-gray-400">85% resolution rate</p>
        </div>
      </div>

      {/* Available Reports List */}
      <div className="glass-card border border-border rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-border/50">
          <h2 className="text-lg font-medium text-white">Available Downloads</h2>
        </div>
        <div className="divide-y divide-border/50">
          {mockReports.map((report) => (
            <motion.div 
              key={report.id}
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
              className="p-4 sm:p-6 flex items-center justify-between gap-4 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center shrink-0">
                  <report.icon className="w-6 h-6 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium">{report.title}</h3>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                    <span>{report.date}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-600" />
                    <span>{report.type}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-600" />
                    <span>{report.size}</span>
                  </div>
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

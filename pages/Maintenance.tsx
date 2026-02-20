
import React, { useState } from 'react';
import { useInventoryStore } from '../store';
import { ItemCondition, MaintenanceLog, ItemStatus } from '../types';
import { ICONS } from '../constants';

const Maintenance: React.FC = () => {
  const { maintenance, items, addMaintenanceRecord, resolveMaintenance } = useInventoryStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<MaintenanceLog | null>(null);

  // DETECT: Identify items marked as Damaged in Inventory that aren't yet in Maintenance status
  const detectedDamagedItems = items.filter(
    i => i.condition === ItemCondition.DAMAGED && i.status !== ItemStatus.MAINTENANCE
  );

  const handleReportIssue = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const itemId = formData.get('itemId') as string;
    
    const newRecord: MaintenanceLog = {
      id: `maint-${Date.now()}`,
      itemId,
      issueDescription: formData.get('description') as string,
      reportedDate: new Date().toISOString(),
      status: 'Ongoing'
    };
    
    addMaintenanceRecord(newRecord);
    setIsModalOpen(false);
  };

  const handleResolve = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedLog) return;
    const formData = new FormData(e.currentTarget);
    const condition = formData.get('condition') as ItemCondition;
    resolveMaintenance(selectedLog.id, condition);
    setSelectedLog(null);
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Maintenance & Repairs</h1>
          <p className="text-slate-500">Track equipment health and service history</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          disabled={detectedDamagedItems.length === 0}
          className={`px-5 py-2.5 rounded-lg font-semibold transition-all flex items-center gap-2 shadow-lg ${
            detectedDamagedItems.length > 0 
              ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-orange-100' 
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          {ICONS.Alert} Log Maintenance
        </button>
      </header>

      {/* DETECTED ISSUES BANNER */}
      {detectedDamagedItems.length > 0 ? (
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4">
            <div className="bg-amber-100 text-amber-600 p-3 rounded-full">
              {ICONS.Alert}
            </div>
            <div>
              <h3 className="text-amber-900 font-bold">Detected Damaged Equipment</h3>
              <p className="text-amber-700 text-sm">{detectedDamagedItems.length} item(s) are flagged as "Damaged" but haven't been admitted to maintenance yet.</p>
            </div>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-amber-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-amber-700 transition-colors whitespace-nowrap"
          >
            Start Repair Workflow
          </button>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-3 text-emerald-800">
          {ICONS.Success}
          <p className="text-sm font-medium">All equipment is currently operational or already in maintenance. No new damage detected.</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900 uppercase tracking-wider text-xs">Active Maintenance Records</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold">
              <tr>
                <th className="px-6 py-4">Equipment</th>
                <th className="px-6 py-4">Issue Description</th>
                <th className="px-6 py-4">Date Reported</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {maintenance.sort((a,b) => (a.status === 'Ongoing' ? -1 : 1)).map(log => {
                const item = items.find(i => i.id === log.itemId);
                return (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{item?.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-500 font-mono uppercase tracking-tighter">SN: {item?.serialNumber}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600 max-w-xs truncate">{log.issueDescription}</td>
                    <td className="px-6 py-4 text-slate-500">{new Date(log.reportedDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${log.status === 'Ongoing' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {log.status === 'Ongoing' && (
                        <button 
                          onClick={() => setSelectedLog(log)}
                          className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                        >
                          MARK RESOLVED
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {maintenance.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <div className="bg-slate-50 p-4 rounded-full mb-2">
                        {ICONS.Maintenance}
                      </div>
                      <p className="text-slate-500 font-medium">No active maintenance logs.</p>
                      <p className="text-xs max-w-xs">Items must be marked as "Damaged" in the inventory before they can be processed here.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Modal - ONLY FOR DETECTED DAMAGED ITEMS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Initiate Repair</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleReportIssue} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Select Detected Item</label>
                <select required name="itemId" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 outline-none">
                  {detectedDamagedItems.map(i => (
                    <option key={i.id} value={i.id}>{i.name} (SN: {i.serialNumber})</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-2 italic">Only items currently flagged as "Damaged" are detectable here.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Diagnosis / Technician Notes</label>
                <textarea required name="description" rows={4} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 outline-none" placeholder="What parts are needed? What is the estimated repair time?" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-orange-600 text-white rounded-xl font-bold shadow-lg shadow-orange-100 hover:bg-orange-700 transition-all">Start Maintenance</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Resolve Repair</h2>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 text-2xl hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleResolve} className="p-6 space-y-4">
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-4">
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">Repairing Item</p>
                <p className="font-bold text-slate-900 text-lg">{items.find(i => i.id === selectedLog.itemId)?.name}</p>
                <p className="text-sm text-slate-600 italic mt-1 line-clamp-2">Issue: {selectedLog.issueDescription}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Final Service Condition</label>
                <div className="flex gap-3">
                   {Object.values(ItemCondition).map(c => (
                     <label key={c} className="flex-1 cursor-pointer">
                       <input type="radio" name="condition" value={c} className="sr-only peer" defaultChecked={c === ItemCondition.GOOD} />
                       <div className="text-center py-2 px-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 peer-checked:bg-indigo-600 peer-checked:text-white peer-checked:border-indigo-600 hover:bg-slate-50 transition-all">
                         {c}
                       </div>
                     </label>
                   ))}
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button type="button" onClick={() => setSelectedLog(null)} className="px-6 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">Return to Inventory</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Maintenance;

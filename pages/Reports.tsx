
import React from 'react';
import { useInventoryStore } from '../store';
import { ICONS } from '../constants';
import { TransactionStatus } from '../types';

const Reports: React.FC = () => {
  const { transactions, items, maintenance } = useInventoryStore();

  const overdueItems = transactions.filter(t => t.status === TransactionStatus.BORROWED && new Date(t.dueDate) < new Date());
  const damagedItems = items.filter(i => i.condition === 'Damaged');
  const activeMaintenance = maintenance.filter(m => m.status === 'Ongoing');

  const handleExport = (name: string) => {
    alert(`Exporting ${name} to Excel/PDF... (Simulated)`);
  };

  const ReportCard = ({ title, count, description, icon, color }: any) => (
    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-start gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-slate-900">{title}</h3>
        <p className="text-slate-500 text-sm mb-4">{description}</p>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-black text-slate-900">{count}</span>
          <button 
            onClick={() => handleExport(title)}
            className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
          >
            {ICONS.Download} EXPORT
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">System Reports</h1>
        <p className="text-slate-500">Export inventory and transaction data for audits</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ReportCard 
          title="Overdue Report" 
          count={overdueItems.length} 
          description="List of all items currently past their due date."
          icon={ICONS.Alert}
          color="bg-rose-50 text-rose-600"
        />
        <ReportCard 
          title="Maintenance History" 
          count={maintenance.length} 
          description="Full history of all maintenance logs recorded."
          icon={ICONS.Maintenance}
          color="bg-orange-50 text-orange-600"
        />
        <ReportCard 
          title="Borrowing Trends" 
          count={transactions.length} 
          description="Comprehensive log of all borrowing transactions."
          icon={ICONS.Transactions}
          color="bg-indigo-50 text-indigo-600"
        />
        <ReportCard 
          title="Damage / Repair" 
          count={damagedItems.length} 
          description="Equipment currently marked as Damaged or Under Repair."
          icon={ICONS.Alert}
          color="bg-amber-50 text-amber-600"
        />
        <ReportCard 
          title="Full Inventory Audit" 
          count={items.length} 
          description="Complete listing of all serialized items in the system."
          icon={ICONS.Inventory}
          color="bg-slate-50 text-slate-600"
        />
      </div>

      <div className="bg-indigo-600 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-indigo-100">
        <div>
          <h2 className="text-2xl font-bold mb-2">Need a Custom Report?</h2>
          <p className="text-indigo-100">Filter your inventory view and use the "Export" buttons on specific tables for targeted data.</p>
        </div>
        <button className="bg-white text-indigo-600 px-8 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors whitespace-nowrap">
          Generate Custom PDF
        </button>
      </div>
    </div>
  );
};

export default Reports;

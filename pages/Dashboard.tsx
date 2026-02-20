
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventoryStore } from '../store';
import { ItemStatus, TransactionStatus } from '../types';
import { ICONS } from '../constants';
import { StatusBadge } from '../components/StatusBadge';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const StatCard = ({ label, value, icon, color }: { label: string, value: number, icon: React.ReactNode, color: string }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-5">
    <div className={`p-4 rounded-lg ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const { items, transactions, sessions } = useInventoryStore();
  const navigate = useNavigate();

  const totalItems = items.length;
  const availableCount = items.filter(i => i.status === ItemStatus.AVAILABLE).length;
  const borrowedCount = items.filter(i => i.status === ItemStatus.BORROWED).length;
  const overdueCount = transactions.filter(t => t.status === TransactionStatus.BORROWED && new Date(t.dueDate) < new Date()).length;
  const pendingSessions = sessions.filter(s => s.status === 'PendingApproval').length;

  const statusData = [
    { name: 'Available', value: availableCount, color: '#22c55e' },
    { name: 'Borrowed', value: borrowedCount, color: '#3b82f6' },
    { name: 'Maintenance', value: items.filter(i => i.status === ItemStatus.MAINTENANCE).length, color: '#f97316' },
    { name: 'Reserved', value: items.filter(i => i.status === ItemStatus.RESERVED).length, color: '#eab308' },
  ];

  const recentTransactions = transactions
    .sort((a, b) => new Date(b.dateRequested).getTime() - new Date(a.dateRequested).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">Overview of equipment and borrowing status</p>
        </div>
        <div className="text-sm font-medium px-4 py-2 bg-white rounded-lg shadow-sm border border-slate-100 text-slate-600">
          Last Updated: {new Date().toLocaleDateString()}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Equipment" value={totalItems} icon={ICONS.Inventory} color="bg-indigo-50 text-indigo-600" />
        <StatCard label="Available" value={availableCount} icon={ICONS.Success} color="bg-emerald-50 text-emerald-600" />
        <StatCard label="Pending Approval" value={pendingSessions} icon={ICONS.Alert} color="bg-amber-50 text-amber-600" />
        <StatCard label="Overdue Items" value={overdueCount} icon={ICONS.Alert} color="bg-rose-50 text-rose-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100 min-w-0">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Inventory Status</h2>
          <div className="h-[300px] w-full min-w-0 min-h-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={statusData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 min-w-0">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Distribution</h2>
          <div className="h-[300px] w-full min-w-0 min-h-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Recent Borrow Sessions</h2>
          <button 
            onClick={() => navigate('/transactions')}
            className="text-indigo-600 text-sm font-semibold hover:underline"
          >
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold">
              <tr>
                <th className="px-6 py-4">Session Code</th>
                <th className="px-6 py-4">Borrower</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Requested Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sessions.slice(0, 5).sort((a,b) => b.id.localeCompare(a.id)).map(session => (
                <tr key={session.id} className="hover:bg-slate-50 transition-colors text-sm">
                  <td className="px-6 py-4 font-mono font-bold text-indigo-600">
                    {session.sessionCode}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900">{session.borrowerName}</p>
                    <p className="text-xs text-slate-500">ID: {session.borrowerIdNumber}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold text-slate-600">
                      {session.itemIds.length} Items
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={session.status as any} />
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {new Date(session.requestedDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No recent sessions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

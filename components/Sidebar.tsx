
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ICONS } from '../constants';

const NavItem = ({ to, icon, label, active }: { to: string, icon: React.ReactNode, label: string, active: boolean }) => (
  <Link 
    to={to} 
    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
      active ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
    }`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </Link>
);

const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-slate-900 text-white flex flex-col z-50">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg shadow-lg">
            {ICONS.QR}
          </div>
          <h1 className="text-xl font-bold tracking-tight">QR-Inventory</h1>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <NavItem to="/" icon={ICONS.Dashboard} label="Dashboard" active={location.pathname === '/'} />
        <NavItem to="/inventory" icon={ICONS.Inventory} label="Equipment" active={location.pathname === '/inventory'} />
        <NavItem to="/transactions" icon={ICONS.Transactions} label="Borrowing" active={location.pathname === '/transactions'} />
        <NavItem to="/maintenance" icon={ICONS.Maintenance} label="Maintenance" active={location.pathname === '/maintenance'} />
        <NavItem to="/categories" icon={ICONS.Categories} label="Categories" active={location.pathname === '/categories'} />
        <NavItem to="/reports" icon={ICONS.Reports} label="Reports" active={location.pathname === '/reports'} />
      </nav>
    </aside>
  );
};

export default Sidebar;
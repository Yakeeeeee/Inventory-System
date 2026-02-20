
import React from 'react';
import { ItemStatus, ItemCondition, TransactionStatus, SessionStatus } from '../types';

export const StatusBadge: React.FC<{ status: ItemStatus | TransactionStatus | SessionStatus }> = ({ status }) => {
  const colors: Record<string, string> = {
    [ItemStatus.AVAILABLE]: 'bg-green-100 text-green-700 border-green-200',
    [ItemStatus.BORROWED]: 'bg-blue-100 text-blue-700 border-blue-200',
    [ItemStatus.RESERVED]: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    [ItemStatus.MAINTENANCE]: 'bg-orange-100 text-orange-700 border-orange-200',
    [ItemStatus.LOST]: 'bg-red-100 text-red-700 border-red-200',
    [ItemStatus.ARCHIVED]: 'bg-slate-100 text-slate-700 border-slate-200',
    [TransactionStatus.OVERDUE]: 'bg-rose-100 text-rose-700 border-rose-200 animate-pulse',
    [TransactionStatus.RETURNED]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    [TransactionStatus.CANCELLED]: 'bg-slate-100 text-slate-500 border-slate-200 italic',
    [SessionStatus.PENDING_SCANNING]: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    [SessionStatus.PENDING_APPROVAL]: 'bg-amber-50 text-amber-600 border-amber-100',
    [SessionStatus.APPROVED]: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    [SessionStatus.ACTIVE]: 'bg-blue-50 text-blue-600 border-blue-100',
    [SessionStatus.COMPLETED]: 'bg-slate-100 text-slate-600 border-slate-200',
    [SessionStatus.REJECTED]: 'bg-rose-50 text-rose-600 border-rose-100'
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${colors[status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
      {status}
    </span>
  );
};

export const ConditionBadge: React.FC<{ condition: ItemCondition }> = ({ condition }) => {
  const colors: Record<string, string> = {
    [ItemCondition.GOOD]: 'bg-green-50 text-green-600',
    [ItemCondition.DAMAGED]: 'bg-red-50 text-red-600',
    [ItemCondition.REPAIR]: 'bg-yellow-50 text-yellow-600'
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${colors[condition]}`}>
      {condition}
    </span>
  );
};

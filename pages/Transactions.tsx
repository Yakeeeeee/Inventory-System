
import React, { useState, useEffect, useRef } from 'react';
import { useInventoryStore } from '../store';
import { TransactionStatus, ItemCondition, Transaction, ItemStatus, BorrowSession, SessionStatus } from '../types';
import { ICONS } from '../constants';
import { StatusBadge } from '../components/StatusBadge';
import { Html5Qrcode } from 'html5-qrcode';

const Transactions: React.FC = () => {
  const { 
    transactions, items, sessions, 
    completeTransaction, updateItem, updateTransaction,
    createSession, addItemToSession, submitSessionForApproval,
    approveSession, rejectSession, releaseItemInSession, cancelSession, deleteSession,
    checkOverdueTransactions
  } = useInventoryStore();

  useEffect(() => {
    checkOverdueTransactions();
  }, []);
  
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [qrValue, setQrValue] = useState('');
  const [scannedItem, setScannedItem] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // New Workflow State
  const [currentSession, setCurrentSession] = useState<BorrowSession | null>(null);
  const [releasingSession, setReleasingSession] = useState<BorrowSession | null>(null);
  const [rejectingSession, setRejectingSession] = useState<BorrowSession | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  
  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilterType, setDateFilterType] = useState<'requested' | 'borrowed' | 'returned'>('requested');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'requestedDate', direction: 'desc' });
  
  // Simple Role Simulation
  const [userRole, setUserRole] = useState<'Admin' | 'Staff'>('Admin');
  
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const startScanner = async (containerId: string) => {
    setIsScannerActive(true);
    setErrorMessage(null);
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode(containerId);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { 
            fps: 15, 
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
              const qrboxSize = Math.floor(minEdge * 0.7);
              return { width: qrboxSize, height: qrboxSize };
            }
          },
          (decodedText) => {
            setQrValue(decodedText);
            stopScanner();
            handleScan(decodedText);
          },
          () => {}
        );
      } catch (err) {
        setIsScannerActive(false);
        setErrorMessage("Camera access denied or unavailable.");
      }
    }, 200);
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current = null;
      } catch (e) {
        console.error("Failed to stop scanner", e);
      }
    }
    setIsScannerActive(false);
  };

  const handleScan = (value?: string) => {
    setErrorMessage(null);
    const finalValue = (value || qrValue).trim();
    if (!finalValue) return;

    const item = items.find(i => i.qrCodeValue === finalValue || i.serialNumber === finalValue);
    
    if (item) {
      if (item.status === ItemStatus.BORROWED && isBorrowModalOpen) {
        setErrorMessage("This item is already marked as Borrowed. Please process a return first.");
        return;
      }
      if (item.status === ItemStatus.RESERVED && isBorrowModalOpen) {
        setErrorMessage("This item is already Reserved for another session.");
        return;
      }
      
      if (currentSession) {
        if (currentSession.itemIds.includes(item.id)) {
          setErrorMessage("This item is already added to the current session.");
          return;
        }
        addItemToSession(currentSession.id, item.id);
        setQrValue('');
        // Keep scanner active for multi-scan
      } else {
        setScannedItem(item);
      }
    } else {
      setErrorMessage("Equipment not found. Please try another Serial Number or QR Code.");
    }
  };

  const handleStartBorrowSession = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = Object.fromEntries(formData.entries());

    const session = createSession({
      borrowerName: data.borrowerName,
      borrowerIdNumber: data.borrowerId,
      department: data.department,
      contactNumber: data.contact,
      purpose: data.purpose,
      requestedDate: new Date().toISOString(),
      expectedReturnDate: data.dueDate,
    });

    setCurrentSession(session);
  };

  const handleSubmitSession = () => {
    if (!currentSession) return;
    if (currentSession.itemIds.length === 0) {
      setErrorMessage("Please scan at least one item before submitting.");
      return;
    }
    submitSessionForApproval(currentSession.id);
    setIsBorrowModalOpen(false);
    setCurrentSession(null);
    resetScanner();
  };

  const handleHandoverReservation = (tx: Transaction) => {
    const item = items.find(i => i.id === tx.itemId);
    if (!item) return;

    const updatedTx: Transaction = {
      ...tx,
      status: TransactionStatus.BORROWED,
      dateBorrowed: new Date().toISOString()
    };
    
    updateTransaction(updatedTx);
    updateItem({ ...item, status: ItemStatus.BORROWED });
  };

  const resetScanner = () => {
    setQrValue('');
    setScannedItem(null);
    setErrorMessage(null);
    stopScanner();
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const filteredTransactions = transactions.filter(tx => {
    const item = items.find(i => i.id === tx.itemId);
    const matchesSearch = 
      tx.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const isOverdue = tx.status === TransactionStatus.OVERDUE || (tx.status === TransactionStatus.BORROWED && new Date(tx.dueDate) < new Date());
    
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      if (statusFilter === 'Overdue') {
        matchesStatus = isOverdue;
      } else {
        matchesStatus = tx.status === statusFilter;
      }
    }
    
    return matchesSearch && matchesStatus;
  });

  const filteredSessions = sessions.filter(s => {
    const sessionItems = items.filter(i => s.itemIds.includes(i.id));
    const itemNames = sessionItems.map(i => i.name.toLowerCase()).join(' ');
    
    const matchesSearch = 
      s.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.sessionCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      itemNames.includes(searchTerm.toLowerCase());
    
    const isOverdue = s.status === SessionStatus.ACTIVE && new Date(s.expectedReturnDate) < new Date();
    
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      if (statusFilter === 'Overdue') {
        matchesStatus = isOverdue;
      } else {
        matchesStatus = s.status === statusFilter;
      }
    }

    let matchesDate = true;
    if (startDate || endDate) {
      let dateToCompare = '';
      if (dateFilterType === 'requested') dateToCompare = s.requestedDate;
      if (dateFilterType === 'borrowed') dateToCompare = s.dateReleased || '';
      if (dateFilterType === 'returned') dateToCompare = s.dateCompleted || '';
      
      if (dateToCompare) {
        const compareDate = new Date(dateToCompare);
        if (startDate && compareDate < new Date(startDate)) matchesDate = false;
        if (endDate && compareDate > new Date(endDate + 'T23:59:59')) matchesDate = false;
      } else {
        matchesDate = false;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const sortedSessions = [...filteredSessions].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    
    let valA: any = a[key as keyof BorrowSession];
    let valB: any = b[key as keyof BorrowSession];

    // Special handling for items count
    if (key === 'items') {
      valA = a.itemIds.length;
      valB = b.itemIds.length;
    }

    // Special handling for item names
    if (key === 'itemName') {
      valA = items.filter(i => a.itemIds.includes(i.id)).map(i => i.name).join(', ');
      valB = items.filter(i => b.itemIds.includes(i.id)).map(i => i.name).join(', ');
    }

    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const exportToCSV = () => {
    const headers = ['Session Code', 'Borrower', 'ID Number', 'Department', 'Purpose', 'Requested Date', 'Expected Return', 'Status', 'Items'];
    const rows = sortedSessions.map(s => [
      s.sessionCode,
      s.borrowerName,
      s.borrowerIdNumber,
      s.department,
      s.purpose,
      new Date(s.requestedDate).toLocaleDateString(),
      new Date(s.expectedReturnDate).toLocaleDateString(),
      s.status,
      s.itemIds.length
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const ErrorAlert = ({ message }: { message: string }) => (
    <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300 mb-4">
      <div className="text-rose-600 mt-0.5">{ICONS.Alert}</div>
      <div className="flex-1">
        <p className="text-sm font-bold text-rose-900 leading-tight">Action Required</p>
        <p className="text-xs text-rose-700 mt-1">{message}</p>
        <button onClick={() => setErrorMessage(null)} className="mt-3 text-[10px] font-black uppercase tracking-widest text-rose-600 hover:text-rose-800 transition-colors">Dismiss & Retry</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Equipment Borrowing</h1>
          <p className="text-slate-500">Manage multi-item sessions and individual returns</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-5 py-2.5 rounded-lg font-semibold hover:bg-slate-50 transition-all shadow-sm"
          >
            {ICONS.Download} Export Transactions
          </button>
          <button 
            onClick={() => setIsReturnModalOpen(true)}
            className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-5 py-2.5 rounded-lg font-semibold hover:bg-slate-50 transition-all shadow-sm"
          >
            {ICONS.QR} Quick Return
          </button>
          <button 
            onClick={() => setIsBorrowModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
          >
            {ICONS.Plus} New Borrow Session
          </button>
        </div>
      </header>

      {/* Procedure Guide */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-center gap-4">
          <div className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs">1</div>
          <p className="text-[10px] font-medium text-indigo-800 tracking-tight uppercase">Fill Borrower Form</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-center gap-4">
          <div className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs">2</div>
          <p className="text-[10px] font-medium text-indigo-800 tracking-tight uppercase">Scan Multiple Items</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-center gap-4">
          <div className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs">3</div>
          <p className="text-[10px] font-medium text-indigo-800 tracking-tight uppercase">Admin Approval</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-center gap-4">
          <div className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs">4</div>
          <p className="text-[10px] font-medium text-indigo-800 tracking-tight uppercase">Staff Release Scan</p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-3 flex items-center text-slate-400">
              {ICONS.Search}
            </div>
            <input 
              type="text" 
              placeholder="Search by borrower, item, or ID..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <select 
              className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value={SessionStatus.ACTIVE}>Active Loans</option>
              <option value={SessionStatus.PENDING_APPROVAL}>Pending Approval</option>
              <option value={SessionStatus.APPROVED}>Ready for Release</option>
              <option value={SessionStatus.RELEASED}>Released</option>
              <option value={SessionStatus.COMPLETED}>Completed</option>
              <option value={SessionStatus.CANCELLED}>Cancelled</option>
              <option value={SessionStatus.REJECTED}>Rejected</option>
              <option value="Overdue">Overdue Items</option>
            </select>
            
            {(searchTerm || statusFilter !== 'all' || startDate || endDate) && (
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 underline"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 pt-4 border-t border-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Filter By:</span>
            <select 
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={dateFilterType}
              onChange={(e) => setDateFilterType(e.target.value as any)}
            >
              <option value="requested">Requested Date</option>
              <option value="borrowed">Borrowed Date</option>
              <option value="returned">Returned Date</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">From:</span>
            <input 
              type="date" 
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">To:</span>
            <input 
              type="date" 
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          
          <div className="flex-1 flex justify-end items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Role:</span>
            <select 
              className="bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none"
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as any)}
            >
              <option value="Admin">Admin (Full Access)</option>
              <option value="Staff">Staff (Release/Return Only)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-bold text-slate-900">Active Sessions & History</h2>
          <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded-full">
            {filteredSessions.length} Sessions Found
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold">
              <tr>
                <th className="px-6 py-4 w-10"></th>
                <th className="px-6 py-4 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleSort('sessionCode')}>
                  Session {sortConfig?.key === 'sessionCode' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleSort('borrowerName')}>
                  Borrower {sortConfig?.key === 'borrowerName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleSort('itemName')}>
                  Items {sortConfig?.key === 'itemName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleSort('status')}>
                  Status {sortConfig?.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleSort('requestedDate')}>
                  Requested {sortConfig?.key === 'requestedDate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleSort('expectedReturnDate')}>
                  Due Date {sortConfig?.key === 'expectedReturnDate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {sortedSessions.map(session => {
                const isSessionOverdue = session.status === SessionStatus.ACTIVE && new Date(session.expectedReturnDate) < new Date();
                return (
                  <React.Fragment key={session.id}>
                    <tr className={`hover:bg-slate-50 transition-colors ${expandedSessionId === session.id ? 'bg-slate-50/50' : ''} ${isSessionOverdue ? 'bg-rose-50/30' : ''}`}>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => setExpandedSessionId(expandedSessionId === session.id ? null : session.id)}
                          className="text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          {expandedSessionId === session.id ? '▼' : '▶'}
                        </button>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-indigo-600">
                        {session.sessionCode}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{session.borrowerName}</p>
                        <p className="text-xs text-slate-500">{session.borrowerIdNumber}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold text-slate-600">
                          {session.itemIds.length} Items
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <StatusBadge status={session.status} />
                          {isSessionOverdue && (
                            <span className="text-[10px] font-black text-rose-600 uppercase tracking-tighter flex items-center gap-1">
                              {ICONS.Alert} OVERDUE
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        <div className="flex flex-col">
                          <span>{new Date(session.requestedDate).toLocaleDateString()}</span>
                          {session.dateReleased && (
                            <span className="text-[10px] text-indigo-500 font-medium">Rel: {new Date(session.dateReleased).toLocaleDateString()}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        <span className={`font-bold ${isSessionOverdue ? 'text-rose-600' : ''}`}>
                          {new Date(session.expectedReturnDate).toLocaleDateString()}
                        </span>
                      </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {session.status === SessionStatus.PENDING_SCANNING && (
                          <>
                            <button 
                              onClick={() => { setCurrentSession(session); setIsBorrowModalOpen(true); }}
                              className="bg-indigo-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-indigo-700 shadow-sm"
                            >
                              RESUME
                            </button>
                            <button 
                              onClick={() => { if (confirm('Cancel this session?')) cancelSession(session.id); }}
                              className="bg-rose-50 text-rose-600 px-3 py-1 rounded text-xs font-bold hover:bg-rose-100"
                            >
                              CANCEL
                            </button>
                          </>
                        )}
                        {session.status === SessionStatus.PENDING_APPROVAL && userRole === 'Admin' && (
                          <>
                            <button 
                              onClick={() => { setCurrentSession(session); setIsBorrowModalOpen(true); }}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit Request"
                            >
                              {ICONS.Edit}
                            </button>
                            <button 
                              onClick={() => approveSession(session.id)}
                              className="bg-emerald-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-emerald-700 shadow-sm"
                            >
                              APPROVE
                            </button>
                            <button 
                              onClick={() => { setRejectingSession(session); setIsRejectModalOpen(true); }}
                              className="bg-rose-50 text-rose-600 px-3 py-1 rounded text-xs font-bold hover:bg-rose-100"
                            >
                              REJECT
                            </button>
                          </>
                        )}
                        {session.status === SessionStatus.APPROVED && (
                          <button 
                            onClick={() => { setReleasingSession(session); setIsReleaseModalOpen(true); }}
                            className="bg-indigo-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-indigo-700 shadow-sm"
                          >
                            RELEASE
                          </button>
                        )}
                        {(session.status === SessionStatus.ACTIVE || session.status === SessionStatus.RELEASED) && (
                          <button 
                            onClick={() => { setExpandedSessionId(session.id); }}
                            className="text-indigo-600 text-xs font-bold hover:underline"
                          >
                            MANAGE ITEMS
                          </button>
                        )}
                        {(session.status === SessionStatus.COMPLETED || session.status === SessionStatus.CANCELLED) && (
                          <>
                            {deletingSessionId === session.id ? (
                              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Confirm?</span>
                                <button 
                                  onClick={() => { deleteSession(session.id); setDeletingSessionId(null); }}
                                  className="bg-rose-600 text-white px-2 py-1 rounded text-[10px] font-bold hover:bg-rose-700"
                                >
                                  YES
                                </button>
                                <button 
                                  onClick={() => setDeletingSessionId(null)}
                                  className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-bold hover:bg-slate-200"
                                >
                                  NO
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => setDeletingSessionId(session.id)}
                                className="text-rose-600 text-xs font-bold hover:underline"
                              >
                                DELETE
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedSessionId === session.id && (
                    <tr className="bg-slate-50/30">
                      <td colSpan={8} className="px-12 py-4">
                        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                          {session.status === SessionStatus.REJECTED && session.rejectionReason && (
                            <div className="bg-rose-50 p-4 border-b border-rose-100">
                              <p className="text-xs font-bold text-rose-800 uppercase mb-1">Rejection Reason</p>
                              <p className="text-sm text-rose-600 italic">"{session.rejectionReason}"</p>
                            </div>
                          )}
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                              <tr>
                                <th className="px-4 py-2">Equipment</th>
                                <th className="px-4 py-2">Serial Number</th>
                                <th className="px-4 py-2">Status</th>
                                <th className="px-4 py-2 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {session.itemIds.map(itemId => {
                                const item = items.find(i => i.id === itemId);
                                const sessionTx = transactions.find(t => t.itemId === itemId && t.googleFormReferenceId === session.sessionCode);
                                const isReleased = session.releasedItemIds?.includes(itemId);
                                return (
                                  <tr key={itemId}>
                                    <td className="px-4 py-3 font-medium text-slate-900">{item?.name}</td>
                                    <td className="px-4 py-3 font-mono text-slate-500">{item?.serialNumber}</td>
                                    <td className="px-4 py-3">
                                      <div className="flex flex-col gap-1">
                                        <StatusBadge status={isReleased ? TransactionStatus.BORROWED : (sessionTx?.status || item?.status || ItemStatus.AVAILABLE)} />
                                        {sessionTx?.status === TransactionStatus.RETURNED && sessionTx.returnRemarks && (
                                          <p className="text-[10px] text-slate-500 italic max-w-[150px] truncate" title={sessionTx.returnRemarks}>
                                            "{sessionTx.returnRemarks}"
                                          </p>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      <div className="flex flex-col items-end gap-2">
                                        <div className="flex gap-2">
                                            {sessionTx?.status === TransactionStatus.BORROWED && (
                                              <button 
                                                onClick={() => {
                                                  setIsReturnModalOpen(true);
                                                  setQrValue(item?.qrCodeValue || '');
                                                  handleScan(item?.qrCodeValue);
                                                }}
                                                className="text-indigo-600 font-bold hover:underline"
                                              >
                                                RETURN
                                              </button>
                                            )}
                                            {!isReleased && session.status === SessionStatus.APPROVED && (
                                              <span className="text-[10px] text-amber-600 font-bold uppercase">Awaiting Release</span>
                                            )}
                                        </div>
                                        
                                          {/* Item History Snippet */}
                                          <div className="mt-2 text-left w-full border-t border-slate-50 pt-2">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">
                                              {sessionTx?.status === TransactionStatus.RETURNED ? 'Previous Borrowers' : 'Recent History'}
                                            </p>
                                            <div className="space-y-1">
                                              {transactions
                                                .filter(t => t.itemId === itemId && t.status === TransactionStatus.RETURNED && t.id !== sessionTx?.id)
                                                .sort((a, b) => new Date(b.dateReturned || '').getTime() - new Date(a.dateReturned || '').getTime())
                                                .slice(0, 2)
                                                .map(prevTx => (
                                                  <div key={prevTx.id} className="bg-slate-50 p-1.5 rounded flex justify-between items-center text-[10px]">
                                                    <span className="text-slate-600 font-medium">{prevTx.borrowerName}</span>
                                                    <span className="text-slate-400">{new Date(prevTx.dateReturned || '').toLocaleDateString()}</span>
                                                  </div>
                                                ))
                                              }
                                              {transactions.filter(t => t.itemId === itemId && t.status === TransactionStatus.RETURNED && t.id !== sessionTx?.id).length === 0 && (
                                                <p className="text-[9px] text-slate-400 italic">No previous records</p>
                                              )}
                                            </div>
                                          </div>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
              {filteredSessions.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400 italic">
                    No sessions found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Session Modal */}
      {isRejectModalOpen && rejectingSession && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-rose-50">
              <h3 className="font-bold text-rose-900 flex items-center gap-2">
                {ICONS.X} Reject Session
              </h3>
              <button onClick={() => setIsRejectModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                {ICONS.X}
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-rose-50/50 p-4 rounded-lg border border-rose-100">
                <p className="text-sm text-rose-800 font-medium">Session: {rejectingSession.sessionCode}</p>
                <p className="text-xs text-rose-600">Borrower: {rejectingSession.borrowerName}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Rejection Reason</label>
                <textarea 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-sm"
                  rows={4}
                  placeholder="Explain why this request is being rejected..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setIsRejectModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    rejectSession(rejectingSession.id, rejectionReason);
                    setIsRejectModalOpen(false);
                    setRejectionReason('');
                  }}
                  disabled={!rejectionReason.trim()}
                  className="flex-1 px-4 py-2.5 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all shadow-md shadow-rose-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Release Scanning Modal */}
      {isReleaseModalOpen && releasingSession && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
              <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                {ICONS.Package} Release Items: {releasingSession.sessionCode}
              </h3>
              <button onClick={() => setIsReleaseModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                {ICONS.X}
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Borrower Details</p>
                  <p className="font-bold text-slate-900">{releasingSession.borrowerName}</p>
                  <p className="text-xs text-slate-500">{releasingSession.borrowerIdNumber}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase">Items to Release</p>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {releasingSession.itemIds.map(itemId => {
                      const item = items.find(i => i.id === itemId);
                      const isReleased = releasingSession.releasedItemIds?.includes(itemId);
                      return (
                        <div key={itemId} className={`p-3 rounded-lg border transition-all flex justify-between items-center ${isReleased ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
                          <div>
                            <p className={`font-bold text-sm ${isReleased ? 'text-emerald-700' : 'text-slate-700'}`}>{item?.name}</p>
                            <p className="text-[10px] font-mono text-slate-500">{item?.serialNumber}</p>
                          </div>
                          {isReleased ? (
                            <span className="text-emerald-600">{ICONS.Check}</span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">PENDING</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-900 rounded-xl overflow-hidden aspect-square relative">
                  {isScannerActive ? (
                    <div id="release-scanner" className="w-full h-full"></div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center">
                      <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400">
                        {ICONS.Camera}
                      </div>
                      <p className="text-sm font-medium">Scanner Inactive</p>
                      <button 
                        onClick={() => {
                          setIsScannerActive(true);
                          setTimeout(() => startScanner('release-scanner'), 100);
                        }}
                        className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all"
                      >
                        Start Scanner
                      </button>
                    </div>
                  )}
                  {isScannerActive && (
                    <button 
                      onClick={stopScanner}
                      className="absolute top-4 right-4 bg-rose-600 text-white p-2 rounded-full shadow-lg hover:bg-rose-700 z-10"
                    >
                      {ICONS.X}
                    </button>
                  )}
                </div>

                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Or enter serial number manually..."
                    className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                    value={qrValue}
                    onChange={(e) => setQrValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const item = items.find(i => i.serialNumber === qrValue || i.qrCodeValue === qrValue);
                        if (item && releasingSession.itemIds.includes(item.id)) {
                          releaseItemInSession(releasingSession.id, item.id);
                          setQrValue('');
                          setErrorMessage(null);
                        } else {
                          setErrorMessage('Item not found in this session');
                        }
                      }
                    }}
                  />
                  <button 
                    onClick={() => {
                      const item = items.find(i => i.serialNumber === qrValue || i.qrCodeValue === qrValue);
                      if (item && releasingSession.itemIds.includes(item.id)) {
                        releaseItemInSession(releasingSession.id, item.id);
                        setQrValue('');
                        setErrorMessage(null);
                      } else {
                        setErrorMessage('Item not found in this session');
                      }
                    }}
                    className="absolute right-2 top-2 p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    {ICONS.Check}
                  </button>
                </div>
                {errorMessage && (
                  <p className="text-xs text-rose-600 font-medium animate-bounce">{errorMessage}</p>
                )}
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <p className="text-xs text-slate-500 font-medium">
                {releasingSession.releasedItemIds?.length || 0} of {releasingSession.itemIds.length} items released
              </p>
              <button 
                onClick={() => setIsReleaseModalOpen(false)}
                className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-all shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {isBorrowModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">New Borrow Session</h2>
                <p className="text-xs text-slate-500">
                  {!currentSession ? 'Step 1: Borrower Information' : 'Step 2: Scan Equipment'}
                </p>
              </div>
              <button onClick={() => { 
                if (currentSession && currentSession.itemIds.length > 0) {
                  if (confirm('Cancel this session and release scanned items?')) {
                    cancelSession(currentSession.id);
                    setIsBorrowModalOpen(false);
                    resetScanner();
                    setCurrentSession(null);
                  }
                } else if (currentSession) {
                  cancelSession(currentSession.id);
                  setIsBorrowModalOpen(false);
                  resetScanner();
                  setCurrentSession(null);
                } else {
                  setIsBorrowModalOpen(false); 
                  resetScanner(); 
                  setCurrentSession(null);
                }
              }} className="text-slate-400 text-2xl hover:text-slate-600">&times;</button>
            </div>
            
            <div className="p-6">
              {errorMessage && <ErrorAlert message={errorMessage} />}
              
              {!currentSession ? (
                <form onSubmit={handleStartBorrowSession} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Borrower Full Name</label>
                      <input required name="borrowerName" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" placeholder="e.g. John Doe" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Student / Staff ID</label>
                      <input required name="borrowerId" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" placeholder="ID Number" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Department</label>
                      <input required name="department" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" placeholder="e.g. IT, Arts" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Contact Number</label>
                      <input required name="contact" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" placeholder="Phone/Email" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Expected Return</label>
                      <input required type="date" name="dueDate" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" defaultValue={new Date(Date.now() + 86400000).toISOString().split('T')[0]} />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Purpose of Borrowing</label>
                      <textarea required name="purpose" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" placeholder="Project name, event, etc." />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                    <button type="button" onClick={() => {
                      if (currentSession) cancelSession(currentSession.id);
                      setIsBorrowModalOpen(false);
                      setCurrentSession(null);
                    }} className="px-6 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors">Cancel</button>
                    <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">Start Scanning</button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Active Session</p>
                        <p className="font-bold text-slate-900">{currentSession.sessionCode}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Items Scanned</p>
                        <p className="font-bold text-indigo-600 text-xl">{currentSession.itemIds.length}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {currentSession.itemIds.map(id => {
                        const item = items.find(i => i.id === id);
                        return (
                          <span key={id} className="bg-white border border-indigo-200 px-2 py-1 rounded text-[10px] font-bold text-indigo-700">
                            {item?.serialNumber}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {isScannerActive ? (
                    <div className="relative overflow-hidden rounded-xl bg-black aspect-square max-w-sm mx-auto shadow-inner">
                      <div id="scanner-container-borrow" className="w-full h-full"></div>
                      <div className="scanner-line"></div>
                      <button onClick={stopScanner} className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg text-sm font-bold border border-white/30 hover:bg-white/30 transition-all z-20">Cancel Camera</button>
                    </div>
                  ) : (
                    <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center">
                      <div className="bg-indigo-600 p-4 rounded-full text-white mb-4 animate-pulse">{ICONS.QR}</div>
                      <p className="font-bold text-slate-900 mb-1">Scan Next Item</p>
                      <p className="text-slate-500 text-xs mb-6 text-center">Scan QR codes one by one to add to this session</p>
                      <div className="flex w-full gap-2 mb-4">
                        <input className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-mono text-center uppercase text-xl tracking-widest focus:ring-4 focus:ring-indigo-100 outline-none" placeholder="SERIAL NUMBER" autoFocus value={qrValue} onChange={(e) => setQrValue(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === 'Enter' && handleScan()} />
                        <button onClick={() => startScanner('scanner-container-borrow')} className="bg-slate-100 text-slate-600 p-4 rounded-xl hover:bg-slate-200 transition-colors">{ICONS.Camera}</button>
                      </div>
                      <div className="grid grid-cols-2 w-full gap-3">
                        <button onClick={() => handleScan()} className="bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all">Add Item</button>
                        <button onClick={handleSubmitSession} className="bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">Finish & Submit</button>
                      </div>
                      <button 
                        onClick={() => {
                          if (confirm('Cancel this session and release scanned items?')) {
                            cancelSession(currentSession.id);
                            setIsBorrowModalOpen(false);
                            setCurrentSession(null);
                            resetScanner();
                          }
                        }}
                        className="w-full mt-3 text-xs text-rose-600 font-bold hover:underline"
                      >
                        Cancel Entire Session
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Return Equipment</h2>
              <button onClick={() => { setIsReturnModalOpen(false); resetScanner(); }} className="text-slate-400 text-2xl hover:text-slate-600">&times;</button>
            </div>
            <div className="p-6">
              {errorMessage && <ErrorAlert message={errorMessage} />}
              {!scannedItem ? (
                <div className="flex flex-col items-center">
                  {isScannerActive ? (
                    <div className="relative overflow-hidden rounded-xl bg-black aspect-square w-full max-w-sm mx-auto shadow-inner">
                      <div id="scanner-container-return" className="w-full h-full"></div>
                      <div className="scanner-line"></div>
                      <button onClick={stopScanner} className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg text-sm font-bold border border-white/30 hover:bg-white/30 transition-all z-20">Cancel Camera</button>
                    </div>
                  ) : (
                    <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 w-full flex flex-col items-center">
                      <div className="bg-emerald-600 p-4 rounded-full text-white mb-4">{ICONS.QR}</div>
                      <p className="font-bold text-slate-900 mb-4">Scan QR to Return</p>
                      <div className="flex w-full gap-2 mb-4">
                        <input className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-mono text-center uppercase tracking-widest text-xl focus:ring-4 focus:ring-emerald-100 outline-none" placeholder="SERIAL NUMBER" autoFocus value={qrValue} onChange={(e) => setQrValue(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === 'Enter' && handleScan()} />
                        <button onClick={() => startScanner('scanner-container-return')} className="bg-slate-100 text-slate-600 p-4 rounded-xl hover:bg-slate-200 transition-colors">{ICONS.Camera}</button>
                      </div>
                      <button onClick={() => handleScan()} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all">Process Return</button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase">Receiving Item</p>
                      <p className="font-bold text-slate-900 text-lg">{scannedItem.name}</p>
                      <p className="text-xs text-slate-600 font-mono">SN: {scannedItem.serialNumber}</p>
                    </div>
                    <button type="button" onClick={resetScanner} className="text-xs text-emerald-600 underline font-bold hover:text-emerald-800 transition-colors">Rescan</button>
                  </div>
                  {(() => {
                    const activeTx = transactions.find(t => t.itemId === scannedItem.id && t.status === TransactionStatus.BORROWED);
                    if (!activeTx) return (
                      <div className="p-4 bg-rose-50 text-rose-700 rounded-lg text-sm font-medium">
                        No active loan record found.
                        <button onClick={resetScanner} className="block mt-2 underline font-bold hover:text-rose-900 transition-colors">Try another scan</button>
                      </div>
                    );
                    return (
                      <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-xl">
                          <p className="text-xs text-slate-500 mb-1">Currently with</p>
                          <p className="font-bold text-slate-900">{activeTx.borrowerName}</p>
                          <p className="text-xs text-slate-500">ID: {activeTx.borrowerIdNumber}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Return Condition</label>
                          <div className="flex gap-2">
                            {Object.values(ItemCondition).map(cond => (
                              <button key={cond} type="button" onClick={() => setScannedItem({...scannedItem, condition: cond})} className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${scannedItem.condition === cond ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'}`}>{cond}</button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Return Notes</label>
                          <textarea id="returnRemarks" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" placeholder="Is the item okay?" />
                        </div>
                        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                          <button onClick={() => { setIsReturnModalOpen(false); resetScanner(); }} className="px-6 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors">Cancel</button>
                          <button onClick={() => {
                              const remarks = (document.getElementById('returnRemarks') as HTMLTextAreaElement).value;
                              completeTransaction(activeTx.id, scannedItem.condition, remarks);
                              setIsReturnModalOpen(false);
                              resetScanner();
                            }} className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all">Finalize Return</button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;

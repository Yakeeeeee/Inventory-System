
import React, { useState, useEffect } from 'react';
import { useInventoryStore } from '../store';
import { ItemStatus, ItemCondition, EquipmentItem, TransactionStatus, Transaction } from '../types';
import { ICONS, getQRImageUrl } from '../constants';
import { StatusBadge, ConditionBadge } from '../components/StatusBadge';
import { QRCodeCanvas } from 'qrcode.react';

const Inventory: React.FC = () => {
  const { items, categories, transactions, addItem, updateItem, deleteItem, addTransaction } = useInventoryStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [qrViewItem, setQrViewItem] = useState<EquipmentItem | null>(null);
  const [editingItem, setEditingItem] = useState<EquipmentItem | null>(null);
  const [borrowingItem, setBorrowingItem] = useState<EquipmentItem | null>(null);
  const [reservingItem, setReservingItem] = useState<EquipmentItem | null>(null);
  const [historyItem, setHistoryItem] = useState<EquipmentItem | null>(null);
  const [liveSerialNumber, setLiveSerialNumber] = useState('');

  useEffect(() => {
    if (editingItem) {
      setLiveSerialNumber(editingItem.serialNumber);
    } else {
      setLiveSerialNumber('');
    }
  }, [editingItem, isModalOpen]);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.categoryId === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getItemHistory = (itemId: string) => {
    return transactions
      .filter(t => t.itemId === itemId)
      .sort((a, b) => new Date(b.dateRequested).getTime() - new Date(a.dateRequested).getTime());
  };

  const getLastBorrower = (itemId: string) => {
    const history = getItemHistory(itemId);
    return history.length > 0 ? history[0] : null;
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = Object.fromEntries(formData.entries());
    
    if (editingItem) {
      updateItem({ ...editingItem, ...data, qrCodeValue: data.serialNumber });
    } else {
      const newItem: EquipmentItem = {
        ...data,
        id: `item-${Date.now()}`,
        qrCodeValue: data.serialNumber,
        dateAdded: new Date().toISOString()
      };
      addItem(newItem);
    }
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleTransactionSubmit = (e: React.FormEvent<HTMLFormElement>, isReservation: boolean) => {
    e.preventDefault();
    const targetItem = isReservation ? reservingItem : borrowingItem;
    if (!targetItem) return;
    
    const formData = new FormData(e.currentTarget);
    const data: any = Object.fromEntries(formData.entries());

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      itemId: targetItem.id,
      borrowerName: data.borrowerName,
      borrowerIdNumber: data.borrowerId,
      contactNumber: data.contact || '',
      dateRequested: new Date().toISOString(),
      dateBorrowed: isReservation ? undefined : new Date().toISOString(),
      dueDate: data.dueDate,
      status: isReservation ? TransactionStatus.RESERVED : TransactionStatus.BORROWED,
      conditionOnRelease: targetItem.condition,
      remarks: data.remarks,
      googleFormReferenceId: ''
    };

    addTransaction(newTx);
    setBorrowingItem(null);
    setReservingItem(null);
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateStr));
  };

  const handlePrintQR = () => {
    const printContent = document.getElementById('printable-qr');
    if (!printContent) return;
    const windowUrl = 'about:blank';
    const uniqueName = new Date().getTime();
    const windowName = 'Print' + uniqueName;
    const printWindow = window.open(windowUrl, windowName, 'left=50000,top=50000,width=0,height=0');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print QR Label</title>
            <style>
              body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              img { width: 300px; height: 300px; border: 1px solid #eee; margin-bottom: 20px; }
              .label { text-align: center; font-size: 24px; font-weight: bold; }
              .sublabel { text-align: center; font-size: 16px; color: #666; margin-top: 5px; }
            </style>
          </head>
          <body>
            <img src="${getQRImageUrl(qrViewItem?.qrCodeValue || '')}" />
            <div class="label">${qrViewItem?.name}</div>
            <div class="sublabel">S/N: ${qrViewItem?.serialNumber}</div>
            <script>
              window.onload = function() { window.print(); window.close(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Equipment Inventory</h1>
          <p className="text-slate-500">Manage serialized assets and track borrowing history</p>
        </div>
        <button 
          onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
        >
          {ICONS.Plus} Add New Item
        </button>
      </header>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-3 flex items-center text-slate-400">
            {ICONS.Search}
          </div>
          <input 
            type="text" 
            placeholder="Search by name or serial number..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold">
              <tr>
                <th className="px-6 py-4">Item Details</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Last User</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredItems.map(item => {
                const lastTx = getLastBorrower(item.id);
                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setQrViewItem(item)}
                          className="bg-white border border-slate-200 p-2 rounded-lg group-hover:bg-indigo-50 group-hover:border-indigo-200 transition-all shadow-sm"
                          title="View QR Code"
                        >
                          {ICONS.QR}
                        </button>
                        <div>
                          <p className="font-bold text-slate-900 uppercase tracking-tight">{item.name}</p>
                          <p className="text-xs text-slate-500">SN: <span className="font-mono">{item.serialNumber}</span></p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {categories.find(c => c.id === item.categoryId)?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <StatusBadge status={item.status} />
                        <ConditionBadge condition={item.condition} />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {lastTx ? (
                        <div className="max-w-[150px]">
                          <p className="font-semibold text-slate-800 truncate">{lastTx.borrowerName}</p>
                          <p className="text-[10px] text-slate-400">{formatDateTime(lastTx.dateBorrowed || lastTx.dateRequested)}</p>
                        </div>
                      ) : (
                        <span className="text-slate-300 italic text-xs">No records</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => setHistoryItem(item)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View Borrowing History"
                        >
                          {ICONS.Transactions}
                        </button>
                        {item.status === ItemStatus.AVAILABLE && (
                          <button 
                            onClick={() => setBorrowingItem(item)}
                            className="p-2 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Quick Borrow"
                          >
                            {ICONS.Borrow}
                          </button>
                        )}
                        <button 
                          onClick={() => { setEditingItem(item); setIsModalOpen(true); }}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Item Info"
                        >
                          {ICONS.Edit}
                        </button>
                        <button 
                          onClick={() => deleteItem(item.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Archive Item"
                        >
                          {ICONS.Trash}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    No items found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Item History Modal */}
      {historyItem && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Borrowing History</h2>
                <p className="text-xs text-slate-500 font-medium">{historyItem.name} (SN: {historyItem.serialNumber})</p>
              </div>
              <button onClick={() => setHistoryItem(null)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {getItemHistory(historyItem.id).length > 0 ? (
                <div className="space-y-6">
                  {getItemHistory(historyItem.id).map((tx, idx) => (
                    <div key={tx.id} className="relative pl-8 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-0.5 before:bg-slate-100 last:before:hidden">
                      <div className={`absolute left-[-4px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${tx.status === TransactionStatus.RETURNED ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                          <div>
                            <p className="font-bold text-slate-900">{tx.borrowerName}</p>
                            <p className="text-xs text-slate-500">ID: {tx.borrowerIdNumber}</p>
                          </div>
                          <div className="text-right">
                            <StatusBadge status={tx.status} />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="text-slate-400 font-bold uppercase tracking-wider mb-1">Out Details</p>
                            <p className="text-slate-700 font-medium">Date: {formatDateTime(tx.dateBorrowed || tx.dateRequested)}</p>
                            <p className="text-slate-700">Release Cond: <ConditionBadge condition={tx.conditionOnRelease} /></p>
                          </div>
                          <div>
                            <p className="text-slate-400 font-bold uppercase tracking-wider mb-1">Return Details</p>
                            <p className="text-slate-700 font-medium">Date: {tx.dateReturned ? formatDateTime(tx.dateReturned) : 'Still in use'}</p>
                            {tx.conditionOnReturn && <p className="text-slate-700">Return Cond: <ConditionBadge condition={tx.conditionOnReturn} /></p>}
                          </div>
                        </div>
                        {tx.remarks && (
                          <div className="mt-3 pt-3 border-t border-slate-200/50">
                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Logs & Remarks</p>
                            <p className="text-xs text-slate-600 italic">"{tx.remarks}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    {ICONS.Transactions}
                  </div>
                  <p>No borrowing history found for this item.</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button onClick={() => setHistoryItem(null)} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors">Close Log</button>
            </div>
          </div>
        </div>
      )}

      {/* Borrow / Reserve Modal */}
      {(borrowingItem || reservingItem) && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`px-6 py-4 border-b border-slate-100 ${reservingItem ? 'bg-amber-50' : 'bg-indigo-50'} flex items-center justify-between`}>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{reservingItem ? 'Reserve Equipment' : 'Borrow Equipment'}</h2>
                <p className={`text-xs ${reservingItem ? 'text-amber-600' : 'text-indigo-600'} font-medium`}>
                  {reservingItem ? 'Create a future booking' : 'Immediate handover procedure'}
                </p>
              </div>
              <button onClick={() => { setBorrowingItem(null); setReservingItem(null); }} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
            </div>
            <form onSubmit={(e) => handleTransactionSubmit(e, !!reservingItem)} className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-4 mb-4">
                <div className={`bg-white p-2 rounded-lg ${reservingItem ? 'text-amber-600' : 'text-indigo-600'} shadow-sm`}>
                  {ICONS.Inventory}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selected Equipment</p>
                  <p className="font-bold text-slate-900">{(reservingItem || borrowingItem)?.name}</p>
                  <p className="text-xs text-slate-500 font-mono">SN: {(reservingItem || borrowingItem)?.serialNumber}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Borrower Full Name</label>
                  <input required name="borrowerName" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" placeholder="e.g. John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">ID / Badge Number</label>
                  <input required name="borrowerId" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" placeholder="ID Number" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{reservingItem ? 'Target Pickup Date' : 'Due Date'}</label>
                  <input required type="date" name="dueDate" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" defaultValue={new Date(Date.now() + 86400000).toISOString().split('T')[0]} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Purpose / Remarks</label>
                  <textarea name="remarks" rows={2} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" placeholder="Reason for this request..." />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => { setBorrowingItem(null); setReservingItem(null); }} className="px-6 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium">Cancel</button>
                <button type="submit" className={`px-6 py-2 ${reservingItem ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-100' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'} text-white rounded-lg font-bold shadow-lg`}>
                  {reservingItem ? 'Confirm Reservation' : 'Confirm Borrowing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code View Modal */}
      {qrViewItem && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-sm:max-w-xs max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900">Equipment QR Code</h2>
              <button onClick={() => setQrViewItem(null)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
            </div>
            <div className="p-8 flex flex-col items-center gap-6" id="printable-qr">
              <div className="bg-white p-4 border border-slate-100 rounded-2xl shadow-inner">
                <QRCodeCanvas 
                  value={qrViewItem.qrCodeValue} 
                  size={200}
                  includeMargin={true}
                  className="block"
                />
              </div>
              <div className="text-center">
                <p className="font-bold text-xl text-slate-900 mb-1">{qrViewItem.name}</p>
                <p className="text-slate-500 font-mono text-sm tracking-wider uppercase">SN: {qrViewItem.serialNumber}</p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={handlePrintQR}
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
              >
                {ICONS.Print} Print Label
              </button>
              <button 
                onClick={() => setQrViewItem(null)}
                className="flex-1 bg-white border border-slate-200 text-slate-700 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal (Edit/Add) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-xl font-bold text-slate-900">{editingItem ? 'Edit Equipment' : 'Add Equipment'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 flex flex-col md:flex-row gap-6 items-start">
                  <div className="flex-1 space-y-4 w-full">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Item Name</label>
                      <input required name="name" defaultValue={editingItem?.name} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" placeholder="e.g. Sony Alpha A7" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Serial Number</label>
                      <input 
                        required 
                        name="serialNumber" 
                        defaultValue={editingItem?.serialNumber} 
                        onChange={(e) => setLiveSerialNumber(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" 
                        placeholder="Unique S/N" 
                      />
                    </div>
                  </div>
                  
                  <div className="w-full md:w-auto flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Live QR Preview</p>
                    <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100">
                      {liveSerialNumber ? (
                        <QRCodeCanvas value={liveSerialNumber} size={100} />
                      ) : (
                        <div className="w-[100px] h-[100px] flex items-center justify-center text-slate-300 italic text-[10px] text-center px-2">
                          Enter S/N to generate
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-[10px] font-mono text-slate-500 truncate max-w-[120px]">
                      {liveSerialNumber || 'NO DATA'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
                  <select name="categoryId" defaultValue={editingItem?.categoryId} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none">
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Location</label>
                  <input name="location" defaultValue={editingItem?.location} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" placeholder="Rack / Room" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                  <select name="status" defaultValue={editingItem?.status || ItemStatus.AVAILABLE} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none">
                    {Object.values(ItemStatus).map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Notes</label>
                  <textarea name="notes" defaultValue={editingItem?.notes} rows={3} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" placeholder="Additional details..." />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700">Save Equipment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;

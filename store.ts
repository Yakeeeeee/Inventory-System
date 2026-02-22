
import { useState, useEffect } from 'react';
import { EquipmentItem, Category, Transaction, MaintenanceLog, AuditLog, ItemStatus, ItemCondition, TransactionStatus, BorrowSession, SessionStatus } from './types';
import { MOCK_CATEGORIES } from './constants';

const STORAGE_KEY = 'qr_inventory_data_v8';

interface AppState {
  items: EquipmentItem[];
  categories: Category[];
  transactions: Transaction[];
  maintenance: MaintenanceLog[];
  logs: AuditLog[];
  sessions: BorrowSession[];
}

const getInitialData = (): AppState => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);
  
  return {
    items: [
      {
        id: 'item-proj-1',
        categoryId: 'cat-proj',
        name: 'Epson EB-X06 Projector',
        serialNumber: 'PROJ-EPS-001',
        qrCodeValue: 'PROJ-EPS-001',
        status: ItemStatus.AVAILABLE,
        condition: ItemCondition.DAMAGED,
        location: 'AV Storage Room 101',
        dateAdded: '2023-10-01',
        notes: '3600 Lumens, HDMI. Note: Recently returned with lens issue.'
      },
      {
        id: 'item-proj-2',
        categoryId: 'cat-proj',
        name: 'BenQ MH560 Business Projector',
        serialNumber: 'PROJ-BNQ-002',
        qrCodeValue: 'PROJ-BNQ-002',
        status: ItemStatus.BORROWED,
        condition: ItemCondition.GOOD,
        location: 'AV Storage Room 101',
        dateAdded: '2023-10-15',
        notes: '1080p, High Contrast'
      },
      {
        id: 'item-lap-1',
        categoryId: 'cat-lap',
        name: 'Dell Latitude 5420',
        serialNumber: 'LAP-DEL-102',
        qrCodeValue: 'LAP-DEL-102',
        status: ItemStatus.BORROWED,
        condition: ItemCondition.GOOD,
        location: 'IT Office Rack A',
        dateAdded: '2023-11-05',
        notes: 'Intel i5, 16GB RAM'
      },
      {
        id: 'item-lap-2',
        categoryId: 'cat-lap',
        name: 'MacBook Air M2',
        serialNumber: 'LAP-APL-105',
        qrCodeValue: 'LAP-APL-105',
        status: ItemStatus.BORROWED,
        condition: ItemCondition.GOOD,
        location: 'IT Office Rack A',
        dateAdded: '2023-11-10',
        notes: 'Silver, 256GB SSD'
      },
      {
        id: 'item-lap-3',
        categoryId: 'cat-lap',
        name: 'HP EliteBook 840',
        serialNumber: 'LAP-HP-108',
        qrCodeValue: 'LAP-HP-108',
        status: ItemStatus.AVAILABLE,
        condition: ItemCondition.GOOD,
        location: 'IT Office Rack B',
        dateAdded: '2023-11-12',
        notes: 'Enterprise model'
      },
      {
        id: 'item-ipad-1',
        categoryId: 'cat-ipad',
        name: 'iPad Pro 11-inch',
        serialNumber: 'IPD-APL-201',
        qrCodeValue: 'IPD-APL-201',
        status: ItemStatus.RESERVED,
        condition: ItemCondition.GOOD,
        location: 'Mobile Lab Cart',
        dateAdded: '2023-09-20',
        notes: 'Includes Apple Pencil'
      },
      {
        id: 'item-ipad-2',
        categoryId: 'cat-ipad',
        name: 'iPad Mini (6th Gen)',
        serialNumber: 'IPD-APL-205',
        qrCodeValue: 'IPD-APL-205',
        status: ItemStatus.AVAILABLE,
        condition: ItemCondition.GOOD,
        location: 'Mobile Lab Cart',
        dateAdded: '2023-09-25',
        notes: 'Space Grey'
      },
      {
        id: 'item-cam-1',
        categoryId: 'cat-cam',
        name: 'Canon EOS R6',
        serialNumber: 'CAM-CAN-301',
        qrCodeValue: 'CAM-CAN-301',
        status: ItemStatus.BORROWED,
        condition: ItemCondition.GOOD,
        location: 'Media Locker 01',
        dateAdded: '2023-12-01',
        notes: 'Body only'
      },
      {
        id: 'item-cam-2',
        categoryId: 'cat-cam',
        name: 'Sony A7 IV',
        serialNumber: 'CAM-SON-305',
        qrCodeValue: 'CAM-SON-305',
        status: ItemStatus.AVAILABLE,
        condition: ItemCondition.GOOD,
        location: 'Media Locker 01',
        dateAdded: '2023-12-05',
        notes: 'High performance'
      },
      {
        id: 'item-cam-3',
        categoryId: 'cat-cam',
        name: 'GoPro Hero 11 Black',
        serialNumber: 'CAM-GPR-310',
        qrCodeValue: 'CAM-GPR-310',
        status: ItemStatus.MAINTENANCE,
        condition: ItemCondition.REPAIR,
        location: 'Media Locker 02',
        dateAdded: '2023-12-08',
        notes: 'Damaged lens cover'
      },
      {
        id: 'item-mic-1',
        categoryId: 'cat-mic',
        name: 'Shure SM58 Vocal Mic',
        serialNumber: 'MIC-SHU-401',
        qrCodeValue: 'MIC-SHU-401',
        status: ItemStatus.BORROWED,
        condition: ItemCondition.GOOD,
        location: 'Sound Cabinet A',
        dateAdded: '2023-08-15',
        notes: 'Classic dynamic mic'
      },
      {
        id: 'item-mic-2',
        categoryId: 'cat-mic',
        name: 'Rode Wireless GO II',
        serialNumber: 'MIC-ROD-405',
        qrCodeValue: 'MIC-ROD-405',
        status: ItemStatus.AVAILABLE,
        condition: ItemCondition.GOOD,
        location: 'Sound Cabinet B',
        dateAdded: '2023-08-20',
        notes: 'Dual channel receiver'
      }
    ],
    categories: MOCK_CATEGORIES,
    transactions: [
      {
        id: 'tx-sample-1',
        itemId: 'item-lap-2',
        borrowerName: 'Sarah Jenkins',
        borrowerIdNumber: 'S20056',
        contactNumber: '555-0234',
        dateRequested: '2024-03-01T09:00:00Z',
        dateBorrowed: '2024-03-01T09:15:00Z',
        dueDate: '2024-03-10',
        status: TransactionStatus.BORROWED,
        conditionOnRelease: ItemCondition.GOOD,
        remarks: 'Software Development project',
        googleFormReferenceId: 'GF-501'
      },
      {
        id: 'tx-sample-2',
        itemId: 'item-proj-1',
        borrowerName: 'John Mark Rolle',
        borrowerIdNumber: 'S30089',
        contactNumber: '555-0789',
        dateRequested: '2024-02-25T14:00:00Z',
        dateBorrowed: '2024-02-25T14:10:00Z',
        dateReturned: '2024-02-28T16:45:00Z',
        dueDate: '2024-03-01',
        status: TransactionStatus.RETURNED,
        conditionOnRelease: ItemCondition.GOOD,
        conditionOnReturn: ItemCondition.DAMAGED,
        remarks: 'Reported: Unit fell from tripod during presentation.',
        googleFormReferenceId: 'GF-502'
      },
      {
        id: 'tx-gopro-sample',
        itemId: 'item-cam-3',
        borrowerName: 'John Alfred',
        borrowerIdNumber: 'S30099',
        contactNumber: '555-0888',
        dateRequested: '2024-02-20T10:00:00Z',
        dateBorrowed: '2024-02-20T10:30:00Z',
        dateReturned: '2024-02-24T15:20:00Z',
        dueDate: '2024-02-27',
        status: TransactionStatus.RETURNED,
        conditionOnRelease: ItemCondition.GOOD,
        conditionOnReturn: ItemCondition.DAMAGED,
        remarks: 'User reported lens cover cracked while filming sports event.',
        googleFormReferenceId: 'GF-999'
      },
      {
        id: 'tx-proj-history-1',
        itemId: 'item-proj-1',
        borrowerName: 'Alice Smith',
        borrowerIdNumber: 'S30012',
        contactNumber: '555-0111',
        dateRequested: '2024-01-10T08:00:00Z',
        dateBorrowed: '2024-01-10T08:30:00Z',
        dateReturned: '2024-01-15T17:00:00Z',
        dueDate: '2024-01-16',
        status: TransactionStatus.RETURNED,
        conditionOnRelease: ItemCondition.GOOD,
        conditionOnReturn: ItemCondition.GOOD,
        remarks: 'Weekly meeting projection',
        googleFormReferenceId: 'GF-101'
      },
      {
        id: 'tx-proj-history-2',
        itemId: 'item-proj-1',
        borrowerName: 'Bob Johnson',
        borrowerIdNumber: 'S30045',
        contactNumber: '555-0222',
        dateRequested: '2024-02-05T10:00:00Z',
        dateBorrowed: '2024-02-05T10:15:00Z',
        dateReturned: '2024-02-10T09:30:00Z',
        dueDate: '2024-02-12',
        status: TransactionStatus.RETURNED,
        conditionOnRelease: ItemCondition.GOOD,
        conditionOnReturn: ItemCondition.GOOD,
        remarks: 'Client presentation in Conference Room B',
        googleFormReferenceId: 'GF-205'
      },
      {
        id: 'tx-sample-3',
        itemId: 'item-ipad-1',
        borrowerName: 'Michael Chen',
        borrowerIdNumber: 'S10022',
        contactNumber: '555-0991',
        dateRequested: '2024-03-05T08:30:00Z',
        dueDate: '2024-03-15',
        status: TransactionStatus.RESERVED,
        conditionOnRelease: ItemCondition.GOOD,
        remarks: 'Graphic design seminar next week',
        googleFormReferenceId: 'GF-503'
      },
      {
        id: 'tx-sample-4',
        itemId: 'item-cam-1',
        borrowerName: 'Emily Davis',
        borrowerIdNumber: 'S40011',
        contactNumber: '555-0556',
        dateRequested: '2024-03-02T11:00:00Z',
        dateBorrowed: '2024-03-02T11:20:00Z',
        dueDate: '2024-03-09',
        status: TransactionStatus.BORROWED,
        conditionOnRelease: ItemCondition.GOOD,
        remarks: 'Student orientation photography',
        googleFormReferenceId: 'GF-504'
      },
      {
        id: 'tx-sample-5',
        itemId: 'item-lap-1',
        borrowerName: 'David Wilson',
        borrowerIdNumber: 'S50033',
        contactNumber: '555-0667',
        dateRequested: '2024-02-20T10:00:00Z',
        dateBorrowed: '2024-02-20T10:30:00Z',
        dateReturned: '2024-02-25T09:00:00Z',
        dueDate: '2024-02-27',
        status: TransactionStatus.RETURNED,
        conditionOnRelease: ItemCondition.GOOD,
        conditionOnReturn: ItemCondition.GOOD,
        remarks: 'Data analysis task completed ahead of schedule.',
        googleFormReferenceId: 'GF-505'
      },
      {
        id: 'tx-multi-1',
        itemId: 'item-proj-2',
        borrowerName: 'Mark Stevens',
        borrowerIdNumber: 'S60077',
        contactNumber: '555-0900',
        dateRequested: '2024-03-10T10:00:00Z',
        dateBorrowed: '2024-03-10T10:15:00Z',
        dueDate: '2024-03-15',
        status: TransactionStatus.BORROWED,
        conditionOnRelease: ItemCondition.GOOD,
        remarks: 'Multi-item Session: BS-MULTI-001 | Media Workshop',
        googleFormReferenceId: 'BS-MULTI-001'
      },
      {
        id: 'tx-multi-2',
        itemId: 'item-mic-1',
        borrowerName: 'Mark Stevens',
        borrowerIdNumber: 'S60077',
        contactNumber: '555-0900',
        dateRequested: '2024-03-10T10:00:00Z',
        dateBorrowed: '2024-03-10T10:15:00Z',
        dueDate: '2024-03-15',
        status: TransactionStatus.BORROWED,
        conditionOnRelease: ItemCondition.GOOD,
        remarks: 'Multi-item Session: BS-MULTI-001 | Media Workshop',
        googleFormReferenceId: 'BS-MULTI-001'
      }
    ],
    sessions: [
      {
        id: 'session-1',
        sessionCode: 'BS-GF501',
        borrowerName: 'Sarah Jenkins',
        borrowerIdNumber: 'S20056',
        department: 'Computer Science',
        contactNumber: '555-0234',
        purpose: 'Software Development project',
        requestedDate: '2024-03-01T09:00:00Z',
        expectedReturnDate: '2024-03-10',
        dateReleased: '2024-03-01T09:15:00Z',
        status: SessionStatus.ACTIVE,
        itemIds: ['item-lap-2']
      },
      {
        id: 'session-2',
        sessionCode: 'BS-GF502',
        borrowerName: 'John Mark Rolle',
        borrowerIdNumber: 'S30089',
        department: 'Engineering',
        contactNumber: '555-0789',
        purpose: 'Class Presentation',
        requestedDate: '2024-02-25T14:00:00Z',
        expectedReturnDate: '2024-03-01',
        dateReleased: '2024-02-25T14:10:00Z',
        dateCompleted: '2024-02-28T16:45:00Z',
        status: SessionStatus.COMPLETED,
        itemIds: ['item-proj-1']
      },
      {
        id: 'session-3',
        sessionCode: 'BS-GF503',
        borrowerName: 'Michael Chen',
        borrowerIdNumber: 'S10022',
        department: 'Design',
        contactNumber: '555-0991',
        purpose: 'Graphic design seminar next week',
        requestedDate: '2024-03-05T08:30:00Z',
        expectedReturnDate: '2024-03-15',
        status: SessionStatus.APPROVED,
        itemIds: ['item-ipad-1']
      },
      {
        id: 'session-4',
        sessionCode: 'BS-GF504',
        borrowerName: 'Emily Davis',
        borrowerIdNumber: 'S40011',
        department: 'Arts & Media',
        contactNumber: '555-0556',
        purpose: 'Student orientation photography',
        requestedDate: '2024-03-02T11:00:00Z',
        expectedReturnDate: '2024-03-09',
        dateReleased: '2024-03-02T11:20:00Z',
        status: SessionStatus.ACTIVE,
        itemIds: ['item-cam-1']
      },
      {
        id: 'session-5',
        sessionCode: 'BS-GF505',
        borrowerName: 'David Wilson',
        borrowerIdNumber: 'S50033',
        department: 'Data Science',
        contactNumber: '555-0667',
        purpose: 'Data analysis task',
        requestedDate: '2024-02-20T10:00:00Z',
        expectedReturnDate: '2024-02-27',
        dateReleased: '2024-02-20T10:30:00Z',
        dateCompleted: '2024-02-25T09:00:00Z',
        status: SessionStatus.COMPLETED,
        itemIds: ['item-lap-1']
      },
      {
        id: 'session-6',
        sessionCode: 'BS-CANCELLED',
        borrowerName: 'Old Request',
        borrowerIdNumber: 'S99999',
        department: 'History',
        contactNumber: '555-0000',
        purpose: 'Cancelled project',
        requestedDate: '2024-01-01T10:00:00Z',
        expectedReturnDate: '2024-01-05',
        status: SessionStatus.CANCELLED,
        itemIds: []
      },
      {
        id: 'session-7',
        sessionCode: 'BS-GF999',
        borrowerName: 'John Alfred',
        borrowerIdNumber: 'S30099',
        department: 'Engineering',
        contactNumber: '555-0888',
        purpose: 'Field research',
        requestedDate: '2024-02-20T10:00:00Z',
        expectedReturnDate: '2024-02-27',
        dateReleased: '2024-02-20T10:30:00Z',
        dateCompleted: '2024-02-24T15:20:00Z',
        status: SessionStatus.COMPLETED,
        itemIds: ['item-cam-3']
      },
      {
        id: 'session-8',
        sessionCode: 'BS-GF101',
        borrowerName: 'Alice Smith',
        borrowerIdNumber: 'S30012',
        department: 'Management',
        contactNumber: '555-0111',
        purpose: 'Weekly meeting projection',
        requestedDate: '2024-01-10T08:00:00Z',
        expectedReturnDate: '2024-01-16',
        dateReleased: '2024-01-10T08:30:00Z',
        dateCompleted: '2024-01-15T17:00:00Z',
        status: SessionStatus.COMPLETED,
        itemIds: ['item-proj-1']
      },
      {
        id: 'session-9',
        sessionCode: 'BS-GF205',
        borrowerName: 'Bob Johnson',
        borrowerIdNumber: 'S30045',
        department: 'Sales',
        contactNumber: '555-0222',
        purpose: 'Client presentation',
        requestedDate: '2024-02-05T10:00:00Z',
        expectedReturnDate: '2024-02-12',
        dateReleased: '2024-02-05T10:15:00Z',
        dateCompleted: '2024-02-10T09:30:00Z',
        status: SessionStatus.COMPLETED,
        itemIds: ['item-proj-1']
      },
      {
        id: 'session-multi-1',
        sessionCode: 'BS-MULTI-001',
        borrowerName: 'Mark Stevens',
        borrowerIdNumber: 'S60077',
        department: 'Media Arts',
        contactNumber: '555-0900',
        purpose: 'Media Production Workshop',
        requestedDate: '2024-03-10T10:00:00Z',
        expectedReturnDate: '2024-03-15',
        dateReleased: '2024-03-10T10:15:00Z',
        status: SessionStatus.ACTIVE,
        itemIds: ['item-proj-2', 'item-mic-1']
      }
    ],
    maintenance: [
      {
        id: 'maint-initial-1',
        itemId: 'item-cam-3',
        issueDescription: 'Lens cover cracked during field trip',
        reportedDate: '2023-12-08',
        status: 'Ongoing'
      }
    ],
    logs: [
      {
        id: 'log-1',
        actionType: 'CREATE',
        adminUser: 'System Admin',
        timestamp: '2023-10-01T08:00:00Z',
        description: 'Initial import of Epson Projector units.',
        itemId: 'item-proj-1'
      },
      {
        id: 'log-2',
        actionType: 'BORROW',
        adminUser: 'System Admin',
        timestamp: '2024-02-25T14:10:00Z',
        description: 'Borrowed: Epson EB-X06 Projector by John Mark Rolle.',
        itemId: 'item-proj-1'
      },
      {
        id: 'log-3',
        actionType: 'RETURN',
        adminUser: 'System Admin',
        timestamp: '2024-02-28T16:45:00Z',
        description: 'Returned: Epson EB-X06 Projector by John Mark Rolle. Status: DAMAGED.',
        itemId: 'item-proj-1'
      },
      {
        id: 'log-gopro-1',
        actionType: 'RETURN',
        adminUser: 'System Admin',
        timestamp: '2024-02-24T15:20:00Z',
        description: 'Returned: GoPro Hero 11 Black by John Alfred. Status: DAMAGED.',
        itemId: 'item-cam-3'
      }
    ]
  };
};

export function useInventoryStore() {
  const [state, setState] = useState<AppState>(getInitialData());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addItem = (item: EquipmentItem) => {
    setState(prev => ({ ...prev, items: [...prev.items, item] }));
    addLog('CREATE', `Added item: ${item.name}`, item.id);
  };

  const updateItem = (item: EquipmentItem) => {
    setState(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === item.id ? item : i)
    }));
    addLog('UPDATE', `Updated item: ${item.name}`, item.id);
  };

  const deleteItem = (id: string) => {
    const hasHistory = state.transactions.some(t => t.itemId === id);
    if (hasHistory) {
      const item = state.items.find(i => i.id === id);
      if (item) updateItem({ ...item, status: ItemStatus.ARCHIVED });
    } else {
      setState(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
    }
  };

  const addTransaction = (tx: Transaction) => {
    setState(prev => ({ ...prev, transactions: [...prev.transactions, tx] }));
    const item = state.items.find(i => i.id === tx.itemId);
    if (item) {
      let newStatus = ItemStatus.AVAILABLE;
      if (tx.status === TransactionStatus.BORROWED) newStatus = ItemStatus.BORROWED;
      if (tx.status === TransactionStatus.RESERVED) newStatus = ItemStatus.RESERVED;
      updateItem({ ...item, status: newStatus });
    }
    const logType = tx.status === TransactionStatus.RESERVED ? 'RESERVE' : 'BORROW';
    addLog(logType, `${tx.status}: ${item?.name} for ${tx.borrowerName}`, tx.itemId);
  };

  const updateTransaction = (tx: Transaction) => {
    setState(prev => ({
      ...prev,
      transactions: prev.transactions.map(t => t.id === tx.id ? tx : t)
    }));
  };

  const completeTransaction = (txId: string, returnCondition: ItemCondition, remarks: string) => {
    const tx = state.transactions.find(t => t.id === txId);
    if (!tx) return;

    const updatedTx: Transaction = {
      ...tx,
      dateReturned: new Date().toISOString(),
      status: TransactionStatus.RETURNED,
      conditionOnReturn: returnCondition,
      returnRemarks: remarks
    };

    setState(prev => ({
      ...prev,
      transactions: prev.transactions.map(t => t.id === txId ? updatedTx : t)
    }));

    const item = state.items.find(i => i.id === tx.itemId);
    if (item) {
      updateItem({ 
        ...item, 
        status: ItemStatus.AVAILABLE, 
        condition: returnCondition 
      });
    }
    addLog('RETURN', `Returned item ID: ${tx.itemId}`, tx.itemId);
  };

  const addLog = (type: string, desc: string, itemId?: string) => {
    const log: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      actionType: type,
      description: desc,
      itemId,
      adminUser: 'Admin User',
      timestamp: new Date().toISOString()
    };
    setState(prev => ({ ...prev, logs: [log, ...prev.logs].slice(0, 100) }));
  };

  const addCategory = (cat: Category) => {
    setState(prev => ({ ...prev, categories: [...prev.categories, cat] }));
  };

  const deleteCategory = (id: string) => {
    const hasItems = state.items.some(i => i.categoryId === id);
    if (hasItems) {
      alert("Cannot delete category with associated items.");
      return;
    }
    setState(prev => ({ ...prev, categories: prev.categories.filter(c => c.id !== id) }));
  };

  const addMaintenanceRecord = (log: MaintenanceLog) => {
    setState(prev => ({ ...prev, maintenance: [...prev.maintenance, log] }));
    const item = state.items.find(i => i.id === log.itemId);
    if (item) updateItem({ ...item, status: ItemStatus.MAINTENANCE });
  };

  const resolveMaintenance = (id: string, newCondition: ItemCondition) => {
    const log = state.maintenance.find(m => m.id === id);
    if (!log) return;
    
    setState(prev => ({
      ...prev,
      maintenance: prev.maintenance.map(m => m.id === id ? { ...m, status: 'Completed', resolvedDate: new Date().toISOString() } : m)
    }));
    
    const item = state.items.find(i => i.id === log.itemId);
    if (item) updateItem({ ...item, status: ItemStatus.AVAILABLE, condition: newCondition });
  };

  const createSession = (session: Omit<BorrowSession, 'id' | 'sessionCode' | 'status' | 'itemIds'>) => {
    const id = `session-${Date.now()}`;
    const sessionCode = `BS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const newSession: BorrowSession = {
      ...session,
      id,
      sessionCode,
      status: SessionStatus.PENDING_SCANNING,
      itemIds: []
    };
    setState(prev => ({ ...prev, sessions: [...prev.sessions, newSession] }));
    return newSession;
  };

  const updateSession = (session: BorrowSession) => {
    setState(prev => ({
      ...prev,
      sessions: prev.sessions.map(s => s.id === session.id ? session : s)
    }));
  };

  const addItemToSession = (sessionId: string, itemId: string) => {
    const session = state.sessions.find(s => s.id === sessionId);
    if (!session) return;
    if (session.itemIds.includes(itemId)) return;

    const updatedSession = {
      ...session,
      itemIds: [...session.itemIds, itemId]
    };
    updateSession(updatedSession);
  };

  const submitSessionForApproval = (sessionId: string) => {
    const session = state.sessions.find(s => s.id === sessionId);
    if (!session) return;
    updateSession({ ...session, status: SessionStatus.PENDING_APPROVAL });
  };

  const approveSession = (sessionId: string) => {
    const session = state.sessions.find(s => s.id === sessionId);
    if (!session) return;
    
    // Reserve items upon approval
    session.itemIds.forEach(itemId => {
      const item = state.items.find(i => i.id === itemId);
      if (item && item.status === ItemStatus.AVAILABLE) {
        updateItem({ ...item, status: ItemStatus.RESERVED });
      }
    });

    updateSession({ ...session, status: SessionStatus.APPROVED });
    addLog('APPROVE', `Approved session: ${session.sessionCode}`, undefined);
  };

  const rejectSession = (sessionId: string, reason: string) => {
    const session = state.sessions.find(s => s.id === sessionId);
    if (!session) return;
    
    updateSession({ 
      ...session, 
      status: SessionStatus.REJECTED, 
      rejectionReason: reason 
    });
    addLog('REJECT', `Rejected session: ${session.sessionCode}. Reason: ${reason}`, undefined);
  };

  const releaseItemInSession = (sessionId: string, itemId: string) => {
    const session = state.sessions.find(s => s.id === sessionId);
    if (!session) return;

    const releasedItemIds = session.releasedItemIds || [];
    if (releasedItemIds.includes(itemId)) return;

    const item = state.items.find(i => i.id === itemId);
    if (!item) return;

    const now = new Date().toISOString();
    const newReleasedItemIds = [...releasedItemIds, itemId];
    
    // Update item status
    updateItem({ ...item, status: ItemStatus.BORROWED });

    // Create transaction
    const tx: Transaction = {
      id: `tx-${Date.now()}-${itemId}`,
      itemId,
      borrowerName: session.borrowerName,
      borrowerIdNumber: session.borrowerIdNumber,
      contactNumber: session.contactNumber,
      dateRequested: session.requestedDate,
      dateBorrowed: now,
      dueDate: session.expectedReturnDate,
      status: TransactionStatus.BORROWED,
      conditionOnRelease: item.condition,
      remarks: `Session: ${session.sessionCode} | Purpose: ${session.purpose}`,
      googleFormReferenceId: session.sessionCode
    };
    addTransaction(tx);

    // Update session
    const isFullyReleased = newReleasedItemIds.length === session.itemIds.length;
    updateSession({ 
      ...session, 
      releasedItemIds: newReleasedItemIds,
      status: isFullyReleased ? SessionStatus.RELEASED : session.status,
      dateReleased: isFullyReleased ? now : session.dateReleased
    });

    addLog('RELEASE', `Released item ${item.serialNumber} for session ${session.sessionCode}`, itemId);
  };

  const cancelSession = (sessionId: string) => {
    setState(prev => {
      const session = prev.sessions.find(s => s.id === sessionId);
      if (!session) return prev;

      const updatedItems = prev.items.map(item => 
        session.itemIds.includes(item.id) 
          ? { ...item, status: ItemStatus.AVAILABLE } 
          : item
      );

      return {
        ...prev,
        items: updatedItems,
        sessions: prev.sessions.map(s => s.id === sessionId ? { ...s, status: SessionStatus.CANCELLED } : s)
      };
    });
    addLog('CANCEL', `Cancelled session for ID: ${sessionId}`);
  };

  const deleteSession = (sessionId: string) => {
    setState(prev => ({
      ...prev,
      sessions: prev.sessions.filter(s => s.id !== sessionId)
    }));
    addLog('DELETE', `Deleted session record ID: ${sessionId}`);
  };

  const checkOverdueTransactions = () => {
    const now = new Date();
    let updated = false;
    const newTransactions = state.transactions.map(tx => {
      if (tx.status === TransactionStatus.BORROWED && new Date(tx.dueDate) < now) {
        updated = true;
        return { ...tx, status: TransactionStatus.OVERDUE };
      }
      return tx;
    });

    if (updated) {
      setState(prev => ({ ...prev, transactions: newTransactions }));
    }
  };

  return {
    ...state,
    addItem,
    updateItem,
    deleteItem,
    addTransaction,
    updateTransaction,
    completeTransaction,
    addCategory,
    deleteCategory,
    addMaintenanceRecord,
    resolveMaintenance,
    createSession,
    updateSession,
    addItemToSession,
    submitSessionForApproval,
    approveSession,
    rejectSession,
    releaseItemInSession,
    cancelSession,
    deleteSession,
    checkOverdueTransactions
  };
}

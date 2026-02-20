
export enum ItemStatus {
  AVAILABLE = 'Available',
  RESERVED = 'Reserved',
  BORROWED = 'Borrowed',
  MAINTENANCE = 'Maintenance',
  LOST = 'Lost',
  ARCHIVED = 'Archived'
}

export enum ItemCondition {
  GOOD = 'Good',
  DAMAGED = 'Damaged',
  REPAIR = 'Under Repair'
}

export enum TransactionStatus {
  RESERVED = 'Reserved',
  BORROWED = 'Borrowed',
  RETURNED = 'Returned',
  OVERDUE = 'Overdue',
  CANCELLED = 'Cancelled'
}

export interface Category {
  id: string;
  name: string;
  description: string;
  dateCreated: string;
}

export interface EquipmentItem {
  id: string;
  categoryId: string;
  name: string;
  serialNumber: string;
  qrCodeValue: string;
  status: ItemStatus;
  condition: ItemCondition;
  location: string;
  dateAdded: string;
  notes: string;
}

export enum SessionStatus {
  PENDING_SCANNING = 'PendingScanning',
  PENDING_APPROVAL = 'PendingApproval',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  ACTIVE = 'Active',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled'
}

export interface BorrowSession {
  id: string;
  sessionCode: string;
  borrowerName: string;
  borrowerIdNumber: string;
  department: string;
  contactNumber: string;
  purpose: string;
  requestedDate: string;
  expectedReturnDate: string;
  dateReleased?: string;
  dateCompleted?: string;
  status: SessionStatus;
  itemIds: string[];
}

export interface Transaction {
  id: string;
  itemId: string;
  borrowerName: string;
  borrowerIdNumber: string;
  contactNumber: string;
  dateRequested: string;
  dateBorrowed?: string;
  dueDate: string;
  dateReturned?: string;
  status: TransactionStatus;
  conditionOnRelease: ItemCondition;
  conditionOnReturn?: ItemCondition;
  remarks: string;
  googleFormReferenceId: string;
}

export interface MaintenanceLog {
  id: string;
  itemId: string;
  issueDescription: string;
  reportedDate: string;
  resolvedDate?: string;
  status: 'Ongoing' | 'Completed';
}

export interface AuditLog {
  id: string;
  actionType: string;
  itemId?: string;
  adminUser: string;
  timestamp: string;
  description: string;
}

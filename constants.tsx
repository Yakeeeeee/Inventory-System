
import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  History, 
  Wrench, 
  Settings, 
  LogOut, 
  QrCode, 
  Plus, 
  Search, 
  ArrowRight,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Download,
  ExternalLink,
  Trash2,
  ChevronRight,
  Printer,
  Handshake,
  Camera,
  Pencil
} from 'lucide-react';

export const ICONS = {
  Dashboard: <LayoutDashboard size={20} />,
  Inventory: <Package size={20} />,
  Transactions: <History size={20} />,
  Maintenance: <Wrench size={20} />,
  Categories: <Settings size={20} />,
  Logout: <LogOut size={20} />,
  QR: <QrCode size={20} />,
  Plus: <Plus size={20} />,
  Search: <Search size={20} />,
  ArrowRight: <ArrowRight size={20} />,
  Edit: <Pencil size={18} />,
  Reports: <ClipboardList size={20} />,
  Alert: <AlertTriangle size={16} />,
  Success: <CheckCircle2 size={16} />,
  Filter: <Filter size={16} />,
  Download: <Download size={16} />,
  External: <ExternalLink size={16} />,
  Trash: <Trash2 size={16} />,
  ChevronRight: <ChevronRight size={16} />,
  Print: <Printer size={16} />,
  Borrow: <Handshake size={16} />,
  Camera: <Camera size={16} />
};

export const MOCK_CATEGORIES = [
  { id: 'cat-proj', name: 'Projectors', description: 'Visual projection equipment', dateCreated: '2023-01-01' },
  { id: 'cat-lap', name: 'Laptops', description: 'Portable computing units', dateCreated: '2023-01-05' },
  { id: 'cat-ipad', name: 'iPads', description: 'Tablets and mobile devices', dateCreated: '2023-02-10' },
  { id: 'cat-cam', name: 'Cameras', description: 'Photography and video gear', dateCreated: '2023-03-15' },
  { id: 'cat-mic', name: 'Microphones', description: 'Audio recording equipment', dateCreated: '2023-04-20' }
];

export const getQRImageUrl = (data: string) => `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(data)}`;

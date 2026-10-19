import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  Banknote, 
  Briefcase, 
  Layers, 
  RotateCcw,
  ShieldCheck,
  Lock,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/hris';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onResetData: () => void;
  candidateCount: number;
}

interface MenuItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  allowedRoles: UserRole[];
  badge?: string;
  highlight?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onResetData,
  candidateCount,
}) => {
  const { currentUser } = useAuth();

  const allMenuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: currentUser.role === 'KARYAWAN' 
        ? 'Dashboard Mandiri' 
        : currentUser.role === 'FINANCE' 
        ? 'Financial Dashboard' 
        : 'Executive Dashboard',
      description: currentUser.role === 'KARYAWAN'
        ? 'Status presensi & gaji pribadi'
        : currentUser.role === 'FINANCE'
        ? 'Analisis payroll & anggaran'
        : 'Statistik SDM & absensi umum',
      icon: <LayoutDashboard className="w-4 h-4" />,
      allowedRoles: ['KARYAWAN', 'HR', 'FINANCE'],
    },
    {
      id: 'employees',
      label: '1. Data Karyawan',
      description: 'Master data CRUD & profil identitas',
      icon: <Users className="w-4 h-4" />,
      allowedRoles: ['HR'], // Restricted to HR only
    },
    {
      id: 'attendance',
      label: currentUser.role === 'KARYAWAN' 
        ? '2. Presensi Mandiri' 
        : currentUser.role === 'FINANCE'
        ? '2. Audit Kehadiran'
        : '2. Presensi & Kehadiran',
      description: currentUser.role === 'KARYAWAN'
        ? 'Clock-In/Out harian & log sendiri'
        : currentUser.role === 'FINANCE'
        ? 'Audit menit denda potongan gaji'
        : 'Kelola & rekap seluruh karyawan',
      icon: <Clock className="w-4 h-4" />,
      allowedRoles: ['KARYAWAN', 'HR', 'FINANCE'],
    },
    {
      id: 'payroll',
      label: currentUser.role === 'KARYAWAN' 
        ? '3. Slip Gaji Saya' 
        : '3. Pengolahan Gaji (Payroll)',
      description: currentUser.role === 'KARYAWAN'
        ? 'Unduh rincian pembayaran pribadi'
        : 'Kalkulasi, validasi & approval gaji',
      icon: <Banknote className="w-4 h-4" />,
      allowedRoles: ['KARYAWAN', 'FINANCE'], // HR cannot touch financial payments directly
    },
    {
      id: 'recruitment',
      label: '4. Perekrutan (ATS)',
      description: 'Posting lowongan & seleksi kandidat',
      icon: <Briefcase className="w-4 h-4" />,
      allowedRoles: ['HR'], // Restricted to HR
      badge: candidateCount > 0 ? `${candidateCount} Pelamar` : undefined,
    },
    {
      id: 'architecture',
      label: 'Arsitektur DB & RBAC',
      description: 'Skema MySQL, Middleware & ERD',
      icon: <Layers className="w-4 h-4" />,
      allowedRoles: ['KARYAWAN', 'HR', 'FINANCE'],
      highlight: true,
    },
  ];

  // Filter menu items strictly by current user's role (Role-Based Access Control)
  const accessibleMenuItems = allMenuItems.filter((item) =>
    item.allowedRoles.includes(currentUser.role)
  );

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)] p-4 border-r border-slate-800">
      {/* Navigation Links */}
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
              MENU HAK AKSES ({currentUser.role})
            </span>
            <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-semibold">
              <ShieldCheck className="w-3 h-3" />
              RBAC Guard
            </span>
          </div>

          <nav className="space-y-1">
            {accessibleMenuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all group ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30'
                      : item.highlight
                      ? 'bg-indigo-950/60 text-indigo-200 border border-indigo-800/60 hover:bg-indigo-900/50'
                      : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <div className="truncate">
                      <div className="text-xs font-semibold leading-tight">{item.label}</div>
                      <div
                        className={`text-[10px] truncate ${
                          isActive ? 'text-blue-100' : 'text-slate-500'
                        }`}
                      >
                        {item.description}
                      </div>
                    </div>
                  </div>

                  {item.badge && (
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Dynamic RBAC Privilege Notice Card */}
        <div className="p-3.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs space-y-2">
          <div className="flex items-center gap-1.5 text-blue-400 font-semibold text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Hak Akses: {currentUser.role}</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {currentUser.role === 'KARYAWAN' && (
              <>• Akses Mandiri (Self-Service)<br />• Presensi Clock-In/Out harian<br />• Melihat slip gaji pribadi (EMP-001)</>
            )}
            {currentUser.role === 'HR' && (
              <>• Kelola master profil seluruh karyawan<br />• Rekapitulasi absensi perusahaan<br />• Publikasi lowongan & seleksi ATS<br />• <em>Finansial diisolasi ke Finance</em></>
            )}
            {currentUser.role === 'FINANCE' && (
              <>• Akses eksklusif kalkulasi Payroll<br />• Validasi & approval pembayaran gaji<br />• Audit keterlambatan absensi<br />• <em>Master data & ATS terkunci</em></>
            )}
          </p>
        </div>
      </div>

      {/* Bottom Tool: Reset Database State */}
      <div className="pt-4 border-t border-slate-800 space-y-2">
        <button
          onClick={onResetData}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl text-xs transition"
          title="Kembalikan data simulasi ke setelan awal"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Data Simulasi (Default)</span>
        </button>

        <div className="text-[10px] text-center text-slate-500">
          NusantaraHR RBAC Engine © 2026
        </div>
      </div>
    </aside>
  );
};

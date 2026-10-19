import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Clock, 
  Bell, 
  ShieldCheck, 
  ChevronDown,
  UserCheck,
  Briefcase,
  Banknote,
  Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/hris';

interface NavbarProps {
  onQuickClockIn: () => void;
  pendingApplicantsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ onQuickClockIn, pendingApplicantsCount }) => {
  const { currentUser, switchUser, availableUsers } = useAuth();
  const [time, setTime] = useState<string>('');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const roleBadges: Record<UserRole, { label: string; color: string; icon: React.ReactNode }> = {
    KARYAWAN: {
      label: 'Karyawan (Self-Service)',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
      icon: <Users className="w-3.5 h-3.5" />,
    },
    HR: {
      label: 'HR Manager (Full Admin)',
      color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
      icon: <Briefcase className="w-3.5 h-3.5" />,
    },
    FINANCE: {
      label: 'Finance Officer (Payroll)',
      color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
      icon: <Banknote className="w-3.5 h-3.5" />,
    },
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Brand & System Status */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-slate-900 dark:text-white text-base tracking-tight leading-none">
              Nusantara<span className="text-blue-600">HR</span>
            </h1>
            <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono text-[10px] font-bold rounded">
              RBAC Matrix Active
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Role: <strong>{currentUser.role}</strong> ({currentUser.displayName.split(' ')[0]})
          </p>
        </div>
      </div>

      {/* Center / Right controls */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Real-time Digital Clock widget */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span>{time || '08:30:00'} WIB</span>
        </div>

        {/* Quick Clock-In button */}
        <button
          onClick={onQuickClockIn}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900 rounded-xl text-xs font-bold transition border border-emerald-200 dark:border-emerald-800"
        >
          <Clock className="w-3.5 h-3.5" />
          Clock-In
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Notifikasi"
          >
            <Bell className="w-4 h-4" />
          </button>
          {currentUser.role === 'HR' && pendingApplicantsCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-bounce">
              {pendingApplicantsCount}
            </span>
          )}
        </div>

        {/* Interactive RBAC Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition shadow-xs ${roleBadges[currentUser.role].color}`}
            title="Klik untuk beralih Role Akun (Karyawan, HR, Finance)"
          >
            {roleBadges[currentUser.role].icon}
            <div className="text-left hidden sm:block">
              <div className="text-[11px] font-bold leading-tight">{roleBadges[currentUser.role].label}</div>
              <div className="text-[10px] opacity-80">{currentUser.displayName}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70" />
          </button>

          {isRoleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="p-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Simulasi Role-Based Access Control (RBAC)
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Pilih peran untuk menguji isolasi menu dan pembatasan wewenang UI:
                </p>
              </div>

              <div className="space-y-1">
                {availableUsers.map((user) => {
                  const isSelected = user.id === currentUser.id;
                  return (
                    <button
                      key={user.id}
                      onClick={() => {
                        switchUser(user.id);
                        setIsRoleDropdownOpen(false);
                      }}
                      className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <img
                        src={user.avatarUrl}
                        alt={user.displayName}
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 shrink-0 mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {user.displayName}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                              user.role === 'KARYAWAN'
                                ? 'bg-emerald-100 text-emerald-800'
                                : user.role === 'HR'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {user.role}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                          {user.role === 'KARYAWAN'
                            ? 'Akses mandiri: Clock-in/out & slip gaji sendiri'
                            : user.role === 'HR'
                            ? 'Wewenang master karyawan, absensi & rekrutmen'
                            : 'Wewenang mutlak hitung & bayar gaji (Payroll)'}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

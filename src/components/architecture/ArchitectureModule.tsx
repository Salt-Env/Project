import React, { useState } from 'react';
import { 
  Database, 
  Layers, 
  Workflow, 
  Globe, 
  Code, 
  Copy, 
  Check, 
  Terminal, 
  ShieldCheck, 
  Lock, 
  FileCode,
  Users,
  Briefcase,
  Banknote
} from 'lucide-react';

export const ArchitectureModule: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'DATABASE' | 'ERD' | 'LOGIC' | 'API' | 'REACT_CODE'>('DATABASE');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // 1. MySQL DDL Schema with Users & Roles (RBAC)
  const mysqlSchemaDDL = `-- ============================================================================
-- DATABASE SCHEMA: ENTERPRISE HRIS WITH RBAC (ROLE-BASED ACCESS CONTROL)
-- RDBMS Engine: MySQL 8.0+ / InnoDB
-- Charset: utf8mb4 / Collation: utf8mb4_unicode_ci
-- ============================================================================

CREATE DATABASE IF NOT EXISTS \`hris_enterprise_db\`
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE \`hris_enterprise_db\`;

-- ----------------------------------------------------------------------------
-- 1. TABEL: ROLES (Master Hak Akses: KARYAWAN, HR, FINANCE)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`roles\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`code\` ENUM('KARYAWAN', 'HR', 'FINANCE') NOT NULL UNIQUE COMMENT 'Kode hak akses RBAC',
  \`name\` VARCHAR(50) NOT NULL COMMENT 'Nama peran (Karyawan Mandiri, HR Manager, Finance)',
  \`description\` VARCHAR(255) NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Seeding Default Roles
INSERT INTO \`roles\` (\`code\`, \`name\`, \`description\`) VALUES
('KARYAWAN', 'Karyawan Regular (Self-Service)', 'Akses presensi mandiri dan unduh slip gaji pribadi'),
('HR', 'Human Resources Manager', 'Wewenang master data karyawan, rekap kehadiran, dan posting rekrutmen'),
('FINANCE', 'Finance & Payroll Specialist', 'Akses terisolasi untuk kalkulasi, validasi, dan pencairan gaji')
ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`);

-- ----------------------------------------------------------------------------
-- 2. TABEL: DEPARTEMEN (Master Organisasi & Divisi)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`departments\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`name\` VARCHAR(100) NOT NULL UNIQUE,
  \`code\` VARCHAR(20) NOT NULL UNIQUE,
  \`description\` TEXT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 3. TABEL: KARYAWAN (Master Profil Identitas & Hak Finansial)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`employees\` (
  \`id\` VARCHAR(30) PRIMARY KEY COMMENT 'Format: EMP-YYYY-XXXX (e.g. EMP-001)',
  \`nik\` CHAR(16) NOT NULL UNIQUE COMMENT 'Nomor Induk Kependudukan 16 Digit KTP',
  \`full_name\` VARCHAR(150) NOT NULL,
  \`email\` VARCHAR(100) NOT NULL UNIQUE,
  \`phone\` VARCHAR(30) NOT NULL,
  \`department_id\` INT UNSIGNED NOT NULL,
  \`position\` VARCHAR(100) NOT NULL COMMENT 'Jabatan / Posisi kerja',
  \`employment_type\` ENUM('Tetap', 'Kontrak', 'Magang') NOT NULL DEFAULT 'Tetap',
  \`status\` ENUM('Aktif', 'Cuti', 'Resigned') NOT NULL DEFAULT 'Aktif',
  \`join_date\` DATE NOT NULL,
  \`base_salary\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Gaji Pokok bulanan',
  \`allowance_transport\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  \`allowance_meal\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  \`bank_name\` VARCHAR(50) NOT NULL DEFAULT 'BCA',
  \`bank_account_number\` VARCHAR(50) NOT NULL,
  \`bank_account_holder\` VARCHAR(150) NOT NULL,
  \`avatar_url\` VARCHAR(255) NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT \`fk_employees_department\`
    FOREIGN KEY (\`department_id\`) REFERENCES \`departments\` (\`id\`)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  INDEX \`idx_employees_dept\` (\`department_id\`),
  INDEX \`idx_employees_status\` (\`status\`),
  INDEX \`idx_employees_name\` (\`full_name\`)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 4. TABEL: USERS (Akun Otentikasi & Penghubung Role RBAC ke Data Karyawan)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` VARCHAR(36) PRIMARY KEY COMMENT 'UUID v4',
  \`username\` VARCHAR(50) NOT NULL UNIQUE,
  \`email\` VARCHAR(100) NOT NULL UNIQUE,
  \`password_hash\` VARCHAR(255) NOT NULL COMMENT 'Bcrypt / Argon2 hash',
  \`role_id\` INT UNSIGNED NOT NULL COMMENT 'Relasi ke tabel roles',
  \`employee_id\` VARCHAR(30) NULL UNIQUE COMMENT 'Relasi 1:1 ke tabel employees (Null jika Admin Eksternal)',
  \`is_active\` BOOLEAN NOT NULL DEFAULT TRUE,
  \`last_login_at\` TIMESTAMP NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT \`fk_users_role\`
    FOREIGN KEY (\`role_id\`) REFERENCES \`roles\` (\`id\`)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT \`fk_users_employee\`
    FOREIGN KEY (\`employee_id\`) REFERENCES \`employees\` (\`id\`)
    ON DELETE SET NULL ON UPDATE CASCADE,

  INDEX \`idx_users_role\` (\`role_id\`),
  INDEX \`idx_users_username\` (\`username\`)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 5. TABEL: KEHADIRAN (Presensi Harian Clock-In / Clock-Out)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`attendances\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`employee_id\` VARCHAR(30) NOT NULL,
  \`date\` DATE NOT NULL COMMENT 'Tanggal presensi',
  \`clock_in\` TIME NULL COMMENT 'Waktu jam masuk (HH:mm:ss)',
  \`clock_out\` TIME NULL COMMENT 'Waktu jam pulang (HH:mm:ss)',
  \`status\` ENUM('Hadir', 'Terlambat', 'Izin', 'Sakit', 'Alpha') NOT NULL DEFAULT 'Alpha',
  \`late_minutes\` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Jumlah menit terlambat dari 08:30 WIB',
  \`location_name\` VARCHAR(200) NULL COMMENT 'Verifikasi geofence kantor',
  \`latitude\` DECIMAL(10, 8) NULL,
  \`longitude\` DECIMAL(11, 8) NULL,
  \`notes\` VARCHAR(255) NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT \`fk_attendances_employee\`
    FOREIGN KEY (\`employee_id\`) REFERENCES \`employees\` (\`id\`)
    ON DELETE CASCADE ON UPDATE CASCADE,

  UNIQUE KEY \`uk_employee_daily_attendance\` (\`employee_id\`, \`date\`),
  INDEX \`idx_attendances_date\` (\`date\`),
  INDEX \`idx_attendances_status\` (\`status\`)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 6. TABEL: PENGOLAHAN GAJI (Payroll & Slip Gaji Bulanan - Hak Akses FINANCE)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`payrolls\` (
  \`id\` VARCHAR(50) PRIMARY KEY COMMENT 'Format: PAY-YYYY-MM-XXXX',
  \`employee_id\` VARCHAR(30) NOT NULL,
  \`period_month\` TINYINT UNSIGNED NOT NULL COMMENT '1 sampai 12',
  \`period_year\` SMALLINT UNSIGNED NOT NULL,
  \`base_salary\` DECIMAL(15, 2) NOT NULL,
  \`allowance_transport\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  \`allowance_meal\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  \`allowance_bonus\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  \`deduction_late\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Dihitung otomatis dari tabel attendances',
  \`deduction_bpjs_kesehatan\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT '1% Gaji Pokok',
  \`deduction_bpjs_ketenagakerjaan\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT '2% JHT+JP',
  \`deduction_pph21\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Pajak Penghasilan',
  \`net_salary\` DECIMAL(15, 2) NOT NULL COMMENT 'Take Home Pay = Penerimaan - Potongan',
  \`payment_status\` ENUM('Draft', 'Diproses', 'Dibayar') NOT NULL DEFAULT 'Draft',
  \`payment_date\` DATE NULL,
  \`processed_by_user_id\` VARCHAR(36) NULL COMMENT 'Audit log ID Finance yang memproses',
  \`total_days_present\` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  \`total_days_late\` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT \`fk_payrolls_employee\`
    FOREIGN KEY (\`employee_id\`) REFERENCES \`employees\` (\`id\`)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT \`fk_payrolls_user\`
    FOREIGN KEY (\`processed_by_user_id\`) REFERENCES \`users\` (\`id\`)
    ON DELETE SET NULL ON UPDATE CASCADE,

  UNIQUE KEY \`uk_employee_payroll_period\` (\`employee_id\`, \`period_month\`, \`period_year\`),
  INDEX \`idx_payrolls_period\` (\`period_year\`, \`period_month\`),
  INDEX \`idx_payrolls_status\` (\`payment_status\`)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 7. TABEL: LOWONGAN KERJA (Job Openings - Hak Akses HR)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`job_openings\` (
  \`id\` VARCHAR(30) PRIMARY KEY COMMENT 'Format: JOB-XXX',
  \`title\` VARCHAR(150) NOT NULL,
  \`department_id\` INT UNSIGNED NOT NULL,
  \`job_type\` ENUM('Full-time', 'Part-time', 'Contract') NOT NULL DEFAULT 'Full-time',
  \`location\` VARCHAR(100) NOT NULL,
  \`experience_level\` VARCHAR(50) NOT NULL DEFAULT 'Mid-Level',
  \`salary_min\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  \`salary_max\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  \`quota\` INT UNSIGNED NOT NULL DEFAULT 1,
  \`status\` ENUM('Buka', 'Tutup', 'Draft') NOT NULL DEFAULT 'Buka',
  \`description\` TEXT NOT NULL,
  \`requirements\` JSON NULL,
  \`posted_by_user_id\` VARCHAR(36) NULL,
  \`posted_date\` DATE NOT NULL,
  \`deadline_date\` DATE NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT \`fk_jobs_department\`
    FOREIGN KEY (\`department_id\`) REFERENCES \`departments\` (\`id\`)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT \`fk_jobs_user\`
    FOREIGN KEY (\`posted_by_user_id\`) REFERENCES \`users\` (\`id\`)
    ON DELETE SET NULL ON UPDATE CASCADE,

  INDEX \`idx_jobs_status\` (\`status\`)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 8. TABEL: KANDIDAT PELAMAR (Candidates - Hak Akses HR)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`candidates\` (
  \`id\` VARCHAR(30) PRIMARY KEY COMMENT 'Format: CND-XXX',
  \`job_opening_id\` VARCHAR(30) NOT NULL,
  \`full_name\` VARCHAR(150) NOT NULL,
  \`email\` VARCHAR(100) NOT NULL,
  \`phone\` VARCHAR(30) NOT NULL,
  \`education\` VARCHAR(150) NOT NULL,
  \`experience_years\` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  \`stage\` ENUM('Melamar', 'Screening', 'Wawancara', 'Penawaran', 'Diterima', 'Ditolak') NOT NULL DEFAULT 'Melamar',
  \`resume_file_url\` VARCHAR(255) NOT NULL,
  \`interview_score\` TINYINT UNSIGNED NULL,
  \`notes\` TEXT NULL,
  \`applied_date\` DATE NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT \`fk_candidates_job\`
    FOREIGN KEY (\`job_opening_id\`) REFERENCES \`job_openings\` (\`id\`)
    ON DELETE CASCADE ON UPDATE CASCADE,

  INDEX \`idx_candidates_stage\` (\`stage\`)
) ENGINE=InnoDB;`;

  // 4. Sample React RBAC Component Code
  const reactSampleCode = `// ============================================================================
// CONTOH KODE REACT: RoleGuardedLayout.tsx
// Implementasi Role-Based Access Control (RBAC) di Sisi Frontend
// Fitur: AuthContext, Role-based conditional rendering, Route Protection
// ============================================================================

import React, { createContext, useContext, useState } from 'react';
import { 
  Users, 
  Clock, 
  Banknote, 
  Briefcase, 
  LayoutDashboard, 
  ShieldAlert, 
  Lock 
} from 'lucide-react';

export type UserRole = 'KARYAWAN' | 'HR' | 'FINANCE';

export interface UserAccount {
  id: string;
  name: string;
  role: UserRole;
  employeeId: string;
}

// 1. Context Auth & Permission Helper
interface AuthContextType {
  user: UserAccount;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};

// 2. Komponen Navigasi Dinamis Berdasarkan Role (Role-Based Rendering)
export const RoleBasedSidebar: React.FC<{ activeTab: string; onSelectTab: (tab: string) => void }> = ({
  activeTab,
  onSelectTab,
}) => {
  const { user, hasRole } = useAuth();

  // Definisi konfigurasi menu beserta izin peran (Permissions)
  const menuConfig = [
    {
      id: 'dashboard',
      label: user.role === 'KARYAWAN' ? 'Dashboard Mandiri' : 'Executive Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
      allowedRoles: ['KARYAWAN', 'HR', 'FINANCE'] as UserRole[],
    },
    {
      id: 'employees',
      label: '1. Master Data Karyawan',
      icon: <Users className="w-4 h-4" />,
      allowedRoles: ['HR'] as UserRole[], // Hanya HR yang dapat mengakses CRUD master data
    },
    {
      id: 'attendance',
      label: user.role === 'KARYAWAN' ? '2. Presensi Mandiri' : '2. Presensi & Kehadiran',
      icon: <Clock className="w-4 h-4" />,
      allowedRoles: ['KARYAWAN', 'HR', 'FINANCE'] as UserRole[],
    },
    {
      id: 'payroll',
      label: user.role === 'KARYAWAN' ? '3. Slip Gaji Saya' : '3. Pengolahan Gaji (Payroll)',
      icon: <Banknote className="w-4 h-4" />,
      // Segregasi tugas: Karyawan melihat slip sendiri, Finance mengelola penuh.
      // HR dibatasi agar tidak dapat mengeksekusi kalkulasi dana finansial.
      allowedRoles: ['KARYAWAN', 'FINANCE'] as UserRole[],
    },
    {
      id: 'recruitment',
      label: '4. Perekrutan (ATS)',
      icon: <Briefcase className="w-4 h-4" />,
      allowedRoles: ['HR'] as UserRole[], // Hanya HR yang dapat mengelola lowongan kerja
    },
  ];

  // Filter menu yang HANYA diizinkan untuk peran user aktif
  const visibleMenus = menuConfig.filter((item) => hasRole(item.allowedRoles));

  return (
    <nav className="w-64 bg-slate-900 text-slate-200 p-4 min-h-screen space-y-2">
      <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
        Menu Akses ({user.role})
      </div>

      {visibleMenus.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelectTab(item.id)}
          className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition \${
            activeTab === item.id 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'hover:bg-slate-800 text-slate-300'
          }\`}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

// 3. Higher-Order Guard Component untuk Memproteksi Modul Konten
export const RoleGuard: React.FC<{
  allowedRoles: UserRole[];
  children: React.ReactNode;
}> = ({ allowedRoles, children }) => {
  const { user, hasRole } = useAuth();

  if (!hasRole(allowedRoles)) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm max-w-lg mx-auto mt-12">
        <Lock className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="font-bold text-base text-slate-800">Akses Ditolak (403 Forbidden)</h3>
        <p className="text-xs text-slate-500 mt-1">
          Halaman ini memerlukan wewenang [<strong>{allowedRoles.join(', ')}</strong>]. 
          Anda saat ini login sebagai <strong>{user.role}</strong>.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase">
            <ShieldCheck className="w-4 h-4" />
            Spesifikasi Arsitektur Sistem & RBAC
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Arsitektur Database MySQL, Alur Logika RBAC, & REST API
          </h2>
          <p className="text-sm text-slate-500">
            Desain relasi tabel MySQL berstandar industri dengan isolasi peran (Karyawan, HR, Finance) dan middleware keamanan API.
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveSection('DATABASE')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeSection === 'DATABASE'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          1. Skema Tabel MySQL (DDL + RBAC)
        </button>

        <button
          onClick={() => setActiveSection('ERD')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeSection === 'ERD'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          2. Diagram Relasi Entitas (ERD)
        </button>

        <button
          onClick={() => setActiveSection('LOGIC')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeSection === 'LOGIC'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <Workflow className="w-4 h-4" />
          3. Alur Otomatisasi & Hak Akses (RBAC)
        </button>

        <button
          onClick={() => setActiveSection('API')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeSection === 'API'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <Globe className="w-4 h-4" />
          4. Desain REST API & Middleware
        </button>

        <button
          onClick={() => setActiveSection('REACT_CODE')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeSection === 'REACT_CODE'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <Code className="w-4 h-4" />
          5. Contoh Kode React (RBAC Rendering)
        </button>
      </div>

      {/* 1. DATABASE DDL VIEW */}
      {activeSection === 'DATABASE' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900 text-slate-300 px-5 py-3 rounded-t-2xl">
            <div className="flex items-center gap-2 text-xs font-mono">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>schema_hris_mysql_rbac.sql (Tabel users, roles, employees, dll)</span>
            </div>
            <button
              onClick={() => copyToClipboard(mysqlSchemaDDL, 'mysql_ddl')}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition"
            >
              {copiedKey === 'mysql_ddl' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Skema SQL</span>
                </>
              )}
            </button>
          </div>
          <pre className="bg-slate-950 text-slate-200 p-5 rounded-b-2xl overflow-x-auto text-xs font-mono leading-relaxed border border-slate-800 max-h-[600px]">
            {mysqlSchemaDDL}
          </pre>
        </div>
      )}

      {/* 2. VISUAL ERD VIEW */}
      {activeSection === 'ERD' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">
              Entity-Relationship Diagram (ERD Relasional & RBAC)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Hubungan terpusat antara Otentikasi (Users & Roles) dengan 4 Modul Operasional HRIS.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Box: roles */}
            <div className="border border-indigo-200 dark:border-indigo-800 rounded-xl overflow-hidden bg-indigo-50/50 dark:bg-indigo-950/30">
              <div className="bg-indigo-600 text-white px-3 py-2 text-xs font-bold flex items-center justify-between">
                <span>roles</span>
                <span className="text-[10px] font-mono bg-indigo-700 px-1.5 py-0.5 rounded">RBAC (1)</span>
              </div>
              <div className="p-3 text-xs font-mono space-y-1">
                <div className="text-amber-600 font-bold">PK  id: INT</div>
                <div>    code: ENUM('KARYAWAN', 'HR', 'FINANCE')</div>
                <div>    name: VARCHAR(50)</div>
              </div>
            </div>

            {/* Box: users */}
            <div className="border border-blue-200 dark:border-blue-800 rounded-xl overflow-hidden bg-blue-50/50 dark:bg-blue-950/30">
              <div className="bg-blue-600 text-white px-3 py-2 text-xs font-bold flex items-center justify-between">
                <span>users</span>
                <span className="text-[10px] font-mono bg-blue-700 px-1.5 py-0.5 rounded">Auth Center</span>
              </div>
              <div className="p-3 text-xs font-mono space-y-1">
                <div className="text-amber-600 font-bold">PK  id: VARCHAR(36)</div>
                <div>    username: VARCHAR(50)</div>
                <div className="text-indigo-600 font-semibold">FK  role_id: INT</div>
                <div className="text-emerald-600 font-semibold">FK  employee_id: VARCHAR(30)</div>
                <div>    is_active: BOOLEAN</div>
              </div>
            </div>

            {/* Box: employees */}
            <div className="border border-emerald-200 dark:border-emerald-800 rounded-xl overflow-hidden bg-emerald-50/50 dark:bg-emerald-950/30">
              <div className="bg-emerald-600 text-white px-3 py-2 text-xs font-bold flex items-center justify-between">
                <span>employees</span>
                <span className="text-[10px] font-mono bg-emerald-700 px-1.5 py-0.5 rounded">Master Data</span>
              </div>
              <div className="p-3 text-xs font-mono space-y-1">
                <div className="text-amber-600 font-bold">PK  id: VARCHAR(30)</div>
                <div>    nik: CHAR(16) UNIQUE</div>
                <div>    full_name: VARCHAR(150)</div>
                <div className="text-blue-500 font-semibold">FK  department_id: INT</div>
                <div>    base_salary: DECIMAL</div>
                <div>    status: ENUM</div>
              </div>
            </div>

            {/* Box: attendances */}
            <div className="border border-amber-200 dark:border-amber-800 rounded-xl overflow-hidden bg-amber-50/50 dark:bg-amber-950/30">
              <div className="bg-amber-600 text-white px-3 py-2 text-xs font-bold flex items-center justify-between">
                <span>attendances</span>
                <span className="text-[10px] font-mono bg-amber-700 px-1.5 py-0.5 rounded">Presensi</span>
              </div>
              <div className="p-3 text-xs font-mono space-y-1">
                <div className="text-amber-600 font-bold">PK  id: BIGINT</div>
                <div className="text-emerald-600 font-semibold">FK  employee_id: VARCHAR</div>
                <div>    date: DATE</div>
                <div>    clock_in / clock_out</div>
                <div>    late_minutes: INT</div>
              </div>
            </div>

            {/* Box: payrolls */}
            <div className="border border-purple-200 dark:border-purple-800 rounded-xl overflow-hidden bg-purple-50/50 dark:bg-purple-950/30">
              <div className="bg-purple-600 text-white px-3 py-2 text-xs font-bold flex items-center justify-between">
                <span>payrolls</span>
                <span className="text-[10px] font-mono bg-purple-700 px-1.5 py-0.5 rounded">Finance Isolated</span>
              </div>
              <div className="p-3 text-xs font-mono space-y-1">
                <div className="text-amber-600 font-bold">PK  id: VARCHAR(50)</div>
                <div className="text-emerald-600 font-semibold">FK  employee_id: VARCHAR</div>
                <div>    deduction_late: DECIMAL</div>
                <div>    net_salary: DECIMAL</div>
                <div className="text-blue-500 font-semibold">FK  processed_by_user_id</div>
                <div>    payment_status: ENUM</div>
              </div>
            </div>

            {/* Box: job_openings */}
            <div className="border border-cyan-200 dark:border-cyan-800 rounded-xl overflow-hidden bg-cyan-50/50 dark:bg-cyan-950/30">
              <div className="bg-cyan-600 text-white px-3 py-2 text-xs font-bold flex items-center justify-between">
                <span>job_openings</span>
                <span className="text-[10px] font-mono bg-cyan-700 px-1.5 py-0.5 rounded">HR ATS</span>
              </div>
              <div className="p-3 text-xs font-mono space-y-1">
                <div className="text-amber-600 font-bold">PK  id: VARCHAR(30)</div>
                <div>    title: VARCHAR(150)</div>
                <div className="text-blue-500 font-semibold">FK  posted_by_user_id</div>
                <div>    status: ENUM('Buka','Tutup')</div>
              </div>
            </div>

            {/* Box: candidates */}
            <div className="border border-rose-200 dark:border-rose-800 rounded-xl overflow-hidden bg-rose-50/50 dark:bg-rose-950/30">
              <div className="bg-rose-600 text-white px-3 py-2 text-xs font-bold flex items-center justify-between">
                <span>candidates</span>
                <span className="text-[10px] font-mono bg-rose-700 px-1.5 py-0.5 rounded">Pelamar</span>
              </div>
              <div className="p-3 text-xs font-mono space-y-1">
                <div className="text-amber-600 font-bold">PK  id: VARCHAR(30)</div>
                <div className="text-cyan-600 font-semibold">FK  job_opening_id</div>
                <div>    stage: ENUM</div>
                <div className="text-emerald-600 font-bold">    → Hire to employees!</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. ALUR LOGIKA OTOMATISASI & HAK AKSES */}
      {activeSection === 'LOGIC' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">
              Alur Logika Otomatisasi & Sistem Hak Akses (RBAC)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Bagaimana otentikasi JWT, pembatasan wewenang divisi, dan otomatisasi antar-modul bekerja bersama:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
              {/* Role 1: KARYAWAN */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/20 dark:border-emerald-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                    <Users className="w-4 h-4 text-emerald-600" />
                    1. Role: KARYAWAN (Self-Service)
                  </div>
                  <div className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    <p>
                      • <strong>Login & Identitas</strong>: Begitu login via <code>/api/auth/login</code>, token JWT memuat klaim <code>employeeId</code> yang terkunci.
                    </p>
                    <p>
                      • <strong>Presensi Mandiri</strong>: Karyawan melakukan Clock-In dan Clock-Out langsung. Sistem otomatis mendeteksi geofence dan menghitung status tepat waktu / terlambat tanpa intervensi admin.
                    </p>
                    <p>
                      • <strong>Slip Gaji Mandiri</strong>: Karyawan hanya dapat melihat dan mengunduh slip gaji miliknya sendiri. Data payroll karyawan lain diblokir di level database (<code>WHERE employee_id = auth.employeeId</code>).
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-2 border-t border-emerald-200 text-[11px] text-emerald-700 font-semibold">
                  Manfaat: Mengeliminasi 100% permintaan rekap manual & cetak fisik slip gaji ke HR.
                </div>
              </div>

              {/* Role 2: HR */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 dark:bg-blue-950/20 dark:border-blue-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-bold text-sm">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    2. Role: HR (Human Resources)
                  </div>
                  <div className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    <p>
                      • <strong>Master Data Karyawan</strong>: Wewenang penuh menambahkan, mengedit, atau menonaktifkan profil karyawan serta status kepegawaian.
                    </p>
                    <p>
                      • <strong>Manajemen Kehadiran</strong>: Akses rekapitulasi kehadiran seluruh departemen untuk audit disiplin kerja.
                    </p>
                    <p>
                      • <strong>Rekrutmen (ATS)</strong>: Menerbitkan lowongan kerja dan mengelola pelamar. Saat kandidat lolos, fitur <em>&quot;Angkat Jadi Karyawan&quot;</em> secara otomatis menyalin data kandidat ke tabel <code>employees</code>.
                    </p>
                    <p>
                      • <strong>Segregasi Tugas</strong>: Modul eksekusi pembayaran gaji dikunci dari HR untuk mencegah manipulasi nominal finansial.
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-2 border-t border-blue-200 text-[11px] text-blue-700 font-semibold">
                  Manfaat: HR bebas dari birokrasi absensi manual & fokus pada talent acquisition & retensi.
                </div>
              </div>

              {/* Role 3: FINANCE */}
              <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/60 dark:bg-purple-950/20 dark:border-purple-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-purple-800 dark:text-purple-300 font-bold text-sm">
                    <Banknote className="w-4 h-4 text-purple-600" />
                    3. Role: FINANCE (Keuangan)
                  </div>
                  <div className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    <p>
                      • <strong>Akses Khusus Terisolasi</strong>: Hanya Finance yang dapat mengeksekusi kalkulasi payroll massal dan memvalidasi status pembayaran (<code>Draft</code> ➔ <code>Diproses</code> ➔ <code>Dibayar</code>).
                    </p>
                    <p>
                      • <strong>Otomatisasi Potongan Denda</strong>: Payroll Engine secara otomatis menarik akumulasi menit keterlambatan dari tabel <code>attendances</code> dan memotong gaji pokok secara proporsional.
                    </p>
                    <p>
                      • <strong>Kalkulasi Pajak & Asuransi</strong>: Perhitungan PPh 21, BPJS Kesehatan (1%), dan BPJS Ketenagakerjaan (2%) terkalkulasi otomatis tanpa rumus Excel manual.
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-2 border-t border-purple-200 text-[11px] text-purple-700 font-semibold">
                  Manfaat: Menghilangkan human error perhitungan gaji & menjamin kepatuhan pajak perusahaan.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. REST API & MIDDLEWARE SPECIFICATION */}
      {activeSection === 'API' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">
              Katalog REST API & Aturan Middleware Hak Akses (RBAC)
            </h3>
            <p className="text-xs text-slate-500">
              Setiap request diamankan oleh <code>authMiddleware</code> (validasi JWT Token) dan <code>requireRole(['ROLE'])</code>.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Modul</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Endpoint URL</th>
                  <th className="py-2.5 px-3">Middleware & Role Izin</th>
                  <th className="py-2.5 px-3">Deskripsi & Pembatasan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {/* Auth */}
                <tr>
                  <td className="py-2.5 px-3 font-sans font-semibold text-slate-700">Otentikasi</td>
                  <td className="py-2.5 px-3"><span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold">POST</span></td>
                  <td className="py-2.5 px-3 text-slate-900 dark:text-white font-bold">/api/auth/login</td>
                  <td className="py-2.5 px-3 font-sans text-slate-500">Public (No Auth)</td>
                  <td className="py-2.5 px-3 font-sans">Login user & return JWT token berisi claims role & employeeId</td>
                </tr>

                {/* Employees */}
                <tr>
                  <td className="py-2.5 px-3 font-sans font-semibold text-blue-600">Karyawan</td>
                  <td className="py-2.5 px-3"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">GET</span></td>
                  <td className="py-2.5 px-3 text-slate-900 dark:text-white font-bold">/api/employees</td>
                  <td className="py-2.5 px-3 font-sans"><span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold">requireRole(['HR'])</span></td>
                  <td className="py-2.5 px-3 font-sans">Daftar semua karyawan (Hanya HR untuk pengelolaan data)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-sans font-semibold text-blue-600">Karyawan</td>
                  <td className="py-2.5 px-3"><span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold">POST</span></td>
                  <td className="py-2.5 px-3 text-slate-900 dark:text-white font-bold">/api/employees</td>
                  <td className="py-2.5 px-3 font-sans"><span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold">requireRole(['HR'])</span></td>
                  <td className="py-2.5 px-3 font-sans">Menerbitkan data karyawan baru</td>
                </tr>

                {/* Attendance */}
                <tr>
                  <td className="py-2.5 px-3 font-sans font-semibold text-emerald-600">Kehadiran</td>
                  <td className="py-2.5 px-3"><span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold">POST</span></td>
                  <td className="py-2.5 px-3 text-slate-900 dark:text-white font-bold">/api/attendance/clock-in</td>
                  <td className="py-2.5 px-3 font-sans"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">requireRole(['KARYAWAN','HR'])</span></td>
                  <td className="py-2.5 px-3 font-sans">Presensi masuk mandiri. employeeId otomatis diambil dari token JWT</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-sans font-semibold text-emerald-600">Kehadiran</td>
                  <td className="py-2.5 px-3"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">GET</span></td>
                  <td className="py-2.5 px-3 text-slate-900 dark:text-white font-bold">/api/attendance/recap</td>
                  <td className="py-2.5 px-3 font-sans"><span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-bold">requireRole(['HR','FINANCE'])</span></td>
                  <td className="py-2.5 px-3 font-sans">Rekap bulanan seluruh staf untuk HR (disiplin) & Finance (audit denda)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-sans font-semibold text-emerald-600">Kehadiran</td>
                  <td className="py-2.5 px-3"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">GET</span></td>
                  <td className="py-2.5 px-3 text-slate-900 dark:text-white font-bold">/api/attendance/me</td>
                  <td className="py-2.5 px-3 font-sans"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">requireRole(['KARYAWAN'])</span></td>
                  <td className="py-2.5 px-3 font-sans">Log presensi mandiri hanya untuk karyawan yang sedang login</td>
                </tr>

                {/* Payroll */}
                <tr>
                  <td className="py-2.5 px-3 font-sans font-semibold text-purple-600">Payroll</td>
                  <td className="py-2.5 px-3"><span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold">POST</span></td>
                  <td className="py-2.5 px-3 text-slate-900 dark:text-white font-bold">/api/payroll/generate</td>
                  <td className="py-2.5 px-3 font-sans"><span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-bold">requireRole(['FINANCE'])</span></td>
                  <td className="py-2.5 px-3 font-sans">Kalkulasi gaji otomatis (Eksklusif Divisi Keuangan)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-sans font-semibold text-purple-600">Payroll</td>
                  <td className="py-2.5 px-3"><span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold">PUT</span></td>
                  <td className="py-2.5 px-3 text-slate-900 dark:text-white font-bold">/api/payroll/:id/status</td>
                  <td className="py-2.5 px-3 font-sans"><span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-bold">requireRole(['FINANCE'])</span></td>
                  <td className="py-2.5 px-3 font-sans">Approval & pencairan dana gaji (Draft ➔ Diproses ➔ Dibayar)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-sans font-semibold text-purple-600">Payroll</td>
                  <td className="py-2.5 px-3"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">GET</span></td>
                  <td className="py-2.5 px-3 text-slate-900 dark:text-white font-bold">/api/payroll/my-payslips</td>
                  <td className="py-2.5 px-3 font-sans"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">requireRole(['KARYAWAN'])</span></td>
                  <td className="py-2.5 px-3 font-sans">Self-service unduh slip gaji sendiri (Dibatasi pada record auth user)</td>
                </tr>

                {/* Recruitment */}
                <tr>
                  <td className="py-2.5 px-3 font-sans font-semibold text-cyan-600">Rekrutmen</td>
                  <td className="py-2.5 px-3"><span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold">POST</span></td>
                  <td className="py-2.5 px-3 text-slate-900 dark:text-white font-bold">/api/jobs</td>
                  <td className="py-2.5 px-3 font-sans"><span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold">requireRole(['HR'])</span></td>
                  <td className="py-2.5 px-3 font-sans">Buka lowongan kerja baru oleh HR</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-sans font-semibold text-cyan-600">Rekrutmen</td>
                  <td className="py-2.5 px-3"><span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold">POST</span></td>
                  <td className="py-2.5 px-3 text-slate-900 dark:text-white font-bold">/api/candidates/:id/convert</td>
                  <td className="py-2.5 px-3 font-sans"><span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold">requireRole(['HR'])</span></td>
                  <td className="py-2.5 px-3 font-sans">Konversi otomatis kandidat lolos menjadi karyawan di tabel employees</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. REACT CODE EXAMPLE VIEW */}
      {activeSection === 'REACT_CODE' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900 text-slate-300 px-5 py-3 rounded-t-2xl">
            <div className="flex items-center gap-2 text-xs font-mono">
              <FileCode className="w-4 h-4 text-blue-400" />
              <span>src/components/RoleGuardedLayout.tsx (Role-based rendering & Route guards)</span>
            </div>
            <button
              onClick={() => copyToClipboard(reactSampleCode, 'react_code')}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition"
            >
              {copiedKey === 'react_code' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Kode React</span>
                </>
              )}
            </button>
          </div>
          <pre className="bg-slate-950 text-slate-200 p-5 rounded-b-2xl overflow-x-auto text-xs font-mono leading-relaxed border border-slate-800">
            {reactSampleCode}
          </pre>
        </div>
      )}
    </div>
  );
};

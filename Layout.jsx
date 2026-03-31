// ============================================================
// components/Layout/Layout.jsx
// Main app shell: collapsible sidebar + top bar + <Outlet />
// ============================================================
import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Navigation items shown in the sidebar
const NAV_ITEMS = [
  { path: '/dashboard', icon: '⬡', label: 'Dashboard',    desc: 'Overview & stats' },
  { path: '/report',    icon: '＋', label: 'Report Issue', desc: 'Submit new report' },
  { path: '/reports',   icon: '≡', label: 'All Reports',  desc: 'Browse reports' },
  { path: '/map',       icon: '◎', label: 'Map View',     desc: 'Visual map' },
];

// Page title lookup for the top bar
const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/report':    'Report Issue',
  '/reports':   'All Reports',
  '/map':       'Map View',
  '/admin':     'Admin Panel',
};

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const [open, setOpen] = useState(true); // sidebar open/collapsed

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentTitle = PAGE_TITLES[location.pathname] || 'UrbanLens';

  return (
    <div className="flex h-screen overflow-hidden bg-dark-900">

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside
        className={`
          ${open ? 'w-64' : 'w-16'}
          transition-all duration-300 ease-in-out
          flex flex-col flex-shrink-0
          bg-dark-800 border-r border-white/5
          relative z-20
        `}
      >
        {/* Logo / Brand */}
        <div className="h-16 flex items-center px-4 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-accent-cyan/15 border border-accent-cyan/30
                            flex items-center justify-center flex-shrink-0 relative">
              <span className="text-accent-cyan font-bold text-sm">U</span>
              {/* Animated ping dot */}
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400">
                <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
              </span>
            </div>
            {open && (
              <div className="overflow-hidden">
                <div className="text-sm font-bold text-white whitespace-nowrap">UrbanLens</div>
                <div className="text-[9px] font-mono text-gray-500 whitespace-nowrap tracking-widest">
                  CITYGUARD v1.0
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {/* Section label */}
          {open && (
            <div className="px-3 pt-3 pb-1">
              <span className="text-[9px] font-mono text-gray-600 tracking-widest uppercase">Navigation</span>
            </div>
          )}

          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              title={!open ? item.label : undefined}
              className={({ isActive }) =>
                `nav-item group ${isActive ? 'active' : ''} ${!open ? 'justify-center px-0' : ''}`
              }
            >
              <span className="text-base flex-shrink-0">{item.icon}</span>
              {open && (
                <div className="overflow-hidden">
                  <div className="text-sm leading-tight">{item.label}</div>
                  <div className="text-[10px] text-gray-600 group-hover:text-gray-500 transition-colors">
                    {item.desc}
                  </div>
                </div>
              )}
            </NavLink>
          ))}

          {/* Admin-only link */}
          {isAdmin && (
            <>
              {open && (
                <div className="px-3 pt-4 pb-1">
                  <span className="text-[9px] font-mono text-gray-600 tracking-widest uppercase">Admin</span>
                </div>
              )}
              <NavLink
                to="/admin"
                title={!open ? 'Admin Panel' : undefined}
                className={({ isActive }) =>
                  `nav-item group ${isActive ? 'active' : ''} ${!open ? 'justify-center px-0' : ''}`
                }
              >
                <span className="text-base flex-shrink-0">⚙</span>
                {open && (
                  <div>
                    <div className="text-sm leading-tight">Admin Panel</div>
                    <div className="text-[10px] text-gray-600">Manage all reports</div>
                  </div>
                )}
              </NavLink>
            </>
          )}
        </nav>

        {/* User profile footer */}
        <div className="p-3 border-t border-white/5 flex-shrink-0">
          <div className={`flex items-center gap-3 ${!open ? 'justify-center' : ''}`}>
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-cyan/30 to-accent-blue/30
                            border border-accent-cyan/30 flex items-center justify-center
                            text-accent-cyan text-xs font-bold flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>

            {open && (
              <>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-white truncate">{user?.name}</div>
                  <div className="text-[10px] text-gray-500 capitalize flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-accent-cyan' : 'bg-green-400'}`} />
                    {user?.role}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="text-gray-600 hover:text-red-400 transition-colors text-sm p-1 rounded hover:bg-red-400/10"
                >
                  ⏻
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="h-16 flex items-center justify-between px-6 flex-shrink-0
                           bg-dark-900/80 backdrop-blur border-b border-white/5 z-10">
          <div className="flex items-center gap-4">
            {/* Sidebar toggle */}
            <button
              onClick={() => setOpen(!open)}
              className="text-gray-500 hover:text-white transition-colors text-lg p-1 rounded
                         hover:bg-dark-600"
            >
              {open ? '←' : '→'}
            </button>

            {/* Breadcrumb */}
            <div>
              <span className="text-white font-semibold text-sm">{currentTitle}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-gray-600 font-mono">URBANLENS</span>
                <span className="text-[10px] text-gray-700">/</span>
                <span className="text-[10px] text-gray-500 font-mono uppercase">{currentTitle}</span>
              </div>
            </div>
          </div>

          {/* Right side status indicators */}
          <div className="flex items-center gap-4">
            {/* System status */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-700 border border-white/5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] font-mono text-gray-500">SYSTEM ONLINE</span>
            </div>

            {/* Current time */}
            <div className="hidden md:block text-[10px] font-mono text-gray-600">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>

            {/* Mobile user avatar */}
            <div className="w-7 h-7 rounded-full bg-accent-cyan/15 border border-accent-cyan/30
                            flex items-center justify-center text-accent-cyan text-xs font-bold sm:hidden">
              {user?.name?.[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 page-enter max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

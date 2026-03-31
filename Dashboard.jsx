// ============================================================
// components/Dashboard/Dashboard.jsx
// User dashboard: KPI cards, charts, recent activity feed
// ============================================================
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

// ── Constants ────────────────────────────────────────────────
const STATUS_COLORS = {
  Pending:      '#f59e0b',
  'In Progress':'#3b82f6',
  Resolved:     '#10b981',
};
const TYPE_COLORS = {
  Theft:          '#ef4444',
  Drainage:       '#3b82f6',
  'Street Light': '#f59e0b',
  Climate:        '#10b981',
};
const TYPE_ICONS = {
  Theft: '🔴', Drainage: '🔵', 'Street Light': '🟡', Climate: '🟢',
};

// ── Sub-components ────────────────────────────────────────────

// KPI stat card with animated fill bar
function StatCard({ label, value, icon, color, delta }) {
  const fill = Math.min((value / Math.max(value + 5, 10)) * 100, 100);
  return (
    <div className="stat-card group hover:scale-[1.01] transition-transform duration-200">
      {/* Subtle corner accent */}
      <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-3xl opacity-20 transition-opacity group-hover:opacity-30"
        style={{ background: `radial-gradient(circle at top right, ${color}, transparent)` }} />

      <div className="flex items-start justify-between mb-4 relative">
        <div>
          <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">{label}</p>
          <p className="text-4xl font-bold text-white mt-1 tabular-nums">{value}</p>
          {delta !== undefined && (
            <p className="text-xs text-gray-500 mt-1">
              {delta > 0 ? `↑ ${delta} this week` : delta < 0 ? `↓ ${Math.abs(delta)} this week` : 'No change'}
            </p>
          )}
        </div>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: `${color}18`, border: `1px solid ${color}35` }}>
          {icon}
        </div>
      </div>

      {/* Fill bar */}
      <div className="h-1.5 rounded-full bg-dark-500 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${fill}%`, background: `linear-gradient(90deg, ${color}80, ${color})` }} />
      </div>
    </div>
  );
}

// Custom tooltip for recharts
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-700 border border-white/10 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-sm font-semibold" style={{ color: p.fill || p.color }}>
          {p.value} reports
        </p>
      ))}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────
export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/stats')
      .then(({ data }) => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Helper: get count from aggregation array by key
  const getCount = (arr, key) => arr?.find((i) => i._id === key)?.count || 0;

  const total      = stats?.statusStats?.reduce((a, b) => a + b.count, 0) || 0;
  const pending    = getCount(stats?.statusStats, 'Pending');
  const inProgress = getCount(stats?.statusStats, 'In Progress');
  const resolved   = getCount(stats?.statusStats, 'Resolved');

  // Bar chart data
  const barData = [
    { name: 'Pending',     count: pending,    fill: STATUS_COLORS.Pending },
    { name: 'In Progress', count: inProgress, fill: STATUS_COLORS['In Progress'] },
    { name: 'Resolved',    count: resolved,   fill: STATUS_COLORS.Resolved },
  ];

  // Pie chart data
  const pieData = stats?.typeStats?.map((i) => ({
    name:  i._id,
    value: i.count,
    fill:  TYPE_COLORS[i._id] || '#6b7280',
  })) || [];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <div className="spinner" />
        <p className="text-gray-600 text-xs font-mono">LOADING DASHBOARD...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, <span className="text-accent-cyan">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {isAdmin ? 'Admin overview — all reports across the city' : 'Your personal reporting dashboard'}
          </p>
        </div>
        <Link to="/report" className="btn-primary text-sm self-start sm:self-auto">
          ＋ Report Issue
        </Link>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Reports"  value={total}      icon="📋" color="#00d4ff" />
        <StatCard label="Pending"        value={pending}    icon="⏳" color="#f59e0b" />
        <StatCard label="In Progress"    value={inProgress} icon="🔧" color="#3b82f6" />
        <StatCard label="Resolved"       value={resolved}   icon="✅" color="#10b981" />
      </div>

      {/* ── Charts Row ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Bar chart — takes 3 cols */}
        <div className="glass-card p-5 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-200">Reports by Status</h3>
            <span className="text-xs font-mono text-gray-600">{total} TOTAL</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} barSize={40}>
              <XAxis
                dataKey="name"
                tick={{ fill: '#6b7280', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {barData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Donut pie chart — takes 2 cols */}
        <div className="glass-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-200">By Issue Type</h3>
          </div>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-gray-600 text-sm">
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="45%"
                  innerRadius={55} outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span style={{ color: '#9ca3af', fontSize: 11 }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Issue Type Breakdown Cards ───────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {['Theft', 'Drainage', 'Street Light', 'Climate'].map((type) => {
          const count = getCount(stats?.typeStats, type);
          const pct   = total ? Math.round((count / total) * 100) : 0;
          return (
            <div key={type} className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <span>{TYPE_ICONS[type]}</span>
                <span className="text-xs text-gray-400">{type}</span>
              </div>
              <div className="text-2xl font-bold text-white">{count}</div>
              <div className="text-xs text-gray-600 mt-0.5">{pct}% of total</div>
              <div className="mt-2 h-1 rounded-full bg-dark-500 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: TYPE_COLORS[type] }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Recent Activity ──────────────────────────────────── */}
      <div className="glass-card">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/5">
          <h3 className="text-sm font-semibold text-gray-200">Recent Reports</h3>
          <Link to="/reports" className="text-xs text-accent-cyan hover:underline">
            View all →
          </Link>
        </div>

        {!stats?.recent?.length ? (
          <div className="p-12 text-center space-y-3">
            <div className="text-4xl">📭</div>
            <p className="text-gray-500 text-sm">No reports yet.</p>
            <Link to="/report" className="btn-primary text-sm inline-block">
              File your first report
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {stats.recent.map((r) => (
              <div key={r._id}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-dark-700/40 transition-colors">
                {/* Color dot */}
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: TYPE_COLORS[r.issueType] || '#6b7280',
                           boxShadow: `0 0 6px ${TYPE_COLORS[r.issueType] || '#6b7280'}80` }} />
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 truncate">{r.description}</p>
                  <p className="text-xs text-gray-600 mt-0.5 truncate">
                    📍 {r.location} · {r.user?.name}
                  </p>
                </div>
                {/* Meta */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    r.status === 'Pending' ? 'badge-pending' :
                    r.status === 'In Progress' ? 'badge-progress' : 'badge-resolved'
                  }`}>
                    {r.status}
                  </span>
                  <span className="text-[10px] text-gray-600">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

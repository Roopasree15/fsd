// ============================================================
// components/Admin/AdminPanel.jsx
// Admin dashboard: view, filter, update, and delete reports
// ============================================================
import { useState, useEffect } from 'react';
import api from '../../utils/api';

// ── Badge helpers ─────────────────────────────────────────────
const TYPE_BADGE = {
  Theft:          'badge-theft',
  Drainage:       'badge-drainage',
  'Street Light': 'badge-light',
  Climate:        'badge-climate',
};
const TYPE_DOT = {
  Theft:          '#ef4444',
  Drainage:       '#3b82f6',
  'Street Light': '#f59e0b',
  Climate:        '#10b981',
};

// ── Edit modal component ──────────────────────────────────────
function EditModal({ report, onClose, onSave }) {
  const [data,   setData]   = useState({ status: report.status, adminNote: report.adminNote || '', severity: report.severity });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(report._id, data);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    // Overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(8,12,20,0.85)', backdropFilter: 'blur(6px)' }}>
      <div className="glass-card w-full max-w-md p-6 shadow-2xl animate-slide-up glow-border">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">Update Report</h3>
          <button onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors text-xl leading-none">×</button>
        </div>

        {/* Report info summary */}
        <div className="bg-dark-800 rounded-lg p-3 mb-5 space-y-1">
          <p className="text-xs text-gray-500">
            <span className="text-gray-600">Type:</span> {report.issueType}
          </p>
          <p className="text-xs text-gray-500">
            <span className="text-gray-600">Location:</span> {report.location}
          </p>
          <p className="text-xs text-gray-500 line-clamp-2">
            <span className="text-gray-600">Description:</span> {report.description}
          </p>
        </div>

        {/* Status picker */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
            Status
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'Pending',      color: '#f59e0b', icon: '⏳' },
              { value: 'In Progress',  color: '#3b82f6', icon: '🔧' },
              { value: 'Resolved',     color: '#10b981', icon: '✅' },
            ].map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setData((d) => ({ ...d, status: s.value }))}
                className={`p-2.5 rounded-lg border text-sm font-medium transition-all ${
                  data.status === s.value
                    ? 'text-white'
                    : 'border-white/10 text-gray-500 hover:border-white/20'
                }`}
                style={data.status === s.value
                  ? { background: `${s.color}20`, borderColor: `${s.color}50`, color: s.color }
                  : {}}
              >
                <div className="text-lg mb-0.5">{s.icon}</div>
                <div className="text-xs">{s.value}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Severity */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
            Severity
          </label>
          <select
            className="input-field text-sm py-2"
            value={data.severity}
            onChange={(e) => setData((d) => ({ ...d, severity: e.target.value }))}
          >
            {['Low', 'Medium', 'High', 'Critical'].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* Admin note */}
        <div className="mb-5">
          <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
            Admin Note (optional)
          </label>
          <textarea
            className="input-field min-h-[80px] resize-none text-sm"
            placeholder="Add a note visible to the reporter..."
            value={data.adminNote}
            onChange={(e) => setData((d) => ({ ...d, adminNote: e.target.value }))}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function AdminPanel() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ issueType: '', status: '' });
  const [search,  setSearch]  = useState('');
  const [editing, setEditing] = useState(null); // report being edited
  const [toast,   setToast]   = useState('');

  // Summary counts (computed from loaded reports)
  const counts = {
    total:      reports.length,
    pending:    reports.filter((r) => r.status === 'Pending').length,
    inProgress: reports.filter((r) => r.status === 'In Progress').length,
    resolved:   reports.filter((r) => r.status === 'Resolved').length,
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = { limit: 200 };
      if (filters.issueType) params.issueType = filters.issueType;
      if (filters.status)    params.status    = filters.status;

      const { data } = await api.get('/reports', { params });
      setReports(data.reports);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, [filters]);

  // Show a temporary toast notification
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // Save updated report from modal
  const handleSave = async (id, updateData) => {
    const { data } = await api.put(`/reports/${id}`, updateData);
    setReports((prev) => prev.map((r) => r._id === id ? data.report : r));
    showToast('✓ Report updated successfully');
  };

  // Delete a report
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to permanently delete this report?')) return;
    try {
      await api.delete(`/reports/${id}`);
      setReports((prev) => prev.filter((r) => r._id !== id));
      showToast('Report deleted');
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // Client-side search
  const filtered = reports.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.location?.toLowerCase().includes(q)    ||
      r.description?.toLowerCase().includes(q) ||
      r.issueType?.toLowerCase().includes(q)   ||
      r.user?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Toast notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-dark-700 border border-green-500/30
                        text-green-400 text-sm px-4 py-3 rounded-lg shadow-xl animate-slide-up">
          {toast}
        </div>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <span className="text-xs px-2 py-0.5 rounded bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan font-mono">
            ADMIN
          </span>
        </div>
        <p className="text-gray-500 text-sm mt-0.5">Manage and resolve all city reports</p>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',       value: counts.total,      color: '#00d4ff', icon: '📋' },
          { label: 'Pending',     value: counts.pending,    color: '#f59e0b', icon: '⏳' },
          { label: 'In Progress', value: counts.inProgress, color: '#3b82f6', icon: '🔧' },
          { label: 'Resolved',    value: counts.resolved,   color: '#10b981', icon: '✅' },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="glass-card p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
              <span className="text-base">{icon}</span>
            </div>
            <div className="text-3xl font-bold" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="glass-card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
          <input
            className="input-field pl-9 text-sm py-2"
            placeholder="Search reports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input-field w-44 text-sm py-2" value={filters.issueType}
          onChange={(e) => setFilters((f) => ({ ...f, issueType: e.target.value }))}>
          <option value="">All Types</option>
          {['Theft', 'Drainage', 'Street Light', 'Climate'].map((t) => <option key={t}>{t}</option>)}
        </select>
        <select className="input-field w-44 text-sm py-2" value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
          <option value="">All Status</option>
          {['Pending', 'In Progress', 'Resolved'].map((s) => <option key={s}>{s}</option>)}
        </select>
        {(filters.issueType || filters.status || search) && (
          <button onClick={() => { setFilters({ issueType: '', status: '' }); setSearch(''); }}
            className="text-xs text-gray-500 hover:text-red-400 transition-colors">
            ✕ Clear
          </button>
        )}
        <span className="text-xs text-gray-600 self-center font-mono ml-auto">
          {filtered.length} RECORDS
        </span>
      </div>

      {/* Reports table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-2">
          <div className="text-3xl">📭</div>
          <p className="text-gray-500">No reports match your filters</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8 bg-dark-800/60">
                  {['#', 'Type', 'Location', 'Description', 'User', 'Severity', 'Status', 'Date', 'Actions'].map((h) => (
                    <th key={h}
                      className="text-left text-[10px] font-semibold text-gray-600 uppercase
                                 tracking-widest px-4 py-3 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr
                    key={r._id}
                    className={`border-b border-white/5 hover:bg-dark-700/40 transition-colors ${
                      i % 2 === 0 ? '' : 'bg-dark-800/20'
                    }`}
                  >
                    {/* Row number */}
                    <td className="px-4 py-3.5 text-xs text-gray-700 font-mono">{i + 1}</td>

                    {/* Type */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full"
                          style={{ background: TYPE_DOT[r.issueType] || '#6b7280' }} />
                        <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_BADGE[r.issueType] || ''}`}>
                          {r.issueType}
                        </span>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-gray-300 max-w-[120px] truncate block">
                        {r.location}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <span className="text-sm text-gray-400 max-w-[200px] truncate block">
                        {r.description}
                      </span>
                    </td>

                    {/* User */}
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <div>
                        <div className="text-sm text-gray-300">{r.user?.name || '—'}</div>
                        <div className="text-[10px] text-gray-600">{r.user?.email}</div>
                      </div>
                    </td>

                    {/* Severity */}
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <span className={`text-xs font-medium ${
                        r.severity === 'Critical' ? 'text-red-400' :
                        r.severity === 'High'     ? 'text-orange-400' :
                        r.severity === 'Medium'   ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {r.severity}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        r.status === 'Pending'     ? 'badge-pending' :
                        r.status === 'In Progress' ? 'badge-progress' : 'badge-resolved'
                      }`}>
                        {r.status}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3.5 hidden xl:table-cell">
                      <span className="text-xs text-gray-600">
                        {new Date(r.createdAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: '2-digit',
                        })}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setEditing(r)}
                          className="text-xs px-2.5 py-1.5 bg-blue-500/15 text-blue-400 rounded-lg
                                     hover:bg-blue-500/25 transition-colors border border-blue-500/20
                                     whitespace-nowrap"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(r._id)}
                          className="text-xs px-2.5 py-1.5 bg-red-500/15 text-red-400 rounded-lg
                                     hover:bg-red-500/25 transition-colors border border-red-500/20"
                        >
                          Del
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 border-t border-white/5 flex items-center justify-between">
            <span className="text-[10px] text-gray-600 font-mono">{filtered.length} REPORTS LOADED</span>
            <button onClick={fetchReports}
              className="text-xs text-gray-600 hover:text-accent-cyan transition-colors">
              ↻ Refresh
            </button>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <EditModal
          report={editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

// ============================================================
// components/Map/MapView.jsx
// Interactive Leaflet map showing all issue reports as
// color-coded circle markers with popups
// ============================================================
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import api from '../../utils/api';

// ── Issue type visual config ──────────────────────────────────
const TYPE_CONFIG = {
  Theft:          { color: '#ef4444', glow: '#ef444460', icon: '🔴', label: 'Theft-Prone' },
  Drainage:       { color: '#3b82f6', glow: '#3b82f660', icon: '🔵', label: 'Drainage' },
  'Street Light': { color: '#f59e0b', glow: '#f59e0b60', icon: '🟡', label: 'Street Light' },
  Climate:        { color: '#10b981', glow: '#10b98160', icon: '🟢', label: 'Climate Risk' },
};

const STATUS_COLORS = {
  Pending:      '#f59e0b',
  'In Progress':'#3b82f6',
  Resolved:     '#10b981',
};

// ── Auto-fit map bounds when reports load ─────────────────────
function FitBounds({ reports }) {
  const map = useMap();

  useEffect(() => {
    if (!reports.length) return;
    const validReports = reports.filter(
      (r) => r.coordinates?.lat && r.coordinates?.lng
    );
    if (!validReports.length) return;

    const bounds = validReports.map((r) => [r.coordinates.lat, r.coordinates.lng]);
    try {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    } catch (_) {
      // fallback: do nothing if bounds are degenerate
    }
  }, [reports]);

  return null;
}

// ── Main Component ────────────────────────────────────────────
export default function MapView() {
  const [reports,     setReports]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [typeFilter,  setTypeFilter]  = useState('');
  const [statusFilter,setStatusFilter]= useState('');
  const [hoveredId,   setHoveredId]   = useState(null);

  useEffect(() => {
    api.get('/reports', { params: { limit: 500 } })
      .then(({ data }) => { setReports(data.reports); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Apply filters
  const visible = reports.filter((r) => {
    if (typeFilter   && r.issueType !== typeFilter)   return false;
    if (statusFilter && r.status    !== statusFilter) return false;
    if (!r.coordinates?.lat || !r.coordinates?.lng)  return false;
    return true;
  });

  // Count by type for legend
  const typeCounts = reports.reduce((acc, r) => {
    acc[r.issueType] = (acc[r.issueType] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Map View</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {visible.length} issues plotted · click markers to view details
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex gap-2 flex-wrap">
          <select
            className="input-field w-44 text-sm py-2"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            {Object.keys(TYPE_CONFIG).map((t) => <option key={t}>{t}</option>)}
          </select>

          <select
            className="input-field w-40 text-sm py-2"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            {['Pending', 'In Progress', 'Resolved'].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="glass-card p-3 flex flex-wrap gap-4 items-center">
        <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Legend</span>
        {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
          <button
            key={type}
            onClick={() => setTypeFilter(typeFilter === type ? '' : type)}
            className={`flex items-center gap-2 transition-opacity ${
              typeFilter && typeFilter !== type ? 'opacity-30' : 'opacity-100'
            }`}
          >
            <div className="w-3.5 h-3.5 rounded-full shadow-sm"
              style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.color}80` }} />
            <span className="text-xs text-gray-400">{cfg.label}</span>
            <span className="text-[10px] text-gray-600 font-mono">({typeCounts[type] || 0})</span>
          </button>
        ))}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-[10px] font-mono text-gray-600">STATUS OUTLINE:</span>
          {Object.entries(STATUS_COLORS).map(([s, c]) => (
            <div key={s} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm border-2" style={{ borderColor: c }} />
              <span className="text-[10px] text-gray-500">{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="glass-card overflow-hidden" style={{ height: '580px' }}>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-3">
            <div className="spinner" />
            <p className="text-gray-600 text-xs font-mono">LOADING MAP DATA...</p>
          </div>
        ) : (
          <MapContainer
            center={[20.5937, 78.9629]}
            zoom={5}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
            />

            {/* Auto-fit bounds when reports first load */}
            {visible.length > 0 && <FitBounds reports={visible} />}

            {/* Render a circle marker per report */}
            {visible.map((report) => {
              const cfg       = TYPE_CONFIG[report.issueType] || { color: '#6b7280', glow: '#6b728060' };
              const isHovered = hoveredId === report._id;
              const radius    = report.severity === 'Critical' ? 12 :
                                report.severity === 'High'     ? 10 :
                                report.severity === 'Medium'   ?  8 : 6;

              return (
                <CircleMarker
                  key={report._id}
                  center={[report.coordinates.lat, report.coordinates.lng]}
                  radius={isHovered ? radius + 3 : radius}
                  pathOptions={{
                    color:       STATUS_COLORS[report.status] || '#6b7280',
                    fillColor:   cfg.color,
                    fillOpacity: isHovered ? 0.95 : 0.75,
                    weight:      2,
                  }}
                  eventHandlers={{
                    mouseover: () => setHoveredId(report._id),
                    mouseout:  () => setHoveredId(null),
                  }}
                >
                  <Popup>
                    <div className="min-w-[200px] max-w-[260px] space-y-2">
                      {/* Type + severity header */}
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm flex items-center gap-1.5">
                          {cfg.icon} {report.issueType}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 rounded"
                          style={{ background: `${cfg.color}20`, color: cfg.color }}>
                          {report.severity}
                        </span>
                      </div>

                      {/* Location */}
                      <div className="text-xs text-gray-400">📍 {report.location}</div>

                      {/* Description */}
                      <div className="text-xs leading-relaxed border-t border-white/10 pt-2">
                        {report.description}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between border-t border-white/10 pt-2">
                        <span className="text-xs"
                          style={{ color: STATUS_COLORS[report.status] }}>
                          ● {report.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Uploaded image */}
                      {report.image && (
                        <img
                          src={`/uploads/${report.image}`}
                          alt="Evidence"
                          className="w-full h-24 object-cover rounded-lg mt-1"
                        />
                      )}

                      {/* Coordinates */}
                      <div className="text-[10px] text-gray-600 font-mono">
                        {report.coordinates.lat.toFixed(5)}, {report.coordinates.lng.toFixed(5)}
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        )}
      </div>

      {/* No reports message */}
      {!loading && visible.length === 0 && (
        <div className="glass-card p-8 text-center space-y-2">
          <p className="text-gray-500">No reports match your current filters.</p>
          <button
            onClick={() => { setTypeFilter(''); setStatusFilter(''); }}
            className="text-sm text-accent-cyan hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

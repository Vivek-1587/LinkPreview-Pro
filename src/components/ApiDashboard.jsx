import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, Zap, Key, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';

export default function ApiDashboard() {
  const [hoveredPoint, setHoveredPoint] = useState(null); // { x, y, value, label }
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [diagnostics, setDiagnostics] = useState({
    successPercent: '100.00',
    redirectPercent: '0.00',
    clientErrorPercent: '0.00',
    serverErrorPercent: '0.00'
  });

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await api.analytics.get();
      
      // Map icons back to stats array
      const iconMap = {
        'Total Requests': Activity,
        'Requests Today': Zap,
        'Active API Keys': Key,
        'Cache Hit Rate': ShieldCheck,
      };

      const mappedStats = data.stats.map(s => ({
        ...s,
        icon: iconMap[s.name] || Activity
      }));

      setStats(mappedStats);
      setChartData(data.chartData);
      setDiagnostics(data.diagnostics);
    } catch (err) {
      console.error('Failed to load analytics metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  // Chart layout config
  const chartWidth = 500;
  const chartHeight = 160;
  const paddingX = 40;
  const paddingY = 20;

  const maxValue = chartData.length > 0 ? Math.max(...chartData.map((d) => d.value)) * 1.1 || 10 : 10; // Add 10% headroom

  const points = chartData.map((d, i) => {
    const x = paddingX + (i * (chartWidth - paddingX * 2)) / (chartData.length - 1);
    const y = chartHeight - paddingY - (d.value * (chartHeight - paddingY * 2)) / maxValue;
    return { x, y, value: d.value, label: d.label };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  // Generate the gradient fill path (d closed at bottom)
  const areaD = points.length > 0 ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z` : '';

  // Handle mouse moves over the chart to show tooltips
  const handleMouseMove = (e) => {
    if (points.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const svgX = (mouseX / rect.width) * chartWidth;

    // Find the closest point in data coordinates
    let closest = points[0];
    let minDist = Math.abs(points[0].x - svgX);

    for (let i = 1; i < points.length; i++) {
      const dist = Math.abs(points[i].x - svgX);
      if (dist < minDist) {
        minDist = dist;
        closest = points[i];
      }
    }

    setHoveredPoint(closest);
  };

  if (loading && stats.length === 0) {
    return <div className="mx-auto max-w-7xl px-6 py-8 text-center text-zinc-500 text-xs">Loading analytics...</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Page Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">API Metrics Console</h2>
          <p className="text-xs text-zinc-400 mt-1">Monitor throughput, cache hits, and request execution diagnostics in real-time.</p>
        </div>
        <button 
          onClick={loadAnalytics}
          className="text-xs bg-zinc-900 border border-white/5 px-3 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
        >
          Refresh Stats
        </button>
      </div>

      {/* Grid of Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="premium-card p-5 relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-zinc-400">{stat.name}</span>
                <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-400">
                  <Icon className="h-4.5 w-4.5" />
                </div>
              </div>

              <div className="flex items-baseline gap-2.5">
                <span className="text-2xl font-bold text-white tracking-tight">{stat.value}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  stat.changeType === 'positive'
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    : 'bg-zinc-900 border border-white/5 text-zinc-400'
                }`}>
                  {stat.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid of Analytical Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Requests Over Time SVG Chart (8/12 cols) */}
        <div className="lg:col-span-8 premium-card p-6 flex flex-col justify-between min-h-[300px]">
          <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-5">
            <div>
              <h3 className="text-sm font-bold text-white">Requests Profile</h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">crawlers processed over last 7 days</p>
            </div>
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
              <Activity className="h-3 w-3" />
              <span>LIVE FEED</span>
            </span>
          </div>

          {/* Interactive Chart Container */}
          <div className="flex-1 relative mb-4">
            {chartData.length > 0 ? (
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-full cursor-crosshair overflow-visible"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <defs>
                  {/* Line Gradient Accent */}
                  <linearGradient id="lineGlow" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>

                  {/* Fill Gradient Area */}
                  <linearGradient id="fillGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="rgba(255,255,255,0.03)" />
                <line x1={paddingX} y1={(chartHeight) / 2} x2={chartWidth - paddingX} y2={(chartHeight) / 2} stroke="rgba(255,255,255,0.03)" />
                <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="rgba(255,255,255,0.05)" />

                {/* Area Gradient Fill */}
                {areaD && <path d={areaD} fill="url(#fillGlow)" />}

                {/* Glowing Line */}
                {pathD && <path d={pathD} fill="none" stroke="url(#lineGlow)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

                {/* Target Data Nodes */}
                {points.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r={hoveredPoint?.label === p.label ? '5' : '3.5'}
                    fill={hoveredPoint?.label === p.label ? '#FFFFFF' : '#3B82F6'}
                    stroke="#0A0A0A"
                    strokeWidth={hoveredPoint?.label === p.label ? '2.5' : '1.5'}
                    className="transition-all duration-100"
                  />
                ))}

                {/* Hover Crosshair Vertical Line */}
                {hoveredPoint && (
                  <line
                    x1={hoveredPoint.x}
                    y1={paddingY}
                    x2={hoveredPoint.x}
                    y2={chartHeight - paddingY}
                    stroke="rgba(255,255,255,0.2)"
                    strokeDasharray="4 3"
                  />
                )}

                {/* X Axis Labels */}
                {chartData.map((d, i) => {
                  const x = paddingX + (i * (chartWidth - paddingX * 2)) / (chartData.length - 1);
                  return (
                    <text
                      key={i}
                      x={x}
                      y={chartHeight - 4}
                      textAnchor="middle"
                      fill="#52525B"
                      className="text-[9px] font-semibold font-mono"
                    >
                      {d.label}
                    </text>
                  );
                })}
              </svg>
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-600 text-xs italic">No activity chart records.</div>
            )}

            {/* Custom Vercel Floating Tooltip Overlay */}
            {hoveredPoint && (
              <div
                className="absolute z-30 pointer-events-none rounded-lg border border-white/10 bg-zinc-950 px-2.5 py-1.5 shadow-xl text-[10px]"
                style={{
                  left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                  top: `${(hoveredPoint.y / chartHeight) * 100 - 30}%`,
                  transform: 'translate(-50%, -100%)',
                }}
              >
                <div className="font-semibold text-white">{hoveredPoint.label}</div>
                <div className="text-blue-400 font-bold mt-0.5">{hoveredPoint.value.toLocaleString()} reqs</div>
              </div>
            )}
          </div>
        </div>

        {/* API Response Success rate breakdown (4/12 cols) */}
        <div className="lg:col-span-4 premium-card p-6 flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-5">
              <h3 className="text-sm font-bold text-white">Status Diagnostics</h3>
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">24H RANGE</span>
            </div>

            {/* Success logs list progress */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-zinc-400 font-medium">200 Crawl Success</span>
                  <span className="text-white font-bold">{diagnostics.successPercent}%</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-900 border border-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${diagnostics.successPercent}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-zinc-400 font-medium">301/302 Redirected</span>
                  <span className="text-white font-bold">{diagnostics.redirectPercent}%</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-900 border border-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, Math.max(2, parseFloat(diagnostics.redirectPercent) * 10))}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-zinc-400 font-medium">4xx Target Client Error</span>
                  <span className="text-white font-bold">{diagnostics.clientErrorPercent}%</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-900 border border-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, Math.max(2, parseFloat(diagnostics.clientErrorPercent) * 10))}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-zinc-400 font-medium">5xx API Server Error</span>
                  <span className="text-white font-bold">{diagnostics.serverErrorPercent}%</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-900 border border-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.min(100, Math.max(2, parseFloat(diagnostics.serverErrorPercent) * 10))}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-4 mt-6 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-xs text-zinc-400">All systems operating within normal parameters.</span>
          </div>
        </div>

      </div>
    </div>
  );
}

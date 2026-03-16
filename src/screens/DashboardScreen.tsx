import RAW_RESULTS from '../data/simulationResults.json';

interface SimResult {
  id: number;
  name: string;
  company: string;
  budget: number;
  authority: number;
  need: number;
  timeline: number;
  total: number;
  tier: 'high' | 'medium' | 'low';
  disqualified: boolean;
  disqualify_reason?: string;
  summary: string;
}

interface DashboardScreenProps {
  onBack: () => void;
}

const ALL = RAW_RESULTS as SimResult[];
const qualified = ALL.filter(p => !p.disqualified);
const high = ALL.filter(p => !p.disqualified && p.tier === 'high');
const medium = ALL.filter(p => !p.disqualified && p.tier === 'medium');
const low = ALL.filter(p => !p.disqualified && p.tier === 'low');
const disqualified = ALL.filter(p => p.disqualified);
const total = ALL.length;

function avg(arr: SimResult[], key: keyof SimResult) {
  if (!arr.length) return 0;
  return Math.round(arr.reduce((s, p) => s + (p[key] as number), 0) / arr.length);
}

function BANTChart() {
  const barHeight = 28;
  const gap = 10;
  const labelW = 140;
  const maxBarW = 320;
  const rowH = barHeight + gap;
  const svgH = qualified.length * rowH + 24;

  const segColors = ['#14b8a6', '#818cf8', '#f59e0b', '#f472b6'];
  const legendLabels = ['Budget', 'Authority', 'Need', 'Timeline'];

  return (
    <div className="overflow-x-auto">
      <svg
        width={labelW + maxBarW + 60}
        height={svgH}
        className="block mx-auto"
        aria-label="BANT scores per qualified prospect"
      >
        {/* Legend */}
        {legendLabels.map((label, i) => (
          <g key={label} transform={`translate(${labelW + i * 80}, 4)`}>
            <rect width={10} height={10} rx={2} fill={segColors[i]} />
            <text x={14} y={9} fontSize={9} fill="#6b7280">{label}</text>
          </g>
        ))}

        {/* Rows */}
        {qualified.map((p, i) => {
          const y = 22 + i * rowH;
          const scores = [p.budget, p.authority, p.need, p.timeline];
          let xCursor = labelW;
          const tierColor = p.tier === 'high' ? '#14b8a6' : p.tier === 'medium' ? '#f59e0b' : '#ef4444';

          return (
            <g key={p.id}>
              <text x={labelW - 8} y={y + barHeight / 2 + 4} textAnchor="end" fontSize={10} fill="#9ca3af">
                {p.name}
              </text>

              {scores.map((score, si) => {
                const w = (score / 25) * (maxBarW / 4);
                const x = xCursor;
                xCursor += w;
                return (
                  <rect
                    key={si}
                    x={x}
                    y={y}
                    width={w}
                    height={barHeight}
                    fill={segColors[si]}
                    opacity={0.85}
                    rx={si === 0 ? 3 : 0}
                  />
                );
              })}

              <text x={labelW + maxBarW + 8} y={y + barHeight / 2 + 4} fontSize={11} fontWeight="600" fill={tierColor}>
                {p.total}
              </text>

              {i < qualified.length - 1 && (
                <line
                  x1={labelW} x2={labelW + maxBarW}
                  y1={y + barHeight + gap / 2} y2={y + barHeight + gap / 2}
                  stroke="#1a1a1a" strokeWidth={1}
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function FunnelChart() {
  const stages = [
    { label: 'Prospects Simulated', count: total, color: '#374151' },
    { label: 'Completed (not disqualified)', count: qualified.length, color: '#4b5563' },
    { label: 'High Fit — Calendly shown', count: high.length, color: '#14b8a6' },
    { label: 'Medium Fit — Email capture', count: medium.length, color: '#f59e0b' },
    { label: 'Low Fit — Resource link', count: low.length, color: '#ef4444' },
    { label: 'Disqualified early', count: disqualified.length, color: '#6b7280' },
  ];

  return (
    <div className="space-y-3">
      {stages.map((stage, i) => {
        const pct = Math.round((stage.count / total) * 100);
        return (
          <div key={stage.label} className="flex items-center gap-3">
            <span className="text-[10px] text-dark-muted w-4 text-right shrink-0">{i + 1}</span>
            <span className="text-xs text-gray-400 w-48 shrink-0">{stage.label}</span>
            <div className="flex-1 h-7 bg-dark-bg rounded overflow-hidden">
              <div
                className="h-full rounded flex items-center justify-end pr-2 transition-all duration-700"
                style={{ width: `${(stage.count / total) * 100}%`, backgroundColor: stage.color }}
              >
                {stage.count > 0 && (
                  <span className="text-[10px] font-semibold text-white">{pct}%</span>
                )}
              </div>
            </div>
            <span className="text-xs font-semibold w-5 text-right shrink-0" style={{ color: stage.color }}>
              {stage.count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-5 flex flex-col gap-1">
      <span className="text-xs text-dark-muted uppercase tracking-wider">{label}</span>
      <span className="text-3xl font-bold" style={{ color: color ?? '#fff' }}>{value}</span>
      {sub && <span className="text-xs text-dark-muted">{sub}</span>}
    </div>
  );
}

export function DashboardScreen({ onBack }: DashboardScreenProps) {
  const avgTotal = avg(qualified, 'total');
  const avgBudget = avg(qualified, 'budget');
  const avgAuthority = avg(qualified, 'authority');
  const avgNeed = avg(qualified, 'need');
  const avgTimeline = avg(qualified, 'timeline');

  const bantDimensions = [
    { label: 'Budget', val: avgBudget, color: '#14b8a6' },
    { label: 'Authority', val: avgAuthority, color: '#818cf8' },
    { label: 'Need', val: avgNeed, color: '#f59e0b' },
    { label: 'Timeline', val: avgTimeline, color: '#f472b6' },
  ];

  return (
    <div className="flex-1 flex flex-col px-6 py-10 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Aria · Analytics Dashboard</h1>
          <p className="text-dark-muted text-sm mt-1">
            {total} simulated prospect conversations · real Groq API · BANT scoring engine
          </p>
        </div>
        <button
          onClick={onBack}
          className="text-sm text-dark-muted hover:text-white transition-colors cursor-pointer"
        >
          ← Back to home
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Simulated" value={total} sub="conversations" />
        <StatCard
          label="High Fit"
          value={high.length}
          sub={`${Math.round((high.length / total) * 100)}% of total`}
          color="#14b8a6"
        />
        <StatCard
          label="Avg Score"
          value={qualified.length ? avgTotal : '—'}
          sub="qualified prospects"
          color="#818cf8"
        />
        <StatCard
          label="Disqualified"
          value={disqualified.length}
          sub={`${Math.round((disqualified.length / total) * 100)}% filtered out`}
          color="#6b7280"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        {/* BANT Distribution */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-white">BANT Score Distribution</h2>
            <p className="text-xs text-dark-muted mt-0.5">Stacked breakdown · qualified prospects only</p>
          </div>
          {qualified.length > 0 ? (
            <>
              <BANTChart />
              <div className="flex justify-between mt-1 px-[140px]">
                {[0, 25, 50, 75, 100].map(v => (
                  <span key={v} className="text-[9px] text-dark-muted">{v}</span>
                ))}
              </div>
            </>
          ) : (
            <p className="text-dark-muted text-sm">No qualified results yet.</p>
          )}
        </div>

        {/* Funnel */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-white">Qualification Funnel</h2>
            <p className="text-xs text-dark-muted mt-0.5">How prospects flow through Aria's pipeline</p>
          </div>
          <FunnelChart />

          <div className="mt-6 pt-4 border-t border-dark-border grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-accent">{high.length}</p>
              <p className="text-[10px] text-dark-muted">High fit</p>
            </div>
            <div>
              <p className="text-lg font-bold text-amber-400">{medium.length}</p>
              <p className="text-[10px] text-dark-muted">Medium fit</p>
            </div>
            <div>
              <p className="text-lg font-bold text-red-400">{low.length}</p>
              <p className="text-[10px] text-dark-muted">Low fit</p>
            </div>
          </div>
        </div>
      </div>

      {/* Avg BANT bars */}
      {qualified.length > 0 && (
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 mb-8">
          <h2 className="text-base font-semibold text-white mb-4">Average BANT Scores · Qualified Prospects</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {bantDimensions.map(({ label, val, color }) => (
              <div key={label} className="flex flex-col gap-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-dark-muted">{label}</span>
                  <span className="text-sm font-semibold" style={{ color }}>
                    {val}<span className="text-dark-muted font-normal">/25</span>
                  </span>
                </div>
                <div className="h-2 bg-dark-bg rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(val / 25) * 100}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full results table */}
      <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-dark-border flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">All Simulation Runs</h2>
          <span className="text-xs text-dark-muted">Real Groq API · llama-3.3-70b-versatile</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-border">
                {['#', 'Prospect', 'Company', 'B', 'A', 'N', 'T', 'Total', 'Tier'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-dark-muted font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL.map((p, i) => (
                <tr key={p.id} className={`border-b border-dark-border/50 ${i % 2 === 0 ? '' : 'bg-dark-bg/30'}`}>
                  <td className="px-4 py-3 text-dark-muted text-xs">{p.id}</td>
                  <td className="px-4 py-3 text-white font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-dark-muted text-xs">{p.company}</td>
                  {p.disqualified ? (
                    <>
                      <td colSpan={4} className="px-4 py-3 text-dark-muted text-xs italic">
                        {p.disqualify_reason}
                      </td>
                      <td className="px-4 py-3 text-dark-muted">—</td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-accent">{p.budget}</td>
                      <td className="px-4 py-3 text-indigo-400">{p.authority}</td>
                      <td className="px-4 py-3 text-amber-400">{p.need}</td>
                      <td className="px-4 py-3 text-pink-400">{p.timeline}</td>
                      <td className="px-4 py-3 font-bold text-white">{p.total}</td>
                    </>
                  )}
                  <td className="px-4 py-3">
                    {p.disqualified ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">Disqualified</span>
                    ) : p.tier === 'high' ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-teal-900/40 text-accent">High</span>
                    ) : p.tier === 'medium' ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-900/30 text-amber-400">Medium</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/30 text-red-400">Low</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-dark-muted/50">
        {total} real simulation runs · FlowDesk AI Prospect Qualifier · Groq / llama-3.3-70b-versatile
      </div>
    </div>
  );
}

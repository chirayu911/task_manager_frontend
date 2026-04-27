import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Calendar, Clock, BarChart3, Info, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

// ─── Constants ───────────────────────────────────────────────────────────────

const DAY_MS = 86400000;

const VIEW_MODES = [
  { label: 'Day',   key: 'day',   colWidthPx: 48,  fmt: (d) => d.getDate(),                  headerFmt: (d) => d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) },
  { label: 'Week',  key: 'week',  colWidthPx: 120, fmt: (d) => `W${getWeekNum(d)}`,           headerFmt: (d) => d.toLocaleDateString('en-US', { month: 'long',  year: 'numeric' }) },
  { label: 'Month', key: 'month', colWidthPx: 180, fmt: (d) => d.toLocaleDateString('en-US', { month: 'short' }), headerFmt: (d) => String(d.getFullYear()) },
];

const ROW_HEIGHT = 52;
const LABEL_WIDTH = 230;
const HEADER_H = 56;
const BAR_H = 28;

// ─── Status → color ──────────────────────────────────────────────────────────

const STATUS_COLORS = {
  default:       '#6f63f1',
  pending:       '#f59e0b',
  'in progress': '#3b82f6',
  review:        '#8b5cf6',
  done:          '#10b981',
  completed:     '#10b981',
  cancelled:     '#6b7280',
  blocked:       '#ef4444',
};

const getColor = (name = '') => {
  const k = name.toLowerCase().trim();
  return STATUS_COLORS[k] || STATUS_COLORS.default;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getWeekNum(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / DAY_MS) + 1) / 7);
}

function startOf(date, mode) {
  const d = new Date(date);
  if (mode === 'day')   { d.setHours(0,0,0,0); return d; }
  if (mode === 'week')  { d.setHours(0,0,0,0); d.setDate(d.getDate() - d.getDay()); return d; }
  if (mode === 'month') { d.setHours(0,0,0,0); d.setDate(1); return d; }
  return d;
}

function addUnit(date, mode, n) {
  const d = new Date(date);
  if (mode === 'day')   { d.setDate(d.getDate() + n); return d; }
  if (mode === 'week')  { d.setDate(d.getDate() + n * 7); return d; }
  if (mode === 'month') { d.setMonth(d.getMonth() + n); return d; }
  return d;
}

function safeDate(val, fallback = new Date()) {
  if (!val) return new Date(fallback);
  const d = new Date(val);
  return isNaN(d.getTime()) ? new Date(fallback) : d;
}

function resolveTaskDates(task) {
  const createdAt = safeDate(task.createdAt);
  const start     = safeDate(task.startDate, createdAt);
  let end;
  if (task.endDate) {
    const e = safeDate(task.endDate, start);
    end = e > start ? e : new Date(start.getTime() + DAY_MS);
  } else {
    end = new Date(start.getTime() + DAY_MS);
  }
  return { start, end };
}

function formatDate(d) {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Tooltip Component ───────────────────────────────────────────────────────

function Tooltip({ task, dates, color, x, y, containerWidth }) {
  const statusName = task.status?.name || task.status || 'Unknown';
  // Clamp so tooltip doesn't go off right edge
  const tooltipW = 240;
  const adjustedX = Math.min(x, containerWidth - tooltipW - 16);

  return (
    <div
      style={{
        position: 'absolute',
        top: y + 8,
        left: adjustedX,
        width: tooltipW,
        zIndex: 50,
        pointerEvents: 'none',
      }}
      className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl p-4"
    >
      <span
        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest mb-2"
        style={{ backgroundColor: `${color}22`, color }}
      >
        {statusName}
      </span>

      <p className="text-sm font-black text-gray-900 dark:text-white leading-tight mb-3 line-clamp-2">
        {task.title}
      </p>

      <div className="space-y-1.5 text-[11px] text-gray-500 dark:text-gray-400 font-medium">
        <div className="flex items-center gap-2">
          <Calendar size={11} />
          <span>Start: <strong className="text-gray-700 dark:text-gray-300">{formatDate(dates.start)}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={11} />
          <span>End: <strong className="text-gray-700 dark:text-gray-300">{formatDate(dates.end)}</strong></span>
        </div>
        {task.hours != null && task.hours !== '' && (
          <div className="flex items-center gap-2">
            <Clock size={11} />
            <span>Working Time: <strong className="text-gray-700 dark:text-gray-300">{task.hours}h</strong></span>
          </div>
        )}
        {task.assignedTo?.name && (
          <div className="flex items-center gap-2">
            <span
              className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white shrink-0"
              style={{ backgroundColor: color }}
            >
              {task.assignedTo.name[0]}
            </span>
            <span>{task.assignedTo.name}</span>
          </div>
        )}
        {task.priority && (
          <span className={`inline-block px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
            task.priority === 'High' || task.priority === 'Critical'
              ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-950/40 dark:border-red-900/50'
              : 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/40 dark:border-blue-900/50'
          }`}>
            {task.priority}
          </span>
        )}
      </div>
      <p className="mt-3 text-[9px] text-gray-400 dark:text-gray-600 font-bold tracking-widest uppercase">Double-click to open</p>
    </div>
  );
}

// ─── Legend ──────────────────────────────────────────────────────────────────

function Legend({ tasks }) {
  const items = useMemo(() => {
    const seen = new Map();
    tasks.forEach(t => {
      const name = t.status?.name || t.status || 'Unknown';
      if (!seen.has(name)) seen.set(name, getColor(name));
    });
    return Array.from(seen.entries()).map(([label, color]) => ({ label, color }));
  }, [tasks]);

  if (!items.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-4 px-5 py-3 bg-white dark:bg-gray-900/60 rounded-2xl border border-gray-100 dark:border-gray-700 backdrop-blur-sm">
      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mr-1">Status</span>
      {items.map(({ label, color }) => (
        <div key={label} className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main GanttView ──────────────────────────────────────────────────────────

export default function GanttView({ tasks = [], navigate, basePath }) {
  const [modeIdx, setModeIdx]       = useState(1);           // default: Week
  const [tooltip, setTooltip]       = useState(null);        // { task, dates, x, y }
  const [showLegend, setShowLegend] = useState(true);
  const scrollRef                   = useRef(null);
  const wrapperRef                  = useRef(null);
  const [containerWidth, setContainerWidth] = useState(800);

  const mode = VIEW_MODES[modeIdx];

  // Track container width for tooltip clamping
  useEffect(() => {
    if (!wrapperRef.current) return;
    const obs = new ResizeObserver(entries => {
      setContainerWidth(entries[0].contentRect.width);
    });
    obs.observe(wrapperRef.current);
    return () => obs.disconnect();
  }, []);

  // ── Compute timeline range ──────────────────────────────────────────────
  const { columns, timelineStart } = useMemo(() => {
    if (!tasks.length) return { columns: [], timelineStart: new Date() };

    // Find overall min/max dates
    let minDate = Infinity, maxDate = -Infinity;
    tasks.forEach(t => {
      const { start, end } = resolveTaskDates(t);
      if (start < minDate) minDate = start;
      if (end   > maxDate) maxDate = end;
    });

    const pad = mode.key === 'day' ? 3 : mode.key === 'week' ? 2 : 1;
    const rangeStart = startOf(addUnit(new Date(minDate), mode.key, -pad), mode.key);
    const rangeEnd   = addUnit(new Date(maxDate), mode.key, pad + 1);

    const cols = [];
    let cur = new Date(rangeStart);
    while (cur < rangeEnd) {
      cols.push(new Date(cur));
      cur = addUnit(cur, mode.key, 1);
    }

    return { columns: cols, timelineStart: rangeStart };
  }, [tasks, mode]);

  const totalWidth = columns.length * mode.colWidthPx;

  // ── px offset for a date ────────────────────────────────────────────────
  const dateToX = (date) => {
    const diffMs = date - timelineStart;
    const unitMs = mode.key === 'day'  ? DAY_MS
                 : mode.key === 'week' ? DAY_MS * 7
                 : DAY_MS * 30.44;     // month approx — we'll use ratio
    if (mode.key === 'month') {
      // accurate month calculation
      const startFrac = (timelineStart.getFullYear() * 12 + timelineStart.getMonth());
      const dateFrac  = (date.getFullYear() * 12 + date.getMonth()) + (date.getDate() - 1) / 30.44;
      return (dateFrac - startFrac) * mode.colWidthPx;
    }
    return (diffMs / unitMs) * mode.colWidthPx;
  };

  // ── today line ──────────────────────────────────────────────────────────
  const todayX = dateToX(new Date());

  // ── Scroll today into view on mode change ───────────────────────────────
  useEffect(() => {
    if (scrollRef.current && todayX > 0) {
      const scrollTo = Math.max(0, todayX - containerWidth / 2 + LABEL_WIDTH);
      scrollRef.current.scrollLeft = scrollTo;
    }
  }, [modeIdx]); // eslint-disable-line

  // ── Grouped header (suppress repeated top-header labels) ────────────────
  const headerGroups = useMemo(() => {
    const groups = [];
    let lastLabel = null, startIdx = 0;
    columns.forEach((col, i) => {
      const label = mode.headerFmt(col);
      if (label !== lastLabel) {
        if (lastLabel !== null) groups.push({ label: lastLabel, startIdx, endIdx: i });
        lastLabel = label;
        startIdx = i;
      }
    });
    if (lastLabel !== null) groups.push({ label: lastLabel, startIdx, endIdx: columns.length });
    return groups;
  }, [columns, mode]);

  if (!tasks.length) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <BarChart3 size={56} className="text-gray-200 dark:text-gray-700 mb-5" />
        <h3 className="text-xl font-black text-gray-800 dark:text-white tracking-tight">No Tasks to Visualise</h3>
        <p className="text-gray-400 dark:text-gray-500 text-sm font-medium mt-2 max-w-sm">
          Create some tasks with start &amp; end dates to see them plotted here.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4" ref={wrapperRef}>

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* View mode switcher */}
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-[20px] border border-gray-200 dark:border-gray-700 shadow-inner">
          {VIEW_MODES.map((vm, i) => (
            <button
              key={vm.key}
              onClick={() => setModeIdx(i)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                modeIdx === i
                  ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-lg'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              {vm.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold text-gray-400 dark:text-gray-500">
            <Info size={11} />
            <span>Tasks without dates default to creation date · 1-day duration</span>
          </div>
          <button
            onClick={() => setShowLegend(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
          >
            Legend {showLegend ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      </div>

      {/* ── Legend ── */}
      {showLegend && <Legend tasks={tasks} />}

      {/* ── Gantt Chart ── */}
      <div className="bg-white dark:bg-gray-900 rounded-[32px] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden transition-all hover:shadow-2xl hover:shadow-primary-500/5">

        {/* Glassmorphism header strip */}
        <div className="px-8 py-5 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-primary-50/60 to-transparent dark:from-primary-950/20 flex items-center gap-3">
          <BarChart3 size={18} className="text-primary-600" strokeWidth={2.5} />
          <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-gray-600 dark:text-gray-300">
            Timeline · {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          </h3>
        </div>

        {/* Scrollable area */}
        <div className="flex" style={{ maxHeight: '70vh', overflow: 'hidden' }}>

          {/* ── Left fixed label panel ── */}
          <div
            className="shrink-0 border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900"
            style={{ width: LABEL_WIDTH, zIndex: 10 }}
          >
            {/* Top header spacer */}
            <div style={{ height: HEADER_H }} className="border-b border-gray-100 dark:border-gray-800 flex items-end px-4 pb-2">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Task</span>
            </div>
            {/* Labels */}
            <div style={{ overflowY: 'hidden', overflowX: 'hidden' }}>
              {tasks.map((task, i) => {
                const color = getColor(task.status?.name || task.status || '');
                return (
                  <div
                    key={task._id}
                    className="flex items-center gap-3 px-4 border-b border-gray-50 dark:border-gray-800/60 group cursor-pointer hover:bg-primary-50/30 dark:hover:bg-primary-950/10 transition-colors"
                    style={{ height: ROW_HEIGHT }}
                    onDoubleClick={() => navigate && basePath && navigate(`${basePath}/view/${task._id}`)}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-[11px] font-black text-gray-700 dark:text-gray-300 truncate flex-1 tracking-tight">
                      {task.title}
                    </span>
                    {task.hours != null && task.hours !== '' && (
                      <span className="text-[9px] font-black text-gray-400 dark:text-gray-600 shrink-0 flex items-center gap-0.5">
                        <Clock size={9} /> {task.hours}h
                      </span>
                    )}
                    <ExternalLink
                      size={12}
                      className="shrink-0 text-gray-300 dark:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => { e.stopPropagation(); navigate && basePath && navigate(`${basePath}/view/${task._id}`); }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Right scrollable timeline ── */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-auto relative"
            style={{ overflowY: 'auto' }}
            onScroll={(e) => {
              // Sync label panel vertical scroll
              const labels = e.currentTarget.previousSibling?.querySelector('[style*="overflow"]');
              if (labels) labels.scrollTop = e.currentTarget.scrollTop;
            }}
          >
            <div style={{ width: totalWidth, position: 'relative', minWidth: '100%' }}>

              {/* ─── Top header (month/year row) ─── */}
              <div
                className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800"
                style={{ height: HEADER_H, display: 'flex', flexDirection: 'column' }}
              >
                {/* Row 1: grouped top label */}
                <div className="flex flex-1 border-b border-gray-50 dark:border-gray-800/50" style={{ height: '50%' }}>
                  {headerGroups.map((g) => (
                    <div
                      key={g.label + g.startIdx}
                      className="flex items-center px-3 border-r border-gray-50 dark:border-gray-800/50 shrink-0"
                      style={{ width: (g.endIdx - g.startIdx) * mode.colWidthPx }}
                    >
                      <span className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-400 dark:text-gray-600 truncate">
                        {g.label}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Row 2: individual column labels */}
                <div className="flex flex-1">
                  {columns.map((col, i) => {
                    const isToday =
                      mode.key === 'day' &&
                      col.toDateString() === new Date().toDateString();
                    return (
                      <div
                        key={i}
                        className={`flex items-center justify-center border-r border-gray-50 dark:border-gray-800/50 shrink-0 ${isToday ? 'bg-primary-50 dark:bg-primary-950/20' : ''}`}
                        style={{ width: mode.colWidthPx }}
                      >
                        <span className={`text-[10px] font-black tracking-tight ${isToday ? 'text-primary-600' : 'text-gray-400 dark:text-gray-600'}`}>
                          {mode.fmt(col)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ─── Grid + Bars ─── */}
              <div style={{ position: 'relative' }}>
                {/* Vertical grid lines */}
                <svg
                  style={{ position: 'absolute', inset: 0, width: totalWidth, height: tasks.length * ROW_HEIGHT, pointerEvents: 'none', zIndex: 0 }}
                >
                  {columns.map((col, i) => (
                    <line
                      key={i}
                      x1={i * mode.colWidthPx} y1={0}
                      x2={i * mode.colWidthPx} y2={tasks.length * ROW_HEIGHT}
                      stroke="currentColor"
                      strokeOpacity="0.06"
                      strokeWidth="1"
                    />
                  ))}
                  {/* Today vertical highlight */}
                  {todayX >= 0 && todayX <= totalWidth && (
                    <rect
                      x={todayX - 1} y={0}
                      width={mode.key === 'day' ? mode.colWidthPx : 2}
                      height={tasks.length * ROW_HEIGHT}
                      fill="#6f63f1"
                      fillOpacity={mode.key === 'day' ? 0.06 : 0.15}
                    />
                  )}
                </svg>

                {/* ── Task rows + Bars ── */}
                {tasks.map((task, rowIdx) => {
                  const { start, end } = resolveTaskDates(task);
                  const color  = getColor(task.status?.name || task.status || '');
                  const barX   = Math.max(0, dateToX(start));
                  const barEnd = dateToX(end);
                  const barW   = Math.max(barEnd - barX, 8);
                  const barY   = (ROW_HEIGHT - BAR_H) / 2;

                  // Label inside bar
                  const hoursStr = task.hours != null && task.hours !== '' ? ` · ${task.hours}h` : '';
                  const barLabel = barW > 80 ? `${task.title}${hoursStr}` : (barW > 36 ? `${task.hours || ''}h` : '');

                  return (
                    <div
                      key={task._id}
                      className="relative border-b border-gray-50 dark:border-gray-800/60"
                      style={{ height: ROW_HEIGHT, width: totalWidth }}
                    >
                      {/* Alternating row bg */}
                      {rowIdx % 2 === 1 && (
                        <div className="absolute inset-0 bg-gray-50/40 dark:bg-gray-800/10" />
                      )}

                      {/* Gantt bar */}
                      <div
                        title={task.title}
                        className="absolute flex items-center px-2 rounded-lg cursor-pointer select-none transition-all hover:brightness-110 hover:scale-y-105 active:scale-95"
                        style={{
                          left: barX,
                          top: barY,
                          width: barW,
                          height: BAR_H,
                          backgroundColor: color,
                          boxShadow: `0 2px 8px ${color}55`,
                          zIndex: 10,
                        }}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.closest('.gantt-scroll-area')?.getBoundingClientRect()
                                    || wrapperRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
                          const bRect = e.currentTarget.getBoundingClientRect();
                          setTooltip({
                            task,
                            dates: { start, end },
                            color,
                            x: bRect.left - rect.left + LABEL_WIDTH,
                            y: bRect.bottom - rect.top,
                          });
                        }}
                        onMouseLeave={() => setTooltip(null)}
                        onDoubleClick={() => navigate && basePath && navigate(`${basePath}/view/${task._id}`)}
                      >
                        {barLabel && (
                          <span
                            className="text-white font-black text-[9px] uppercase tracking-widest truncate leading-none"
                            style={{ maxWidth: barW - 16, textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                          >
                            {barLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Tooltip */}
            {tooltip && (
              <Tooltip
                task={tooltip.task}
                dates={tooltip.dates}
                color={tooltip.color}
                x={tooltip.x}
                y={tooltip.y}
                containerWidth={containerWidth - LABEL_WIDTH}
              />
            )}
          </div>
        </div>
      </div>

      {/* Today indicator label */}
      <p className="text-center text-[10px] font-bold text-gray-400 dark:text-gray-600 tracking-widest uppercase">
        Double-click any bar or task name to open details · Purple line = today
      </p>
    </div>
  );
}

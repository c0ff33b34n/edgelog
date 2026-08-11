import React, { useState, useMemo } from 'react';

// --- INLINE SVG ICONS ---
const IconChevronLeft = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const IconChevronRight = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const IconCalendar = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 002-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const IconCamera = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <circle cx="12" cy="13" r="3" strokeWidth={2} />
  </svg>
);

const IconSwap = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
  </svg>
);

const IconClose = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Helper: Safely format dates without UTC/Timezone shifts
const toYYYYMMDD = (input) => {
  if (!input) return '';
  if (typeof input === 'string') {
    const clean = input.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
  }
  const d = new Date(input);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Default fallback data for visual confirmation if no props passed
const DEFAULT_DEMO_TRADES = [
  { id: '1', date: '2026-08-01', symbol: 'EURUSD', pnl: 100, type: 'WIN' },
  { id: '2', date: '2026-08-02', symbol: 'BTCUSD', pnl: 150, type: 'WIN' },
  { id: '3', date: '2026-08-03', symbol: 'US30', pnl: -50, type: 'LOSS' },
  { id: '4', date: '2026-08-04', symbol: 'NVDA', pnl: 100, type: 'WIN' },
  { id: '5', date: '2026-08-05', symbol: 'TSLA', pnl: 500, type: 'WIN' },
  { id: '6', date: '2026-08-06', symbol: 'AAPL', pnl: -50, type: 'LOSS' },
];

export default function Dashboard({ trades = [], onAddTrade, onDeleteTrade }) {
  // Default to August 2026 to match mockup, or fallback to current month
  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 1));
  const [selectedDayKey, setSelectedDayKey] = useState(null);

  const activeTradesList = trades && trades.length > 0 ? trades : DEFAULT_DEMO_TRADES;

  // Month Controls
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const monthYearString = `${monthName} ${year}`;

  // Group trades by YYYY-MM-DD
  const { tradesMap, dateToItems } = useMemo(() => {
    const map = {};
    const items = {};

    activeTradesList.forEach((t) => {
      const rawDate = t.date || t.created_at || t.trade_date;
      const key = toYYYYMMDD(rawDate);
      if (!key) return;

      const pnlVal = Number(t.pnl ?? t.profit ?? t.net_pnl ?? 0);

      if (!map[key]) {
        map[key] = { pnl: 0, count: 0 };
        items[key] = [];
      }
      map[key].pnl += pnlVal;
      map[key].count += 1;
      items[key].push({ ...t, calculatedPnl: pnlVal });
    });

    return { tradesMap: map, dateToItems: items };
  }, [activeTradesList]);

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Monthly aggregated totals
  const monthlyStats = useMemo(() => {
    let totalPnL = 0;
    let activeDays = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      if (tradesMap[dateKey]) {
        totalPnL += tradesMap[dateKey].pnl;
        activeDays += 1;
      }
    }
    return { totalPnL, activeDays };
  }, [year, month, daysInMonth, tradesMap]);

  // Weekly aggregates
  const weeks = useMemo(() => {
    const weekList = [];
    let currentWeekDays = [];
    let weekIndex = 1;
    const weekNames = ['One', 'Two', 'Three', 'Four', 'Five', 'Six'];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      currentWeekDays.push({ day, dateObj });

      if (dateObj.getDay() === 6 || day === daysInMonth) {
        let weekPnL = 0;
        let weekActiveDays = 0;

        currentWeekDays.forEach(({ day: d }) => {
          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          if (tradesMap[dateKey]) {
            weekPnL += tradesMap[dateKey].pnl;
            weekActiveDays += 1;
          }
        });

        const startDate = currentWeekDays[0].dateObj.toLocaleString('default', { month: 'short', day: 'numeric' });
        const endDate = currentWeekDays[currentWeekDays.length - 1].dateObj.toLocaleString('default', { month: 'short', day: 'numeric' });

        weekList.push({
          title: `Week ${weekNames[weekIndex - 1] || weekIndex}`,
          range: `${startDate} - ${endDate}`,
          pnl: weekPnL,
          days: weekActiveDays,
        });

        weekIndex++;
        currentWeekDays = [];
      }
    }
    return weekList;
  }, [year, month, daysInMonth, tradesMap]);

  const selectedDayTrades = selectedDayKey ? dateToItems[selectedDayKey] || [] : [];

  return (
    <div className="bg-[#0b0e14] text-gray-100 min-h-screen p-4 md:p-6 font-sans select-none">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-white tracking-wide">Daily Summary</h1>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-[#141824] hover:bg-[#1f2638] text-gray-300 text-sm px-3.5 py-1.5 rounded-lg border border-slate-800 transition cursor-pointer"
        >
          <IconCamera />
          <span>Share</span>
        </button>
      </div>

      {/* Control Navigation & PnL Bar */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#141824] rounded-lg p-1 border border-slate-800">
            <button onClick={prevMonth} className="p-1.5 hover:bg-[#1f2638] rounded-md text-gray-400 hover:text-white transition cursor-pointer">
              <IconChevronLeft />
            </button>
            <span className="px-3 text-sm font-semibold text-white">{monthYearString}</span>
            <button onClick={nextMonth} className="p-1.5 hover:bg-[#1f2638] rounded-md text-gray-400 hover:text-white transition cursor-pointer">
              <IconChevronRight />
            </button>
          </div>
          <button
            onClick={goToToday}
            className="flex items-center gap-2 bg-[#141824] hover:bg-[#1f2638] text-gray-300 text-sm px-3 py-1.5 rounded-lg border border-slate-800 transition cursor-pointer"
          >
            <IconCalendar />
            <span>Today</span>
          </button>
        </div>

        <div className="bg-[#141824] border border-slate-800 rounded-lg px-4 py-1.5 flex items-center gap-4 text-sm font-medium">
          <div>
            <span className="text-slate-400">PnL: </span>
            <span className={monthlyStats.totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {monthlyStats.totalPnL >= 0 ? '+' : ''}${monthlyStats.totalPnL.toFixed(2)}
            </span>
          </div>
          <div className="h-4 w-px bg-slate-800" />
          <div>
            <span className="text-slate-400">Days: </span>
            <span className="text-white">{monthlyStats.activeDays}</span>
          </div>
        </div>
      </div>

      {/* Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Calendar View */}
        <div className="lg:col-span-3 bg-[#11141f] p-5 rounded-2xl border border-slate-800/80 shadow-2xl">
          <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-400 mb-3">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {/* Empty Offset Days */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-24 rounded-xl bg-[#181c2b]/20" />
            ))}

            {/* Calendar Days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayData = tradesMap[dateKey];
              const hasTrades = !!dayData && dayData.count > 0;
              const isProfit = hasTrades && dayData.pnl >= 0;

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDayKey(dateKey)}
                  className={`h-24 p-2.5 rounded-xl flex flex-col justify-between cursor-pointer transition-all duration-150 ${
                    hasTrades
                      ? isProfit
                        ? 'bg-[#0a231c] border border-emerald-500/80 hover:border-emerald-400 shadow-sm shadow-emerald-950/40'
                        : 'bg-[#281217] border border-rose-500/80 hover:border-rose-400 shadow-sm shadow-rose-950/40'
                      : 'bg-[#151926] border border-slate-800/50 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-semibold text-slate-300">{day}</span>

                  {hasTrades && (
                    <div className="flex flex-col items-start gap-0.5">
                      {dayData.count > 1 && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5">
                          <span>{dayData.count}</span>
                          <IconSwap />
                        </div>
                      )}
                      <span className={`text-xs font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isProfit ? '+' : ''}${dayData.pnl.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly Sidebar */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-400 mb-2">Weekly Summary</h2>
          {weeks.map((week, idx) => (
            <div key={idx} className="bg-[#141824] border border-slate-800/80 rounded-xl p-4 text-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-white">{week.title}</span>
                <span className="text-xs text-slate-400">{week.range}</span>
              </div>
              {week.days > 0 ? (
                <div className="flex justify-between items-center mt-3 text-xs">
                  <div>
                    <span className="text-slate-400">PnL: </span>
                    <span className={`font-semibold ${week.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {week.pnl >= 0 ? '+' : ''}${week.pnl.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Days: </span>
                    <span className="font-semibold text-white">{week.days}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 mt-2">No trades</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Day Details Modal */}
      {selectedDayKey && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141824] border border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Trades for {selectedDayKey}</h3>
              <button
                onClick={() => setSelectedDayKey(null)}
                className="text-gray-400 hover:text-white transition cursor-pointer"
              >
                <IconClose />
              </button>
            </div>

            {selectedDayTrades.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {selectedDayTrades.map((t, idx) => (
                  <div key={t.id || idx} className="flex justify-between items-center p-3 rounded-lg bg-[#1c2232] border border-slate-800">
                    <div>
                      <p className="text-sm font-semibold text-white">{t.symbol || t.pair || 'Trade'}</p>
                      <p className="text-xs text-gray-400">{t.type || (t.calculatedPnl >= 0 ? 'Long' : 'Short')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-bold ${t.calculatedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {t.calculatedPnl >= 0 ? '+' : ''}${t.calculatedPnl.toFixed(2)}
                      </span>
                      {onDeleteTrade && (
                        <button
                          onClick={() => onDeleteTrade(t.id)}
                          className="text-xs text-rose-500 hover:text-rose-400 transition"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 my-4 text-center">No trades logged for this date.</p>
            )}

            <div className="mt-5 flex gap-2">
              {onAddTrade && (
                <button
                  onClick={() => {
                    onAddTrade(selectedDayKey);
                    setSelectedDayKey(null);
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-sm py-2 rounded-lg font-semibold transition"
                >
                  + Add Trade for this Day
                </button>
              )}
              <button
                onClick={() => setSelectedDayKey(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-gray-300 text-sm py-2 rounded-lg font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

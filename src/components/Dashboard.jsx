import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Camera, ArrowUpDown } from 'lucide-react';

export default function Dashboard({ trades = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 1)); // Default: August 2026

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const monthYearString = `${monthName} ${year}`;

  // Process trades into a lookup map by YYYY-MM-DD
  const tradesByDate = useMemo(() => {
    const map = {};
    trades.forEach((trade) => {
      const dateKey = new Date(trade.date).toISOString().split('T')[0];
      if (!map[dateKey]) {
        map[dateKey] = { pnl: 0, count: 0 };
      }
      map[dateKey].pnl += Number(trade.pnl || trade.profit || 0);
      map[dateKey].count += 1;
    });
    return map;
  }, [trades]);

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Monthly statistics
  const monthlyStats = useMemo(() => {
    let totalPnL = 0;
    let activeDays = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (tradesByDate[dateKey]) {
        totalPnL += tradesByDate[dateKey].pnl;
        activeDays += 1;
      }
    }
    return { totalPnL, activeDays };
  }, [year, month, daysInMonth, tradesByDate]);

  // Weekly breakdown computation
  const weeks = useMemo(() => {
    const weekList = [];
    let currentWeekDays = [];
    let weekIndex = 1;
    const weekNames = ['One', 'Two', 'Three', 'Four', 'Five', 'Six'];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const dayOfWeek = dateObj.getDay();

      currentWeekDays.push({ day, dateObj });

      if (dayOfWeek === 6 || day === daysInMonth) {
        let weekPnL = 0;
        let weekActiveDays = 0;

        currentWeekDays.forEach(({ day: d }) => {
          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          if (tradesByDate[dateKey]) {
            weekPnL += tradesByDate[dateKey].pnl;
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
  }, [year, month, daysInMonth, tradesByDate]);

  return (
    <div className="bg-[#090d16] text-gray-100 min-h-screen p-6 font-sans">
      {/* Top Header Controls */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-white">Daily Summary</h1>
        <button className="flex items-center gap-2 bg-[#131927] hover:bg-[#1a2336] text-gray-300 text-sm px-3.5 py-1.5 rounded-lg border border-slate-800 transition">
          <Camera className="w-4 h-4" />
          <span>Share</span>
        </button>
      </div>

      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#131927] rounded-lg p-1 border border-slate-800">
            <button onClick={prevMonth} className="p-1.5 hover:bg-[#1a2336] rounded-md text-gray-400 hover:text-white transition">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-sm font-semibold text-white">{monthYearString}</span>
            <button onClick={nextMonth} className="p-1.5 hover:bg-[#1a2336] rounded-md text-gray-400 hover:text-white transition">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={goToToday}
            className="flex items-center gap-2 bg-[#131927] hover:bg-[#1a2336] text-gray-300 text-sm px-3 py-1.5 rounded-lg border border-slate-800 transition"
          >
            <Calendar className="w-4 h-4" />
            <span>Today</span>
          </button>
        </div>

        <div className="bg-[#131927] border border-slate-800 rounded-lg px-4 py-1.5 flex items-center gap-4 text-sm font-medium">
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

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Styled Calendar Card Container */}
        <div className="lg:col-span-3 bg-[#0d121f] p-6 rounded-2xl border border-slate-800/80 shadow-xl">
          {/* Calendar Header with Navigation */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white tracking-wide">{monthYearString}</h2>
            <div className="flex gap-2">
              <button
                onClick={prevMonth}
                className="p-2 bg-[#141b2d] hover:bg-[#1c263e] border border-slate-800 rounded-xl text-slate-300 hover:text-white transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-2 bg-[#141b2d] hover:bg-[#1c263e] border border-slate-800 rounded-xl text-slate-300 hover:text-white transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of Week Row */}
          <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-400 mb-3">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Day Grid Cells */}
          <div className="grid grid-cols-7 gap-2.5">
            {/* Empty Offset Days */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-24 rounded-xl bg-[#121826]/40" />
            ))}

            {/* Active Calendar Days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayData = tradesByDate[dateKey];
              const hasTrades = !!dayData && dayData.count > 0;
              const isProfit = hasTrades && dayData.pnl >= 0;

              return (
                <div
                  key={day}
                  className={`h-24 p-3 rounded-xl flex flex-col justify-between transition-all duration-200 ${
                    hasTrades
                      ? isProfit
                        ? 'bg-[#0b211e] border border-emerald-500/80 shadow-sm shadow-emerald-950/50'
                        : 'bg-[#261118] border border-rose-500/80 shadow-sm shadow-rose-950/50'
                      : 'bg-[#121826] border border-slate-800/40 hover:border-slate-700'
                  }`}
                >
                  <span className="text-sm font-semibold text-slate-200">{day}</span>

                  {hasTrades && (
                    <div className="flex flex-col items-start gap-0.5">
                      {dayData.count > 1 && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5">
                          <span>{dayData.count}</span>
                          <ArrowUpDown className="w-2.5 h-2.5" />
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

        {/* Weekly Summary Panel */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-400 mb-2">Weekly Summary</h2>
          {weeks.map((week, idx) => (
            <div key={idx} className="bg-[#131927] border border-slate-800/80 rounded-2xl p-4 text-sm">
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
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Camera, ArrowUpDown } from 'lucide-react';

export default function Dashboard({ trades = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 1)); // Set to August 2026 by default

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

  // Calendar matrix setup
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
    <div className="bg-[#0e1117] text-gray-100 min-h-screen p-6 font-sans">
      {/* Daily Summary Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-white">Daily Summary</h1>
        <button className="flex items-center gap-2 bg-[#181c24] hover:bg-[#222733] text-gray-300 text-sm px-3 py-1.5 rounded-lg border border-gray-800 transition">
          <Camera className="w-4 h-4" />
          <span>Share</span>
        </button>
      </div>

      {/* Control Bar */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#181c24] rounded-lg p-1 border border-gray-800">
            <button onClick={prevMonth} className="p-1.5 hover:bg-[#222733] rounded-md text-gray-400 hover:text-white transition">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-sm font-semibold text-white">{monthYearString}</span>
            <button onClick={nextMonth} className="p-1.5 hover:bg-[#222733] rounded-md text-gray-400 hover:text-white transition">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={goToToday}
            className="flex items-center gap-2 bg-[#181c24] hover:bg-[#222733] text-gray-300 text-sm px-3 py-1.5 rounded-lg border border-gray-800 transition"
          >
            <Calendar className="w-4 h-4" />
            <span>Today</span>
          </button>
        </div>

        {/* Top-Right Monthly PnL / Days Summary */}
        <div className="bg-[#181c24] border border-gray-800 rounded-lg px-4 py-1.5 flex items-center gap-4 text-sm font-medium">
          <div>
            <span className="text-gray-400">PnL: </span>
            <span className={monthlyStats.totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {monthlyStats.totalPnL >= 0 ? '+' : ''}${monthlyStats.totalPnL.toFixed(2)}
            </span>
          </div>
          <div className="h-4 w-px bg-gray-800" />
          <div>
            <span className="text-gray-400">Days: </span>
            <span className="text-white">{monthlyStats.activeDays}</span>
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side: Calendar Grid */}
        <div className="lg:col-span-3 bg-[#131720] p-4 rounded-xl border border-gray-800/80">
          {/* Day Names */}
          <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-400 mb-3">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {/* Offset blank cells for month start */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-24 rounded-lg bg-[#0e1117]/30" />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayData = tradesByDate[dateKey];
              const hasTrades = !!dayData && dayData.count > 0;
              const isProfit = hasTrades && dayData.pnl >= 0;

              return (
                <div
                  key={day}
                  className={`h-24 p-2 rounded-lg border flex flex-col justify-between transition ${
                    hasTrades
                      ? isProfit
                        ? 'bg-[#0f2420] border-emerald-600/50 hover:border-emerald-500'
                        : 'bg-[#29151a] border-rose-600/50 hover:border-rose-500'
                      : 'bg-[#181c24]/50 border-gray-800/60 hover:border-gray-700'
                  }`}
                >
                  <span className="text-xs font-medium text-gray-300">{day}</span>

                  {hasTrades && (
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1 text-[11px] text-gray-400">
                        <span>{dayData.count}</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
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

        {/* Right Side: Weekly Summary Panel */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-400 mb-2">Weekly Summary</h2>
          {weeks.map((week, idx) => (
            <div key={idx} className="bg-[#181c24] border border-gray-800/80 rounded-xl p-4 text-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-white">{week.title}</span>
                <span className="text-xs text-gray-400">{week.range}</span>
              </div>
              {week.days > 0 ? (
                <div className="flex justify-between items-center mt-3 text-xs">
                  <div>
                    <span className="text-gray-400">PnL: </span>
                    <span className={`font-semibold ${week.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {week.pnl >= 0 ? '+' : ''}${week.pnl.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Days: </span>
                    <span className="font-semibold text-white">{week.days}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 mt-2">No trades</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

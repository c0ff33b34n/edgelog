import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../supabaseClient'
import TradeModal from './TradeModal'
import { 
  ChevronLeft, ChevronRight, TrendingUp, DollarSign, Percent, 
  Camera, Calendar, ArrowUpDown 
} from 'lucide-react'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts'

export default function Dashboard({ user }) {
  const [trades, setTrades] = useState([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTrades, setSelectedTrades] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    fetchTrades()
  }, [])

  const fetchTrades = async () => {
    const { data } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
    if (data) setTrades(data)
  }

  // --- Analytics & Chart Data ---
  const totalTrades = trades.length
  const winningTrades = trades.filter(t => t.is_win).length
  const winRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(1) : '0'
  const netPnL = trades.reduce((acc, t) => acc + Number(t.amount), 0)

  const sortedTrades = [...trades].sort((a, b) => new Date(a.trade_date) - new Date(b.trade_date))
  let runningBalance = 0
  const equityData = sortedTrades.map(trade => {
    runningBalance += Number(trade.amount)
    return {
      date: trade.trade_date,
      equity: runningBalance,
      amount: Number(trade.amount)
    }
  })

  const winLossData = [
    { name: 'Wins', value: winningTrades },
    { name: 'Losses', value: totalTrades - winningTrades }
  ]
  const PIE_COLORS = ['#34d399', '#fb7185']

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const pnlByDayMap = dayNames.map(day => ({ day, pnl: 0 }))

  trades.forEach(trade => {
    if (trade.trade_date) {
      const [y, m, d] = trade.trade_date.split('-')
      const dateObj = new Date(y, m - 1, d)
      const dayIndex = dateObj.getDay()
      pnlByDayMap[dayIndex].pnl += Number(trade.amount)
    }
  })

  // --- Calendar & Weekly Logic ---
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const formatMonth = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const goToToday = () => setCurrentDate(new Date())

  // Monthly stats for active month
  const monthlyStats = useMemo(() => {
    const monthTrades = trades.filter(t => {
      if (!t.trade_date) return false
      const [y, m] = t.trade_date.split('-').map(Number)
      return y === year && m === month + 1
    })
    const pnl = monthTrades.reduce((acc, t) => acc + Number(t.amount), 0)
    const activeDays = new Set(monthTrades.map(t => t.trade_date)).size
    return { pnl, activeDays }
  }, [trades, year, month])

  // Weekly breakdown computation for sidebar
  const weeklySummary = useMemo(() => {
    const list = []
    const weekNames = ['One', 'Two', 'Three', 'Four', 'Five', 'Six']
    let currentWeekDays = []
    let weekIdx = 0

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day)
      currentWeekDays.push(dateObj)

      if (dateObj.getDay() === 6 || day === daysInMonth) {
        const startDate = currentWeekDays[0]
        const endDate = currentWeekDays[currentWeekDays.length - 1]

        const formattedKeys = currentWeekDays.map(d => {
          const mStr = String(d.getMonth() + 1).padStart(2, '0')
          const dStr = String(d.getDate()).padStart(2, '0')
          return `${d.getFullYear()}-${mStr}-${dStr}`
        })

        const weekTrades = trades.filter(t => formattedKeys.includes(t.trade_date))
        const pnl = weekTrades.reduce((acc, t) => acc + Number(t.amount), 0)
        const daysCount = new Set(weekTrades.map(t => t.trade_date)).size

        list.push({
          title: `Week ${weekNames[weekIdx] || weekIdx + 1}`,
          range: `${startDate.toLocaleString('default', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleString('default', { month: 'short', day: 'numeric' })}`,
          pnl,
          days: daysCount,
          hasTrades: weekTrades.length > 0
        })

        weekIdx++
        currentWeekDays = []
      }
    }
    return list
  }, [year, month, daysInMonth, trades])

  const handleDateClick = (day) => {
    const monthStr = String(month + 1).padStart(2, '0')
    const dayStr = String(day).padStart(2, '0')
    const dateStr = `${year}-${monthStr}-${dayStr}`
    const tradesOnDate = trades.filter(t => t.trade_date === dateStr)
    setSelectedDate(dateStr)
    setSelectedTrades(tradesOnDate)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6 bg-[#090d16] text-gray-100 min-h-screen p-2 md:p-6 rounded-2xl select-none">
      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#131927] border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Net P&L</p>
            <h3 className={`text-2xl font-bold mt-1 ${netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              ${netPnL.toFixed(2)}
            </h3>
          </div>
          <div className="p-3 bg-slate-800/80 rounded-xl text-blue-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-[#131927] border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Win Rate</p>
            <h3 className="text-2xl font-bold mt-1 text-white">{winRate}%</h3>
          </div>
          <div className="p-3 bg-slate-800/80 rounded-xl text-emerald-400">
            <Percent className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-[#131927] border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Executed Trades</p>
            <h3 className="text-2xl font-bold mt-1 text-white">{totalTrades}</h3>
          </div>
          <div className="p-3 bg-slate-800/80 rounded-xl text-purple-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Header & Controls Bar */}
      <div className="flex justify-between items-center pt-2">
        <h1 className="text-xl font-bold text-white">Daily Summary</h1>
        <button className="flex items-center gap-2 bg-[#131927] hover:bg-[#1a2336] text-gray-300 text-sm px-3.5 py-1.5 rounded-lg border border-slate-800 transition">
          <Camera className="w-4 h-4" />
          <span>Share</span>
        </button>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#131927] rounded-lg p-1 border border-slate-800">
            <button onClick={prevMonth} className="p-1.5 hover:bg-[#1a2336] rounded-md text-gray-400 hover:text-white transition">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-sm font-semibold text-white">{formatMonth}</span>
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
            <span className={monthlyStats.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {monthlyStats.pnl >= 0 ? '+' : ''}${monthlyStats.pnl.toFixed(2)}
            </span>
          </div>
          <div className="h-4 w-px bg-slate-800" />
          <div>
            <span className="text-slate-400">Days: </span>
            <span className="text-white">{monthlyStats.activeDays}</span>
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Grid Container */}
        <div className="lg:col-span-3 bg-[#0d121f] p-5 rounded-2xl border border-slate-800/80 shadow-2xl">
          <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-400 mb-3">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2.5">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="h-24 rounded-xl bg-[#121826]/30 border border-transparent" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const monthStr = String(month + 1).padStart(2, '0')
              const dayStr = String(day).padStart(2, '0')
              const dateKey = `${year}-${monthStr}-${dayStr}`

              const dayTrades = trades.filter(t => t.trade_date === dateKey)
              const hasTrades = dayTrades.length > 0
              const dayPnL = hasTrades ? dayTrades.reduce((acc, t) => acc + Number(t.amount), 0) : null
              const isProfit = dayPnL !== null && dayPnL >= 0
              const tradeWithImage = dayTrades.find(t => t.image_url)

              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className={`h-24 p-2.5 rounded-xl border flex flex-col justify-between transition-all duration-200 text-left relative overflow-hidden group ${
                    hasTrades
                      ? isProfit
                        ? 'bg-[#0b211e] border-emerald-500/80 hover:border-emerald-400 shadow-sm shadow-emerald-950/40'
                        : 'bg-[#261118] border-rose-500/80 hover:border-rose-400 shadow-sm shadow-rose-950/40'
                      : 'bg-[#121826] border-slate-800/40 hover:border-slate-700'
                  }`}
                >
                  <span className="text-sm font-semibold text-slate-200">{day}</span>

                  {tradeWithImage && (
                    <div className="w-full h-8 my-0.5 rounded overflow-hidden border border-slate-700/60 bg-slate-900/80">
                      <img src={tradeWithImage.image_url} alt="Trade preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                    </div>
                  )}

                  {hasTrades && (
                    <div className="flex flex-col items-start gap-0.5 mt-auto">
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <span>{dayTrades.length}</span>
                        <ArrowUpDown className="w-2.5 h-2.5" />
                      </div>
                      <span className={`text-xs font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isProfit ? '+' : ''}${dayPnL.toFixed(2)}
                      </span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Weekly Summary Panel Sidebar */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-400 mb-2">Weekly Summary</h2>
          {weeklySummary.map((week, idx) => (
            <div key={idx} className="bg-[#131927] border border-slate-800/80 rounded-2xl p-4 text-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-white">{week.title}</span>
                <span className="text-xs text-slate-400">{week.range}</span>
              </div>
              {week.hasTrades ? (
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

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {/* Equity Curve */}
        <div className="md:col-span-2 bg-[#131927] border border-slate-800 p-6 rounded-2xl shadow-lg">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Cumulative Equity Curve</h3>
          <div className="h-64 w-full">
            {equityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={equityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickMargin={10} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `$${value}`} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    itemStyle={{ color: '#60a5fa' }}
                  />
                  <Line type="monotone" dataKey="equity" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">No trades yet to plot equity.</div>
            )}
          </div>
        </div>

        {/* Win/Loss Pie */}
        <div className="bg-[#131927] border border-slate-800 p-6 rounded-2xl shadow-lg flex flex-col">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Win vs Loss Ratio</h3>
          <div className="h-64 w-full flex-grow">
            {totalTrades > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={winLossData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {winLossData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">Log trades to see win ratio.</div>
            )}
          </div>
        </div>

        {/* P&L Day Bar Chart */}
        <div className="md:col-span-3 bg-[#131927] border border-slate-800 p-6 rounded-2xl shadow-lg flex flex-col">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Net P&L by Day of the Week</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pnlByDayMap}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickMargin={10} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `$${value}`} />
                <RechartsTooltip 
                  cursor={{ fill: '#1e293b' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                  formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Net P&L']}
                />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {pnlByDayMap.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.pnl >= 0 ? '#34d399' : '#fb7185'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <TradeModal
          selectedDate={selectedDate}
          existingTrades={selectedTrades}
          userId={user.id}
          onClose={() => setIsModalOpen(false)}
          onRefresh={fetchTrades}
        />
      )}
    </div>
  )
}

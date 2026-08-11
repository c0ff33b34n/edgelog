import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import TradeModal from './TradeModal'
import { ChevronLeft, ChevronRight, TrendingUp, DollarSign, Percent } from 'lucide-react'
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

  // --- Analytics & Chart Data Prep ---
  const totalTrades = trades.length
  const winningTrades = trades.filter(t => t.is_win).length
  const winRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(1) : '0'
  const netPnL = trades.reduce((acc, t) => acc + Number(t.amount), 0)

  // 1. Equity Curve Data (Sorted by date)
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

  // 2. Win/Loss Pie Chart Data
  const winLossData = [
    { name: 'Wins', value: winningTrades },
    { name: 'Losses', value: totalTrades - winningTrades }
  ]
  const PIE_COLORS = ['#34d399', '#fb7185'] // Tailwind Emerald-400 and Rose-400

  // 3. P&L by Day of the Week Data
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const pnlByDayMap = dayNames.map(day => ({ day, pnl: 0 }))
  
  trades.forEach(trade => {
    if (trade.trade_date) {
      // Split to avoid timezone shifting issues when parsing dates
      const [y, m, d] = trade.trade_date.split('-')
      const dateObj = new Date(y, m - 1, d)
      const dayIndex = dateObj.getDay()
      
      pnlByDayMap[dayIndex].pnl += Number(trade.amount)
    }
  })

  // --- Calendar Date Logic ---
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const formatMonth = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

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
    <div className="space-y-6">
      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-lg">
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
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Win Rate</p>
            <h3 className="text-2xl font-bold mt-1 text-white">{winRate}%</h3>
          </div>
          <div className="p-3 bg-slate-800/80 rounded-xl text-emerald-400">
            <Percent className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Executed Trades</p>
            <h3 className="text-2xl font-bold mt-1 text-white">{totalTrades}</h3>
          </div>
          <div className="p-3 bg-slate-800/80 rounded-xl text-purple-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Graphical Representations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cumulative Equity Curve */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
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

        {/* Win/Loss Pie Chart */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg flex flex-col">
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

        {/* P&L by Day of the Week Bar Chart */}
        <div className="md:col-span-3 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg flex flex-col">
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

      {/* Monthly Trading Calendar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">{formatMonth}</h2>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition active:scale-95">
              <ChevronLeft className="w-5 h-5 text-slate-300" />
            </button>
            <button onClick={nextMonth} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition active:scale-95">
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-400 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="h-28 bg-slate-950/40 rounded-xl border border-slate-900/50" />
          ))}
          
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const monthStr = String(month + 1).padStart(2, '0')
            const dayStr = String(day).padStart(2, '0')
            const dateKey = `${year}-${monthStr}-${dayStr}`
            
            const dayTrades = trades.filter(t => t.trade_date === dateKey)
            const dayPnL = dayTrades.length > 0
               ? dayTrades.reduce((acc, t) => acc + Number(t.amount), 0)
               : undefined
            
            const tradeWithImage = dayTrades.find(t => t.image_url)
            let bgStyle = 'bg-slate-800/30 border-slate-800 hover:border-blue-500/50'
            
            if (dayPnL !== undefined) {
              bgStyle = dayPnL >= 0
                 ? 'bg-emerald-950/40 border-emerald-600/50 hover:border-emerald-500 text-emerald-400'
                 : 'bg-rose-950/40 border-rose-600/50 hover:border-rose-500 text-rose-400'
            }
            
            return (
              <button
                key={day}
                onClick={() => handleDateClick(day)}
                className={`h-28 p-2 rounded-xl border transition text-left flex flex-col justify-between overflow-hidden relative group ${bgStyle}`}
              >
                <div className="flex justify-between items-center w-full z-10">
                  <span className="text-xs font-semibold text-slate-400">{day}</span>
                </div>
                {tradeWithImage && (
                  <div className="w-full h-10 my-1 rounded overflow-hidden border border-slate-700/60 bg-slate-900/80">
                    <img src={tradeWithImage.image_url} alt="Trade preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                  </div>
                )}
                {dayPnL !== undefined && (
                  <span className="text-xs font-bold z-10 mt-auto">
                    {dayPnL >= 0 ? `+$${dayPnL.toFixed(2)}` : `-$${Math.abs(dayPnL).toFixed(2)}`}
                  </span>
                )}
              </button>
            )
          })}
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

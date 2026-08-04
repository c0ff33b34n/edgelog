import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { X, Upload, Plus, Trash2, Edit3, CheckCircle2, XCircle } from 'lucide-react'

export default function TradeModal({ selectedDate, existingTrades, onClose, onRefresh, userId }) {
  // If trade exists, default to 'view' mode, otherwise 'create'
  const activeTrade = existingTrades && existingTrades.length > 0 ? existingTrades[0] : null
  const [mode, setMode] = useState(activeTrade ? 'view' : 'create')

  // Form States
  const [amount, setAmount] = useState(activeTrade ? Math.abs(activeTrade.amount) : '')
  const [isWin, setIsWin] = useState(activeTrade ? activeTrade.is_win : true)
  const [tp, setTp] = useState(activeTrade?.tp || '')
  const [sl, setSl] = useState(activeTrade?.sl || '')
  const [notes, setNotes] = useState(activeTrade?.psychology_notes || '')
  const [imageFile, setImageFile] = useState(null)
  const [rules, setRules] = useState([])
  const [checkedRules, setCheckedRules] = useState({})
  const [newRuleText, setNewRuleText] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchRules()
  }, [])

  const fetchRules = async () => {
    const { data } = await supabase
      .from('strategy_rules')
      .select('*')
      .eq('user_id', userId)

    if (data) {
      setRules(data)
      const initialChecked = {}
      data.forEach(r => initialChecked[r.id] = false)
      setCheckedRules(initialChecked)
    }
  }

  const handleAddRule = async () => {
    if (!newRuleText.trim()) return
    const { data, error } = await supabase
      .from('strategy_rules')
      .insert([{ user_id: userId, rule_text: newRuleText }])
      .select()

    if (!error && data) {
      setRules([...rules, data[0]])
      setNewRuleText('')
    }
  }

  const handleSaveTrade = async (e) => {
    e.preventDefault()
    setLoading(true)

    let imageUrl = activeTrade?.image_url || null

    if (imageFile) {
      const fileName = `${userId}/${Date.now()}_${imageFile.name}`
      const { data, error } = await supabase.storage
        .from('trade-screenshots')
        .upload(fileName, imageFile)

      if (!error && data) {
        const { data: { publicUrl } } = supabase.storage
          .from('trade-screenshots')
          .getPublicUrl(fileName)
        imageUrl = publicUrl
      }
    }

    const tradeAmount = isWin ? Math.abs(parseFloat(amount) || 0) : -Math.abs(parseFloat(amount) || 0)

    const tradePayload = {
      user_id: userId,
      trade_date: selectedDate,
      amount: tradeAmount,
      is_win: isWin,
      tp: tp ? parseFloat(tp) : null,
      sl: sl ? parseFloat(sl) : null,
      psychology_notes: notes,
      image_url: imageUrl
    }

    let result
    if (activeTrade && mode === 'edit') {
      result = await supabase.from('trades').update(tradePayload).eq('id', activeTrade.id)
    } else {
      result = await supabase.from('trades').insert([tradePayload])
    }

    setLoading(false)
    if (result.error) {
      alert(result.error.message)
    } else {
      onRefresh()
      onClose()
    }
  }

  const handleDeleteTrade = async () => {
    if (!activeTrade || !confirm('Are you sure you want to delete this trade entry?')) return
    setLoading(true)
    const { error } = await supabase.from('trades').delete().eq('id', activeTrade.id)
    setLoading(false)

    if (error) {
      alert(error.message)
    } else {
      onRefresh()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 text-slate-100 shadow-2xl">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-slate-100">
              Trade Log for <span className="text-blue-400">{selectedDate}</span>
            </h3>
            {mode === 'view' && activeTrade && (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                activeTrade.is_win ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                {activeTrade.is_win ? 'WIN' : 'LOSS'}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* --- VIEW MODE --- */}
        {mode === 'view' && activeTrade && (
          <div className="space-y-6">
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5">
                <p className="text-xs text-slate-400 font-medium">Net P&L</p>
                <p className={`text-xl font-bold mt-1 ${activeTrade.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {activeTrade.amount >= 0 ? `+$${Number(activeTrade.amount).toFixed(2)}` : `-$${Math.abs(activeTrade.amount).toFixed(2)}`}
                </p>
              </div>
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5">
                <p className="text-xs text-slate-400 font-medium">Take Profit (TP)</p>
                <p className="text-lg font-semibold mt-1 text-slate-200">{activeTrade.tp ? `$${activeTrade.tp}` : 'N/A'}</p>
              </div>
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5">
                <p className="text-xs text-slate-400 font-medium">Stop Loss (SL)</p>
                <p className="text-lg font-semibold mt-1 text-slate-200">{activeTrade.sl ? `$${activeTrade.sl}` : 'N/A'}</p>
              </div>
            </div>

            {/* Psychology & Notes */}
            <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Psychology & Notes</h4>
              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {activeTrade.psychology_notes || 'No notes provided for this trade.'}
              </p>
            </div>

            {/* Screenshot Preview */}
            {activeTrade.image_url && (
              <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Chart Screenshot</h4>
                <a href={activeTrade.image_url} target="_blank" rel="noreferrer">
                  <img
                    src={activeTrade.image_url}
                    alt="Trade Screenshot"
                    className="w-full max-h-64 object-cover rounded-lg border border-slate-700 hover:opacity-95 transition"
                  />
                </a>
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleDeleteTrade}
                disabled={loading}
                className="flex items-center gap-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 px-4 py-2 rounded-xl text-sm font-semibold transition"
              >
                <Trash2 className="w-4 h-4" /> Delete Trade
              </button>
              <button
                type="button"
                onClick={() => setMode('edit')}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/20 transition"
              >
                <Edit3 className="w-4 h-4" /> Edit Trade
              </button>
            </div>
          </div>
        )}

        {/* --- CREATE / EDIT MODE --- */}
        {(mode === 'create' || mode === 'edit') && (
          <form onSubmit={handleSaveTrade} className="space-y-5">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsWin(true)}
                className={`flex-1 py-2.5 rounded-xl font-semibold border transition flex items-center justify-center gap-2 ${
                  isWin ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" /> Win (+)
              </button>
              <button
                type="button"
                onClick={() => setIsWin(false)}
                className={`flex-1 py-2.5 rounded-xl font-semibold border transition flex items-center justify-center gap-2 ${
                  !isWin ? 'bg-rose-600/20 border-rose-500 text-rose-400' : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                <XCircle className="w-4 h-4" /> Loss (-)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Amount ($)</label>
                <input
                  type="number" step="any" required placeholder="0.00" value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Take Profit (TP)</label>
                <input
                  type="number" step="any" placeholder="Optional" value={tp}
                  onChange={e => setTp(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Stop Loss (SL)</label>
                <input
                  type="number" step="any" placeholder="Optional" value={sl}
                  onChange={e => setSl(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Strategy Checklist</h4>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {rules.map(rule => (
                  <label key={rule.id} className="flex items-center gap-3 text-sm cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={checkedRules[rule.id] || false}
                      onChange={() => setCheckedRules(prev => ({ ...prev, [rule.id]: !prev[rule.id] }))}
                      className="accent-blue-500 w-4 h-4 rounded"
                    />
                    <span className="text-slate-300">{rule.rule_text}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <input
                  type="text"
                  placeholder="Add custom strategy rule..."
                  value={newRuleText}
                  onChange={e => setNewRuleText(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-white"
                />
                <button
                  type="button"
                  onClick={handleAddRule}
                  className="bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Psychology & Mental State</label>
              <textarea
                rows={3}
                placeholder="How were your emotions? Discipline level, mistakes, or key takeaways..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Upload / Replace Chart Image</label>
              <label className="flex items-center gap-2 cursor-pointer bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2.5 rounded-xl text-sm w-max">
                <Upload className="w-4 h-4 text-blue-400" />
                <span>{imageFile ? imageFile.name : 'Choose Chart Image'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setImageFile(e.target.files[0])}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex gap-3 pt-3">
              {mode === 'edit' && (
                <button
                  type="button"
                  onClick={() => setMode('view')}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 p-3 rounded-xl font-semibold transition"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-500 p-3 rounded-xl font-bold transition text-white shadow-lg shadow-blue-600/20"
              >
                {loading ? 'Saving Trade...' : mode === 'edit' ? 'Update Trade Entry' : 'Save Trade Entry'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  )
}
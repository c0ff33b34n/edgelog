import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'

export default function App() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (!session) return <Auth />

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <nav className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center max-w-7xl mx-auto">
        <h1 className="text-xl font-bold text-blue-400">TradeLog App</h1>
        <button 
          onClick={() => supabase.auth.signOut()} 
          className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded text-sm border border-slate-700"
        >
          Logout
        </button>
      </nav>
      <main className="p-6 max-w-7xl mx-auto">
        <Dashboard user={session.user} />
      </main>
    </div>
  )
}
import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) alert(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) alert(error.message)
      else alert('Check your email for confirmation!')
    }
    setLoading(false)
  }

  return (
    <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
      <form onSubmit={handleAuth} className="p-8 bg-slate-800 rounded-xl w-96 flex flex-col gap-4 shadow-2xl border border-slate-700">
        <h2 className="text-2xl font-bold text-center text-blue-400">
          {isLogin ? 'Trading Journal Login' : 'Create Account'}
        </h2>
        <input 
          type="email" placeholder="Email" value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          className="p-3 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:border-blue-500 text-white" required 
        />
        <input 
          type="password" placeholder="Password" value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          className="p-3 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:border-blue-500 text-white" required 
        />
        <button disabled={loading} type="submit" className="bg-blue-600 hover:bg-blue-500 p-3 rounded font-bold transition">
          {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
        </button>
        <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-sm text-slate-400 hover:underline text-center">
          {isLogin ? "Don't have an account? Register" : 'Already registered? Login'}
        </button>
      </form>
    </div>
  )
}
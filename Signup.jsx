// ============================================================
// components/Auth/Signup.jsx - Registration page
// ============================================================
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Signup() {
  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate   = useNavigate();

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.name.trim().length < 2)
      return setError('Name must be at least 2 characters');
    if (form.password.length < 6)
      return setError('Password must be at least 6 characters');
    if (form.password !== form.confirm)
      return setError('Passwords do not match');

    setLoading(true);
    try {
      await signup(form.name.trim(), form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const strength = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 6)  s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();
  const strengthLabel  = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'][strength];
  const strengthColors = ['', '#ef4444', '#f97316', '#f59e0b', '#22c55e', '#10b981'];

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 p-4 relative overflow-hidden">
      {/* Background decorative glow blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #00d4ff, transparent 70%)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #8b5cf6, transparent 70%)' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4
                          bg-gradient-to-br from-accent-cyan/20 to-accent-blue/10
                          border border-accent-cyan/30 shadow-[0_0_30px_rgba(0,212,255,0.15)]">
            <span className="text-3xl">🏙</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Join UrbanLens</h1>
          <p className="text-gray-500 text-sm mt-1">Report issues, shape your city</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white">Create Account</h2>
            <p className="text-gray-500 text-sm mt-1">Join the city monitoring network</p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm
                            rounded-lg px-4 py-3 mb-5 flex items-center gap-2">
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                className="input-field"
                placeholder="Jane Smith"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                className="input-field"
                placeholder="officer@city.gov"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                name="password"
                className="input-field"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />
              {/* Password strength bar */}
              {form.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                        style={{ background: i <= strength ? strengthColors[strength] : '#1e2d42' }} />
                    ))}
                  </div>
                  <p className="text-[10px]" style={{ color: strengthColors[strength] }}>{strengthLabel}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirm"
                className={`input-field ${
                  form.confirm && form.confirm !== form.password
                    ? 'border-red-500/50 focus:border-red-500/70'
                    : form.confirm && form.confirm === form.password
                    ? 'border-green-500/50 focus:border-green-500/70'
                    : ''
                }`}
                placeholder="Repeat password"
                value={form.confirm}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />
              {form.confirm && form.confirm === form.password && (
                <p className="text-[10px] text-green-400 mt-1">✓ Passwords match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                'Create Account →'
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/5">
            <p className="text-center text-sm text-gray-500">
              Already a member?{' '}
              <Link to="/login" className="text-accent-cyan hover:text-cyan-300 transition-colors font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-[11px] text-gray-700 mt-6 font-mono">
          URBANLENS © {new Date().getFullYear()} · SMART CITY INFRASTRUCTURE
        </p>
      </div>
    </div>
  );
}

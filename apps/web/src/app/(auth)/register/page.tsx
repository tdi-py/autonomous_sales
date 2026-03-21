'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', companyName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post<{ token: string }>('/auth/register', form);
      document.cookie = `auth-token=${res.token}; path=/; max-age=${60 * 60 * 24 * 7}`;
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">

        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground font-bold text-xl">
            A
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Get started</h1>
          <p className="text-muted-foreground text-sm">Create your account and workspace</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {[
            { id: 'name', label: 'Full Name', type: 'text', placeholder: 'Mustafa Yılmaz', autocomplete: 'name' },
            { id: 'companyName', label: 'Company Name', type: 'text', placeholder: 'ShopFast Inc.', autocomplete: 'organization' },
            { id: 'email', label: 'Email', type: 'email', placeholder: 'you@company.com', autocomplete: 'email' },
            { id: 'password', label: 'Password', type: 'password', placeholder: '8+ characters', autocomplete: 'new-password' },
          ].map((field) => (
            <div key={field.id} className="space-y-2">
              <label className="text-sm font-medium" htmlFor={field.id}>
                {field.label}
              </label>
              <input
                id={field.id}
                name={field.id}
                type={field.type}
                autoComplete={field.autocomplete}
                required={field.id !== 'companyName'}
                value={form[field.id as keyof typeof form]}
                onChange={handleChange}
                placeholder={field.placeholder}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
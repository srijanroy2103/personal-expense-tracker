import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginFormValues } from './schemas'
import { signIn } from './api'

export function LoginForm() {
  const [authError, setAuthError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (values: LoginFormValues) => {
    setAuthError(null)
    try {
      await signIn(values.email, values.password)
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Sign in failed')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex w-full max-w-sm flex-col gap-4" noValidate>
      <h1 className="text-2xl font-semibold tracking-tight">Sign in to FamFin</h1>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          className="rounded border border-stone-700 bg-stone-900 px-3 py-2"
          {...register('email')}
        />
        {errors.email && (
          <p role="alert" className="text-sm text-red-400">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className="rounded border border-stone-700 bg-stone-900 px-3 py-2"
          {...register('password')}
        />
        {errors.password && (
          <p role="alert" className="text-sm text-red-400">
            {errors.password.message}
          </p>
        )}
      </div>

      {authError && (
        <p role="alert" className="text-sm text-red-400">
          {authError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded bg-stone-50 px-3 py-2 font-medium text-stone-950 disabled:opacity-50"
      >
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}

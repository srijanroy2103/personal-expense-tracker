import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '../auth/authStore'
import { friendlyLookupError } from '../lookups/api'
import { creditCardSchema, type CreditCardFormValues } from './schemas'
import { useCreditCards } from './useCreditCards'
import type { CreditCard } from './api'

const emptyValues: CreditCardFormValues = {
  card_name: '',
  bank: '',
  network: '',
  credit_limit: 0,
  statement_day: 1,
  due_day: 1,
  opening_balance: 0,
  notes: '',
}

export function CreditCardsManager() {
  const { session } = useAuthStore()
  const { cards, create, update, remove } = useCreditCards()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreditCardFormValues>({ resolver: zodResolver(creditCardSchema), defaultValues: emptyValues })

  useEffect(() => {
    if (!editingId) return
    const card = cards.data?.find((c) => c.id === editingId)
    if (card) reset(card)
  }, [editingId, cards.data, reset])

  const cancelEdit = () => {
    setEditingId(null)
    setFormError(null)
    reset(emptyValues)
  }

  const onSubmit = async (values: CreditCardFormValues) => {
    setFormError(null)
    try {
      if (editingId) {
        await update.mutateAsync({ id: editingId, values })
      } else {
        if (!session) throw new Error('Not signed in')
        await create.mutateAsync({ values, createdBy: session.user.id })
      }
      cancelEdit()
    } catch (err) {
      setFormError(friendlyLookupError(err))
    }
  }

  const onDelete = async (id: string) => {
    if (!window.confirm('Delete this credit card?')) return
    try {
      await remove.mutateAsync(id)
      if (editingId === id) cancelEdit()
    } catch (err) {
      setFormError(friendlyLookupError(err))
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Credit cards</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="grid max-w-xl grid-cols-2 gap-3" noValidate>
        <Field id="card_name" label="Card name" error={errors.card_name?.message}>
          <input id="card_name" className="input" {...register('card_name')} />
        </Field>
        <Field id="bank" label="Bank" error={errors.bank?.message}>
          <input id="bank" className="input" {...register('bank')} />
        </Field>
        <Field id="network" label="Network" error={errors.network?.message}>
          <input id="network" className="input" {...register('network')} />
        </Field>
        <Field id="credit_limit" label="Credit limit" error={errors.credit_limit?.message}>
          <input id="credit_limit" type="number" step="0.01" className="input" {...register('credit_limit')} />
        </Field>
        <Field id="statement_day" label="Statement day" error={errors.statement_day?.message}>
          <input id="statement_day" type="number" className="input" {...register('statement_day')} />
        </Field>
        <Field id="due_day" label="Due day" error={errors.due_day?.message}>
          <input id="due_day" type="number" className="input" {...register('due_day')} />
        </Field>
        <Field id="opening_balance" label="Opening balance" error={errors.opening_balance?.message}>
          <input id="opening_balance" type="number" step="0.01" className="input" {...register('opening_balance')} />
        </Field>
        <Field id="notes" label="Notes" error={errors.notes?.message}>
          <input id="notes" className="input" {...register('notes')} />
        </Field>

        <div className="col-span-2 flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded bg-stone-50 px-3 py-2 font-medium text-stone-950 disabled:opacity-50"
          >
            {editingId ? 'Save' : 'Add card'}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="rounded border border-stone-700 px-3 py-2 text-sm">
              Cancel
            </button>
          )}
        </div>
      </form>

      {formError && (
        <p role="alert" className="text-sm text-red-400">
          {formError}
        </p>
      )}

      {cards.isLoading && <p className="text-sm text-stone-400">Loading…</p>}
      {cards.isError && <p className="text-sm text-red-400">{friendlyLookupError(cards.error)}</p>}

      <ul className="flex flex-col divide-y divide-stone-800">
        {cards.data?.map((card: CreditCard) => (
          <li key={card.id} className="flex items-center justify-between gap-3 py-2">
            <span>
              {card.card_name}
              <span className="ml-2 text-sm text-stone-400">
                ({card.bank}, due day {card.due_day})
              </span>
            </span>
            <span className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditingId(card.id)}
                className="rounded border border-stone-700 px-2 py-1 text-sm"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => void onDelete(card.id)}
                className="rounded border border-stone-700 px-2 py-1 text-sm text-red-400"
              >
                Delete
              </button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}

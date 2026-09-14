import { useEffect, useState } from 'react'
import { useForm, type Path } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import { friendlyLookupError } from './api'
import { useLookupTable } from './useLookupTable'
import type { LookupRow, LookupTable } from './types'

interface LookupField {
  name: 'name' | 'type' | 'sort_order'
  label: string
  kind: 'text' | 'select' | 'number'
  options?: string[]
}

interface LookupManagerProps<TSchema extends z.ZodTypeAny> {
  table: LookupTable
  title: string
  schema: TSchema
  fields: LookupField[]
}

export function LookupManager<TSchema extends z.ZodTypeAny>({
  table,
  title,
  schema,
  fields,
}: LookupManagerProps<TSchema>) {
  type FormValues = z.infer<TSchema>
  const { rows, create, update, remove } = useLookupTable(table)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!editingId) return
    const row = rows.data?.find((r) => r.id === editingId)
    if (row) reset(row as FormValues)
  }, [editingId, rows.data, reset])

  const startEdit = (row: LookupRow) => {
    setFormError(null)
    setEditingId(row.id)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setFormError(null)
    reset({ name: '' } as FormValues)
  }

  const onSubmit = async (values: FormValues) => {
    setFormError(null)
    try {
      if (editingId) {
        await update.mutateAsync({ id: editingId, values })
      } else {
        await create.mutateAsync(values)
      }
      cancelEdit()
    } catch (err) {
      setFormError(friendlyLookupError(err))
    }
  }

  const onDelete = async (id: string) => {
    if (!window.confirm('Delete this item?')) return
    try {
      await remove.mutateAsync(id)
      if (editingId === id) cancelEdit()
    } catch (err) {
      setFormError(friendlyLookupError(err))
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{title}</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-wrap items-end gap-3" noValidate>
        {fields.map((field) => (
          <div key={field.name} className="flex flex-col gap-1">
            <label htmlFor={`${table}-${field.name}`} className="text-sm font-medium">
              {field.label}
            </label>
            {field.kind === 'select' ? (
              <select
                id={`${table}-${field.name}`}
                className="rounded border border-stone-700 bg-stone-900 px-3 py-2"
                {...register(field.name as Path<FormValues>)}
              >
                <option value="">Select…</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={`${table}-${field.name}`}
                type={field.kind === 'number' ? 'number' : 'text'}
                className="rounded border border-stone-700 bg-stone-900 px-3 py-2"
                {...register(field.name as Path<FormValues>)}
              />
            )}
            {errors[field.name] && (
              <p role="alert" className="text-sm text-red-400">
                {String(errors[field.name]?.message)}
              </p>
            )}
          </div>
        ))}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-stone-50 px-3 py-2 font-medium text-stone-950 disabled:opacity-50"
        >
          {editingId ? 'Save' : 'Add'}
        </button>
        {editingId && (
          <button type="button" onClick={cancelEdit} className="rounded border border-stone-700 px-3 py-2 text-sm">
            Cancel
          </button>
        )}
      </form>

      {formError && (
        <p role="alert" className="text-sm text-red-400">
          {formError}
        </p>
      )}

      {rows.isLoading && <p className="text-sm text-stone-400">Loading…</p>}
      {rows.isError && <p className="text-sm text-red-400">{friendlyLookupError(rows.error)}</p>}

      <ul className="flex flex-col divide-y divide-stone-800">
        {rows.data?.map((row) => (
          <li key={row.id} className="flex items-center justify-between gap-3 py-2">
            <span>
              {row.name}
              {row.type ? <span className="ml-2 text-sm text-stone-400">({row.type})</span> : null}
            </span>
            <span className="flex gap-2">
              <button
                type="button"
                onClick={() => startEdit(row)}
                className="rounded border border-stone-700 px-2 py-1 text-sm"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => void onDelete(row.id)}
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

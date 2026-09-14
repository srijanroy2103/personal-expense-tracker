import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createCreditCard, deleteCreditCard, listCreditCards, updateCreditCard } from './api'
import type { CreditCardFormValues } from './schemas'

const queryKey = ['credit_cards']

export function useCreditCards() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey })

  const cards = useQuery({ queryKey, queryFn: listCreditCards })

  const create = useMutation({
    mutationFn: ({ values, createdBy }: { values: CreditCardFormValues; createdBy: string }) =>
      createCreditCard(values, createdBy),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, values }: { id: string; values: CreditCardFormValues }) => updateCreditCard(id, values),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: string) => deleteCreditCard(id),
    onSuccess: invalidate,
  })

  return { cards, create, update, remove }
}

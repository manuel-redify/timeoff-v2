import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface ContractType {
  id: string | null
  name: string
  description: string | null
  color: string
  employeeCount: number
  createdAt: string
}

export function useContractTypes() {
  const [contractTypes, setContractTypes] = useState<ContractType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { data: session } = useSession()

  useEffect(() => {
    if (!session) return

    async function fetchContractTypes() {
      try {
        setLoading(true)
        const response = await fetch('/api/contract-types')
        
        if (!response.ok) {
          throw new Error('Failed to fetch contract types')
        }

        const data = await response.json()
        if (data.success) {
          setContractTypes(data.data)
        } else {
          throw new Error(data.error?.message || 'Failed to fetch contract types')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        console.error('Error fetching contract types:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchContractTypes()
  }, [session])

  return { contractTypes, loading, error }
}
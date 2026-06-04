import { useEffect, useMemo, useRef, useState } from 'react'
import { searchService } from '../services/searchService'
import type { SearchResultItem } from '../types'

export function useSearch(keyword: string) {
  const normalizedKeyword = useMemo(() => keyword.trim(), [keyword])
  const [results, setResults] = useState<SearchResultItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<number | null>(null)

  useEffect(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current)
    }

    if (!normalizedKeyword) {
      return () => undefined
    }

    let cancelled = false

    debounceRef.current = window.setTimeout(() => {
      const runSearch = async () => {
        try {
          setLoading(true)
          setError(null)
          const nextResults = await searchService.searchPlaces(normalizedKeyword)
          if (!cancelled) {
            setResults(nextResults)
          }
        } catch (searchError) {
          if (!cancelled) {
            setError(searchError instanceof Error ? searchError.message : '搜索失败')
            setResults([])
          }
        } finally {
          if (!cancelled) {
            setLoading(false)
          }
        }
      }

      void runSearch()
    }, 300)

    return () => {
      cancelled = true
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current)
      }
    }
  }, [normalizedKeyword])

  return {
    results: normalizedKeyword ? results : [],
    loading: normalizedKeyword ? loading : false,
    error: normalizedKeyword ? error : null,
  }
}

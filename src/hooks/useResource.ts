import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../lib/api-error'

interface ResourceState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return 'Something went wrong. Please try again.'
}

/**
 * Runs an async fetcher on mount and whenever `deps` change, aborting the
 * in-flight request so a stale response can never overwrite a newer one.
 */
export function useResource<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: unknown[],
  options: { enabled?: boolean; initialData?: T | null } = {},
) {
  const { enabled = true, initialData = null } = options
  const [nonce, setNonce] = useState(0)
  const depsKey = JSON.stringify([deps, enabled, nonce])

  const [state, setState] = useState<ResourceState<T>>({
    data: initialData,
    loading: enabled,
    error: null,
  })
  const [activeKey, setActiveKey] = useState(depsKey)

  // Reset during render rather than in the effect, so `loading` is already true
  // on the render where the request becomes enabled. Otherwise consumers see
  // one frame of "not loading, no data" and can mistake it for an empty result.
  if (activeKey !== depsKey) {
    setActiveKey(depsKey)
    setState({ data: initialData, loading: enabled, error: null })
  }

  const reload = useCallback(() => setNonce((value) => value + 1), [])

  useEffect(() => {
    if (!enabled) return

    const controller = new AbortController()

    fetcher(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ data, loading: false, error: null })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        if (error instanceof DOMException && error.name === 'AbortError') return
        setState({ data: null, loading: false, error: errorMessage(error) })
      })

    return () => controller.abort()
    // `depsKey` already folds in deps, enabled and nonce.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depsKey])

  return {
    ...state,
    reload,
    setData: (data: T) => setState({ data, loading: false, error: null }),
  }
}

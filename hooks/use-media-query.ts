"use client"

import * as React from "react"

export function useMediaQuery(query: string): boolean {
  const [value, setValue] = React.useState(false)

  React.useEffect(() => {
    function onChange(event: MediaQueryListEvent | MediaQueryList) {
      setValue(event.matches)
    }

    const result = matchMedia(query)
    result.addEventListener("change", onChange)
    onChange(result)

    return () => result.removeEventListener("change", onChange)
  }, [query])

  return value
}

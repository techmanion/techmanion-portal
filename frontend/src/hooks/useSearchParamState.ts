import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

export function useSearchParamState(key: string, defaultValue = ""): readonly [string, (value: string) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const value = searchParams.get(key) ?? defaultValue;

  const setValue = useCallback(
    (next: string) => {
      setSearchParams(
        (current) => {
          const updated = new URLSearchParams(current);
          if (next) updated.set(key, next);
          else updated.delete(key);
          return updated;
        },
        { replace: true },
      );
    },
    [key, setSearchParams],
  );

  return [value, setValue] as const;
}

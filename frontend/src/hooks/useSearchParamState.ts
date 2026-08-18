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

export function useSearchParamsUpdater() {
  const [, setSearchParams] = useSearchParams();

  return useCallback(
    (updates: Record<string, string | undefined>) => {
      setSearchParams(
        (current) => {
          const updated = new URLSearchParams(current);
          for (const [key, value] of Object.entries(updates)) {
            if (value) updated.set(key, value);
            else updated.delete(key);
          }
          return updated;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );
}

export function useClearSearchParams() {
  const [, setSearchParams] = useSearchParams();

  return (keys: readonly string[]) => {
    setSearchParams(
      (current) => {
        const updated = new URLSearchParams(current);
        keys.forEach((key) => updated.delete(key));
        return updated;
      },
      { replace: true },
    );
  };
}

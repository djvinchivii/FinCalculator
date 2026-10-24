"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useForm,
  useWatch,
  type DefaultValues,
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { buildShareUrl, parseState, serializeState } from "@/lib/url-state";

export const DEBOUNCE_MS = 150;

export interface CalculatorState<TForm extends FieldValues, TOut, TResult> {
  form: UseFormReturn<TForm, unknown, TOut>;
  /** Latest result; while inputs are invalid this is the last valid result (or null). */
  result: TResult | null;
  /** Parsed, validated inputs that produced `result`. */
  inputs: TOut | null;
  isValid: boolean;
  isStale: boolean;
  getShareUrl: () => string;
}

/**
 * Wires a zod schema + react-hook-form to a pure compute function:
 * live (150 ms debounced) results, inline validation, and URL ⇄ state sync.
 *
 * `schema`, `defaults`, `compute` and `clientDefaults` must be stable (define them at module level).
 * `clientDefaults` supplies values that depend on the viewer's clock (e.g. today's date); they are
 * applied after mount so server and client render identical HTML.
 */
export function useCalculator<TForm extends FieldValues, TOut, TResult>(
  schema: z.ZodType<TOut, z.ZodTypeDef, TForm>,
  defaults: TForm,
  compute: (inputs: TOut) => TResult,
  clientDefaults?: () => Partial<TForm>,
): CalculatorState<TForm, TOut, TResult> {
  const form = useForm<TForm, unknown, TOut>({
    resolver: zodResolver(schema),
    defaultValues: defaults as DefaultValues<TForm>,
    mode: "onChange",
  });
  const { control, reset, trigger } = form;
  const watched = useWatch({ control });
  const json = JSON.stringify(watched);

  const [debounced, setDebounced] = useState(json);
  const skipDebounce = useRef(false);
  // True between a programmatic reset and the first render that reflects it.
  const awaitingReset = useRef(false);
  useEffect(() => {
    if (skipDebounce.current) {
      skipDebounce.current = false;
      awaitingReset.current = false;
      setDebounced(json);
      return;
    }
    const t = setTimeout(() => setDebounced(json), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [json]);

  // Restore state from the URL (and apply clock-dependent defaults) once on mount.
  const [hydrated, setHydrated] = useState(false);
  const loadedFromUrl = useRef(false);
  const effectiveDefaultsJson = useRef(JSON.stringify(defaults));
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const local = clientDefaults?.() ?? {};
    const base = { ...defaults, ...local } as TForm;
    effectiveDefaultsJson.current = JSON.stringify(base);
    if ([...params.keys()].length > 0) {
      loadedFromUrl.current = true;
      skipDebounce.current = true;
      awaitingReset.current = true;
      reset(parseState(params, base));
      void trigger();
    } else if (Object.keys(local).length > 0) {
      skipDebounce.current = true;
      awaitingReset.current = true;
      reset(base);
    }
    setHydrated(true);
  }, [defaults, clientDefaults, reset, trigger]);

  const parsed = useMemo(
    () => schema.safeParse(JSON.parse(debounced) as unknown),
    [schema, debounced],
  );

  const fresh = useMemo(() => {
    if (!parsed.success) return null;
    try {
      return { result: compute(parsed.data), inputs: parsed.data };
    } catch {
      return null;
    }
  }, [parsed, compute]);

  const [lastGood, setLastGood] = useState(fresh);
  useEffect(() => {
    if (fresh) setLastGood(fresh);
  }, [fresh]);
  const shown = fresh ?? lastGood;

  // Keep the address bar in sync so the URL is always shareable.
  useEffect(() => {
    if (!hydrated || awaitingReset.current) return;
    let url = window.location.pathname;
    if (debounced !== effectiveDefaultsJson.current || loadedFromUrl.current) {
      const qs = serializeState(JSON.parse(debounced) as object);
      if (qs) url += `?${qs}`;
    }
    if (url !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(window.history.state, "", url);
    }
  }, [hydrated, debounced]);

  const getShareUrl = useCallback(() => buildShareUrl(JSON.parse(json) as object), [json]);

  return {
    form,
    result: shown?.result ?? null,
    inputs: shown?.inputs ?? null,
    isValid: parsed.success,
    isStale: !parsed.success && shown !== null,
    getShareUrl,
  };
}

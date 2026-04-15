"use client";

import { useCallback, useEffect, useRef } from "react";
import { requestFuriganaSuggestion } from "./request-suggestion";
import { normalizeNameText } from "./shared";

type UseFuriganaAutofillInput = {
  kanaValue: string;
  setKanaValue: (value: string) => void;
  setSourceValue: (value: string) => void;
  sourceValue: string;
};

export function useFuriganaAutofill({
  kanaValue,
  setKanaValue,
  setSourceValue,
  sourceValue,
}: UseFuriganaAutofillInput) {
  const lastAutofilledKanaRef = useRef("");
  const sourceEditedRef = useRef(false);
  const kanaManuallyEditedRef = useRef(false);

  const handleSourceChange = useCallback(
    (value: string) => {
      sourceEditedRef.current = true;
      setSourceValue(value);
    },
    [setSourceValue],
  );

  const handleKanaChange = useCallback(
    (value: string) => {
      kanaManuallyEditedRef.current =
        Boolean(value.trim()) && value !== lastAutofilledKanaRef.current;

      if (!value.trim()) {
        kanaManuallyEditedRef.current = false;
      }

      setKanaValue(value);
    },
    [setKanaValue],
  );

  useEffect(() => {
    if (!sourceEditedRef.current) {
      return;
    }

    const normalizedSource = normalizeNameText(sourceValue);

    if (!normalizedSource) {
      lastAutofilledKanaRef.current = "";

      if (!kanaManuallyEditedRef.current || kanaValue === lastAutofilledKanaRef.current) {
        setKanaValue("");
      }

      kanaManuallyEditedRef.current = false;
      return;
    }

    const shouldAutofill =
      !kanaManuallyEditedRef.current ||
      !kanaValue.trim() ||
      kanaValue === lastAutofilledKanaRef.current;

    if (!shouldAutofill) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        const suggestion = await requestFuriganaSuggestion(normalizedSource, controller.signal);

        if (controller.signal.aborted) {
          return;
        }

        lastAutofilledKanaRef.current = suggestion;

        if (suggestion) {
          kanaManuallyEditedRef.current = false;
          setKanaValue(suggestion);
        } else if (!kanaManuallyEditedRef.current || kanaValue === lastAutofilledKanaRef.current) {
          setKanaValue("");
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(error);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [kanaValue, setKanaValue, sourceValue]);

  return { handleKanaChange, handleSourceChange };
}

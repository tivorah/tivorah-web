"use client";
import type { BookingSetupIssue } from '../components/business/booking-setup-notice';
import { useRef, useState } from "react";
import { ApiError, api } from "../lib/api/client";
export function useMutation(onSuccess?: () => void) {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [setupIssues, setSetupIssues] = useState<BookingSetupIssue[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function run(
    path: string,
    method = "POST",
    body?: unknown,
    success = "Saved.",
  ) {
    if (lock.current) return false;
    lock.current = true;
    setBusy(true);
    setError("");
    setSetupIssues([]);
    setNotice("");
    try {
      await api(path, {
        method,
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      setNotice(success);
      onSuccess?.();
      return true;
    } catch (cause) {
      setSetupIssues(cause instanceof ApiError ? cause.setupIssues : []);
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not save. Please try again.",
      );
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return { busy, error, notice, run, setupIssues };
}

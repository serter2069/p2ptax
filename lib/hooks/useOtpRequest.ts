import { useState } from "react";
import { api } from "@/lib/api";
import { track } from "@/lib/analytics";

export function useOtpRequest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function request(email: string) {
    setLoading(true);
    setError(null);
    try {
      await api("/api/auth/request-otp", {
        method: "POST",
        body: { email },
        noAuth: true,
      });
      track("otp_request", { ok: true });
      return true;
    } catch (e: any) {
      track("otp_request", { ok: false, reason: e?.message ?? "unknown" });
      setError(e.message ?? "OTP request failed");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function verify(email: string, code: string) {
    setLoading(true);
    setError(null);
    try {
      const data = await api<{
        accessToken: string;
        refreshToken: string;
        user?: any;
      }>("/api/auth/verify-otp", {
        method: "POST",
        body: { email, code },
        noAuth: true,
      });
      track("otp_verify", { ok: true });
      return data;
    } catch (e: any) {
      track("otp_verify", { ok: false, reason: e?.message ?? "unknown" });
      setError(e.message ?? "OTP verify failed");
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { request, verify, loading, error };
}

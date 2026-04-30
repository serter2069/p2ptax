import { useState } from "react";
import { API_URL } from "@/lib/api";

export function useOtpRequest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function request(email: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/auth/request-otp`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("OTP request failed");
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function verify(email: string, code: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      if (!res.ok) throw new Error("OTP verify failed");
      return (await res.json()) as {
        accessToken: string;
        refreshToken: string;
        user?: any;
      };
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { request, verify, loading, error };
}

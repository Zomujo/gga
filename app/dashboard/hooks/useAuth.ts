"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProfile, type ApiUser } from "@/lib/api";
import {
  AUTH_EXPIRED_EVENT,
  clearAuth,
  loadAuth,
  saveAuth,
} from "@/lib/storage";

export function useAuth() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const syncAuthState = () => {
      const stored = loadAuth();
      if (!stored) {
        setCheckingAuth(false);
        router.replace("/");
        return;
      }
      setToken(stored.token);
      setCurrentUser(stored.user);
      setCheckingAuth(false);
    };

    const frame = window.requestAnimationFrame(syncAuthState);
    return () => window.cancelAnimationFrame(frame);
  }, [router]);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    const refreshProfile = async () => {
      try {
        const profile = await getProfile(token);
        if (cancelled) return;
        setCurrentUser(profile);
        saveAuth(token, profile);
      } catch {
        // Leave current auth state alone; global auth-expired handling covers invalid tokens.
      }
    };

    refreshProfile();

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    const handleAuthExpired = () => {
      setToken(null);
      setCurrentUser(null);
      setCheckingAuth(false);
      router.replace("/");
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    };
  }, [router]);

  const handleLogout = useCallback(() => {
    clearAuth();
    setToken(null);
    setCurrentUser(null);
    router.replace("/");
  }, [router]);

  const isAdmin = currentUser?.role === "admin";
  const isNavigator = currentUser?.role === "navigator";
  const isDistrictOfficer = currentUser?.role === "district_officer";

  return {
    token,
    currentUser,
    checkingAuth,
    handleLogout,
    isAdmin,
    isNavigator,
    isDistrictOfficer,
  };
}

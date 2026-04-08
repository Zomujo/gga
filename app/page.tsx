"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  loginUser as loginUserApi,
  registerUser as registerUserApi,
} from "@/lib/api";
import { loadAuth, saveAuth } from "@/lib/storage";

const stats = [
  { label: "Assemblies", value: "3" },
  { label: "Active Cases", value: "80+" },
  { label: "Citizens Served", value: "500+" },
];

const highlights = [
  "USSD-native reporting for any phone without data",
  "Assembly portal for structured case management",
  "Real-time tracking and accountability measures",
];

const quickSteps = [
  {
    title: "1. Create an account",
    copy: "Register as a navigator or admin to access the assembly portal.",
  },
  {
    title: "2. Capture reports",
    copy: "Use USSD or dashboard to log service delivery issues from citizens.",
  },
  {
    title: "3. Track and resolve",
    copy: "Assign cases, track progress, and close with documented outcomes.",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "navigator" as "district_officer" | "admin" | "navigator",
    district: "assembly_a" as "assembly_a" | "assembly_b" | "assembly_c",
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const stored = loadAuth();
    if (stored) {
      router.replace(stored.user.role === "admin" ? "/admin/dashboard" : "/dashboard");
      return;
    }
    setCheckingSession(false);
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (authLoading) return;
    setAuthLoading(true);
    setAuthError(null);

    try {
      const payload =
        authMode === "login"
          ? await loginUserApi({
              email: form.email,
              password: form.password,
            })
          : await registerUserApi({
              email: form.email,
              password: form.password,
              fullName: form.fullName,
              role: form.role,
              district: form.role !== "admin" ? form.district : undefined,
            });

      saveAuth(payload.accessToken, payload.user);
      router.push(payload.user.role === "admin" ? "/admin/dashboard" : "/dashboard");
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setAuthLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-600">Loading GGA Governance…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
      <header className="border-b border-white/20 bg-white/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-auto items-center justify-center overflow-hidden">
              <img
                src={encodeURI("/GGA-logo-Full-Colour-Pantone.png")}
                alt="Good Governance Africa"
                className="h-full w-auto object-contain"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/public-dashboard")}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Citizen Portal
            </button>
            <button
              onClick={() => router.push("/track")}
              className="rounded-lg border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50"
            >
              Track Report
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12 lg:py-20">
        <div className="grid gap-16 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
          <section className="space-y-10">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-lg">
                <span className="h-2 w-2 animate-pulse rounded-full bg-white"></span>
                Local Service Delivery & Inclusive Governance
              </span>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => router.push("/public-dashboard")}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-emerald-700"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Report an Issue
                </button>
                <button
                  onClick={() => router.push("/track")}
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-emerald-600 bg-white px-6 py-3 text-sm font-bold text-emerald-600 shadow-lg hover:bg-emerald-50"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  Track My Report
                </button>
              </div>
              <h2 className="text-5xl font-extrabold leading-tight text-gray-900 sm:text-6xl lg:text-7xl">
                Connect citizens to{" "}
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  responsive
                </span>{" "}
                local assemblies.
              </h2>
              <p className="text-xl leading-relaxed text-gray-600">
                GGA Governance connects citizen reporting to structured assembly
                response. Every report becomes a trackable case with clear
                ownership and visible outcomes.
              </p>
            </div>

            <ul className="space-y-4">
              {highlights.map((item, index) => (
                <li key={item} className="group flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md transition-transform group-hover:scale-110">
                    <span className="text-sm font-bold text-white">
                      {index + 1}
                    </span>
                  </div>
                  <p className="pt-1 text-lg font-medium text-gray-800">
                    {item}
                  </p>
                </li>
              ))}
            </ul>

            <div className="grid gap-4 sm:grid-cols-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="group rounded-2xl border border-white/50 bg-white/60 p-6 shadow-lg backdrop-blur-sm transition-all hover:scale-105 hover:shadow-xl"
                >
                  <p className="text-4xl font-extrabold text-gray-900">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-sm font-medium uppercase tracking-wide text-gray-600">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section
            id="auth-card"
            className="sticky top-8 rounded-3xl border border-white/50 bg-white/80 p-8 shadow-2xl backdrop-blur-xl"
          >
            <div className="mb-8">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-emerald-600">
                    {authMode === "login" ? "Welcome back" : "Get started"}
                  </p>
                  <h3 className="text-3xl font-bold text-gray-900">
                    {authMode === "login" ? "Sign in" : "Create account"}
                  </h3>
                </div>
              </div>
              <div className="flex gap-2 rounded-xl bg-gray-100 p-1">
                {["login", "register"].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setAuthMode(mode as "login" | "register")}
                    className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                      authMode === mode
                        ? "bg-white text-gray-900 shadow-md"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {mode === "login" ? "Sign in" : "Register"}
                  </button>
                ))}
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {authMode === "register" && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Full name
                    </label>
                    <input
                      type="text"
                      required
                      value={form.fullName}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          fullName: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Role
                    </label>
                    <select
                      required
                      value={form.role}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          role: event.target.value as typeof form.role,
                        }))
                      }
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="navigator">Navigator</option>
                      <option value="district_officer">District Officer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  {form.role !== "admin" && (
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Assembly
                      </label>
                      <select
                        required
                        value={form.district}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            district: event.target.value as typeof form.district,
                          }))
                        }
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      >
                        <option value="assembly_a">Assembly A</option>
                        <option value="assembly_b">Assembly B</option>
                        <option value="assembly_c">Assembly C</option>
                      </select>
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  minLength={8}
                  required
                  value={form.password}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      password: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="••••••••"
                />
              </div>

              {authError && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3">
                  <p className="text-sm font-medium text-red-800">
                    {authError}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 transition-all hover:from-emerald-700 hover:to-teal-700 hover:shadow-xl hover:shadow-emerald-600/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-lg"
              >
                {authLoading
                  ? "Connecting…"
                  : authMode === "login"
                  ? "Sign in"
                  : "Create account"}
              </button>
            </form>

            <div className="mt-8 space-y-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100/50 p-6 border border-gray-200/50">
              <p className="text-sm font-bold text-gray-900">How it works</p>
              <ul className="space-y-4 text-sm text-gray-700">
                {quickSteps.map((step, index) => (
                  <li key={step.title} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {step.title}
                      </p>
                      <p className="mt-0.5 leading-relaxed">{step.copy}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-white/30 bg-white/30 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex flex-col items-center justify-center gap-6">
            <div className="flex flex-wrap items-center justify-center gap-8">
              <img
                src={encodeURI("/GGA-logo-Full-Colour-Pantone.png")}
                alt="Good Governance Africa"
                className="h-12 w-auto object-contain opacity-90"
              />
            </div>
            <p className="text-xs text-gray-600">© 2026 Good Governance Africa</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

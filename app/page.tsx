"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  loginUser as loginUserApi,
  registerUser as registerUserApi,
  getLocations,
  getPublicStats,
  type ApiLocation,
} from "@/lib/api";
import { consumeAuthNotice, loadAuth, saveAuth } from "@/lib/storage";

const highlights = [
  "Community-led reporting with clear case ownership",
  "Assembly portal for structured case management",
  "Real-time tracking and accountability measures",
];

const quickSteps = [
  {
    title: "1. Create an account",
    copy: "Sign up as a field agent to join the community reporting network.",
  },
  {
    title: "2. Submit reports",
    copy: "Use the dashboard to log service delivery issues from your community.",
  },
  {
    title: "3. Track and resolve",
    copy: "Follow case progress and help drive documented outcomes.",
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
    district: "",
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [locationOptions, setLocationOptions] = useState<ApiLocation[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [landingStatsLoading, setLandingStatsLoading] = useState(true);
  const [landingStats, setLandingStats] = useState({
    assemblies: 0,
    activeCases: 0,
    citizensServed: 0,
  });
  const [animatedStats, setAnimatedStats] = useState({
    assemblies: 0,
    activeCases: 0,
    citizensServed: 0,
  });
  const [statsInView, setStatsInView] = useState(false);
  const [statsAnimated, setStatsAnimated] = useState(false);

  useEffect(() => {
    const stored = loadAuth();
    if (stored) {
      if (stored.user.role === "admin") {
        router.replace("/admin/dashboard");
      } else if (stored.user.role === "district_officer") {
        router.replace("/staff-officer/cases");
      } else {
        router.replace("/field-agent/cases");
      }
      return;
    }
    const authNotice = consumeAuthNotice();
    if (authNotice) {
      setAuthError(authNotice);
    }
    setCheckingSession(false);
  }, [router]);

  useEffect(() => {
    const loadLandingData = async () => {
      setLocationsLoading(true);
      setLandingStatsLoading(true);
      try {
        const [locationsResponse, publicStats] = await Promise.all([
          getLocations(),
          getPublicStats(),
        ]);
        const rows = locationsResponse.rows ?? [];
        setLocationOptions(rows);
        setForm((prev) => ({
          ...prev,
          district: prev.district || rows[0]?.id || "",
        }));
        setLandingStats({
          assemblies: rows.length,
          activeCases: (publicStats.inProgress ?? 0) + (publicStats.pending ?? 0),
          citizensServed: publicStats.totalCases ?? 0,
        });
      } catch {
        setLocationOptions([]);
        setLandingStats({
          assemblies: 0,
          activeCases: 0,
          citizensServed: 0,
        });
      } finally {
        setLocationsLoading(false);
        setLandingStatsLoading(false);
      }
    };

    loadLandingData();
  }, []);

  useEffect(() => {
    const checkStatsInView = () => {
      const statSections = document.querySelectorAll("[data-landing-stats]");
      const isVisible = Array.from(statSections).some((section) => {
        const rect = section.getBoundingClientRect();
        return rect.top <= window.innerHeight * 0.85 && rect.bottom >= 0;
      });

      if (isVisible) {
        setStatsInView(true);
      }
    };

    checkStatsInView();
    window.addEventListener("scroll", checkStatsInView, { passive: true });
    window.addEventListener("resize", checkStatsInView);

    return () => {
      window.removeEventListener("scroll", checkStatsInView);
      window.removeEventListener("resize", checkStatsInView);
    };
  }, []);

  useEffect(() => {
    if (landingStatsLoading || !statsInView || statsAnimated) return;

    const start = performance.now();
    const duration = 900;

    const animate = (timestamp: number) => {
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setAnimatedStats({
        assemblies: Math.round(landingStats.assemblies * eased),
        activeCases: Math.round(landingStats.activeCases * eased),
        citizensServed: Math.round(landingStats.citizensServed * eased),
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setStatsAnimated(true);
      }
    };

    const frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [landingStats, landingStatsLoading, statsAnimated, statsInView]);

  const stats = [
    {
      label: "Assemblies",
      value: animatedStats.assemblies.toLocaleString(),
    },
    {
      label: "Active Cases",
      value: animatedStats.activeCases.toLocaleString(),
    },
    {
      label: "Citizens Served",
      value: animatedStats.citizensServed.toLocaleString(),
    },
  ];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (authLoading) return;
    setAuthLoading(true);
    setAuthError(null);

    try {
      if (authMode === "register" && !form.district) {
        throw new Error("A location must be selected for field agents.");
      }

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
              role: "navigator",
              district: form.district,
            });

      saveAuth(payload.accessToken, payload.user);
      if (payload.user.role === "admin") {
        router.push("/admin/dashboard");
      } else if (payload.user.role === "district_officer") {
        router.push("/staff-officer/cases");
      } else {
        router.push("/field-agent/cases");
      }
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
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-auto items-center justify-center overflow-hidden sm:h-12">
                <img
                  src={encodeURI("/GGA-logo-Full-Colour-Pantone.png")}
                  alt="Good Governance Africa"
                  className="h-full w-auto object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
          <section className="order-1 space-y-8 lg:space-y-10">
            <div className="space-y-5 sm:space-y-6">
              <h2 className="max-w-3xl text-4xl font-extrabold leading-tight text-gray-900 sm:text-5xl lg:text-7xl">
                Connect citizens to{" "}
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  responsive
                </span>{" "}
                local assemblies.
              </h2>
              <p className="max-w-2xl text-base leading-relaxed text-gray-600 sm:text-lg lg:text-xl">
                GGA Governance equips community stewards to log local issues,
                route them into structured assembly response, and keep outcomes
                visible.
              </p>
            </div>

            <div className="hidden lg:block lg:space-y-10">
              <ul className="space-y-4">
                {highlights.map((item, index) => (
                  <li key={item} className="group flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md transition-transform group-hover:scale-110">
                      <span className="text-sm font-bold text-white">
                        {index + 1}
                      </span>
                    </div>
                    <p className="pt-1 text-base font-medium text-gray-800 sm:text-lg">
                      {item}
                    </p>
                  </li>
                ))}
              </ul>

              <div
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                data-landing-stats
              >
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="group rounded-2xl border border-white/50 bg-white/60 p-5 shadow-lg backdrop-blur-sm transition-all hover:scale-105 hover:shadow-xl sm:p-6"
                  >
                    <p className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                      {stat.value}
                    </p>
                    <p className="mt-2 text-sm font-medium uppercase tracking-wide text-gray-600">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section
            id="auth-card"
            className="order-2 rounded-3xl border border-white/50 bg-white/80 p-5 shadow-2xl backdrop-blur-xl sm:p-8 lg:order-none lg:sticky lg:top-8"
          >
            <div className="mb-6 sm:mb-8">
              <div className="mb-5 flex items-center justify-between sm:mb-6">
                <div>
                  <p className="text-sm font-semibold text-emerald-600">
                    {authMode === "login" ? "Welcome back" : "Get started"}
                  </p>
                  <h3 className="text-2xl font-bold text-gray-900 sm:text-3xl">
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

            <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
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
                      Location
                    </label>
                    <select
                      required
                      value={form.district}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          district: event.target.value,
                        }))
                      }
                      disabled={locationsLoading || locationOptions.length === 0}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      {locationOptions.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.name}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs text-gray-500">
                      New public signups are created as Field Agents.
                    </p>
                    {!locationsLoading && locationOptions.length === 0 && (
                      <p className="mt-2 text-xs text-amber-700">
                        No locations available yet. Ask an admin to create locations first.
                      </p>
                    )}
                  </div>
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

            <div className="mt-6 space-y-4 rounded-2xl border border-gray-200/50 bg-gradient-to-br from-gray-50 to-gray-100/50 p-5 sm:mt-8 sm:p-6">
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

          <section className="order-3 space-y-8 lg:hidden">
            <ul className="space-y-4">
              {highlights.map((item, index) => (
                <li key={item} className="group flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md transition-transform group-hover:scale-110">
                    <span className="text-sm font-bold text-white">
                      {index + 1}
                    </span>
                  </div>
                  <p className="pt-1 text-base font-medium text-gray-800 sm:text-lg">
                    {item}
                  </p>
                </li>
              ))}
            </ul>

            <div
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              data-landing-stats
            >
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="group rounded-2xl border border-white/50 bg-white/60 p-5 shadow-lg backdrop-blur-sm transition-all hover:scale-105 hover:shadow-xl sm:p-6"
                >
                  <p className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-sm font-medium uppercase tracking-wide text-gray-600">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-white/30 bg-white/30 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
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

"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  loginUser as loginUserApi,
  registerUser as registerUserApi,
  getLocations,
  getPublicStats,
  isValidGhanaPhoneInput,
  type ApiLocation,
} from "@/lib/api";
import { consumeAuthNotice, loadAuth, saveAuth } from "@/lib/storage";

const highlights = [
  "Community reporting tied directly to Sekyere Kumawu District Assembly",
  "Clear case ownership across towns and communities",
  "Visible follow-through on local service delivery issues",
];

const quickSteps = [
  {
    title: "1. Create an account",
    copy: "Register as a field agent for Sekyere Kumawu District Assembly.",
  },
  {
    title: "2. Submit reports",
    copy: "Log issues from your town or community through the district reporting dashboard.",
  },
  {
    title: "3. Track and resolve",
    copy: "Follow case progress from reporting through assignment and resolution.",
  },
];

const FIELD_OFFICER_DEFAULT_DEPARTMENT_ID =
  "860441fe-cfb6-4c52-90af-6eb29e1e06ba";
const SKDA_DISTRICT_NAME = "Sekyere Kumawu";

export default function LandingPage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    password: "",
    metroDistrict: "",
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
      if (stored.user.role === "super_admin") {
        router.replace("/super-admin/dashboard");
      } else if (stored.user.role === "admin") {
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
        const metroDistricts = rows.filter(
          (location) => location.type === "METRO_DISTRICT",
        );
        const skdaDistrict =
          metroDistricts.find(
            (location) => location.name === SKDA_DISTRICT_NAME,
          ) ?? null;
        const defaultMetroDistrictId =
          skdaDistrict?.id ??
          metroDistricts[0]?.id ??
          rows[0]?.parentLocationId ??
          rows[0]?.id ??
          "";
        const defaultTownId =
          rows.find(
            (location) =>
              location.type === "TOWN" &&
              location.parentLocationId === defaultMetroDistrictId,
          )?.id ??
          rows.find((location) => location.type === "TOWN")?.id ??
          "";
        setForm((prev) => ({
          ...prev,
          metroDistrict: prev.metroDistrict || defaultMetroDistrictId,
          district: prev.district || defaultTownId,
        }));
        const districtTownCount = rows.filter(
          (location) =>
            location.type === "TOWN" &&
            location.parentLocationId === defaultMetroDistrictId,
        ).length;
        setLandingStats({
          assemblies: districtTownCount,
          activeCases:
            (publicStats.inProgress ?? 0) + (publicStats.pending ?? 0),
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
      label: "Towns",
      value: animatedStats.assemblies.toLocaleString(),
    },
    {
      label: "Active Cases",
      value: animatedStats.activeCases.toLocaleString(),
    },
    {
      label: "Reports",
      value: animatedStats.citizensServed.toLocaleString(),
    },
  ];

  const allMetroDistrictOptions = locationOptions.filter(
    (location) => location.type === "METRO_DISTRICT",
  );
  const skdaDistrict =
    allMetroDistrictOptions.find(
      (location) => location.name === SKDA_DISTRICT_NAME,
    ) ?? null;
  const metroDistrictOptions = skdaDistrict
    ? [skdaDistrict]
    : allMetroDistrictOptions;
  const townOptions = locationOptions.filter(
    (location) =>
      location.type === "TOWN" &&
      location.parentLocationId === form.metroDistrict,
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (authLoading) return;
    setAuthLoading(true);
    setAuthError(null);

    try {
      if (authMode === "register" && !form.district) {
        throw new Error("A location must be selected for field agents.");
      }
      if (
        authMode === "register" &&
        !isValidGhanaPhoneInput(form.phoneNumber)
      ) {
        throw new Error(
          "Enter a valid Ghana phone number, for example 0201234567.",
        );
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
              phoneNumber: form.phoneNumber,
              departmentId: FIELD_OFFICER_DEFAULT_DEPARTMENT_ID,
              role: "navigator",
              district: form.district,
            });

      saveAuth(payload.accessToken, payload.user);
      if (payload.user.role === "super_admin") {
        router.push("/super-admin/dashboard");
      } else if (payload.user.role === "admin") {
        router.push("/admin/dashboard");
      } else if (payload.user.role === "district_officer") {
        router.push("/staff-officer/cases");
      } else {
        router.push("/field-agent/cases");
      }
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : "Something went wrong",
      );
    } finally {
      setAuthLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-600">
          Loading Sekyere Kumawu District Assembly…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2eee5]">
      <header className="border-b border-[#d7c8ab]/60 bg-[#f8f5ee]/75 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-auto items-center justify-center overflow-hidden sm:h-12">
                <img
                  src={encodeURI("/skda-logo.jpeg")}
                  alt="Sekyere Kumawu District Assembly"
                  className="h-full w-auto object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.95fr] lg:gap-14">
          <section className="order-1 space-y-8 lg:space-y-8">
            <div className="space-y-4 sm:space-y-5">
              <h2 className="max-w-3xl text-4xl font-extrabold leading-tight text-gray-900 sm:text-5xl lg:text-6xl">
                Report community issues to{" "}
                <span className="text-[#7a5a3b]">Sekyere Kumawu</span> District
                Assembly.
              </h2>
              <p className="max-w-2xl text-base leading-relaxed text-gray-600 sm:text-lg lg:text-lg">
                This portal helps field agents across Sekyere Kumawu log local
                concerns, route them into the district response process, and
                keep progress visible from report to resolution.
              </p>
            </div>

            <div className="hidden lg:block lg:space-y-8">
              <ul className="space-y-3">
                {highlights.map((item, index) => (
                  <li key={item} className="group flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#7a5a3b] shadow-md transition-transform group-hover:scale-110">
                      <span className="text-sm font-bold text-white">
                        {index + 1}
                      </span>
                    </div>
                    <p className="pt-1 text-base font-medium text-gray-800">
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
                    className="group rounded-2xl border border-[#d7c8ab]/60 bg-[#fbfaf7]/80 p-5 shadow-lg backdrop-blur-sm transition-all hover:scale-105 hover:shadow-xl"
                  >
                    <p className="text-3xl font-extrabold text-gray-900">
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
            className="order-2 rounded-3xl border border-[#d7c8ab]/60 bg-[#fbfaf7]/88 p-5 shadow-2xl backdrop-blur-xl sm:p-8 lg:order-none lg:sticky lg:top-6"
          >
            <div className="mb-6 sm:mb-8">
              <div className="mb-5 flex items-center justify-between sm:mb-6">
                <div>
                  <p className="text-sm font-semibold text-[#7a5a3b]">
                    {authMode === "login" ? "Welcome back" : "Get started"}
                  </p>
                  <h3 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                    {authMode === "login" ? "Sign in" : "Create account"}
                  </h3>
                </div>
              </div>
              <div className="flex gap-2 rounded-xl bg-[#ece5d8] p-1">
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
                      className="w-full rounded-xl border border-[#cdbd9a] bg-white px-4 py-3 text-gray-900 shadow-sm transition-all focus:border-[#7a5a3b] focus:outline-none focus:ring-2 focus:ring-[#7a5a3b]/20"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Phone number
                    </label>
                    <input
                      type="tel"
                      required
                      value={form.phoneNumber}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          phoneNumber: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-[#cdbd9a] bg-white px-4 py-3 text-gray-900 shadow-sm transition-all focus:border-[#7a5a3b] focus:outline-none focus:ring-2 focus:ring-[#7a5a3b]/20"
                      placeholder="+233001234567"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      District
                    </label>
                    <select
                      required
                      value={form.metroDistrict}
                      onChange={(event) => {
                        const nextMetroDistrict = event.target.value;
                        const nextTownId =
                          locationOptions.find(
                            (location) =>
                              location.type === "TOWN" &&
                              location.parentLocationId === nextMetroDistrict,
                          )?.id ?? "";
                        setForm((prev) => ({
                          ...prev,
                          metroDistrict: nextMetroDistrict,
                          district: nextTownId,
                        }));
                      }}
                      disabled={
                        locationsLoading || metroDistrictOptions.length === 0
                      }
                      className="w-full rounded-xl border border-[#cdbd9a] bg-white px-4 py-3 text-gray-900 shadow-sm transition-all focus:border-[#7a5a3b] focus:outline-none focus:ring-2 focus:ring-[#7a5a3b]/20"
                    >
                      {metroDistrictOptions.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Town
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
                      disabled={locationsLoading || townOptions.length === 0}
                      className="w-full rounded-xl border border-[#cdbd9a] bg-white px-4 py-3 text-gray-900 shadow-sm transition-all focus:border-[#7a5a3b] focus:outline-none focus:ring-2 focus:ring-[#7a5a3b]/20"
                    >
                      {townOptions.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.name}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs text-gray-500">
                      All new signups are created as Field Agents for Sekyere
                      Kumawu District Assembly.
                    </p>
                    {!locationsLoading &&
                      (metroDistrictOptions.length === 0 ||
                        townOptions.length === 0) && (
                        <p className="mt-2 text-xs text-amber-700">
                          No district and town locations are available yet. Ask
                          an admin to configure them first.
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
                  className="w-full rounded-xl border border-[#cdbd9a] bg-white px-4 py-3 text-gray-900 shadow-sm transition-all focus:border-[#7a5a3b] focus:outline-none focus:ring-2 focus:ring-[#7a5a3b]/20"
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
                  className="w-full rounded-xl border border-[#cdbd9a] bg-white px-4 py-3 text-gray-900 shadow-sm transition-all focus:border-[#7a5a3b] focus:outline-none focus:ring-2 focus:ring-[#7a5a3b]/20"
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
                className="w-full rounded-xl bg-[#7a5a3b] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#7a5a3b]/25 transition-all hover:bg-[#62482f] hover:shadow-xl hover:shadow-[#7a5a3b]/35 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-lg"
              >
                {authLoading
                  ? "Connecting…"
                  : authMode === "login"
                    ? "Sign in"
                    : "Create account"}
              </button>
            </form>

            <div className="mt-6 space-y-4 rounded-2xl border border-[#d7c8ab]/60 bg-[#f8f5ee] p-5 sm:mt-8 sm:p-6">
              <p className="text-sm font-bold text-gray-900">How it works</p>
              <ul className="space-y-4 text-sm text-gray-700">
                {quickSteps.map((step, index) => (
                  <li key={step.title} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#7a5a3b] text-xs font-bold text-white">
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
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#7a5a3b] shadow-md transition-transform group-hover:scale-110">
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
                  className="group rounded-2xl border border-[#d7c8ab]/60 bg-[#fbfaf7]/80 p-5 shadow-lg backdrop-blur-sm transition-all hover:scale-105 hover:shadow-xl sm:p-6"
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

      <footer className="border-t border-[#d7c8ab]/60 bg-[#f8f5ee]/70 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="flex flex-col items-center justify-center gap-6">
            <div className="flex flex-wrap items-center justify-center gap-8">
              <img
                src={encodeURI("/skda-logo.jpeg")}
                alt="Sekyere Kumawu District Assembly"
                className="h-12 w-auto object-contain opacity-90"
              />
            </div>
            <p className="text-xs text-gray-600">
              © 2026 Sekyere Kumawu District Assembly
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

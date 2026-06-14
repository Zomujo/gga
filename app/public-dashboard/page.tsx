"use client";

import { Suspense, useState, useEffect, FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  submitComplaint,
  getComplaintByCode,
  getLocations,
  getPublicStats,
  type ApiComplaint,
} from "@/lib/api";
import { categoryOptions } from "@/app/dashboard/utils/constants";

interface LocationOption {
  value: string;
  label: string;
}

interface PublicStats {
  totalCases: number;
  resolved: number;
  inProgress: number;
  pending: number;
  byCategory: { category: string; count: number }[];
}

type PublicSection = "submit" | "track" | "view";

function parseSection(value: string | null): PublicSection {
  if (value === "track" || value === "view") return value;
  return "submit";
}

function PublicDashboardContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeSection = parseSection(searchParams.get("tab"));
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [publicStats, setPublicStats] = useState<PublicStats | null>(null);
  const [statsLocationId, setStatsLocationId] = useState<string>("");
  const [communityLocationModalOpen, setCommunityLocationModalOpen] =
    useState(false);
  const [submitPickerOpen, setSubmitPickerOpen] = useState<
    "location" | "category" | null
  >(null);
  const [ticketNumber, setTicketNumber] = useState("");
  const [searching, setSearching] = useState(false);
  const [caseData, setCaseData] = useState<ApiComplaint | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);

  const [form, setForm] = useState({
    phoneNumber: "",
    district: "",
    category: "roads_infrastructure",
    description: "",
  });

  useEffect(() => {
    const loadInitialData = async () => {
      setLocationsLoading(true);
      try {
        const response = await getLocations();
        const rows = response.rows ?? [];
        const opts = rows.map((row) => ({ value: row.id, label: row.name }));
        setLocations(opts);
        if (opts.length > 0) {
          const firstLocation = opts[0].value;
          setForm((prev) => ({ ...prev, district: firstLocation }));
          setStatsLocationId(firstLocation);
        }
      } catch (error) {
        setSubmitError(
          error instanceof Error ? error.message : "Failed to load locations"
        );
      } finally {
        setLocationsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      if (!statsLocationId) {
        setStatsLoading(false);
        setPublicStats(null);
        return;
      }
      setStatsLoading(true);
      setStatsError(null);
      try {
        const stats = await getPublicStats(statsLocationId);
        setPublicStats(stats);
      } catch (error) {
        setStatsError(
          error instanceof Error ? error.message : "Failed to load public stats"
        );
      } finally {
        setStatsLoading(false);
      }
    };

    loadStats();
  }, [statsLocationId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const result = await submitComplaint("public", form);
      setSubmittedCode(result.code);
      setCopiedCode(false);
      setSubmitSuccess(`Your report has been submitted successfully! Your ticket number is: ${result.code}`);
      setForm({
        phoneNumber: "",
        district: form.district,
        category: "roads_infrastructure",
        description: "",
      });
      const refreshed = await getPublicStats(statsLocationId || undefined);
      setPublicStats(refreshed);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrackSearch = async (e: FormEvent) => {
    e.preventDefault();
    setSearching(true);
    setTrackError(null);
    setCaseData(null);

    try {
      if (!ticketNumber.trim()) {
        setTrackError("Enter your case code to continue.");
        return;
      }
      const data = await getComplaintByCode(ticketNumber.trim());
      setCaseData(data);
    } catch (error) {
      setTrackError(
        error instanceof Error
          ? error.message
          : "Failed to search. Please try again."
      );
    } finally {
      setSearching(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "resolved":
        return "bg-emerald-100 text-emerald-800";
      case "escalated":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const statusLabel = (status: ApiComplaint["status"]) => {
    if (status === "pending") return "Pending";
    if (status === "in_progress") return "In Progress";
    if (status === "resolved") return "Resolved";
    if (status === "escalated") return "Escalated";
    return "Rejected";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const changeSection = (section: PublicSection) => {
    const params = new URLSearchParams(searchParams.toString());
    if (section === "submit") {
      params.delete("tab");
    } else {
      params.set("tab", section);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const selectedStatsLocationLabel =
    locations.find((option) => option.value === statsLocationId)?.label ??
    "All Locations";
  const selectedSubmitLocationLabel =
    locations.find((option) => option.value === form.district)?.label ??
    "Choose location";
  const selectedSubmitCategoryLabel =
    categoryOptions.find((option) => option.value === form.category)?.label ??
    "Choose category";

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
      {/* Header */}
      <header className="border-b border-white/20 bg-white/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/")}>
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
              onClick={() => router.push("/")}
              className="text-sm font-medium text-gray-600 hover:text-emerald-600"
            >
              Assembly Portal
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900">
            Citizen Service Portal
          </h1>
          <p className="mt-2 text-xl text-gray-600">
            Report service issues, track your reports, and see community progress
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8 grid grid-cols-3 gap-2 rounded-xl bg-white/60 p-2 backdrop-blur-sm">
          <button
            onClick={() => changeSection("submit")}
            className={`rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap transition-all sm:px-6 sm:py-3 sm:text-sm ${
              activeSection === "submit"
                ? "bg-emerald-600 text-white shadow-md"
                : "text-gray-600 hover:bg-white/50"
            }`}
          >
            <span className="sm:hidden">Submit</span>
            <span className="hidden sm:inline">Submit Report</span>
          </button>
          <button
            onClick={() => changeSection("track")}
            className={`rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap transition-all sm:px-6 sm:py-3 sm:text-sm ${
              activeSection === "track"
                ? "bg-emerald-600 text-white shadow-md"
                : "text-gray-600 hover:bg-white/50"
            }`}
          >
            <span className="sm:hidden">Track</span>
            <span className="hidden sm:inline">Track Report</span>
          </button>
          <button
            onClick={() => changeSection("view")}
            className={`rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap transition-all sm:px-6 sm:py-3 sm:text-sm ${
              activeSection === "view"
                ? "bg-emerald-600 text-white shadow-md"
                : "text-gray-600 hover:bg-white/50"
            }`}
          >
            <span className="sm:hidden">Community</span>
            <span className="hidden sm:inline">View Community Issues</span>
          </button>
        </div>

        {/* Submit Report Section */}
        {activeSection === "submit" && (
          <div className="rounded-2xl border border-white/50 bg-white/80 p-8 backdrop-blur-xl">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">
              Report a Service Issue
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={form.phoneNumber}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, phoneNumber: e.target.value }))
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="+233 XX XXX XXXX"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Location
                </label>
                <button
                  type="button"
                  disabled={locationsLoading || locations.length === 0}
                  onClick={() => setSubmitPickerOpen("location")}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3 text-left text-gray-900 shadow-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 sm:hidden"
                >
                  <span className="truncate">
                    {locationsLoading ? "Loading..." : selectedSubmitLocationLabel}
                  </span>
                  <span className="text-gray-400">▾</span>
                </button>
                <select
                  required
                  value={form.district}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, district: e.target.value }))
                  }
                  disabled={locationsLoading || locations.length === 0}
                  className="hidden w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 sm:block"
                >
                  {locations.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {locations.length === 0 && !locationsLoading && (
                  <p className="mt-2 text-sm text-amber-700">
                    No locations are configured yet. Ask the backend admin to create
                    locations before submitting reports.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Service Category
                </label>
                <button
                  type="button"
                  onClick={() => setSubmitPickerOpen("category")}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3 text-left text-gray-900 shadow-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 sm:hidden"
                >
                  <span className="truncate">{selectedSubmitCategoryLabel}</span>
                  <span className="text-gray-400">▾</span>
                </button>
                <select
                  required
                  value={form.category}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, category: e.target.value }))
                  }
                  className="hidden w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 sm:block"
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Description
                </label>
                <textarea
                  required
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={4}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="Provide details about the issue..."
                />
              </div>

              {submitError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-medium text-red-800">{submitError}</p>
                </div>
              )}

              {submitSuccess && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-medium text-emerald-800">
                    {submitSuccess}
                  </p>
                  {submittedCode && (
                    <div className="mt-3 rounded-lg border border-emerald-200 bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                        Ticket Code
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <code className="text-sm font-bold text-gray-900">{submittedCode}</code>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(submittedCode);
                              setCopiedCode(true);
                              setTimeout(() => setCopiedCode(false), 1500);
                            } catch {
                              setCopiedCode(false);
                            }
                          }}
                          className="rounded-md border border-emerald-300 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                        >
                          {copiedCode ? "Copied" : "Copy"}
                        </button>
                      </div>
                      <p className="mt-2 text-xs text-gray-600">
                        Save this code to track your report later.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 transition-all hover:from-emerald-700 hover:to-teal-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Report"}
              </button>
            </form>
          </div>
        )}

        {/* Track Report Section */}
        {activeSection === "track" && (
          <div className="space-y-8">
            <div className="rounded-2xl border border-white/50 bg-white/80 p-8 backdrop-blur-xl">
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                Track Your Report
              </h2>
              <form onSubmit={handleTrackSearch} className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Case Code
                  </label>
                  <input
                    type="text"
                    required
                    value={ticketNumber}
                    onChange={(e) => setTicketNumber(e.target.value.toUpperCase())}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="e.g. YV3UERULET"
                  />
                  <p className="mt-2 text-sm text-gray-600">
                    Use the code shown after report submission.
                  </p>
                </div>

                {trackError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="text-sm font-medium text-red-800">{trackError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={searching}
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 transition-all hover:from-emerald-700 hover:to-teal-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {searching ? "Searching..." : "Track Report"}
                </button>
              </form>

              {caseData && (
                <div className="mt-8 space-y-6 rounded-xl border border-emerald-200 bg-emerald-50 p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">
                      Case #{caseData.code}
                    </h3>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusColor(
                        caseData.status
                      )}`}
                    >
                      {statusLabel(caseData.status)}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Category</p>
                      <p className="mt-1 text-gray-900">
                        {caseData.category.replace(/_/g, " ")}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-700">Description</p>
                      <p className="mt-1 text-gray-900">{caseData.description}</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Submitted</p>
                        <p className="mt-1 text-gray-900">{formatDate(caseData.createdAt)}</p>
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-gray-700">Last Updated</p>
                        <p className="mt-1 text-gray-900">{formatDate(caseData.updatedAt)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-emerald-300 bg-white p-4">
                    <h4 className="mb-2 font-semibold text-gray-900">Status Timeline</h4>
                    <div className="space-y-2">
                      {caseData.status === "resolved" && (
                        <>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-600"></div>
                            <span className="text-sm text-gray-900">Case Resolved</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-600"></div>
                            <span className="text-sm text-gray-900">In Progress</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-600"></div>
                            <span className="text-sm text-gray-900">Case Assigned</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-600"></div>
                            <span className="text-sm text-gray-900">Case Received</span>
                          </div>
                        </>
                      )}
                      {caseData.status === "in_progress" && (
                        <>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 animate-pulse rounded-full bg-blue-600"></div>
                            <span className="text-sm font-semibold text-gray-900">In Progress</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-600"></div>
                            <span className="text-sm text-gray-900">Case Assigned</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-600"></div>
                            <span className="text-sm text-gray-900">Case Received</span>
                          </div>
                        </>
                      )}
                      {caseData.status === "pending" && (
                        <>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 animate-pulse rounded-full bg-yellow-600"></div>
                            <span className="text-sm font-semibold text-gray-900">
                              Pending Assignment
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-600"></div>
                            <span className="text-sm text-gray-900">Case Received</span>
                          </div>
                        </>
                      )}
                      {caseData.status === "escalated" && (
                        <>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 animate-pulse rounded-full bg-purple-600"></div>
                            <span className="text-sm font-semibold text-gray-900">Escalated</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-600"></div>
                            <span className="text-sm text-gray-900">In Progress</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-600"></div>
                            <span className="text-sm text-gray-900">Case Received</span>
                          </div>
                        </>
                      )}
                      {caseData.status === "rejected" && (
                        <>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-red-600"></div>
                            <span className="text-sm font-semibold text-gray-900">
                              Closed with reasons
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-600"></div>
                            <span className="text-sm text-gray-900">Case Received</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg bg-blue-50 p-4">
                    <p className="text-sm text-blue-900">
                      <strong>Note:</strong> You will be contacted via the phone number
                      you provided if additional information is needed or when your
                      case is resolved.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-white/50 bg-white/60 p-6 backdrop-blur-sm">
              <h3 className="mb-4 font-bold text-gray-900">Need Help?</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Keep your case code safe for future reference</li>
                <li>• Cases are typically reviewed within 24-48 hours</li>
                <li>• For urgent issues, contact your assembly directly</li>
                <li>
                  • Lost your case code? Contact your assembly or submit a new report.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* View Community Issues Section */}
        {activeSection === "view" && (
          <div className="rounded-2xl border border-white/50 bg-white/80 p-8 backdrop-blur-xl">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">
              Community Issues Overview
            </h2>
            <p className="mb-8 text-gray-600">
              See aggregated statistics about service issues across assemblies. Individual
              case details are protected for privacy.
            </p>

            <div className="mb-6 flex justify-start">
              <button
                type="button"
                className="flex w-full max-w-[16rem] items-center justify-between gap-3 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm sm:hidden"
                onClick={() => setCommunityLocationModalOpen(true)}
              >
                <span className="truncate">{selectedStatsLocationLabel}</span>
                <span className="text-gray-400">▾</span>
              </button>
              <select
                aria-label="Community issues location filter"
                className="hidden w-full max-w-[16rem] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm sm:block"
                value={statsLocationId}
                onChange={(e) => setStatsLocationId(e.target.value)}
              >
                {locations.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {statsError && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-medium text-red-800">{statsError}</p>
              </div>
            )}

            {statsLoading ? (
              <p className="text-sm text-gray-600">Loading community stats...</p>
            ) : (
              <div className="grid gap-6 md:grid-cols-4">
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <p className="text-sm font-semibold text-gray-600">Total Cases</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {publicStats?.totalCases ?? 0}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <p className="text-sm font-semibold text-gray-600">Resolved</p>
                  <p className="mt-2 text-3xl font-bold text-emerald-700">
                    {publicStats?.resolved ?? 0}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <p className="text-sm font-semibold text-gray-600">In Progress</p>
                  <p className="mt-2 text-3xl font-bold text-blue-700">
                    {publicStats?.inProgress ?? 0}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <p className="text-sm font-semibold text-gray-600">Pending</p>
                  <p className="mt-2 text-3xl font-bold text-amber-700">
                    {publicStats?.pending ?? 0}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-8">
              <h3 className="mb-4 text-lg font-bold text-gray-900">
                Common Service Categories
              </h3>
              <div className="flex flex-wrap gap-2">
                {(publicStats?.byCategory ?? []).slice(0, 8).map((category) => (
                  <span
                    key={category.category}
                    className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700"
                  >
                    {category.category.replace(/_/g, " ")} ({category.count})
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {communityLocationModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 sm:hidden"
          onClick={() => setCommunityLocationModalOpen(false)}
        >
          <div
            className="mt-24 w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Choose Location
                </h3>
                <p className="text-sm text-gray-600">
                  Filter community issues by location.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCommunityLocationModalOpen(false)}
                className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
              >
                Close
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-200 bg-white">
              {locations.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`block w-full px-3 py-3 text-left text-sm hover:bg-emerald-50 ${
                    option.value === statsLocationId
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-gray-700"
                  }`}
                  onClick={() => {
                    setStatsLocationId(option.value);
                    setCommunityLocationModalOpen(false);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {submitPickerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 sm:hidden"
          onClick={() => setSubmitPickerOpen(null)}
        >
          <div
            className="mt-24 w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  {submitPickerOpen === "location"
                    ? "Choose Location"
                    : "Choose Service Category"}
                </h3>
                <p className="text-sm text-gray-600">
                  Select one option to continue.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSubmitPickerOpen(null)}
                className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
              >
                Close
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-200 bg-white">
              {(submitPickerOpen === "location" ? locations : categoryOptions).map(
                (option) => {
                  const currentValue =
                    submitPickerOpen === "location"
                      ? form.district
                      : form.category;
                  const active = option.value === currentValue;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`block w-full px-3 py-3 text-left text-sm hover:bg-emerald-50 ${
                        active
                          ? "bg-emerald-50 text-emerald-700"
                          : "text-gray-700"
                      }`}
                      onClick={() => {
                        setForm((prev) => ({
                          ...prev,
                          [submitPickerOpen === "location"
                            ? "district"
                            : "category"]: option.value,
                        }));
                        setSubmitPickerOpen(null);
                      }}
                    >
                      {option.label}
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-20 border-t border-white/30 bg-white/30 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex flex-col items-center justify-center gap-6">
            <img
              src={encodeURI("/GGA-logo-Full-Colour-Pantone.png")}
              alt="Good Governance Africa"
              className="h-12 w-auto object-contain opacity-90"
            />
            <p className="text-xs text-gray-600">© 2026 Good Governance Africa</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function PublicDashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50" />
      }
    >
      <PublicDashboardContent />
    </Suspense>
  );
}

"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { submitComplaint } from "@/lib/api";
import { categoryOptions, districtOptions } from "@/app/dashboard/utils/constants";

export default function PublicDashboard() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<"submit" | "track" | "view">("submit");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [form, setForm] = useState({
    phoneNumber: "",
    district: "assembly_a",
    category: "roads_infrastructure",
    description: "",
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      // For public submission, we use a dummy token
      const result = await submitComplaint("mock-token-public", form);
      setSubmitSuccess(`Your report has been submitted successfully! Your ticket number is: ${result.code}`);
      setForm({
        phoneNumber: "",
        district: "assembly_a",
        category: "roads_infrastructure",
        description: "",
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

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
        <div className="mb-8 flex gap-2 rounded-xl bg-white/60 p-2 backdrop-blur-sm">
          <button
            onClick={() => setActiveSection("submit")}
            className={`flex-1 rounded-lg px-6 py-3 text-sm font-semibold transition-all ${
              activeSection === "submit"
                ? "bg-emerald-600 text-white shadow-md"
                : "text-gray-600 hover:bg-white/50"
            }`}
          >
            Submit Report
          </button>
          <button
            onClick={() => {
              router.push("/track");
            }}
            className={`flex-1 rounded-lg px-6 py-3 text-sm font-semibold transition-all ${
              activeSection === "track"
                ? "bg-emerald-600 text-white shadow-md"
                : "text-gray-600 hover:bg-white/50"
            }`}
          >
            Track Report
          </button>
          <button
            onClick={() => setActiveSection("view")}
            className={`flex-1 rounded-lg px-6 py-3 text-sm font-semibold transition-all ${
              activeSection === "view"
                ? "bg-emerald-600 text-white shadow-md"
                : "text-gray-600 hover:bg-white/50"
            }`}
          >
            View Community Issues
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
                  Assembly
                </label>
                <select
                  required
                  value={form.district}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, district: e.target.value }))
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  {districtOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Service Category
                </label>
                <select
                  required
                  value={form.category}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, category: e.target.value }))
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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

            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-600">Assembly A</span>
                  <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                    Active
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-900">45</p>
                <p className="text-sm text-gray-600">Total cases</p>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Resolved:</span>
                    <span className="font-semibold text-gray-900">35</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">In Progress:</span>
                    <span className="font-semibold text-gray-900">8</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pending:</span>
                    <span className="font-semibold text-gray-900">2</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-600">Assembly B</span>
                  <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                    Active
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-900">23</p>
                <p className="text-sm text-gray-600">Total cases</p>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Resolved:</span>
                    <span className="font-semibold text-gray-900">20</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">In Progress:</span>
                    <span className="font-semibold text-gray-900">2</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pending:</span>
                    <span className="font-semibold text-gray-900">1</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-600">Assembly C</span>
                  <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                    Active
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-900">12</p>
                <p className="text-sm text-gray-600">Total cases</p>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Resolved:</span>
                    <span className="font-semibold text-gray-900">11</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">In Progress:</span>
                    <span className="font-semibold text-gray-900">1</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pending:</span>
                    <span className="font-semibold text-gray-900">0</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="mb-4 text-lg font-bold text-gray-900">
                Common Service Categories
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  "Roads & Infrastructure",
                  "Water & Sanitation",
                  "Waste Management",
                  "Electricity",
                  "Healthcare Services",
                  "Public Safety",
                ].map((category) => (
                  <span
                    key={category}
                    className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

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

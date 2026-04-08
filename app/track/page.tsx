"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getComplaintByCode, type ApiComplaint } from "@/lib/api";

export default function TrackReport() {
  const router = useRouter();
  const [ticketNumber, setTicketNumber] = useState("");
  const [searching, setSearching] = useState(false);
  const [caseData, setCaseData] = useState<ApiComplaint | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    setSearching(true);
    setError(null);
    setCaseData(null);

    try {
      if (!ticketNumber.trim()) {
        setError("Enter your case code to continue.");
        return;
      }
      const data = await getComplaintByCode(ticketNumber.trim());
      setCaseData(data);
    } catch (error) {
      setError(
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
              onClick={() => router.push("/public-dashboard")}
              className="text-sm font-medium text-gray-600 hover:text-emerald-600"
            >
              Submit Report
            </button>
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
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900">
            Track Your Report
          </h1>
          <p className="mt-2 text-xl text-gray-600">
            Enter your case code to check the status of your report
          </p>
        </div>

        <div className="rounded-2xl border border-white/50 bg-white/80 p-8 backdrop-blur-xl">
          <form onSubmit={handleSearch} className="space-y-6">
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
                Use the code shown after report submission (example: YV3UERULET)
              </p>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-medium text-red-800">{error}</p>
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
                <h2 className="text-xl font-bold text-gray-900">
                  Case #{caseData.code}
                </h2>
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
                  <p className="mt-1 text-gray-900">{caseData.category.replace(/_/g, " ")}</p>
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
                <h3 className="mb-2 font-semibold text-gray-900">Status Timeline</h3>
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
                        <span className="text-sm font-semibold text-gray-900">Closed with reasons</span>
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
                  <strong>Note:</strong> You will be contacted via the phone number you provided
                  if additional information is needed or when your case is resolved.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-8 rounded-xl border border-white/50 bg-white/60 p-6 backdrop-blur-sm">
          <h3 className="mb-4 font-bold text-gray-900">Need Help?</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Keep your case code safe for future reference</li>
            <li>• Cases are typically reviewed within 24-48 hours</li>
            <li>• For urgent issues, contact your assembly directly</li>
            <li>
              • Lost your case code? Contact your assembly or submit a{" "}
              <button
                onClick={() => router.push("/public-dashboard")}
                className="font-semibold text-emerald-600 hover:underline"
              >
                new report
              </button>
            </li>
          </ul>
        </div>
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

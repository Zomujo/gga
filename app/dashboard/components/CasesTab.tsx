"use client";

import { useState } from "react";
import type { ApiComplaint } from "@/lib/api";
import { CasesTable } from "./CasesTable";
import { EscalationsSection } from "./EscalationsSection";

interface LocationOption {
  value: string;
  label: string;
}

interface CasesTabProps {
  isAdmin: boolean;
  isDistrictOfficer: boolean;
  escalatedToMe: ApiComplaint[];
  filteredComplaints: ApiComplaint[];
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  selectedCase: string | null;
  statusUpdatingId: string | null;
  onSelect: (id: string) => void;
  onUpdateStatus: (
    complaintId: string,
    newStatus: ApiComplaint["status"]
  ) => void;
  adminDistrict?: string;
  onAdminDistrictChange?: (district: string) => void;
  locationOptions?: LocationOption[];
  // Server-side pagination props
  complaintsPage: number;
  complaintsPageSize: number;
  complaintsTotal: number;
  complaintsLoading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function CasesTab({
  isAdmin,
  isDistrictOfficer,
  escalatedToMe,
  filteredComplaints,
  statusFilter,
  setStatusFilter,
  selectedCase,
  statusUpdatingId,
  onSelect,
  onUpdateStatus,
  adminDistrict,
  onAdminDistrictChange,
  locationOptions = [],
  complaintsPage,
  complaintsPageSize,
  complaintsTotal,
  complaintsLoading,
  onPageChange,
  onPageSizeChange,
}: CasesTabProps) {
  const [statusFilterModalOpen, setStatusFilterModalOpen] = useState(false);
  const displayedTotal =
    isAdmin && statusFilter === "All statuses"
      ? complaintsTotal
      : filteredComplaints.length;

  const statusFilterOptions = [
    "All statuses",
    "Pending",
    "In Progress",
    "Escalated",
    "Resolved",
    "Rejected",
  ];

  return (
    <div className="relative space-y-6">
      {/* Escalations Section - Only for admins */}
      {isAdmin && (
        <EscalationsSection
          escalatedToMe={escalatedToMe}
          statusUpdatingId={statusUpdatingId}
          onSelect={onSelect}
          onUpdateStatus={onUpdateStatus}
        />
      )}

      {/* Cases Tab Content */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {isAdmin
              ? "Case Management"
              : isDistrictOfficer
              ? "Assigned Cases"
              : "My Cases"}
          </h2>
          <p className="text-gray-600">
            {isAdmin
              ? "Monitor and triage incoming service delivery reports"
              : isDistrictOfficer
              ? "Cases assigned to you for resolution"
              : "Cases you've reported from the field"}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {isAdmin && (
            <label className="block">
              <span className="sr-only">Location</span>
              <select
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                value={adminDistrict || ""}
                onChange={(e) => onAdminDistrictChange?.(e.target.value)}
              >
                <option value="">All Locations</option>
                {locationOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button
            type="button"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-left text-gray-900 focus:border-emerald-500 focus:outline-none sm:hidden"
            onClick={() => setStatusFilterModalOpen(true)}
          >
            <span className="flex items-center justify-between gap-3">
              <span className="truncate">{statusFilter}</span>
              <span className="text-gray-400">▾</span>
            </span>
          </button>
          <label className="hidden sm:block">
            <span className="sr-only">Status</span>
            <select
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-emerald-500 focus:outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {statusFilterOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div>
        <CasesTable
          complaints={filteredComplaints}
          selectedCase={selectedCase}
          onSelect={onSelect}
          showDistrictColumn={isAdmin}
          page={complaintsPage}
          pageSize={complaintsPageSize}
          total={displayedTotal}
          loading={complaintsLoading}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </div>

      {statusFilterModalOpen && (
        <div
          className="absolute inset-0 z-20 flex items-start justify-center bg-black/30 p-4 sm:hidden"
          onClick={() => setStatusFilterModalOpen(false)}
        >
          <div
            className="mt-20 w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Filter by Status
                </h3>
                <p className="text-sm text-gray-600">
                  Choose which case statuses to show.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStatusFilterModalOpen(false)}
                className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
              >
                Close
              </button>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white">
              {statusFilterOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`block w-full px-3 py-3 text-left text-sm hover:bg-emerald-50 ${
                    option === statusFilter
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-gray-700"
                  }`}
                  onClick={() => {
                    setStatusFilter(option);
                    setStatusFilterModalOpen(false);
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

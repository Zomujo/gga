"use client";

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
  const displayedTotal =
    isAdmin && statusFilter === "All statuses"
      ? complaintsTotal
      : filteredComplaints.length;

  return (
    <div className="space-y-6">
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
          <label className="block">
            <span className="sr-only">Status</span>
            <select
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-emerald-500 focus:outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option>All statuses</option>
              <option>Pending</option>
              <option>In Progress</option>
              <option>Escalated</option>
              <option>Resolved</option>
              <option>Rejected</option>
            </select>
          </label>
        </div>
      </div>

      <div>
        <CasesTable
          complaints={filteredComplaints}
          selectedCase={selectedCase}
          onSelect={onSelect}
          showDistrictColumn={!isAdmin}
          page={complaintsPage}
          pageSize={complaintsPageSize}
          total={displayedTotal}
          loading={complaintsLoading}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </div>
    </div>
  );
}

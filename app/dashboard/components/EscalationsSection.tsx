"use client";

import { useState } from "react";
import type { ApiComplaint } from "@/lib/api";
import {
  formatDisplayText,
} from "../utils/formatters";

interface EscalationsSectionProps {
  escalatedToMe: ApiComplaint[];
  statusUpdatingId: string | null;
  onSelect: (id: string) => void;
  onUpdateStatus: (complaintId: string, newStatus: ApiComplaint["status"]) => void;
}

export function EscalationsSection({
  escalatedToMe,
  statusUpdatingId,
  onSelect,
  onUpdateStatus,
}: EscalationsSectionProps) {
  const [statusModalComplaintId, setStatusModalComplaintId] = useState<
    string | null
  >(null);

  const statusOptions: { value: ApiComplaint["status"]; label: string }[] = [
    { value: "escalated", label: "Escalated" },
    { value: "pending", label: "Pending" },
    { value: "in_progress", label: "In Progress" },
    { value: "resolved", label: "Resolved" },
    { value: "rejected", label: "Rejected" },
  ];

  const activeStatusComplaint =
    escalatedToMe.find((complaint) => complaint.id === statusModalComplaintId) ??
    null;

  if (escalatedToMe.length === 0) return null;

  return (
    <div className="relative rounded-xl border-2 border-red-200 bg-red-50 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-red-900">Escalations</h2>
          <p className="text-sm text-red-700">
            {escalatedToMe.length} case{escalatedToMe.length !== 1 ? "s" : ""}{" "}
            escalated to you
          </p>
        </div>
        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
          {escalatedToMe.length}
        </span>
      </div>
      <div className="space-y-2">
        {escalatedToMe.map((complaint) => (
          <div
            key={complaint.id}
            className="rounded-lg border border-red-200 bg-white p-4 hover:bg-red-50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div
                className="flex-1 cursor-pointer"
                onClick={() => onSelect(complaint.id)}
              >
                <p className="font-semibold text-gray-900">
                  {formatDisplayText(complaint.category) || "Complaint"}
                </p>
                <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                  {complaint.phoneNumber} -{" "}
                  {complaint.district?.replace(/_/g, " ")}
                </p>
                {complaint.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                    {complaint.description}
                  </p>
                )}
                {complaint.escalationReason && (
                  <p className="text-xs text-red-700 mt-1 italic">
                    Reason: {complaint.escalationReason}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-gray-700"
                  disabled={statusUpdatingId === complaint.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setStatusModalComplaintId(complaint.id);
                  }}
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {activeStatusComplaint && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Update Status
                </h3>
                <p className="text-sm text-gray-600">
                  Choose the next status for this escalated case.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStatusModalComplaintId(null)}
                className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
                disabled={statusUpdatingId === activeStatusComplaint.id}
              >
                Close
              </button>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`block w-full px-3 py-3 text-left text-sm hover:bg-emerald-50 ${
                    option.value === activeStatusComplaint.status
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-gray-700"
                  }`}
                  onClick={() => {
                    setStatusModalComplaintId(null);
                    onUpdateStatus(activeStatusComplaint.id, option.value);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

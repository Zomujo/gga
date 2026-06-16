"use client";

import { useMemo, useState } from "react";
import type { ApiComplaint, ApiUser } from "@/lib/api";
import {
  formatComplaintDate,
  formatComplaintStatus,
  formatDisplayText,
} from "../utils/formatters";

interface CaseDetailsModalProps {
  activeComplaint: ApiComplaint;
  currentUser: ApiUser;
  isAdmin: boolean;
  isDistrictOfficer: boolean;
  districtOfficers: ApiUser[];
  navigators: ApiUser[];
  admins: ApiUser[];
  assignmentModal: boolean;
  assignee: string;
  expectedResolutionDate: string;
  eligibleDistrictOfficers: ApiUser[];
  districtOfficersLoading: boolean;
  assigning: boolean;
  assignmentError: string | null;
  escalationModal: boolean;
  targetAdmin: string;
  escalationReason: string;
  adminsLoading: boolean;
  escalating: boolean;
  escalationError: string | null;
  lastAction: { type: "assign" | "escalate"; detail: string } | null;
  statusUpdateFeedback: { kind: "success" | "error"; message: string } | null;
  statusUpdatingId: string | null;
  creatorLoadingIds: Record<string, boolean>;
  assignedLoadingIds: Record<string, boolean>;
  onClose: () => void;
  onOpenAssignmentModal: () => void;
  onOpenEscalationModal: () => void;
  onCloseAssignmentModal: () => void;
  onCloseEscalationModal: () => void;
  onSetAssignee: (value: string) => void;
  onSetExpectedResolutionDate: (value: string) => void;
  onAssign: () => void;
  onClearAssignmentError: () => void;
  onSetTargetAdmin: (value: string) => void;
  onSetEscalationReason: (value: string) => void;
  onEscalate: () => void;
  onClearEscalationError: () => void;
  onRefreshAdmins: () => void;
  onUpdateStatus: (
    complaintId: string,
    newStatus: ApiComplaint["status"]
  ) => void;
}

export function CaseDetailsModal({
  activeComplaint,
  currentUser,
  isAdmin,
  isDistrictOfficer,
  districtOfficers,
  navigators,
  admins,
  assignmentModal,
  assignee,
  expectedResolutionDate,
  eligibleDistrictOfficers,
  districtOfficersLoading,
  assigning,
  assignmentError,
  escalationModal,
  targetAdmin,
  escalationReason,
  adminsLoading,
  escalating,
  escalationError,
  lastAction,
  statusUpdateFeedback,
  statusUpdatingId,
  creatorLoadingIds,
  assignedLoadingIds,
  onClose,
  onOpenAssignmentModal,
  onOpenEscalationModal,
  onCloseAssignmentModal,
  onCloseEscalationModal,
  onSetAssignee,
  onSetExpectedResolutionDate,
  onAssign,
  onClearAssignmentError,
  onSetTargetAdmin,
  onSetEscalationReason,
  onEscalate,
  onClearEscalationError,
  onRefreshAdmins,
  onUpdateStatus,
}: CaseDetailsModalProps) {
  const caseReference = activeComplaint.code || activeComplaint.id.slice(0, 8);
  const statusOptions: { value: ApiComplaint["status"]; label: string }[] = [
    { value: "pending", label: "Pending" },
    { value: "in_progress", label: "In Progress" },
    { value: "resolved", label: "Resolved" },
    { value: "rejected", label: "Rejected" },
  ];

  const getAssignedToName = () => {
    if (activeComplaint.assignedToId === currentUser?.id) {
      return `${currentUser.fullName} (You)`;
    }
    return (
      districtOfficers.find((d) => d.id === activeComplaint.assignedToId)
        ?.fullName ||
      navigators.find((n) => n.id === activeComplaint.assignedToId)?.fullName ||
      admins.find((a) => a.id === activeComplaint.assignedToId)?.fullName ||
      activeComplaint.assignedTo?.fullName ||
      "Unassigned"
    );
  };

  const getAssignedToDepartment = () => {
    if (activeComplaint.assignedToId === currentUser?.id) {
      return currentUser.departmentName ?? null;
    }

    return (
      districtOfficers.find((d) => d.id === activeComplaint.assignedToId)
        ?.departmentName ||
      navigators.find((n) => n.id === activeComplaint.assignedToId)
        ?.departmentName ||
      admins.find((a) => a.id === activeComplaint.assignedToId)
        ?.departmentName ||
      activeComplaint.assignedTo?.departmentName ||
      null
    );
  };

  const getCreatedByName = () => {
    if (activeComplaint.createdById === currentUser?.id) {
      return `${currentUser.fullName} (You)`;
    }

    return (
      navigators.find((n) => n.id === activeComplaint.createdById)?.fullName ||
      districtOfficers.find((d) => d.id === activeComplaint.createdById)
        ?.fullName ||
      admins.find((a) => a.id === activeComplaint.createdById)?.fullName ||
      activeComplaint.createdBy?.fullName ||
      "Unknown"
    );
  };

  const selectedOfficer = eligibleDistrictOfficers.find(
    (officer) => officer.id === assignee
  );
  const selectedAdmin = admins.find((admin) => admin.id === targetAdmin);
  const selectedStatus =
    statusOptions.find((option) => option.value === activeComplaint.status)
      ?.label ?? "Pending";

  const pickerButtonClassName =
    "flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-left text-sm focus:border-emerald-500 focus:outline-none";

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [timelineExpanded, setTimelineExpanded] = useState(false);

  const timelineItems = useMemo(() => {
    const items: { label: string; date: string; tone?: "neutral" | "success" | "danger" }[] = [
      { label: "Reported", date: activeComplaint.createdAt, tone: "neutral" },
    ];

    if (activeComplaint.respondedAt) {
      items.push({
        label: "Assigned / First Response",
        date: activeComplaint.respondedAt,
        tone: "neutral",
      });
    }

    if (activeComplaint.escalatedAt) {
      items.push({
        label: "Escalated",
        date: activeComplaint.escalatedAt,
        tone: "danger",
      });
    }

    if (activeComplaint.status === "in_progress") {
      items.push({
        label: "In Progress",
        date: activeComplaint.updatedAt,
        tone: "neutral",
      });
    }

    if (activeComplaint.status === "resolved") {
      items.push({
        label: "Resolved",
        date: activeComplaint.updatedAt,
        tone: "success",
      });
    }

    if (activeComplaint.status === "rejected") {
      items.push({
        label: "Closed with Reasons",
        date: activeComplaint.updatedAt,
        tone: "danger",
      });
    }

    return items
      .sort((a, b) => +new Date(a.date) - +new Date(b.date))
      .filter(
        (item, index, all) =>
          index ===
          all.findIndex(
            (candidate) =>
              candidate.label === item.label && candidate.date === item.date
          )
      );
  }, [
    activeComplaint.createdAt,
    activeComplaint.escalatedAt,
    activeComplaint.respondedAt,
    activeComplaint.status,
    activeComplaint.updatedAt,
  ]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-600">Case Details</p>
            <h2 className="text-2xl font-bold text-gray-900">
              {caseReference}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Phone Number
            </p>
            <p className="text-gray-900">
              {activeComplaint.isAnonymous
                ? "Hidden for anonymous report"
                : activeComplaint.phoneNumber || "—"}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Town
            </p>
            <p className="text-gray-700">
              {activeComplaint.locationName ||
                formatDisplayText(activeComplaint.district)}
            </p>
          </div>

          {activeComplaint.metroDistrictName && (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                District
              </p>
              <p className="text-gray-700">
                {activeComplaint.metroDistrictName}
              </p>
            </div>
          )}

          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Category
            </p>
            <p className="text-gray-700">
              {formatDisplayText(activeComplaint.category)}
              {activeComplaint.otherCategory
                ? `: ${activeComplaint.otherCategory}`
                : ""}
            </p>
          </div>

          {!activeComplaint.isAnonymous && activeComplaint.fullName && (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Full Name
              </p>
              <p className="text-gray-700">{activeComplaint.fullName}</p>
            </div>
          )}

          {activeComplaint.age && (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Age
              </p>
              <p className="text-gray-700">{activeComplaint.age}</p>
            </div>
          )}

          {activeComplaint.gender && (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Gender
              </p>
              <p className="text-gray-700">
                {activeComplaint.gender.charAt(0).toUpperCase() +
                  activeComplaint.gender.slice(1)}
              </p>
            </div>
          )}

          {activeComplaint.assistiveDevice && (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Assistive Device
              </p>
              <p className="text-gray-700">
                {formatDisplayText(activeComplaint.assistiveDevice)}
                {activeComplaint.otherAssistiveDevice &&
                  `: ${activeComplaint.otherAssistiveDevice}`}
              </p>
            </div>
          )}

          {activeComplaint.caregiverPhoneNumber && (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Caregiver Phone
              </p>
              <p className="text-gray-700">
                {activeComplaint.caregiverPhoneNumber}
              </p>
            </div>
          )}

          {activeComplaint.language && (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Language
              </p>
              <p className="text-gray-700">{activeComplaint.language}</p>
            </div>
          )}

          {activeComplaint.issueTypes &&
            activeComplaint.issueTypes.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Issue Types
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {activeComplaint.issueTypes.map((type) => (
                    <span
                      key={type}
                      className="inline-block rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800"
                    >
                      {formatDisplayText(type)}
                    </span>
                  ))}
                </div>
                {activeComplaint.otherIssueType && (
                  <p className="mt-1 text-sm text-gray-600">
                    Other: {activeComplaint.otherIssueType}
                  </p>
                )}
              </div>
            )}

          {activeComplaint.requestType && (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Request Type
              </p>
              <p className="text-gray-700">
                {formatDisplayText(activeComplaint.requestType)}
                {activeComplaint.otherRequest &&
                  `: ${activeComplaint.otherRequest}`}
              </p>
            </div>
          )}

          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Description
            </p>
            <p className="whitespace-pre-line text-gray-700">
              {activeComplaint.description || "No description provided"}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Created
            </p>
            <p className="text-gray-700">
              {formatComplaintDate(activeComplaint.createdAt)}
            </p>
          </div>

          {activeComplaint.createdById &&
            !activeComplaint.isAnonymous &&
            !isDistrictOfficer && (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Created By
              </p>
              <p className="text-gray-700">
                {creatorLoadingIds?.[activeComplaint.createdById]
                  ? "Loading..."
                  : getCreatedByName()}
              </p>
            </div>
          )}

          {activeComplaint.assignedToId && (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                {activeComplaint.status === "escalated"
                  ? "Escalated To"
                  : "Assigned To"}
              </p>
              <p className="text-gray-700">
                {activeComplaint.assignedToId &&
                assignedLoadingIds?.[activeComplaint.assignedToId]
                  ? "Loading..."
                  : getAssignedToName()}
              </p>
              {(!activeComplaint.assignedToId ||
                !assignedLoadingIds?.[activeComplaint.assignedToId]) &&
                getAssignedToDepartment() && (
                  <p className="text-sm text-gray-500">
                    Department: {getAssignedToDepartment()}
                  </p>
                )}
            </div>
          )}

          {activeComplaint.expectedResolutionDate && (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Expected Resolution
              </p>
              <p className="text-gray-700">
                {formatComplaintDate(activeComplaint.expectedResolutionDate)}
              </p>
            </div>
          )}

          {activeComplaint.status === "escalated" &&
            activeComplaint.escalationReason && (
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Escalation Reason
                </p>
                <p className="whitespace-pre-line text-gray-700">
                  {activeComplaint.escalationReason}
                </p>
              </div>
            )}

          {lastAction && (
            <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
              {lastAction.type === "assign"
                ? `Assigned to ${lastAction.detail}`
                : `Escalated to ${lastAction.detail}`}
            </div>
          )}

          {statusUpdateFeedback && (
            <div
              className={`rounded-lg px-3 py-2 text-sm ${
                statusUpdateFeedback.kind === "success"
                  ? "bg-green-50 text-green-800"
                  : "bg-red-50 text-red-800"
              }`}
            >
              {statusUpdateFeedback.message}
            </div>
          )}

          {statusUpdatingId === activeComplaint.id && (
            <div className="text-xs text-gray-500">Updating status…</div>
          )}

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 text-left"
              onClick={() => setTimelineExpanded((value) => !value)}
            >
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Status Timeline
                </p>
                <p className="text-xs text-gray-500">
                  Current status: {formatComplaintStatus(activeComplaint.status)}
                </p>
              </div>
              <span className="text-sm text-gray-500">
                {timelineExpanded ? "Hide" : "Show"}
              </span>
            </button>

            {timelineExpanded && (
              <div className="mt-4 space-y-3">
                {timelineItems.map((item, index) => (
                  <div key={`${item.label}-${item.date}`} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={`mt-1 h-3 w-3 rounded-full ${
                          item.tone === "success"
                            ? "bg-emerald-600"
                            : item.tone === "danger"
                            ? "bg-red-500"
                            : "bg-blue-500"
                        }`}
                      />
                      {index < timelineItems.length - 1 && (
                        <span className="mt-1 h-full w-px bg-gray-300" />
                      )}
                    </div>
                    <div className="pb-2">
                      <p className="text-sm font-medium text-gray-900">
                        {item.label}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatComplaintDate(item.date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3 pt-4">
            {isAdmin && (
              <div className="flex gap-2">
                <button
                  className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                  onClick={onOpenAssignmentModal}
                >
                  Assign
                </button>
              </div>
            )}

            {isDistrictOfficer ? (
              <div className="flex items-end gap-3">
                {activeComplaint.status !== "resolved" && (
                  <button
                    className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                    onClick={onOpenEscalationModal}
                  >
                    Escalate to Admin
                  </button>
                )}
                <div className="flex-1">
                  <button
                    type="button"
                    className={`${pickerButtonClassName} ${
                      statusUpdatingId === activeComplaint.id
                        ? "cursor-not-allowed opacity-60"
                        : ""
                    }`}
                    disabled={statusUpdatingId === activeComplaint.id}
                    onClick={() => setStatusModalOpen(true)}
                  >
                    <span>{selectedStatus}</span>
                    <span className="text-gray-400">▾</span>
                  </button>
                </div>
              </div>
            ) : (
              (isAdmin || isDistrictOfficer) && (
                <div>
                  <button
                    type="button"
                    className={`${pickerButtonClassName} ${
                      statusUpdatingId === activeComplaint.id
                        ? "cursor-not-allowed opacity-60"
                        : ""
                    }`}
                    disabled={statusUpdatingId === activeComplaint.id}
                    onClick={() => setStatusModalOpen(true)}
                  >
                    <span>{selectedStatus}</span>
                    <span className="text-gray-400">▾</span>
                  </button>
                </div>
              )
            )}
          </div>
        </div>

        {assignmentModal && (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 p-4"
            onClick={onCloseAssignmentModal}
          >
            <div
              className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    Assign Complaint
                  </h3>
                  <p className="text-sm text-gray-600">
                    Choose a staff officer and set an expected resolution date.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onCloseAssignmentModal}
                  className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
                  disabled={assigning}
                >
                  Close
                </button>
              </div>
              <div className="space-y-4">
                {assignmentError && (
                  <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
                    {assignmentError}
                  </div>
                )}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Assign to Staff Officer
                  </label>
                  <div className="max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white">
                    {districtOfficersLoading ? (
                      <div className="px-3 py-3 text-sm text-gray-500">
                        Loading...
                      </div>
                    ) : eligibleDistrictOfficers.length === 0 ? (
                      <div className="px-3 py-3 text-sm text-gray-500">
                        No staff officers found for this location. Ask an admin to create or update a staff officer for this location.
                      </div>
                    ) : (
                      eligibleDistrictOfficers.map((officer) => (
                        <button
                          key={officer.id}
                          type="button"
                          className={`block w-full px-3 py-2 text-left text-sm hover:bg-emerald-50 ${
                            officer.id === assignee
                              ? "bg-emerald-50 text-emerald-700"
                              : "text-gray-700"
                          }`}
                          onClick={() => {
                            onClearAssignmentError();
                            onSetAssignee(officer.id);
                          }}
                        >
                          <span className="block font-medium">
                            {officer.fullName}
                          </span>
                          <span className="block text-xs text-gray-500">
                            {officer.departmentName || "No department set"}
                          </span>
                          <span className="block text-xs text-gray-500">
                            {officer.email}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                  {selectedOfficer && (
                    <p className="mt-2 text-xs text-gray-500">
                      Selected: {selectedOfficer.fullName}
                      {selectedOfficer.departmentName
                        ? ` • ${selectedOfficer.departmentName}`
                        : ""}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Expected Resolution Date
                  </label>
                  <p className="mb-2 text-xs text-gray-500">Required</p>
                  <input
                    type="datetime-local"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                    value={expectedResolutionDate}
                    onChange={(e) => {
                      onClearAssignmentError();
                      onSetExpectedResolutionDate(e.target.value);
                    }}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    onClick={onCloseAssignmentModal}
                    disabled={assigning}
                  >
                    Cancel
                  </button>
                  <button
                    disabled={assigning}
                    className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                    onClick={onAssign}
                  >
                    {assigning ? "Assigning..." : "Assign"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {escalationModal && (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 p-4"
            onClick={onCloseEscalationModal}
          >
            <div
              className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    Escalate Complaint
                  </h3>
                  <p className="text-sm text-gray-600">
                    Send this case to an admin with a clear escalation reason.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onCloseEscalationModal}
                  className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
                  disabled={escalating}
                >
                  Close
                </button>
              </div>
              <div className="space-y-4">
                {escalationError && (
                  <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
                    {escalationError}
                  </div>
                )}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Escalate to Admin
                  </label>
                  <div className="max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white">
                    {adminsLoading ? (
                      <div className="px-3 py-3 text-sm text-gray-500">
                        Loading...
                      </div>
                    ) : admins.length === 0 ? (
                      <div className="px-3 py-3 text-sm text-gray-500">
                        No admins available.
                      </div>
                    ) : (
                      admins.map((admin) => (
                        <button
                          key={admin.id}
                          type="button"
                          className={`block w-full px-3 py-2 text-left text-sm hover:bg-emerald-50 ${
                            admin.id === targetAdmin
                              ? "bg-emerald-50 text-emerald-700"
                              : "text-gray-700"
                          }`}
                          onClick={() => {
                            onClearEscalationError();
                            onSetTargetAdmin(admin.id);
                          }}
                        >
                          <span className="block font-medium">
                            {admin.fullName}
                          </span>
                          <span className="block text-xs text-gray-500">
                            {admin.email}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    {selectedAdmin ? (
                      <p className="text-xs text-gray-500">
                        Selected: {selectedAdmin.fullName}
                      </p>
                    ) : (
                      <span />
                    )}
                    <button
                      type="button"
                      onClick={onRefreshAdmins}
                      className="text-xs text-emerald-600 hover:underline"
                    >
                      Refresh list
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Escalation Reason
                  </label>
                  <textarea
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                    rows={4}
                    value={escalationReason}
                    onChange={(e) => {
                      onClearEscalationError();
                      onSetEscalationReason(e.target.value);
                    }}
                    placeholder="Explain why this complaint needs escalation..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    onClick={onCloseEscalationModal}
                    disabled={escalating}
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!targetAdmin || !escalationReason || escalating}
                    className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                    onClick={onEscalate}
                  >
                    {escalating ? "Escalating..." : "Escalate"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {statusModalOpen && (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 p-4"
            onClick={() => setStatusModalOpen(false)}
          >
            <div
              className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    Update Status
                  </h3>
                  <p className="text-sm text-gray-600">
                    Choose the next status for this case.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStatusModalOpen(false)}
                  className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
                  disabled={statusUpdatingId === activeComplaint.id}
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
                      option.value === activeComplaint.status
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-gray-700"
                    }`}
                    onClick={() => {
                      setStatusModalOpen(false);
                      onUpdateStatus(activeComplaint.id, option.value);
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
    </div>
  );
}

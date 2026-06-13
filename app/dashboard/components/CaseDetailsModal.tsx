"use client";

import { useState } from "react";
import type { ApiComplaint, ApiUser } from "@/lib/api";
import {
  formatComplaintDate,
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
  const [openPicker, setOpenPicker] = useState<
    "assignee" | "admin" | "status" | null
  >(null);

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-600">Case Details</p>
            <h2 className="text-2xl font-bold text-gray-900">
              {activeComplaint.id}
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
            <p className="text-gray-900">{activeComplaint.phoneNumber}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              District
            </p>
            <p className="text-gray-700">
              {formatDisplayText(activeComplaint.district)}
            </p>
          </div>

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

          {activeComplaint.fullName && (
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

          {activeComplaint.createdById && !isDistrictOfficer && (
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

          <div className="space-y-3 pt-4">
            {isAdmin && (
              <div className="flex gap-2">
                <button
                  className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                  onClick={onOpenAssignmentModal}
                >
                  Assign
                </button>
                {activeComplaint.status !== "resolved" && (
                  <button
                    className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                    onClick={onOpenEscalationModal}
                  >
                    Escalate
                  </button>
                )}
              </div>
            )}

            {assignmentModal && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
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
                    className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-white"
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
                    <button
                      type="button"
                      className={pickerButtonClassName}
                      onClick={() =>
                        setOpenPicker((current) =>
                          current === "assignee" ? null : "assignee"
                        )
                      }
                      disabled={districtOfficersLoading}
                    >
                      <span className="truncate">
                        {districtOfficersLoading
                          ? "Loading..."
                          : selectedOfficer
                          ? `${selectedOfficer.fullName} - ${formatDisplayText(
                              selectedOfficer.district
                            )}`
                          : "Select staff officer"}
                      </span>
                      <span className="text-gray-400">▾</span>
                    </button>
                    {openPicker === "assignee" && !districtOfficersLoading && (
                      <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white">
                        {eligibleDistrictOfficers.map((officer) => (
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
                              setOpenPicker(null);
                            }}
                          >
                            <span className="block font-medium">
                              {officer.fullName}
                            </span>
                            <span className="block text-xs text-gray-500">
                              {formatDisplayText(officer.district)} ({officer.email})
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    {!districtOfficersLoading && eligibleDistrictOfficers.length === 0 && (
                      <p className="mt-2 text-xs text-gray-500">
                        No staff officers found for this location. Ask an admin to create or update a staff officer for this location.
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
            )}

            {escalationModal && (
              <div className="rounded-xl border border-red-200 bg-red-50/40 p-4">
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
                    className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-white"
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
                    <button
                      type="button"
                      className={pickerButtonClassName}
                      onClick={() =>
                        setOpenPicker((current) =>
                          current === "admin" ? null : "admin"
                        )
                      }
                      disabled={adminsLoading}
                    >
                      <span className="truncate">
                        {adminsLoading
                          ? "Loading..."
                          : selectedAdmin
                          ? `${selectedAdmin.fullName} (${selectedAdmin.email})`
                          : "Select admin"}
                      </span>
                      <span className="text-gray-400">▾</span>
                    </button>
                    {openPicker === "admin" && !adminsLoading && (
                      <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white">
                        {admins.map((admin) => (
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
                              setOpenPicker(null);
                            }}
                          >
                            <span className="block font-medium">
                              {admin.fullName}
                            </span>
                            <span className="block text-xs text-gray-500">
                              {admin.email}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      {!adminsLoading && admins.length === 0 && (
                        <p className="text-xs text-gray-500">No admins available.</p>
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
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Update Status
                  </label>
                  <button
                    type="button"
                    className={`${pickerButtonClassName} ${
                      statusUpdatingId === activeComplaint.id
                        ? "cursor-not-allowed opacity-60"
                        : ""
                    }`}
                    disabled={statusUpdatingId === activeComplaint.id}
                    onClick={() =>
                      setOpenPicker((current) =>
                        current === "status" ? null : "status"
                      )
                    }
                  >
                    <span>{selectedStatus}</span>
                    <span className="text-gray-400">▾</span>
                  </button>
                  {openPicker === "status" && (
                    <div className="mt-2 rounded-lg border border-gray-200 bg-white">
                      {statusOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={`block w-full px-3 py-2 text-left text-sm hover:bg-emerald-50 ${
                            option.value === activeComplaint.status
                              ? "bg-emerald-50 text-emerald-700"
                              : "text-gray-700"
                          }`}
                          onClick={() => {
                            setOpenPicker(null);
                            onUpdateStatus(activeComplaint.id, option.value);
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              (isAdmin || isDistrictOfficer) && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Update Status
                  </label>
                  <button
                    type="button"
                    className={`${pickerButtonClassName} ${
                      statusUpdatingId === activeComplaint.id
                        ? "cursor-not-allowed opacity-60"
                        : ""
                    }`}
                    disabled={statusUpdatingId === activeComplaint.id}
                    onClick={() =>
                      setOpenPicker((current) =>
                        current === "status" ? null : "status"
                      )
                    }
                  >
                    <span>{selectedStatus}</span>
                    <span className="text-gray-400">▾</span>
                  </button>
                  {openPicker === "status" && (
                    <div className="mt-2 rounded-lg border border-gray-200 bg-white">
                      {statusOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={`block w-full px-3 py-2 text-left text-sm hover:bg-emerald-50 ${
                            option.value === activeComplaint.status
                              ? "bg-emerald-50 text-emerald-700"
                              : "text-gray-700"
                          }`}
                          onClick={() => {
                            setOpenPicker(null);
                            onUpdateStatus(activeComplaint.id, option.value);
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

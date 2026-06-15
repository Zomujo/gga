"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  getComplaints,
  getComplaint,
  getUser,
  submitComplaint as submitComplaintApi,
  submitComplaintByNavigator,
  updateComplaintStatus as updateComplaintStatusApi,
  type ApiComplaint,
  type ApiUser,
} from "@/lib/api";
import {
  getStatusLabel,
  getFriendlyStatusUpdateError,
} from "../utils/formatters";

export interface ComplaintFormState {
  fullName: string;
  age: string;
  phoneNumber: string;
  isAnonymous: boolean;
  caregiverPhoneNumber: string;
  category: string;
  district: string;
  assistiveDevice: string;
  otherAssistiveDevice: string;
  issueTypes: string[];
  otherIssueType: string;
  requestType: string;
  otherRequest: string;
  gender: string;
  language: string;
  description: string;
  otherCategory: string;
  complaintType: "general" | "detailed";
}

const initialFormState: ComplaintFormState = {
  fullName: "",
  age: "",
  phoneNumber: "",
  isAnonymous: false,
  caregiverPhoneNumber: "",
  category: "",
  district: "",
  assistiveDevice: "none",
  otherAssistiveDevice: "",
  issueTypes: [],
  otherIssueType: "",
  requestType: "",
  otherRequest: "",
  gender: "male",
  language: "english",
  description: "",
  otherCategory: "",
  complaintType: "general",
};

function getInitialFormState(currentUser: ApiUser | null): ComplaintFormState {
  return {
    ...initialFormState,
    phoneNumber:
      currentUser?.role === "navigator" ? currentUser.phoneNumber ?? "" : "",
    district:
      currentUser?.role === "navigator" ? currentUser.locationId ?? "" : "",
  };
}

interface UseComplaintsOptions {
  token: string | null;
  currentUser: ApiUser | null;
  onStatsRefresh?: () => void;
  adminDistrict?: string;
}

export function useComplaints({
  token,
  currentUser,
  onStatsRefresh,
  adminDistrict,
}: UseComplaintsOptions) {
  const isAdminLike =
    currentUser?.role === "admin" || currentUser?.role === "super_admin";
  const [liveComplaints, setLiveComplaints] = useState<ApiComplaint[]>([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [complaintsError, setComplaintsError] = useState<string | null>(null);
  // Server-side pagination state
  const [complaintsPage, setComplaintsPage] = useState(1);
  const [complaintsPageSize, setComplaintsPageSize] = useState(10);
  const [complaintsTotal, setComplaintsTotal] = useState(0);
  const [complaintForm, setComplaintForm] =
    useState<ComplaintFormState>(() => getInitialFormState(currentUser));
  const [complaintSubmitting, setComplaintSubmitting] = useState(false);
  const [complaintStatus, setComplaintStatus] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [statusUpdateFeedback, setStatusUpdateFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<{
    type: "assign" | "escalate";
    detail: string;
  } | null>(null);
  const [creatorLoadingIds, setCreatorLoadingIds] = useState<
    Record<string, boolean>
  >({});
  const [assignedLoadingIds, setAssignedLoadingIds] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    if (currentUser?.role !== "navigator") return;

    setComplaintForm((prev) => ({
      ...prev,
      phoneNumber: currentUser.phoneNumber ?? prev.phoneNumber,
      district: currentUser.locationId ?? prev.district,
    }));
  }, [currentUser]);

  const refreshComplaints = useCallback(
    async (
      districtOverride?: string,
      pageOverride?: number,
      pageSizeOverride?: number
    ) => {
      if (!token) return;
      setComplaintsLoading(true);
      setComplaintsError(null);
      try {
        const resolvedAdminDistrict = districtOverride ?? adminDistrict;
        const resolvedPage = pageOverride ?? complaintsPage;
        const resolvedPageSize = pageSizeOverride ?? complaintsPageSize;
        const options: { district?: string; page?: number; pageSize?: number } =
          {
            page: resolvedPage,
            pageSize: resolvedPageSize,
          };
        if (isAdminLike && resolvedAdminDistrict) {
          options.district = resolvedAdminDistrict;
        }
        const response = await getComplaints(token, options);
        setLiveComplaints(response.rows || []);
        setComplaintsTotal(response.total);
        setComplaintsPage(response.page);
        setComplaintsPageSize(response.pageSize);
      } catch (error) {
        setComplaintsError(
          error instanceof Error ? error.message : "Failed to load complaints"
        );
      } finally {
        setComplaintsLoading(false);
      }
    },
    [
      token,
      isAdminLike,
      adminDistrict,
      complaintsPage,
      complaintsPageSize,
    ]
  );

  const handleComplaintSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!token) return;
      setComplaintSubmitting(true);
      setComplaintStatus(null);
      setComplaintsError(null);
      try {
        const base = {
          phoneNumber: complaintForm.phoneNumber,
          district: complaintForm.district,
          category: complaintForm.category,
          isAnonymous: complaintForm.isAnonymous,
          otherCategory:
            complaintForm.category === "other"
              ? complaintForm.otherCategory || undefined
              : undefined,
          description: complaintForm.description || undefined,
        };

        const createPayload = base;

        const result =
          currentUser?.role === "navigator"
            ? await submitComplaintByNavigator(token, base)
            : await submitComplaintApi(token, createPayload);

        await refreshComplaints();

        setComplaintForm(getInitialFormState(currentUser));
        setComplaintStatus(
          `Complaint submitted successfully. Code: ${result.code}`
        );

        return result;
      } catch (error) {
        setComplaintStatus(null);
        setComplaintsError(
          error instanceof Error ? error.message : "Failed to submit complaint"
        );
        return null;
      } finally {
        setComplaintSubmitting(false);
      }
    },
    [token, complaintForm, refreshComplaints, currentUser]
  );

  const resetComplaintForm = useCallback(() => {
    setComplaintForm(getInitialFormState(currentUser));
    setComplaintStatus(null);
    setComplaintsError(null);
  }, [currentUser]);

  const handleUpdateStatus = useCallback(
    async (complaintId: string, newStatus: ApiComplaint["status"]) => {
      if (!token) {
        setStatusUpdateFeedback({
          kind: "error",
          message: "Session expired. Please sign in again.",
        });
        return;
      }

      const current = liveComplaints.find((c) => c.id === complaintId);
      if (!current) {
        setStatusUpdateFeedback({
          kind: "error",
          message: "This case is no longer available. Please refresh.",
        });
        return;
      }

      if (
        currentUser?.role === "district_officer" &&
        current.assignedToId &&
        current.assignedToId !== currentUser.id
      ) {
        setStatusUpdateFeedback({
          kind: "error",
          message: "You can only change the status of cases assigned to you.",
        });
        return;
      }

      if (currentUser?.role === "district_officer" && !current.assignedToId) {
        setStatusUpdateFeedback({
          kind: "error",
          message: "You can't change the status until the case is assigned.",
        });
        return;
      }

      if (current.status === newStatus) return;

      const previousStatus = current.status;
      setStatusUpdatingId(complaintId);
      setStatusUpdateFeedback(null);

      setLiveComplaints((prev) =>
        prev.map((c) =>
          c.id === complaintId ? { ...c, status: newStatus } : c
        )
      );

      try {
        const updated = await updateComplaintStatusApi(token, complaintId, {
          status: newStatus,
        });
        const finalStatus = updated?.status ?? newStatus;
        setLiveComplaints((prev) =>
          prev.map((c) =>
            c.id === complaintId
              ? {
                  ...c,
                  ...updated,
                  id: c.id,
                  status: finalStatus,
                }
              : c
          )
        );
        setStatusUpdateFeedback({
          kind: "success",
          message: `Status updated to ${getStatusLabel(finalStatus)}.`,
        });
        if (isAdminLike) {
          onStatsRefresh?.();
        }
      } catch (error) {
        setLiveComplaints((prev) =>
          prev.map((c) =>
            c.id === complaintId ? { ...c, status: previousStatus } : c
          )
        );
        setStatusUpdateFeedback({
          kind: "error",
          message: getFriendlyStatusUpdateError(error),
        });
      } finally {
        setStatusUpdatingId(null);
      }
    },
    [token, liveComplaints, currentUser, onStatsRefresh, isAdminLike]
  );

  const escalatedToMe = useMemo(() => {
    if (!currentUser || !isAdminLike) return [];
    return liveComplaints.filter(
      (c) => c.status === "escalated" && c.assignedToId === currentUser.id
    );
  }, [liveComplaints, currentUser, isAdminLike]);

  const filteredComplaints = useMemo(() => {
    let complaints = liveComplaints;

    if (currentUser?.role === "district_officer") {
      complaints = liveComplaints.filter((c) => {
        const isAssignedToMe = c.assignedToId === currentUser.id;
        const sameLocation = currentUser.locationId
          ? c.locationId === currentUser.locationId
          : currentUser.district && c.district
          ? c.district === currentUser.district
          : false;

        const isEscalatedFromMyLocation = c.status === "escalated" && sameLocation;

        return isAssignedToMe || isEscalatedFromMyLocation;
      });
    }

    // Navigators should only see complaints they created
    if (currentUser?.role === "navigator") {
      complaints = liveComplaints.filter(
        (c) => c.createdById === currentUser.id
      );
    }

    if (statusFilter === "All statuses") {
      return complaints;
    }

    const statusMap: Record<string, ApiComplaint["status"]> = {
      Pending: "pending",
      "In Progress": "in_progress",
      Escalated: "escalated",
      Resolved: "resolved",
      Rejected: "rejected",
    };

    const backendStatus = statusMap[statusFilter];
    if (!backendStatus) return complaints;
    return complaints.filter((c) => c.status === backendStatus);
  }, [liveComplaints, statusFilter, currentUser]);

  const activeComplaint = selectedCase
    ? liveComplaints.find((c) => c.id === selectedCase) ?? null
    : filteredComplaints[0] ?? null;

  const handleSelect = useCallback(
    async (id: string) => {
      setSelectedCase(id);
      setLastAction(null);
      setStatusUpdateFeedback(null);

      if (!token) return;

      const canFetchUsersById =
        isAdminLike || currentUser?.role === "navigator";

      try {
        const full = await getComplaint(token, id);
        let merged = { ...full } as ApiComplaint;

        // If backend didn't include related `createdBy`, try fetching the user directly
        if (
          canFetchUsersById &&
          full.createdById &&
          !full.createdBy?.fullName
        ) {
          setCreatorLoadingIds((s) => ({ ...s, [full.createdById!]: true }));
          try {
            const user = await getUser(token, full.createdById);
            merged = { ...merged, createdBy: user };
          } catch {
            // ignore — we'll fall back to local lists or 'Unknown'
          } finally {
            setCreatorLoadingIds((s) => ({ ...s, [full.createdById!]: false }));
          }
        }

        // If backend didn't include related `assignedTo`, try fetching that user too
        if (
          canFetchUsersById &&
          full.assignedToId &&
          !full.assignedTo?.fullName
        ) {
          setAssignedLoadingIds((s) => ({ ...s, [full.assignedToId!]: true }));
          try {
            const user = await getUser(token, full.assignedToId);
            merged = { ...merged, assignedTo: user };
          } catch {
            // ignore — we'll fall back to local lists or 'Unassigned'
          } finally {
            setAssignedLoadingIds((s) => ({
              ...s,
              [full.assignedToId!]: false,
            }));
          }
        }

        setLiveComplaints((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...merged } : c))
        );
      } catch (error) {
        setComplaintsError(
          error instanceof Error ? error.message : "Failed to load case details"
        );
      }
    },
    [token, currentUser?.role, isAdminLike]
  );

  const closeCaseDetailsModal = useCallback(() => {
    setSelectedCase(null);
    setLastAction(null);
    setStatusUpdateFeedback(null);
  }, []);

  const updateComplaintInList = useCallback((complaint: ApiComplaint) => {
    setLiveComplaints((prev) =>
      prev.map((c) => (c.id === complaint.id ? complaint : c))
    );
  }, []);

  return {
    // State
    liveComplaints,
    complaintsLoading,
    complaintsError,
    complaintForm,
    complaintSubmitting,
    complaintStatus,
    statusFilter,
    selectedCase,
    statusUpdateFeedback,
    statusUpdatingId,
    lastAction,
    escalatedToMe,
    filteredComplaints,
    activeComplaint,
    // Setters
    setComplaintForm,
    setStatusFilter,
    setSelectedCase,
    setLastAction,
    setComplaintsError,
    setComplaintStatus,
    // Pagination state
    complaintsPage,
    complaintsPageSize,
    complaintsTotal,
    setComplaintsPage,
    setComplaintsPageSize,
    // Actions
    refreshComplaints,
    handleComplaintSubmit,
    handleUpdateStatus,
    handleSelect,
    closeCaseDetailsModal,
    updateComplaintInList,
    resetComplaintForm,
    creatorLoadingIds,
    assignedLoadingIds,
  };
}

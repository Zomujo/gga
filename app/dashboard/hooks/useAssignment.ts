"use client";

import { useCallback, useMemo, useState } from "react";
import {
  assignComplaint as assignComplaintApi,
  getDepartments,
  getDistrictOfficers,
  type ApiComplaint,
  type ApiDepartment,
  type ApiUser,
} from "@/lib/api";

interface UseAssignmentOptions {
  token: string | null;
  currentUser: ApiUser | null;
  activeComplaint: ApiComplaint | null;
  onComplaintUpdate: (complaint: ApiComplaint) => void;
  onSuccess: (detail: string) => void;
  onStatsRefresh?: () => void;
}

export function useAssignment({
  token,
  currentUser,
  activeComplaint,
  onComplaintUpdate,
  onSuccess,
  onStatsRefresh,
}: UseAssignmentOptions) {
  const isAdminLike =
    currentUser?.role === "admin" || currentUser?.role === "super_admin";
  const [assignmentModal, setAssignmentModal] = useState(false);
  const [assignee, setAssignee] = useState("");
  const [expectedResolutionDate, setExpectedResolutionDate] = useState("");
  const [districtOfficers, setDistrictOfficers] = useState<ApiUser[]>([]);
  const [departments, setDepartments] = useState<ApiDepartment[]>([]);
  const [districtOfficersLoading, setDistrictOfficersLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

  const complaintDistrict = activeComplaint?.district;
  const complaintLocationId = activeComplaint?.locationId;
  const complaintLocationName = activeComplaint?.locationName;

  const eligibleDistrictOfficers = useMemo(() => {
    if (!complaintLocationId) return districtOfficers;
    return districtOfficers.filter((o) => o.locationId === complaintLocationId);
  }, [districtOfficers, complaintLocationId]);

  const complaintLocationLabel = useMemo(() => {
    return complaintLocationName ?? complaintDistrict ?? "";
  }, [complaintLocationName, complaintDistrict]);

  const clearAssignmentError = useCallback(() => {
    setAssignmentError(null);
  }, []);

  const fetchDistrictOfficers = useCallback(async () => {
    if (!token) return;
    if (!isAdminLike && currentUser?.role !== "district_officer")
      return;
    setDistrictOfficersLoading(true);
    try {
      const [officersResponse, departmentsResponse] = await Promise.all([
        getDistrictOfficers(token, complaintLocationId ?? undefined),
        getDepartments(token),
      ]);
      const availableDepartments = departmentsResponse.rows || [];
      setDepartments(availableDepartments);
      const departmentNames = new Map(
        availableDepartments.map((department) => [department.id, department.name])
      );
      setDistrictOfficers(
        (officersResponse.rows || []).map((officer) => ({
          ...officer,
          departmentName: officer.departmentId
            ? departmentNames.get(officer.departmentId) ?? null
            : null,
        }))
      );
    } catch (error) {
      console.error("Failed to load district officers:", error);
    } finally {
      setDistrictOfficersLoading(false);
    }
  }, [token, complaintLocationId, isAdminLike]);

  const handleOpenAssignmentModal = useCallback(() => {
    setAssignmentModal(true);
    setAssignmentError(null);
    setAssignee("");
    fetchDistrictOfficers();
  }, [fetchDistrictOfficers]);

  const handleAssign = useCallback(async () => {
    if (!token) {
      setAssignmentError("Session expired. Please sign in again.");
      return;
    }
    if (!activeComplaint) {
      setAssignmentError("No active complaint selected.");
      return;
    }
    if (!assignee) {
      setAssignmentError("Please select a district officer.");
      return;
    }

    const officer = districtOfficers.find((o) => o.id === assignee);
    if (complaintLocationId && officer?.locationId !== complaintLocationId) {
      setAssignmentError(
        `Please select a staff officer in ${complaintLocationLabel}.`
      );
      return;
    }
    if (!expectedResolutionDate) {
      setAssignmentError("Expected resolution date is required.");
      return;
    }

    setAssigning(true);
    setAssignmentError(null);
    try {
      const expectedDate = new Date(expectedResolutionDate).toISOString();
      const complaint = await assignComplaintApi(token, activeComplaint.id, {
        assignedToId: assignee,
        expectedResolutionDate: expectedDate,
      });
      onComplaintUpdate(complaint);
      const assignedOfficer = districtOfficers.find((o) => o.id === assignee);
      onSuccess(assignedOfficer?.fullName || assignee);
      setAssignmentModal(false);
      setAssignee("");
      setExpectedResolutionDate("");
      if (isAdminLike) {
        onStatsRefresh?.();
      }
    } catch (error) {
      console.error("Failed to assign complaint:", error);
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "string"
          ? error
          : "Failed to assign complaint";
      const normalized = message.toLowerCase().replace(/\s+/g, "");
      if (
        normalized.includes("expectedresolutiondate") &&
        (normalized.includes("shouldnotbeempty") ||
          normalized.includes("min") ||
          normalized.includes("minimalalloweddate"))
      ) {
        setAssignmentError(
          "Please set an expected resolution date (it must be in the future)."
        );
      } else {
        setAssignmentError(message);
      }
    } finally {
      setAssigning(false);
    }
  }, [
    token,
    activeComplaint,
    assignee,
    expectedResolutionDate,
    districtOfficers,
    complaintLocationId,
    complaintLocationLabel,
    isAdminLike,
    onComplaintUpdate,
    onSuccess,
    onStatsRefresh,
  ]);

  const closeAssignmentModal = useCallback(() => {
    setAssignmentModal(false);
    setAssignee("");
    setExpectedResolutionDate("");
    setAssignmentError(null);
  }, []);

  return {
    // State
    assignmentModal,
    assignee,
    expectedResolutionDate,
    districtOfficers,
    departments,
    eligibleDistrictOfficers,
    districtOfficersLoading,
    assigning,
    assignmentError,
    // Setters
    setAssignee,
    setExpectedResolutionDate,
    // Actions
    fetchDistrictOfficers,
    handleOpenAssignmentModal,
    handleAssign,
    closeAssignmentModal,
    clearAssignmentError,
  };
}

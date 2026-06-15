"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./hooks/useAuth";
import { useComplaints } from "./hooks/useComplaints";
import { useAssignment } from "./hooks/useAssignment";
import { useEscalation } from "./hooks/useEscalation";
import { useMonitoring } from "./hooks/useMonitoring";
import { DashboardNav } from "./components/DashboardNav";
import { CasesTab } from "./components/CasesTab";
import { DepartmentsTab } from "./components/DepartmentsTab";
import { LocationsTab } from "./components/LocationsTab";
import { MonitoringTab } from "./components/MonitoringTab";
import { StaffDashboardTab } from "./components/StaffDashboardTab";
import { CaseDetailsModal } from "./components/CaseDetailsModal";
import { NewCaseModal } from "./components/NewCaseModal";
import {
  createDepartment,
  createLocation,
  getDepartments,
  getLocations,
  updateDepartment,
  type ApiDepartment,
  type ApiLocation,
} from "@/lib/api";

export default function DashboardClient() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    token,
    currentUser,
    checkingAuth,
    handleLogout,
    isAdmin,
    isNavigator,
    isDistrictOfficer,
  } = useAuth();
  const isSuperAdmin = currentUser?.role === "super_admin";
  const adminBasePath = isSuperAdmin ? "/super-admin" : "/admin";

  const [activeTab, setActiveTab] = useState("cases");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [newCaseModal, setNewCaseModal] = useState(false);
  const [adminDistrict, setAdminDistrict] = useState("");
  const [hasInitializedLocationFilter, setHasInitializedLocationFilter] =
    useState(false);
  const [locationOptions, setLocationOptions] = useState<
    {
      value: string;
      label: string;
      type?: string;
      parentLocationId?: string | null;
    }[]
  >([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [creatingLocation, setCreatingLocation] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationType, setNewLocationType] = useState<
    "METRO_DISTRICT" | "TOWN"
  >("METRO_DISTRICT");
  const [newLocationParentId, setNewLocationParentId] = useState("");
  const [departments, setDepartments] = useState<ApiDepartment[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [departmentError, setDepartmentError] = useState<string | null>(null);
  const [creatingDepartment, setCreatingDepartment] = useState(false);
  const [updatingDepartmentId, setUpdatingDepartmentId] = useState<
    string | null
  >(null);
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [newDepartmentScope, setNewDepartmentScope] = useState<
    "DISTRICT" | "MUNICIPAL" | ""
  >("");

  const getTabFromPath = useCallback((path: string, admin: boolean) => {
    if (!admin) {
      if (path.endsWith("/dashboard")) return "staff_dashboard";
      return "cases";
    }
    if (path.endsWith("/dashboard")) return "monitoring";
    if (path.endsWith("/cases")) return "cases";
    if (path.endsWith("/locations")) return "locations";
    if (path.endsWith("/departments")) return "departments";
    return "monitoring";
  }, []);

  const loadLocations = useCallback(async () => {
    setLocationsLoading(true);
    try {
      const response = await getLocations();
      const options = (response.rows ?? []).map((location: ApiLocation) => ({
        value: location.id,
        label: location.name,
        type: location.type,
        parentLocationId: location.parentLocationId ?? null,
      }));
      setLocationOptions(options);
      setLocationError(null);
      if (!hasInitializedLocationFilter) {
        setAdminDistrict("");
        setHasInitializedLocationFilter(true);
      }
    } catch (error) {
      setLocationError(
        error instanceof Error ? error.message : "Failed to load locations"
      );
    } finally {
      setLocationsLoading(false);
    }
  }, [hasInitializedLocationFilter]);

  const loadDepartments = useCallback(async () => {
    if (!token || !isSuperAdmin) return;
    setDepartmentsLoading(true);
    try {
      const response = await getDepartments(token);
      setDepartments(response.rows ?? []);
      setDepartmentError(null);
    } catch (error) {
      setDepartmentError(
        error instanceof Error ? error.message : "Failed to load departments"
      );
    } finally {
      setDepartmentsLoading(false);
    }
  }, [token, isSuperAdmin]);

  const {
    monitoringMetrics,
    overdueComplaints,
    navigatorUpdates,
    navigators,
    refreshStats,
    refreshNavigatorUpdates,
    refreshOverdueComplaints,
    fetchNavigators,
  } = useMonitoring({ token, currentUser });

  const refreshStatsForAdmin = useCallback(() => {
    if (!token || !isAdmin) return;
    refreshStats(adminDistrict);
  }, [token, isAdmin, refreshStats, adminDistrict]);

  const {
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
    setComplaintForm,
    setStatusFilter,
    setLastAction,
    setComplaintStatus,
    // Pagination state
    complaintsPage,
    complaintsPageSize,
    complaintsTotal,
    setComplaintsPage,
    setComplaintsPageSize,
    refreshComplaints,
    handleComplaintSubmit,
    handleUpdateStatus,
    handleSelect,
    closeCaseDetailsModal,
    updateComplaintInList,
    resetComplaintForm,
    creatorLoadingIds,
    assignedLoadingIds,
  } = useComplaints({
    token,
    currentUser,
    onStatsRefresh: refreshStatsForAdmin,
    adminDistrict: isAdmin ? adminDistrict : undefined,
  });

  const handleCreateLocation = useCallback(async () => {
    if (!token || !newLocationName.trim()) return;
    if (newLocationType === "TOWN" && !newLocationParentId) {
      setLocationError("Select a metro/district before creating a town.");
      return;
    }
    setCreatingLocation(true);
    try {
      const created = await createLocation(token, {
        name: newLocationName.trim(),
        type: newLocationType,
        parentLocationId:
          newLocationType === "TOWN" ? newLocationParentId : undefined,
      });
      await loadLocations();
      if (created.type === "METRO_DISTRICT") {
        setAdminDistrict(created.id);
      }
      setNewLocationName("");
      setNewLocationType("METRO_DISTRICT");
      setNewLocationParentId("");
      setLocationError(null);
      if (created.type === "METRO_DISTRICT") {
        refreshStats(created.id);
        refreshNavigatorUpdates(created.id);
        refreshComplaints(created.id, 1, complaintsPageSize);
      }
    } catch (error) {
      setLocationError(
        error instanceof Error ? error.message : "Failed to create location"
      );
    } finally {
      setCreatingLocation(false);
    }
  }, [
    token,
    newLocationName,
    newLocationType,
    newLocationParentId,
    loadLocations,
    refreshStats,
    refreshNavigatorUpdates,
    refreshComplaints,
    complaintsPageSize,
  ]);

  const handleCreateDepartment = useCallback(async () => {
    if (!token || !newDepartmentName.trim()) return;
    setCreatingDepartment(true);
    try {
      const created = await createDepartment(token, {
        name: newDepartmentName.trim(),
        scope: newDepartmentScope || undefined,
      });
      setDepartments((prev) => [created, ...prev]);
      setNewDepartmentName("");
      setNewDepartmentScope("");
      setDepartmentError(null);
    } catch (error) {
      setDepartmentError(
        error instanceof Error ? error.message : "Failed to create department"
      );
    } finally {
      setCreatingDepartment(false);
    }
  }, [token, newDepartmentName, newDepartmentScope]);

  const handleUpdateDepartment = useCallback(
    async (
      departmentId: string,
      updates: {
        name?: string;
        scope?: "DISTRICT" | "MUNICIPAL";
        isActive?: boolean;
      }
    ) => {
      if (!token) return;
      setUpdatingDepartmentId(departmentId);
      try {
        const updated = await updateDepartment(token, departmentId, updates);
        setDepartments((prev) =>
          prev.map((department) =>
            department.id === departmentId ? updated : department
          )
        );
        setDepartmentError(null);
      } catch (error) {
        setDepartmentError(
          error instanceof Error ? error.message : "Failed to update department"
        );
      } finally {
        setUpdatingDepartmentId(null);
      }
    },
    [token]
  );

  const handleAssignSuccess = useCallback(
    (detail: string) => {
      setLastAction({ type: "assign", detail });
    },
    [setLastAction]
  );

  const handleEscalateSuccess = useCallback(
    (detail: string) => {
      setLastAction({ type: "escalate", detail });
    },
    [setLastAction]
  );

  const {
    assignmentModal,
    assignee,
    expectedResolutionDate,
    districtOfficers,
    eligibleDistrictOfficers,
    districtOfficersLoading,
    assigning,
    assignmentError,
    setAssignee,
    setExpectedResolutionDate,
    fetchDistrictOfficers,
    handleOpenAssignmentModal,
    handleAssign,
    closeAssignmentModal,
    clearAssignmentError,
  } = useAssignment({
    token,
    currentUser,
    activeComplaint,
    onComplaintUpdate: updateComplaintInList,
    onSuccess: handleAssignSuccess,
    onStatsRefresh: refreshStatsForAdmin,
  });

  const {
    escalationModal,
    targetAdmin,
    escalationReason,
    admins,
    adminsLoading,
    escalating,
    escalationError,
    setTargetAdmin,
    setEscalationReason,
    fetchAdmins,
    handleOpenEscalationModal,
    handleEscalate,
    closeEscalationModal,
    clearEscalationError,
  } = useEscalation({
    token,
    currentUser,
    activeComplaint,
    onComplaintUpdate: updateComplaintInList,
    onSuccess: handleEscalateSuccess,
    onStatsRefresh: refreshStatsForAdmin,
  });

  // Initial data loading
  useEffect(() => {
    if (!token) return;
    loadLocations();
    if (currentUser?.role === "district_officer") {
      refreshComplaints(undefined, 1, 200);
    } else {
      refreshComplaints();
    }
    if (isAdmin) {
      refreshStatsForAdmin();
      refreshNavigatorUpdates(adminDistrict);
      refreshOverdueComplaints();
      fetchNavigators();
      fetchDistrictOfficers();
      fetchAdmins();
    }
    if (isSuperAdmin) {
      loadDepartments();
    }
  }, [
    token,
    loadLocations,
    currentUser?.role,
    refreshComplaints,
    refreshNavigatorUpdates,
    refreshOverdueComplaints,
    fetchNavigators,
    fetchDistrictOfficers,
    fetchAdmins,
    refreshStatsForAdmin,
    adminDistrict,
    isAdmin,
    isSuperAdmin,
    loadDepartments,
  ]);

  useEffect(() => {
    if (!currentUser) return;
    const resolvedTab = getTabFromPath(pathname, isAdmin);
    setActiveTab(resolvedTab);
  }, [pathname, isAdmin, currentUser, getTabFromPath]);

  useEffect(() => {
    if (pathname !== "/dashboard") return;
    if (currentUser?.role === "super_admin") {
      router.replace("/super-admin/dashboard");
      return;
    }
    if (currentUser?.role === "admin") {
      router.replace("/admin/dashboard");
      return;
    }
    if (currentUser?.role === "district_officer") {
      router.replace("/staff-officer/dashboard");
      return;
    }
    if (currentUser?.role === "navigator") {
      router.replace("/field-agent/cases");
    }
  }, [currentUser, pathname, router]);

  const handleTabChange = useCallback(
    (tab: string) => {
      setActiveTab(tab);
      const routeMap: Record<string, string> = isAdmin
        ? {
            monitoring: `${adminBasePath}/dashboard`,
            cases: `${adminBasePath}/cases`,
            locations: `${adminBasePath}/locations`,
            departments: `${adminBasePath}/departments`,
          }
        : currentUser?.role === "district_officer"
        ? {
            staff_dashboard: "/staff-officer/dashboard",
            cases: "/staff-officer/cases",
          }
        : {
            cases: "/field-agent/cases",
          };
      const nextRoute = routeMap[tab];
      if (nextRoute && pathname !== nextRoute) {
        router.push(nextRoute);
      }
    },
    [isAdmin, adminBasePath, currentUser?.role, pathname, router]
  );

  // Refresh monitoring data when tab changes to monitoring
  useEffect(() => {
    if (activeTab === "monitoring" && token && isAdmin) {
      refreshStatsForAdmin();
      refreshNavigatorUpdates(adminDistrict);
      refreshOverdueComplaints();
    }
  }, [
    activeTab,
    token,
    isAdmin,
    refreshStatsForAdmin,
    refreshNavigatorUpdates,
    refreshOverdueComplaints,
    adminDistrict,
  ]);

  // Handle closing case details modal - also close assignment/escalation modals
  const handleCloseCaseDetailsModal = useCallback(() => {
    closeCaseDetailsModal();
    closeAssignmentModal();
    closeEscalationModal();
  }, [closeCaseDetailsModal, closeAssignmentModal, closeEscalationModal]);

  const handleAdminDistrictChange = useCallback(
    (district: string) => {
      setAdminDistrict(district);
      handleCloseCaseDetailsModal();
      if (isAdmin) {
        refreshStats(district);
        refreshNavigatorUpdates(district);
        // Reset to page 1 when changing district
        refreshComplaints(district, 1, complaintsPageSize);
      }
    },
    [
      handleCloseCaseDetailsModal,
      isAdmin,
      refreshStats,
      refreshNavigatorUpdates,
      refreshComplaints,
      complaintsPageSize,
    ]
  );

  // Handle case selection - also close assignment/escalation modals
  const handleCaseSelect = useCallback(
    (id: string) => {
      handleSelect(id);
      closeAssignmentModal();
      closeEscalationModal();
    },
    [handleSelect, closeAssignmentModal, closeEscalationModal]
  );

  // Handle new case modal close
  const handleCloseNewCaseModal = useCallback(() => {
    setNewCaseModal(false);
    resetComplaintForm();
  }, [resetComplaintForm]);

  // Handle complaint submit with modal close on success
  const handleComplaintSubmitWithClose = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      const result = await handleComplaintSubmit(event);
      if (result) {
        // Close modal after 2 seconds on success
        setTimeout(() => {
          setNewCaseModal(false);
          setComplaintStatus(null);
        }, 2000);
      }
    },
    [handleComplaintSubmit, setComplaintStatus]
  );

  // Handle pagination changes - fetch new page from server
  const handlePageChange = useCallback(
    (newPage: number) => {
      setComplaintsPage(newPage);
      const district = isAdmin ? adminDistrict : undefined;
      refreshComplaints(district, newPage, complaintsPageSize);
    },
    [
      isAdmin,
      adminDistrict,
      complaintsPageSize,
      refreshComplaints,
      setComplaintsPage,
    ]
  );

  const handlePageSizeChange = useCallback(
    (newPageSize: number) => {
      setComplaintsPageSize(newPageSize);
      const district = isAdmin ? adminDistrict : undefined;
      // Reset to page 1 when changing page size
      refreshComplaints(district, 1, newPageSize);
    },
    [isAdmin, adminDistrict, refreshComplaints, setComplaintsPageSize]
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "cases":
        // Server already filters by district for admin, no client-side filter needed
        return (
          <CasesTab
            isAdmin={isAdmin}
            isDistrictOfficer={isDistrictOfficer}
            escalatedToMe={escalatedToMe}
            filteredComplaints={filteredComplaints}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            selectedCase={selectedCase}
            statusUpdatingId={statusUpdatingId}
            onSelect={handleCaseSelect}
            onUpdateStatus={handleUpdateStatus}
            adminDistrict={adminDistrict}
            onAdminDistrictChange={handleAdminDistrictChange}
            locationOptions={locationOptions}
            complaintsPage={complaintsPage}
            complaintsPageSize={complaintsPageSize}
            complaintsTotal={complaintsTotal}
            complaintsLoading={complaintsLoading}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        );

      case "locations":
        return isAdmin ? (
          <LocationsTab
            locationOptions={locationOptions}
            locationsLoading={locationsLoading}
            creatingLocation={creatingLocation}
            newLocationName={newLocationName}
            newLocationType={newLocationType}
            newLocationParentId={newLocationParentId}
            onNewLocationNameChange={setNewLocationName}
            onNewLocationTypeChange={setNewLocationType}
            onNewLocationParentIdChange={setNewLocationParentId}
            onCreateLocation={handleCreateLocation}
          />
        ) : null;

      case "departments":
        return isSuperAdmin ? (
          <DepartmentsTab
            departments={departments}
            departmentsLoading={departmentsLoading}
            creatingDepartment={creatingDepartment}
            updatingDepartmentId={updatingDepartmentId}
            newDepartmentName={newDepartmentName}
            newDepartmentScope={newDepartmentScope}
            onNewDepartmentNameChange={setNewDepartmentName}
            onNewDepartmentScopeChange={setNewDepartmentScope}
            onCreateDepartment={handleCreateDepartment}
            onUpdateDepartment={handleUpdateDepartment}
          />
        ) : null;

      case "monitoring":
        return (
          <MonitoringTab
            token={token!}
            monitoringMetrics={monitoringMetrics}
            overdueComplaints={overdueComplaints}
            navigatorUpdates={navigatorUpdates}
            isAdmin={isAdmin}
            adminDistrict={adminDistrict}
            onAdminDistrictChange={handleAdminDistrictChange}
            locationOptions={locationOptions}
          />
        );

      case "staff_dashboard":
        return <StaffDashboardTab complaints={liveComplaints} currentUser={currentUser!} />;
      default:
        return null;
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-600">Checking session…</p>
      </div>
    );
  }

  if (!token || !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-600">Redirecting to sign in…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <DashboardNav
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        isAdmin={isAdmin}
        isSuperAdmin={isSuperAdmin}
        isNavigator={isNavigator}
        isDistrictOfficer={isDistrictOfficer}
        onNewCase={() => setNewCaseModal(true)}
        profileMenuOpen={profileMenuOpen}
        setProfileMenuOpen={setProfileMenuOpen}
        onRefresh={refreshComplaints}
        onLogout={handleLogout}
        isLoading={complaintsLoading}
      />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">{renderTabContent()}</main>
      {locationError && (
        <div className="mx-auto mb-4 max-w-7xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {locationError}
        </div>
      )}
      {departmentError && (
        <div className="mx-auto mb-4 max-w-7xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {departmentError}
        </div>
      )}

      {/* New Case Modal */}
      {newCaseModal && (
        <NewCaseModal
          complaintForm={complaintForm}
          setComplaintForm={setComplaintForm}
          complaintSubmitting={complaintSubmitting}
          complaintStatus={complaintStatus}
          complaintsError={complaintsError}
          locationOptions={locationOptions}
          isLocationLocked={currentUser.role === "navigator"}
          showAnonymousToggle={currentUser.role === "navigator"}
          onSubmit={handleComplaintSubmitWithClose}
          onClose={handleCloseNewCaseModal}
        />
      )}

      {/* Case Details Modal */}
      {selectedCase && activeComplaint && (
        <CaseDetailsModal
          activeComplaint={activeComplaint}
          currentUser={currentUser}
          isAdmin={isAdmin}
          isDistrictOfficer={isDistrictOfficer}
          districtOfficers={districtOfficers}
          navigators={navigators}
          admins={admins}
          assignmentModal={assignmentModal}
          assignee={assignee}
          expectedResolutionDate={expectedResolutionDate}
          eligibleDistrictOfficers={eligibleDistrictOfficers}
          districtOfficersLoading={districtOfficersLoading}
          assigning={assigning}
          assignmentError={assignmentError}
          escalationModal={escalationModal}
          targetAdmin={targetAdmin}
          escalationReason={escalationReason}
          adminsLoading={adminsLoading}
          escalating={escalating}
          escalationError={escalationError}
          creatorLoadingIds={creatorLoadingIds}
          assignedLoadingIds={assignedLoadingIds}
          lastAction={lastAction}
          statusUpdateFeedback={statusUpdateFeedback}
          statusUpdatingId={statusUpdatingId}
          onClose={handleCloseCaseDetailsModal}
          onOpenAssignmentModal={handleOpenAssignmentModal}
          onOpenEscalationModal={handleOpenEscalationModal}
          onCloseAssignmentModal={closeAssignmentModal}
          onCloseEscalationModal={closeEscalationModal}
          onSetAssignee={setAssignee}
          onSetExpectedResolutionDate={setExpectedResolutionDate}
          onAssign={handleAssign}
          onClearAssignmentError={clearAssignmentError}
          onSetTargetAdmin={setTargetAdmin}
          onSetEscalationReason={setEscalationReason}
          onEscalate={handleEscalate}
          onClearEscalationError={clearEscalationError}
          onRefreshAdmins={fetchAdmins}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  );
}

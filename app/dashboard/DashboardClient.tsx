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
import { LocationsTab } from "./components/LocationsTab";
import { MonitoringTab } from "./components/MonitoringTab";
import { UssdTab } from "./components/UssdTab";
import { CaseDetailsModal } from "./components/CaseDetailsModal";
import { NewCaseModal } from "./components/NewCaseModal";
import { AssignmentModal } from "./components/AssignmentModal";
import { EscalationModal } from "./components/EscalationModal";
import { createLocation, getLocations, type ApiLocation } from "@/lib/api";

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

  const [activeTab, setActiveTab] = useState("cases");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [newCaseModal, setNewCaseModal] = useState(false);
  const [adminDistrict, setAdminDistrict] = useState("");
  const [locationOptions, setLocationOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [creatingLocation, setCreatingLocation] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationRegion, setNewLocationRegion] = useState("");

  const getTabFromPath = useCallback((path: string, admin: boolean) => {
    if (!admin) {
      if (path.endsWith("/ussd")) return "ussd";
      return "cases";
    }
    if (path === "/admin/dashboard") return "monitoring";
    if (path === "/admin/cases") return "cases";
    if (path === "/admin/locations") return "locations";
    if (path === "/admin/ussd") return "ussd";
    return "monitoring";
  }, []);

  const loadLocations = useCallback(async () => {
    try {
      const response = await getLocations();
      const options = (response.rows ?? []).map((location: ApiLocation) => ({
        value: location.id,
        label: location.name,
      }));
      setLocationOptions(options);
      setLocationError(null);
      if (options.length > 0 && !adminDistrict) {
        setAdminDistrict(options[0].value);
      }
    } catch (error) {
      setLocationError(
        error instanceof Error ? error.message : "Failed to load locations"
      );
    }
  }, [adminDistrict]);

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
    if (!token || currentUser?.role !== "admin") return;
    refreshStats(adminDistrict);
  }, [token, currentUser?.role, refreshStats, adminDistrict]);

  const {
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
    setCreatingLocation(true);
    try {
      const created = await createLocation(token, {
        name: newLocationName.trim(),
        region: newLocationRegion.trim() || undefined,
      });
      await loadLocations();
      setAdminDistrict(created.id);
      setNewLocationName("");
      setNewLocationRegion("");
      setLocationError(null);
      refreshStats(created.id);
      refreshNavigatorUpdates(created.id);
      refreshComplaints(created.id, 1, complaintsPageSize);
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
    newLocationRegion,
    loadLocations,
    refreshStats,
    refreshNavigatorUpdates,
    refreshComplaints,
    complaintsPageSize,
  ]);

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
    refreshComplaints();
    if (currentUser?.role === "admin") {
      refreshStatsForAdmin();
      refreshNavigatorUpdates(adminDistrict);
      refreshOverdueComplaints();
      fetchNavigators();
      fetchDistrictOfficers();
      fetchAdmins();
    }
  }, [
    token,
    loadLocations,
    currentUser?.role,
    refreshComplaints,
    refreshStats,
    refreshNavigatorUpdates,
    refreshOverdueComplaints,
    fetchNavigators,
    fetchDistrictOfficers,
    fetchAdmins,
    refreshStatsForAdmin,
    adminDistrict,
  ]);

  useEffect(() => {
    if (!currentUser) return;
    const resolvedTab = getTabFromPath(pathname, currentUser.role === "admin");
    setActiveTab(resolvedTab);
  }, [pathname, currentUser, getTabFromPath]);

  useEffect(() => {
    if (pathname !== "/dashboard") return;
    if (currentUser?.role === "admin") {
      router.replace("/admin/dashboard");
      return;
    }
    if (currentUser?.role === "district_officer") {
      router.replace("/staff-officer/cases");
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
            monitoring: "/admin/dashboard",
            cases: "/admin/cases",
            locations: "/admin/locations",
            ussd: "/admin/ussd",
          }
        : currentUser?.role === "district_officer"
        ? {
            cases: "/staff-officer/cases",
            ussd: "/staff-officer/ussd",
          }
        : {
            cases: "/field-agent/cases",
            ussd: "/field-agent/ussd",
          };
      const nextRoute = routeMap[tab];
      if (nextRoute && pathname !== nextRoute) {
        router.push(nextRoute);
      }
    },
    [isAdmin, currentUser?.role, pathname, router]
  );

  // Refresh monitoring data when tab changes to monitoring
  useEffect(() => {
    if (activeTab === "monitoring" && token && currentUser?.role === "admin") {
      refreshStatsForAdmin();
      refreshNavigatorUpdates(adminDistrict);
      refreshOverdueComplaints();
    }
  }, [
    activeTab,
    token,
    currentUser?.role,
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
      if (currentUser?.role === "admin") {
        refreshStats(district);
        refreshNavigatorUpdates(district);
        // Reset to page 1 when changing district
        refreshComplaints(district, 1, complaintsPageSize);
      }
    },
    [
      handleCloseCaseDetailsModal,
      currentUser?.role,
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
            creatingLocation={creatingLocation}
            newLocationName={newLocationName}
            newLocationRegion={newLocationRegion}
            onNewLocationNameChange={setNewLocationName}
            onNewLocationRegionChange={setNewLocationRegion}
            onCreateLocation={handleCreateLocation}
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

      case "ussd":
        return <UssdTab />;

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

      {/* New Case Modal */}
      {newCaseModal && (
        <NewCaseModal
          complaintForm={complaintForm}
          setComplaintForm={setComplaintForm}
          complaintSubmitting={complaintSubmitting}
          complaintStatus={complaintStatus}
          complaintsError={complaintsError}
          locationOptions={locationOptions}
          onSubmit={handleComplaintSubmitWithClose}
          onClose={handleCloseNewCaseModal}
        />
      )}

      {/* Assignment Modal */}
      {assignmentModal && (
        <AssignmentModal
          assignee={assignee}
          setAssignee={setAssignee}
          expectedResolutionDate={expectedResolutionDate}
          setExpectedResolutionDate={setExpectedResolutionDate}
          districtOfficers={eligibleDistrictOfficers}
          districtOfficersLoading={districtOfficersLoading}
          assigning={assigning}
          errorMessage={assignmentError}
          onClearError={clearAssignmentError}
          onAssign={handleAssign}
          onClose={closeAssignmentModal}
        />
      )}

      {/* Escalation Modal */}
      {escalationModal && (
        <EscalationModal
          targetAdmin={targetAdmin}
          setTargetAdmin={setTargetAdmin}
          escalationReason={escalationReason}
          setEscalationReason={setEscalationReason}
          admins={admins}
          adminsLoading={adminsLoading}
          escalating={escalating}
          errorMessage={escalationError}
          onClearError={clearEscalationError}
          onEscalate={handleEscalate}
          onRefreshAdmins={fetchAdmins}
          onClose={closeEscalationModal}
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
          creatorLoadingIds={creatorLoadingIds}
          assignedLoadingIds={assignedLoadingIds}
          lastAction={lastAction}
          statusUpdateFeedback={statusUpdateFeedback}
          statusUpdatingId={statusUpdatingId}
          onClose={handleCloseCaseDetailsModal}
          onOpenAssignmentModal={handleOpenAssignmentModal}
          onOpenEscalationModal={handleOpenEscalationModal}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  );
}

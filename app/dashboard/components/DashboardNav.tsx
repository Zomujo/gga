"use client";

import type { ApiUser } from "@/lib/api";
import { tabs } from "../utils/constants";
import { ProfileMenu } from "./ProfileMenu";

interface DashboardNavProps {
  currentUser: ApiUser;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdmin: boolean;
  isNavigator: boolean;
  isDistrictOfficer: boolean;
  onNewCase: () => void;
  profileMenuOpen: boolean;
  setProfileMenuOpen: (open: boolean) => void;
  onRefresh: () => void;
  onLogout: () => void;
  isLoading: boolean;
}

export function DashboardNav({
  currentUser,
  activeTab,
  setActiveTab,
  isAdmin,
  isNavigator,
  isDistrictOfficer,
  onNewCase,
  profileMenuOpen,
  setProfileMenuOpen,
  onRefresh,
  onLogout,
  isLoading,
}: DashboardNavProps) {
  const visibleTabs = isAdmin
    ? tabs.filter((t) => t.id !== "staff_dashboard")
    : isDistrictOfficer
    ? tabs.filter((t) => t.id === "staff_dashboard" || t.id === "cases" || t.id === "ussd")
    : tabs.filter((t) => t.id === "cases" || t.id === "ussd");

  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-auto items-center justify-center overflow-hidden">
                <img
                  src={encodeURI("/GGA-logo-Full-Colour-Pantone.png")}
                  alt="Good Governance Africa"
                  className="h-full w-auto object-contain"
                />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold text-gray-900 sm:text-xl">
                  GGA Governance
                </h1>
                <p className="truncate text-xs text-gray-600 sm:text-sm">Service Delivery Portal</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 sm:justify-end sm:gap-4">
            {(isAdmin || isNavigator) && !isDistrictOfficer && (
              <button
                onClick={onNewCase}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 sm:px-4"
              >
                + New Case
              </button>
            )}
            <ProfileMenu
              currentUser={currentUser}
              profileMenuOpen={profileMenuOpen}
              setProfileMenuOpen={setProfileMenuOpen}
              onRefresh={onRefresh}
              onLogout={onLogout}
              isLoading={isLoading}
            />
          </div>
        </div>

        {(isAdmin || isNavigator || isDistrictOfficer) && (
          <div className="-mx-1 overflow-x-auto lg:mx-0">
            <div className="mx-auto flex w-max min-w-max gap-2 rounded-lg bg-gray-100 p-1">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`shrink-0 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors sm:px-4 ${
                    activeTab === tab.id
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <span className="sm:hidden">{tab.mobileLabel ?? tab.label}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

"use client";

import type { ApiUser } from "@/lib/api";
import { tabs } from "../utils/constants";
import { ProfileMenu } from "./ProfileMenu";

interface DashboardNavProps {
  currentUser: ApiUser;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isNavigator: boolean;
  isDistrictOfficer: boolean;
  districtOptions?: { value: string; label: string }[];
  selectedDistrict?: string;
  onDistrictChange?: (district: string) => void;
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
  isSuperAdmin,
  isNavigator,
  isDistrictOfficer,
  districtOptions = [],
  selectedDistrict,
  onDistrictChange,
  onNewCase,
  profileMenuOpen,
  setProfileMenuOpen,
  onRefresh,
  onLogout,
  isLoading,
}: DashboardNavProps) {
  const visibleTabs = isAdmin
    ? tabs.filter((t) =>
        isSuperAdmin
          ? t.id !== "staff_dashboard"
          : t.id !== "staff_dashboard" && t.id !== "departments"
      )
    : isDistrictOfficer
    ? tabs.filter((t) => t.id === "staff_dashboard" || t.id === "cases")
    : tabs.filter((t) => t.id === "cases");

  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-4">
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
          <div className="ml-auto flex shrink-0 items-center gap-3 sm:gap-4">
            {isSuperAdmin && districtOptions.length > 0 && onDistrictChange && (
              <label className="hidden items-center gap-2 sm:flex">
                <span className="text-xs font-medium text-gray-600">
                  District
                </span>
                <select
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  value={selectedDistrict || ""}
                  onChange={(e) => onDistrictChange(e.target.value)}
                >
                  {districtOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {(isAdmin || isNavigator) && !isDistrictOfficer && (
              <div className="hidden h-10 w-auto items-center justify-center overflow-hidden sm:flex">
                <button
                  onClick={onNewCase}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 sm:px-4"
                >
                  + New Report
                </button>
              </div>
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

        {(isAdmin || isNavigator) && !isDistrictOfficer && (
          <div className="space-y-3 sm:hidden">
            {isSuperAdmin && districtOptions.length > 0 && onDistrictChange && (
              <label className="block">
                <span className="sr-only">District</span>
                <select
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  value={selectedDistrict || ""}
                  onChange={(e) => onDistrictChange(e.target.value)}
                >
                  {districtOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <button
              onClick={onNewCase}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              + New Report
            </button>
          </div>
        )}

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

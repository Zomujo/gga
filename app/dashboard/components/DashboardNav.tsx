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
    ? tabs
    : isDistrictOfficer
    ? tabs.filter((t) => t.id === "staff_dashboard" || t.id === "cases" || t.id === "ussd")
    : tabs.filter((t) => t.id === "cases" || t.id === "ussd");

  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-auto items-center justify-center overflow-hidden">
              <img
                src={encodeURI("/GGA-logo-Full-Colour-Pantone.png")}
                alt="Good Governance Africa"
                className="h-full w-auto object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                GGA Governance
              </h1>
              <p className="text-sm text-gray-600">Service Delivery Portal</p>
            </div>
          </div>
          {(isAdmin || isNavigator || isDistrictOfficer) && (
            <div className="flex rounded-lg bg-gray-100 p-1">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          {(isAdmin || isNavigator) && !isDistrictOfficer && (
            <button
              onClick={onNewCase}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
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
    </nav>
  );
}

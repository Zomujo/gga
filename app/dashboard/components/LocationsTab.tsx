"use client";

import { useState } from "react";

interface LocationOption {
  value: string;
  label: string;
  type?: string;
  parentLocationId?: string | null;
}

interface LocationsTabProps {
  locationOptions: LocationOption[];
  locationsLoading: boolean;
  creatingLocation: boolean;
  newLocationName: string;
  newLocationType: "METRO_DISTRICT" | "TOWN";
  newLocationParentId: string;
  onNewLocationNameChange: (value: string) => void;
  onNewLocationTypeChange: (value: "METRO_DISTRICT" | "TOWN") => void;
  onNewLocationParentIdChange: (value: string) => void;
  onCreateLocation: () => void;
}

export function LocationsTab({
  locationOptions,
  locationsLoading,
  creatingLocation,
  newLocationName,
  newLocationType,
  newLocationParentId,
  onNewLocationNameChange,
  onNewLocationTypeChange,
  onNewLocationParentIdChange,
  onCreateLocation,
}: LocationsTabProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const metroDistricts = locationOptions.filter(
    (location) => location.type === "METRO_DISTRICT",
  );

  const townsByParent = metroDistricts.map((metroDistrict) => ({
    ...metroDistrict,
    towns: locationOptions.filter(
      (location) =>
        location.type === "TOWN" &&
        location.parentLocationId === metroDistrict.value,
    ),
  }));

  const locationCountLabel = `${metroDistricts.length} metro/district${
    metroDistricts.length === 1 ? "" : "s"
  } and ${
    locationOptions.filter((location) => location.type === "TOWN").length
  } town${
    locationOptions.filter((location) => location.type === "TOWN").length === 1
      ? ""
      : "s"
  } configured`;

  const canCreateLocation =
    !creatingLocation &&
    !!newLocationName.trim() &&
    (newLocationType !== "TOWN" || !!newLocationParentId);

  const handleCreateAndClose = () => {
    onCreateLocation();
    if (canCreateLocation) {
      setCreateModalOpen(false);
    }
  };

  const renderCreateForm = () => (
    <div className="mt-5 space-y-4">
      <label className="block space-y-1">
        <span className="text-sm font-medium text-gray-700">Location type</span>
        <select
          value={newLocationType}
          onChange={(e) =>
            onNewLocationTypeChange(e.target.value as "METRO_DISTRICT" | "TOWN")
          }
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#7a5a3b] focus:outline-none"
        >
          <option value="METRO_DISTRICT">Metro / District</option>
          <option value="TOWN">Town</option>
        </select>
      </label>

      {newLocationType === "TOWN" && (
        <label className="block space-y-1">
          <span className="text-sm font-medium text-gray-700">
            Parent metro / district
          </span>
          <select
            value={newLocationParentId}
            onChange={(e) => onNewLocationParentIdChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#7a5a3b] focus:outline-none"
          >
            <option value="">Select parent district</option>
            {metroDistricts.map((metroDistrict) => (
              <option key={metroDistrict.value} value={metroDistrict.value}>
                {metroDistrict.label}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="block space-y-1">
        <span className="text-sm font-medium text-gray-700">
          {newLocationType === "TOWN" ? "Town name" : "Metro / district name"}
        </span>
        <input
          type="text"
          placeholder={
            newLocationType === "TOWN" ? "e.g., Pepease" : "e.g., Sekyerekumawu"
          }
          value={newLocationName}
          onChange={(e) => onNewLocationNameChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#7a5a3b] focus:outline-none"
        />
      </label>

      <button
        type="button"
        onClick={handleCreateAndClose}
        disabled={!canCreateLocation}
        className="w-full rounded-lg bg-[#7a5a3b] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#62482f] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {creatingLocation ? "Creating location..." : "Create location"}
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Locations</h2>
        <p className="mt-1 text-gray-600">
          Manage metro/district parents and the towns under each one.
        </p>
        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="mt-4 w-full rounded-lg bg-[#7a5a3b] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#62482f] lg:hidden"
        >
          + Create location
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="mt-1 text-sm text-gray-600">{locationCountLabel}</p>

          <div className="mt-4 max-h-[32rem] space-y-4 overflow-auto pr-1">
            {locationsLoading ? (
              <div className="flex items-center gap-3 rounded-lg border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[#7a5a3b]" />
                <span>Loading locations...</span>
              </div>
            ) : townsByParent.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500">
                No locations yet. Create your first metro/district.
              </p>
            ) : (
              townsByParent.map((metroDistrict) => (
                <div
                  key={metroDistrict.value}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                >
                  <div>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium text-gray-500">
                        District:
                      </span>{" "}
                      <span className="font-semibold text-gray-900">
                        {metroDistrict.label}
                      </span>
                    </p>
                    <p className="mt-4 text-xs uppercase tracking-wide text-gray-500">
                      Towns / Communities
                    </p>
                  </div>

                  <div className="mt-4 space-y-2">
                    {metroDistrict.towns.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-gray-300 bg-white px-3 py-3 text-sm text-gray-500">
                        No towns added under this district yet.
                      </p>
                    ) : (
                      metroDistrict.towns.map((town) => (
                        <div
                          key={town.value}
                          className="rounded-lg border border-gray-200 bg-white px-3 py-3"
                        >
                          <p className="font-medium text-gray-900">
                            {town.label}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">Town</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:block">
          <h3 className="text-base font-semibold text-gray-900">
            Create Location
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Add either a parent metro/district or a town under an existing one.
          </p>
          {renderCreateForm()}
        </div>
      </div>

      {createModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 lg:hidden"
          onClick={() => setCreateModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Create Location
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Add a new metro/district or town.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
              >
                Close
              </button>
            </div>
            {renderCreateForm()}
          </div>
        </div>
      )}
    </div>
  );
}

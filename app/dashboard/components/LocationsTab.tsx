"use client";

interface LocationOption {
  value: string;
  label: string;
}

interface LocationsTabProps {
  locationOptions: LocationOption[];
  creatingLocation: boolean;
  newLocationName: string;
  newLocationRegion: string;
  onNewLocationNameChange: (value: string) => void;
  onNewLocationRegionChange: (value: string) => void;
  onCreateLocation: () => void;
}

export function LocationsTab({
  locationOptions,
  creatingLocation,
  newLocationName,
  newLocationRegion,
  onNewLocationNameChange,
  onNewLocationRegionChange,
  onCreateLocation,
}: LocationsTabProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Locations</h2>
        <p className="mt-1 text-gray-600">
          Manage service locations used across complaints, analytics, and assignment.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900">Existing Locations</h3>
          <p className="mt-1 text-sm text-gray-600">
            {locationOptions.length} location{locationOptions.length === 1 ? "" : "s"} configured
          </p>

          <div className="mt-4 max-h-[28rem] space-y-2 overflow-auto pr-1">
            {locationOptions.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500">
                No locations yet. Create your first location.
              </p>
            ) : (
              locationOptions.map((location) => (
                <div
                  key={location.value}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
                >
                  <p className="font-medium text-gray-900">{location.label}</p>
                  <p className="mt-1 text-xs text-gray-500">ID: {location.value}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900">Create Location</h3>
          <p className="mt-1 text-sm text-gray-600">
            Add a new location for intake and reporting.
          </p>

          <div className="mt-5 space-y-4">
            <label className="block space-y-1">
              <span className="text-sm font-medium text-gray-700">Location name</span>
              <input
                type="text"
                placeholder="e.g., East District"
                value={newLocationName}
                onChange={(e) => onNewLocationNameChange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-gray-700">Region (optional)</span>
              <input
                type="text"
                placeholder="e.g., Greater Accra"
                value={newLocationRegion}
                onChange={(e) => onNewLocationRegionChange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </label>

            <button
              type="button"
              onClick={onCreateLocation}
              disabled={creatingLocation || !newLocationName.trim()}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creatingLocation ? "Creating location..." : "Create location"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

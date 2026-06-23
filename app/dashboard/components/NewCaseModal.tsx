"use client";

import { FormEvent, useState } from "react";
import type { ComplaintFormState } from "../hooks/useComplaints";
import { categoryOptions } from "../utils/constants";

interface LocationOption {
  value: string;
  label: string;
  parentLocationId?: string | null;
}

interface NewCaseModalProps {
  complaintForm: ComplaintFormState;
  setComplaintForm: React.Dispatch<React.SetStateAction<ComplaintFormState>>;
  complaintSubmitting: boolean;
  complaintStatus: string | null;
  complaintsError: string | null;
  locationOptions: LocationOption[];
  isLocationLocked?: boolean;
  showAnonymousToggle?: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}

export function NewCaseModal({
  complaintForm,
  setComplaintForm,
  complaintSubmitting,
  complaintStatus,
  complaintsError,
  locationOptions,
  isLocationLocked = false,
  showAnonymousToggle = false,
  onSubmit,
  onClose,
}: NewCaseModalProps) {
  const [pickerOpen, setPickerOpen] = useState<"location" | "category" | null>(
    null
  );

  const selectedLocationLabel =
    locationOptions.find((opt) => opt.value === complaintForm.district)?.label ??
    "Choose location";
  const selectedLocation = locationOptions.find(
    (opt) => opt.value === complaintForm.district
  );
  const selectedMetroDistrictLabel =
    locationOptions.find(
      (opt) => opt.value === selectedLocation?.parentLocationId
    )?.label ?? "";
  const selectedCategoryLabel =
    categoryOptions.find((opt) => opt.value === complaintForm.category)?.label ??
    "Choose category";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Make a Report
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-3 rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900">Contact Information</h3>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-gray-700">
                Phone Number *
              </span>
              <input
                type="tel"
                required
                placeholder="+233551234567"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#7a5a3b] focus:outline-none"
                value={complaintForm.phoneNumber ?? ""}
                onChange={(e) =>
                  setComplaintForm((prev) => ({
                    ...prev,
                    phoneNumber: e.target.value,
                  }))
                }
              />
            </label>

            {showAnonymousToggle && (
              <label className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3">
                <input
                  type="checkbox"
                  checked={Boolean(complaintForm.isAnonymous)}
                  onChange={(e) =>
                    setComplaintForm((prev) => ({
                      ...prev,
                      isAnonymous: e.target.checked,
                    }))
                  }
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#7a5a3b] focus:ring-[#7a5a3b]"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Report anonymously
                  </p>
                  <p className="text-xs text-gray-500">
                    Hide your personal details from the case in the normal
                    workflow.
                  </p>
                </div>
              </label>
            )}
          </div>

          {/* Complaint Details */}
          <div className="space-y-3 rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900">Report Details</h3>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-700">
                  Location *
                </span>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg border border-gray-300 px-3 py-2 text-left text-sm focus:border-[#7a5a3b] focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 sm:hidden"
                  onClick={() => {
                    if (!isLocationLocked) setPickerOpen("location");
                  }}
                  disabled={isLocationLocked}
                >
                  <span className="truncate">
                    {complaintForm.district ? selectedLocationLabel : "Choose location"}
                  </span>
                  <span className="text-gray-400">{isLocationLocked ? "" : "▾"}</span>
                </button>
                <select
                  required
                  className="hidden w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#7a5a3b] focus:outline-none disabled:bg-gray-50 disabled:text-gray-500 sm:block"
                  value={complaintForm.district ?? ""}
                  onChange={(e) =>
                    setComplaintForm((prev) => ({
                      ...prev,
                      district: e.target.value,
                    }))
                  }
                  disabled={isLocationLocked}
                >
                  <option value="">Choose location</option>
                  {locationOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {isLocationLocked && (
                  <div className="space-y-1 text-xs text-gray-500">
                    <p>Your assigned town is used automatically for reports.</p>
                    {selectedMetroDistrictLabel && (
                      <p>District: {selectedMetroDistrictLabel}</p>
                    )}
                  </div>
                )}
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-700">
                  Category *
                </span>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg border border-gray-300 px-3 py-2 text-left text-sm focus:border-[#7a5a3b] focus:outline-none sm:hidden"
                  onClick={() => setPickerOpen("category")}
                >
                  <span className="truncate">{selectedCategoryLabel}</span>
                  <span className="text-gray-400">▾</span>
                </button>
                <select
                  required
                  className="hidden w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#7a5a3b] focus:outline-none sm:block"
                  value={complaintForm.category ?? ""}
                  onChange={(e) =>
                    setComplaintForm((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                >
                  <option value="">Choose category</option>
                  {categoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {complaintForm.category === "other" && (
              <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-700">
                  Specify Other Category *
                </span>
                <input
                  type="text"
                  required
                  placeholder="Please specify the category"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#7a5a3b] focus:outline-none"
                  value={complaintForm.otherCategory ?? ""}
                  onChange={(e) =>
                    setComplaintForm((prev) => ({
                      ...prev,
                      otherCategory: e.target.value,
                    }))
                  }
                />
              </label>
            )}

            <label className="block space-y-1">
              <span className="text-sm font-medium text-gray-700">
                Description
              </span>
              <textarea
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#7a5a3b] focus:outline-none"
                rows={3}
                value={complaintForm.description ?? ""}
                onChange={(e) =>
                  setComplaintForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </label>
          </div>

          {complaintStatus && (
            <p className="rounded-lg border border-[#d7c8ab] bg-[#f4efe5] p-3 text-sm text-[#7a5a3b]">
              {complaintStatus}
            </p>
          )}
          {complaintsError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              {complaintsError}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-[#7a5a3b] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#62482f] disabled:bg-gray-400"
              disabled={complaintSubmitting}
            >
              {complaintSubmitting ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>

        {pickerOpen && (
          <div className="absolute inset-0 z-20 flex items-start justify-center bg-black/30 p-4 sm:hidden">
            <div className="mt-16 w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {pickerOpen === "location" ? "Choose Location" : "Choose Category"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Select one option to continue.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPickerOpen(null)}
                  className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
                >
                  Close
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-200 bg-white">
                {(pickerOpen === "location" ? locationOptions : categoryOptions).map(
                  (opt) => {
                    const value =
                      pickerOpen === "location"
                        ? complaintForm.district
                        : complaintForm.category;
                    const isActive = value === opt.value;

                    return (
                      <button
                        key={opt.value}
                        type="button"
                        className={`block w-full px-3 py-3 text-left text-sm hover:bg-[#f4efe5] ${
                          isActive
                            ? "bg-[#f4efe5] text-[#7a5a3b]"
                            : "text-gray-700"
                        }`}
                        onClick={() => {
                          setComplaintForm((prev) => ({
                            ...prev,
                            [pickerOpen === "location" ? "district" : "category"]:
                              opt.value,
                          }));
                          setPickerOpen(null);
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

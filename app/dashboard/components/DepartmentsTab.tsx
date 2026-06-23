"use client";

import { useState } from "react";
import type { ApiDepartment } from "@/lib/api";

interface DepartmentsTabProps {
  departments: ApiDepartment[];
  departmentsLoading: boolean;
  creatingDepartment: boolean;
  updatingDepartmentId: string | null;
  newDepartmentName: string;
  newDepartmentScope: "DISTRICT" | "MUNICIPAL" | "";
  onNewDepartmentNameChange: (value: string) => void;
  onNewDepartmentScopeChange: (value: "DISTRICT" | "MUNICIPAL" | "") => void;
  onCreateDepartment: () => void;
  onUpdateDepartment: (
    departmentId: string,
    updates: {
      name?: string;
      scope?: "DISTRICT" | "MUNICIPAL";
      isActive?: boolean;
    }
  ) => void;
}

interface EditingDepartmentState {
  id: string;
  name: string;
  scope: "DISTRICT" | "MUNICIPAL" | "";
  isActive: boolean;
}

export function DepartmentsTab({
  departments,
  departmentsLoading,
  creatingDepartment,
  updatingDepartmentId,
  newDepartmentName,
  newDepartmentScope,
  onNewDepartmentNameChange,
  onNewDepartmentScopeChange,
  onCreateDepartment,
  onUpdateDepartment,
}: DepartmentsTabProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] =
    useState<EditingDepartmentState | null>(null);

  const canCreateDepartment = !creatingDepartment && !!newDepartmentName.trim();

  const handleCreateAndClose = () => {
    onCreateDepartment();
    if (canCreateDepartment) {
      setCreateModalOpen(false);
    }
  };

  const renderCreateForm = () => (
    <div className="mt-5 space-y-4">
      <label className="block space-y-1">
        <span className="text-sm font-medium text-gray-700">
          Department name
        </span>
        <input
          type="text"
          placeholder="e.g., Central Administration"
          value={newDepartmentName}
          onChange={(e) => onNewDepartmentNameChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#7a5a3b] focus:outline-none"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-gray-700">
          Scope (optional)
        </span>
        <select
          value={newDepartmentScope}
          onChange={(e) =>
            onNewDepartmentScopeChange(
              e.target.value as "DISTRICT" | "MUNICIPAL" | ""
            )
          }
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#7a5a3b] focus:outline-none"
        >
          <option value="">No scope</option>
          <option value="DISTRICT">District</option>
          <option value="MUNICIPAL">Municipal</option>
        </select>
      </label>

      <button
        type="button"
        onClick={handleCreateAndClose}
        disabled={!canCreateDepartment}
        className="w-full rounded-lg bg-[#7a5a3b] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#62482f] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {creatingDepartment ? "Creating department..." : "Create department"}
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Departments</h2>
        <p className="mt-1 text-gray-600">
          Manage department names, scope, and activation status for staff assignment.
        </p>
        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="mt-4 w-full rounded-lg bg-[#7a5a3b] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#62482f] lg:hidden"
        >
          + Create department
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900">
            Existing Departments
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            {departments.length} department{departments.length === 1 ? "" : "s"} configured
          </p>

          <div className="mt-4 max-h-[32rem] space-y-3 overflow-auto pr-1">
            {departmentsLoading ? (
              <div className="flex items-center gap-3 rounded-lg border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[#7a5a3b]" />
                <span>Loading departments...</span>
              </div>
            ) : departments.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500">
                No departments yet. Create your first department.
              </p>
            ) : (
              departments.map((department) => (
                <div
                  key={department.id}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {department.name}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        <span className="rounded-full bg-white px-2 py-1">
                          {department.scope ?? "No scope"}
                        </span>
                        <span
                          className={`rounded-full px-2 py-1 ${
                            department.isActive
                              ? "bg-[#f4efe5] text-[#7a5a3b]"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {department.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingDepartment({
                          id: department.id,
                          name: department.name,
                          scope:
                            (department.scope as
                              | "DISTRICT"
                              | "MUNICIPAL"
                              | "") ?? "",
                          isActive: department.isActive ?? true,
                        })
                      }
                      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:block">
          <h3 className="text-base font-semibold text-gray-900">
            Create Department
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Add a department for future staff assignment.
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
                  Create Department
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Add a new department.
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

      {editingDepartment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setEditingDepartment(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Edit Department
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Update name, scope, or activation state.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingDepartment(null)}
                className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
              >
                Close
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-700">
                  Department name
                </span>
                <input
                  type="text"
                  value={editingDepartment.name}
                  onChange={(e) =>
                    setEditingDepartment((prev) =>
                      prev ? { ...prev, name: e.target.value } : prev
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#7a5a3b] focus:outline-none"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-700">
                  Scope
                </span>
                <select
                  value={editingDepartment.scope}
                  onChange={(e) =>
                    setEditingDepartment((prev) =>
                      prev
                        ? {
                            ...prev,
                            scope: e.target.value as
                              | "DISTRICT"
                              | "MUNICIPAL"
                              | "",
                          }
                        : prev
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#7a5a3b] focus:outline-none"
                >
                  <option value="">No scope</option>
                  <option value="DISTRICT">District</option>
                  <option value="MUNICIPAL">Municipal</option>
                </select>
              </label>

              <label className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={editingDepartment.isActive}
                  onChange={(e) =>
                    setEditingDepartment((prev) =>
                      prev ? { ...prev, isActive: e.target.checked } : prev
                    )
                  }
                  className="h-4 w-4 rounded border-gray-300 text-[#7a5a3b] focus:ring-[#7a5a3b]"
                />
                <span>Department is active</span>
              </label>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingDepartment(null)}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={updatingDepartmentId === editingDepartment.id}
                  onClick={async () => {
                    await onUpdateDepartment(editingDepartment.id, {
                      name: editingDepartment.name.trim(),
                      scope: editingDepartment.scope || undefined,
                      isActive: editingDepartment.isActive,
                    });
                    setEditingDepartment(null);
                  }}
                  className="flex-1 rounded-lg bg-[#7a5a3b] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#62482f] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updatingDepartmentId === editingDepartment.id
                    ? "Saving..."
                    : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1";

interface ApiErrorPayload {
  message?: string;
  statusCode?: number;
  data?: unknown;
}

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type BackendRole = "STAFF_OFFICER" | "ADMIN" | "FIELD_AGENT";
export type FrontendRole = "district_officer" | "admin" | "navigator";

type BackendStatus =
  | "RECEIVED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED_WITH_REASONS"
  | "ESCALATED";

export type FrontendStatus =
  | "pending"
  | "in_progress"
  | "resolved"
  | "rejected"
  | "escalated";

type BackendCategory =
  | "ROADS_INFRASTRUCTURE"
  | "WATER_SANITATION"
  | "ELECTRICITY_ENERGY"
  | "WASTE_MANAGEMENT"
  | "HEALTHCARE_SERVICES"
  | "EDUCATION_SERVICES"
  | "PUBLIC_SAFETY"
  | "MARKET_COMMERCE"
  | "ENVIRONMENTAL_ISSUES"
  | "DOCUMENTATION_SERVICES"
  | "TRANSPORTATION"
  | "OTHER";

type FrontendCategory =
  | "roads_infrastructure"
  | "water_sanitation"
  | "electricity_energy"
  | "waste_management"
  | "healthcare_services"
  | "education_services"
  | "public_safety"
  | "market_commerce"
  | "environmental_issues"
  | "documentation_services"
  | "transportation"
  | "other";

export interface RawApiSuccess<T> {
  statusCode?: number;
  message?: string;
  data?: T;
}

export interface RawPaginated<T> {
  rows?: T[];
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
  };
}

export interface RawLocation {
  id: string;
  name: string;
  region?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiLocation {
  id: string;
  name: string;
  region?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RawUser {
  id: string;
  email: string;
  fullName: string;
  role: BackendRole | string;
  locationId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface RawCase {
  id: string;
  code: string;
  fullName?: string;
  phoneNumber?: string;
  category?: BackendCategory | string;
  otherCategory?: string | null;
  description?: string;
  status?: BackendStatus | string;
  assignedToId?: string | null;
  createdById?: string | null;
  channel?: string;
  locationId?: string;
  attachmentUrl?: string;
  expectedResolutionDate?: string;
  respondedAt?: string;
  escalatedAt?: string;
  escalationReason?: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: RawUser;
  createdBy?: RawUser;
}

export interface ApiUser {
  id: string;
  email: string;
  fullName: string;
  username?: string;
  role: FrontendRole;
  district?: string | null;
  locationId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiComplaint {
  id: string;
  code: string;
  fullName?: string;
  age?: number;
  gender?: "male" | "female" | "other" | string;
  assistiveDevice?: string;
  otherAssistiveDevice?: string | null;
  phoneNumber: string;
  caregiverPhoneNumber?: string;
  language?: string;
  category: FrontendCategory;
  otherCategory?: string | null;
  issueTypes?: string[];
  otherIssueType?: string | null;
  requestType?: string;
  otherRequest?: string | null;
  district: string;
  description?: string;
  status: FrontendStatus;
  assignedToId?: string | null;
  assignedTo?: ApiUser;
  createdById?: string | null;
  createdBy?: ApiUser;
  expectedResolutionDate?: string | null;
  respondedAt?: string | null;
  escalatedAt?: string | null;
  escalationReason?: string | null;
  attachmentUrl?: string;
  createdAt: string;
  updatedAt: string;
  locationId?: string;
}

interface LocationCache {
  loaded: boolean;
  byId: Map<string, RawLocation>;
  districtToLocationId: Map<string, string>;
}

const locationCache: LocationCache = {
  loaded: false,
  byId: new Map(),
  districtToLocationId: new Map(),
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DISTRICT_FALLBACKS = ["assembly_a", "assembly_b", "assembly_c"];

export function toBackendRole(role: FrontendRole): BackendRole {
  if (role === "admin") return "ADMIN";
  if (role === "navigator") return "FIELD_AGENT";
  return "STAFF_OFFICER";
}

function fromBackendRole(role: string): FrontendRole {
  if (role === "ADMIN") return "admin";
  if (role === "FIELD_AGENT") return "navigator";
  return "district_officer";
}

export function toBackendStatus(status: FrontendStatus): BackendStatus {
  if (status === "pending") return "RECEIVED";
  if (status === "in_progress") return "IN_PROGRESS";
  if (status === "resolved") return "RESOLVED";
  if (status === "rejected") return "CLOSED_WITH_REASONS";
  return "ESCALATED";
}

export function fromBackendStatus(status?: string): FrontendStatus {
  if (status === "RESOLVED") return "resolved";
  if (status === "ESCALATED") return "escalated";
  if (status === "CLOSED_WITH_REASONS") return "rejected";
  if (status === "IN_PROGRESS" || status === "ASSIGNED") return "in_progress";
  return "pending";
}

export function toBackendCategory(category: string): BackendCategory {
  return category.toUpperCase() as BackendCategory;
}

function fromBackendCategory(category?: string): FrontendCategory {
  return (category?.toLowerCase() ?? "other") as FrontendCategory;
}

function normalizeLabel(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

export function toDisplayLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function toDisplayStatus(value: string): string {
  if (value === "RECEIVED") return "Pending";
  if (value === "ASSIGNED" || value === "IN_PROGRESS") return "In Progress";
  if (value === "CLOSED_WITH_REASONS") return "Rejected";
  return toDisplayLabel(value);
}

function getDistrictFromLocation(locationId?: string): string {
  if (!locationId) return "assembly_a";
  const location = locationCache.byId.get(locationId);
  if (!location) return "assembly_a";
  const byName = normalizeLabel(location.name);
  if (byName.includes("assembly_a")) return "assembly_a";
  if (byName.includes("assembly_b")) return "assembly_b";
  if (byName.includes("assembly_c")) return "assembly_c";
  return byName;
}

export async function request<T>(
  path: string,
  options?: {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    token?: string;
    query?: Record<string, string | number | boolean | undefined>;
    body?: unknown;
    isFormData?: boolean;
  }
): Promise<T> {
  const method = options?.method ?? "GET";
  const rawUrl = `${API_BASE_URL}${path}`;
  const url = /^https?:\/\//.test(API_BASE_URL)
    ? new URL(rawUrl)
    : new URL(rawUrl, window.location.origin);

  if (options?.query) {
    Object.entries(options.query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      url.searchParams.set(key, String(value));
    });
  }

  const headers: Record<string, string> = {};
  if (options?.token) headers.Authorization = `Bearer ${options.token}`;
  if (!options?.isFormData) headers["Content-Type"] = "application/json";

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: options?.body
      ? options.isFormData
        ? (options.body as BodyInit)
        : JSON.stringify(options.body)
      : undefined,
  });

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const errorPayload = payload as ApiErrorPayload | null;
    throw new ApiError(
      errorPayload?.message ?? `Request failed with status ${response.status}`,
      errorPayload?.statusCode ?? response.status,
      errorPayload?.data
    );
  }

  return payload as T;
}

export function unwrapData<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in (payload as object)) {
    return (payload as RawApiSuccess<T>).data as T;
  }
  return payload as T;
}

export function unwrapPaginated<T>(payload: unknown): {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
} {
  const data = unwrapData<RawPaginated<T>>(payload);
  const rows = data?.rows ?? [];
  return {
    rows,
    total: data?.meta?.total ?? rows.length,
    page: data?.meta?.page ?? 1,
    pageSize: data?.meta?.pageSize ?? rows.length,
  };
}

export function unwrapArray<T>(payload: unknown): T[] {
  const unwrapped = unwrapData<unknown>(payload);
  if (Array.isArray(unwrapped)) return unwrapped as T[];
  if (
    unwrapped &&
    typeof unwrapped === "object" &&
    "rows" in unwrapped &&
    Array.isArray((unwrapped as { rows?: unknown }).rows)
  ) {
    return ((unwrapped as { rows: unknown[] }).rows ?? []) as T[];
  }
  return [];
}

export function mapUser(raw: RawUser): ApiUser {
  return {
    id: raw.id,
    email: raw.email,
    fullName: raw.fullName,
    role: fromBackendRole(raw.role),
    district: raw.locationId ? getDistrictFromLocation(raw.locationId) : null,
    locationId: raw.locationId ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export function mapCase(raw: RawCase): ApiComplaint {
  return {
    id: raw.id,
    code: raw.code,
    fullName: raw.fullName,
    phoneNumber: raw.phoneNumber ?? "",
    category: fromBackendCategory(raw.category),
    otherCategory: raw.otherCategory ?? null,
    district: getDistrictFromLocation(raw.locationId),
    description: raw.description,
    status: fromBackendStatus(raw.status),
    assignedToId: raw.assignedToId ?? null,
    assignedTo: raw.assignedTo ? mapUser(raw.assignedTo) : undefined,
    createdById: raw.createdById ?? null,
    createdBy: raw.createdBy ? mapUser(raw.createdBy) : undefined,
    expectedResolutionDate: raw.expectedResolutionDate ?? null,
    respondedAt: raw.respondedAt ?? null,
    escalatedAt: raw.escalatedAt ?? null,
    escalationReason: raw.escalationReason ?? null,
    attachmentUrl: raw.attachmentUrl,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    locationId: raw.locationId,
  };
}

export function mapLocation(raw: RawLocation): ApiLocation {
  return {
    id: raw.id,
    name: raw.name,
    region: raw.region,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export async function ensureLocationCache(token?: string) {
  if (locationCache.loaded) return;
  const payload = await request<RawPaginated<RawLocation> | RawApiSuccess<RawPaginated<RawLocation>>>(
    "/locations",
    { token, query: { page: 1, pageSize: 100 } }
  );
  const page = unwrapPaginated<RawLocation>(payload);
  page.rows.forEach((location, index) => {
    locationCache.byId.set(location.id, location);
    const normalized = normalizeLabel(location.name);
    locationCache.districtToLocationId.set(normalized, location.id);
    if (index < DISTRICT_FALLBACKS.length) {
      locationCache.districtToLocationId.set(DISTRICT_FALLBACKS[index], location.id);
    }
  });
  locationCache.loaded = true;
}

export async function resolveLocationId(
  input?: string,
  token?: string
): Promise<string | undefined> {
  if (!input) return undefined;
  if (UUID_REGEX.test(input)) return input;
  await ensureLocationCache(token);
  const normalized = normalizeLabel(input);
  return locationCache.districtToLocationId.get(normalized);
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "/api/v1";

interface ApiErrorPayload {
  message?: string;
  statusCode?: number;
  data?: unknown;
}

class ApiError extends Error {
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
type FrontendRole = "district_officer" | "admin" | "navigator";

type BackendStatus =
  | "RECEIVED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED_WITH_REASONS"
  | "ESCALATED";

type FrontendStatus =
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

interface RawApiSuccess<T> {
  statusCode?: number;
  message?: string;
  data?: T;
}

interface RawPaginated<T> {
  rows?: T[];
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
  };
}

interface RawLocation {
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

interface RawUser {
  id: string;
  email: string;
  fullName: string;
  role: BackendRole | string;
  locationId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface RawCase {
  id: string;
  code: string;
  fullName?: string;
  phoneNumber?: string;
  category?: BackendCategory | string;
  otherCategory?: string | null;
  description?: string;
  community?: string;
  landmark?: string;
  status?: BackendStatus | string;
  assignedToId?: string | null;
  createdById?: string | null;
  channel?: string;
  locationId?: string;
  attachmentUrl?: string;
  expectedResolutionDate?: string;
  respondedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  closureReason?: string;
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

interface AuthResponse {
  user: ApiUser;
  accessToken: string;
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
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DISTRICT_FALLBACKS = ["assembly_a", "assembly_b", "assembly_c"];

function toBackendRole(role: FrontendRole): BackendRole {
  if (role === "admin") return "ADMIN";
  if (role === "navigator") return "FIELD_AGENT";
  return "STAFF_OFFICER";
}

function fromBackendRole(role: string): FrontendRole {
  if (role === "ADMIN") return "admin";
  if (role === "FIELD_AGENT") return "navigator";
  return "district_officer";
}

function toBackendStatus(status: FrontendStatus): BackendStatus {
  if (status === "pending") return "RECEIVED";
  if (status === "in_progress") return "IN_PROGRESS";
  if (status === "resolved") return "RESOLVED";
  if (status === "rejected") return "CLOSED_WITH_REASONS";
  return "ESCALATED";
}

function fromBackendStatus(status?: string): FrontendStatus {
  if (status === "RESOLVED") return "resolved";
  if (status === "ESCALATED") return "escalated";
  if (status === "CLOSED_WITH_REASONS") return "rejected";
  if (status === "IN_PROGRESS" || status === "ASSIGNED") return "in_progress";
  return "pending";
}

function toBackendCategory(category: string): BackendCategory {
  return category.toUpperCase() as BackendCategory;
}

function fromBackendCategory(category?: string): FrontendCategory {
  return (category?.toLowerCase() ?? "other") as FrontendCategory;
}

function normalizeLabel(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function getDistrictFromLocation(locationId?: string): string {
  if (!locationId) return "assembly_a";
  const location = locationCache.byId.get(locationId);
  if (!location) return "assembly_a";
  const byName = normalizeLabel(location.name);
  if (byName.includes("assembly_a") || byName.includes("assembly_a")) return "assembly_a";
  if (byName.includes("assembly_b")) return "assembly_b";
  if (byName.includes("assembly_c")) return "assembly_c";
  return byName;
}

async function request<T>(
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
  if (options?.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }
  if (!options?.isFormData) {
    headers["Content-Type"] = "application/json";
  }

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

function unwrapData<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in (payload as object)) {
    return (payload as RawApiSuccess<T>).data as T;
  }
  return payload as T;
}

function unwrapPaginated<T>(payload: unknown): { rows: T[]; total: number; page: number; pageSize: number } {
  const data = unwrapData<RawPaginated<T>>(payload);
  const rows = data?.rows ?? [];
  return {
    rows,
    total: data?.meta?.total ?? rows.length,
    page: data?.meta?.page ?? 1,
    pageSize: data?.meta?.pageSize ?? rows.length,
  };
}

function unwrapArray<T>(payload: unknown): T[] {
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

function mapUser(raw: RawUser): ApiUser {
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

function mapCase(raw: RawCase): ApiComplaint {
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

function mapLocation(raw: RawLocation): ApiLocation {
  return {
    id: raw.id,
    name: raw.name,
    region: raw.region,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

async function ensureLocationCache(token?: string) {
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

async function resolveLocationId(input?: string, token?: string): Promise<string | undefined> {
  if (!input) return undefined;
  if (UUID_REGEX.test(input)) return input;
  await ensureLocationCache(token);
  const normalized = normalizeLabel(input);
  return locationCache.districtToLocationId.get(normalized);
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  try {
    await ensureLocationCache();
  } catch {
    // Non-blocking for auth; location mapping can be resolved lazily later.
  }
  const payload = await request<RawApiSuccess<{ accessToken: string; user: RawUser }>>(
    "/auth/login",
    {
      method: "POST",
      body: input,
    }
  );
  const data = unwrapData<{ accessToken: string; user: RawUser }>(payload);
  return {
    accessToken: data.accessToken,
    user: mapUser(data.user),
  };
}

export async function registerUser(input: {
  email: string;
  password: string;
  fullName: string;
  role?: FrontendRole;
  district?: string;
}): Promise<AuthResponse> {
  const locationId = await resolveLocationId(input.district);
  await request("/auth/register", {
    method: "POST",
    body: {
      email: input.email,
      password: input.password,
      fullName: input.fullName,
      role: toBackendRole(input.role ?? "navigator"),
      locationId,
    },
  });

  return loginUser({ email: input.email, password: input.password });
}

export async function getProfile(token: string): Promise<ApiUser> {
  await ensureLocationCache(token);
  const payload = await request<RawApiSuccess<RawUser>>("/auth/profile", { token });
  return mapUser(unwrapData<RawUser>(payload));
}

export async function getComplaints(
  token: string,
  options?: { district?: string; page?: number; pageSize?: number }
): Promise<{ rows: ApiComplaint[]; total: number; page: number; pageSize: number }> {
  await ensureLocationCache(token);
  const locationId = await resolveLocationId(options?.district, token);
  const payload = await request<RawPaginated<RawCase> | RawApiSuccess<RawPaginated<RawCase>>>(
    "/cases",
    {
      token,
      query: {
        locationId,
        page: options?.page ?? 1,
        pageSize: options?.pageSize ?? 10,
      },
    }
  );
  const page = unwrapPaginated<RawCase>(payload);
  return {
    rows: page.rows.map(mapCase),
    total: page.total,
    page: page.page,
    pageSize: page.pageSize,
  };
}

export async function getComplaint(token: string, id: string): Promise<ApiComplaint> {
  await ensureLocationCache(token);
  const payload = await request<RawApiSuccess<RawCase>>(`/cases/${id}`, { token });
  return mapCase(unwrapData<RawCase>(payload));
}

export async function getComplaintByCode(code: string): Promise<ApiComplaint> {
  await ensureLocationCache();
  const payload = await request<RawApiSuccess<RawCase>>(`/cases/code/${encodeURIComponent(code)}`);
  return mapCase(unwrapData<RawCase>(payload));
}

export async function getUser(token: string, id: string): Promise<ApiUser> {
  const users = await request<RawPaginated<RawUser>>("/users", {
    token,
    query: { page: 1, pageSize: 100, query: id },
  });
  const found = (users.rows ?? []).find((user) => user.id === id);
  if (!found) {
    throw new ApiError("User not found", 404);
  }
  await ensureLocationCache(token);
  return mapUser(found);
}

export async function submitComplaint(
  token: string,
  input: {
    phoneNumber: string;
    district: string;
    category: string;
    otherCategory?: string;
    description?: string;
  }
): Promise<{ code: string }> {
  const locationId = await resolveLocationId(input.district, token);
  if (!locationId) {
    throw new ApiError("No locations are configured yet. Please create at least one location.", 400);
  }
  const payload = await request<RawApiSuccess<RawCase>>("/cases/citizen", {
    method: "POST",
    token: undefined,
    body: {
      phoneNumber: input.phoneNumber,
      locationId,
      category: toBackendCategory(input.category),
      otherCategory: input.otherCategory,
      description: input.description,
    },
  });
  const created = unwrapData<RawCase>(payload);
  return { code: created.code };
}

export async function submitComplaintByNavigator(
  token: string,
  input: {
    fullName?: string;
    age?: number;
    gender?: string;
    assistiveDevice?: string;
    otherAssistiveDevice?: string;
    phoneNumber: string;
    caregiverPhoneNumber?: string;
    language?: string;
    category: string;
    otherCategory?: string;
    issueTypes?: string[];
    otherIssueType?: string;
    requestType?: string;
    otherRequest?: string;
    district: string;
    description?: string;
  },
  options?: { code?: string }
): Promise<{ code: string }> {
  void options;
  const locationId = await resolveLocationId(input.district, token);
  if (!locationId) {
    throw new ApiError("No locations are configured yet. Please create at least one location.", 400);
  }
  const payload = await request<RawApiSuccess<RawCase>>("/cases/portal", {
    method: "POST",
    token,
    body: {
      fullName: input.fullName,
      phoneNumber: input.phoneNumber,
      locationId,
      category: toBackendCategory(input.category),
      otherCategory: input.otherCategory,
      description: input.description,
      channel: "PORTAL",
    },
  });
  const created = unwrapData<RawCase>(payload);
  return { code: created.code };
}

export async function getNavigators(token: string): Promise<{ rows: ApiUser[] }> {
  await ensureLocationCache(token);
  const payload = await request<RawPaginated<RawUser>>("/users", {
    token,
    query: { role: "FIELD_AGENT", page: 1, pageSize: 100 },
  });
  return { rows: (payload.rows ?? []).map(mapUser) };
}

export async function getDistrictOfficers(
  token: string,
  district?: string
): Promise<{ rows: ApiUser[] }> {
  await ensureLocationCache(token);
  const locationId = await resolveLocationId(district, token);
  const payload = await request<RawPaginated<RawUser>>("/users", {
    token,
    query: { role: "STAFF_OFFICER", locationId, page: 1, pageSize: 100 },
  });
  return { rows: (payload.rows ?? []).map(mapUser) };
}

export async function getAdmins(token: string): Promise<{ rows: ApiUser[] }> {
  await ensureLocationCache(token);
  const payload = await request<RawPaginated<RawUser>>("/users", {
    token,
    query: { role: "ADMIN", page: 1, pageSize: 100 },
  });
  return { rows: (payload.rows ?? []).map(mapUser) };
}

export async function assignComplaint(
  token: string,
  complaintId: string,
  input: { assignedToId: string; expectedResolutionDate?: string }
): Promise<ApiComplaint> {
  const payload = await request<RawApiSuccess<RawCase>>(`/cases/${complaintId}/assign`, {
    method: "PATCH",
    token,
    body: input,
  });
  return mapCase(unwrapData<RawCase>(payload));
}

export async function escalateComplaint(
  token: string,
  complaintId: string,
  input: { assignedToId: string; escalationReason: string }
): Promise<ApiComplaint> {
  const payload = await request<RawApiSuccess<RawCase>>(`/cases/${complaintId}/escalate`, {
    method: "PATCH",
    token,
    body: input,
  });
  return mapCase(unwrapData<RawCase>(payload));
}

export async function updateComplaintStatus(
  token: string,
  complaintId: string,
  input: { status: FrontendStatus }
): Promise<ApiComplaint> {
  const body: { status: BackendStatus; closureReason?: string } = {
    status: toBackendStatus(input.status),
  };
  if (input.status === "rejected") {
    body.closureReason = "Closed with reasons";
  }
  const payload = await request<RawApiSuccess<RawCase>>(`/cases/${complaintId}/status`, {
    method: "PATCH",
    token,
    body,
  });
  return mapCase(unwrapData<RawCase>(payload));
}

export interface ComplaintStats {
  activeCases: number;
  avgResponseHours: number;
  resolutionRate: number;
  overdueCases: number;
  activeCasesChange?: number;
  avgResponseHoursChange?: number;
  resolutionRateChange?: number;
  overdueCasesChange?: number;
}

export interface ComplaintStatsWithTrends extends ComplaintStats {
  activeCasesChange: number;
  avgResponseHoursChange: number;
  resolutionRateChange: number;
  overdueCasesChange: number;
}

export async function getComplaintStats(
  token: string,
  options?: { district?: string }
): Promise<ComplaintStatsWithTrends> {
  const locationId = await resolveLocationId(options?.district, token);
  const payload = await request<RawApiSuccess<ComplaintStatsWithTrends>>("/analytics/stats", {
    token,
    query: { locationId },
  });
  return unwrapData<ComplaintStatsWithTrends>(payload);
}

export interface NavigatorUpdate {
  id: string;
  complaintId: string;
  complaintTitle: string;
  navigatorName: string;
  navigatorEmail: string;
  oldStatus: string;
  newStatus: string;
  updatedAt: string;
}

export async function getNavigatorUpdates(
  token: string,
  options?: { district?: string; page?: number; pageSize?: number }
): Promise<NavigatorUpdate[]> {
  const locationId = await resolveLocationId(options?.district, token);
  const payload = await request<RawPaginated<{
    id: string;
    caseId: string;
    caseCode: string;
    agentName: string;
    agentEmail: string;
    oldStatus: string;
    newStatus: string;
    updatedAt: string;
  }>>("/analytics/recent-activity", {
    token,
    query: {
      locationId,
      page: options?.page ?? 1,
      pageSize: options?.pageSize ?? 10,
    },
  });

  return (payload.rows ?? []).map((item) => ({
    id: item.id,
    complaintId: item.caseId,
    complaintTitle: `Case ${item.caseCode}`,
    navigatorName: item.agentName,
    navigatorEmail: item.agentEmail,
    oldStatus: fromBackendStatus(item.oldStatus),
    newStatus: fromBackendStatus(item.newStatus),
    updatedAt: item.updatedAt,
  }));
}

export async function getOverdueComplaints(token: string): Promise<ApiComplaint[]> {
  const payload = await request<RawApiSuccess<RawCase[]>>("/analytics/overdue-cases", { token });
  return unwrapArray<RawCase>(payload).map(mapCase);
}

export async function getCasesByAssembly(
  token: string
): Promise<{ assembly: string; total: number; pending: number; inProgress: number; resolved: number; rejected: number }[]> {
  const payload = await request<RawApiSuccess<Array<{
    location: string;
    total: number;
    received: number;
    assigned: number;
    inProgress: number;
    resolved: number;
    closedWithReasons: number;
    escalated: number;
  }>>>("/analytics/cases-by-location", { token });

  const rows = unwrapData<Array<{
    location: string;
    total: number;
    received: number;
    assigned: number;
    inProgress: number;
    resolved: number;
    closedWithReasons: number;
    escalated: number;
  }>>(payload);
  return (rows ?? []).map((row) => ({
    assembly: row.location,
    total: row.total,
    pending: row.received,
    inProgress: row.assigned + row.inProgress,
    resolved: row.resolved,
    rejected: row.closedWithReasons,
  }));
}

export async function getCasesByLocation(
  token: string
): Promise<{ location: string; total: number; pending: number; inProgress: number; resolved: number; rejected: number }[]> {
  const rows = await getCasesByAssembly(token);
  return rows.map((row) => ({
    location: row.assembly,
    total: row.total,
    pending: row.pending,
    inProgress: row.inProgress,
    resolved: row.resolved,
    rejected: row.rejected,
  }));
}

export async function getCasesByCategory(
  token: string,
  district?: string
): Promise<{ category: string; count: number }[]> {
  const locationId = await resolveLocationId(district, token);
  const payload = await request<RawApiSuccess<Array<{ category: string; count: number }>>>(
    "/analytics/cases-by-category",
    { token, query: { locationId } }
  );
  return unwrapData(payload) ?? [];
}

export async function getCasesByStatus(
  token: string,
  district?: string
): Promise<{ status: string; count: number; percentage: number }[]> {
  const locationId = await resolveLocationId(district, token);
  const payload = await request<RawApiSuccess<Array<{ status: string; count: number; percentage: number }>>>(
    "/analytics/cases-by-status",
    { token, query: { locationId } }
  );
  const rows = unwrapData<Array<{ status: string; count: number; percentage: number }>>(payload) ?? [];
  return rows.map((row) => ({
    ...row,
    status: row.status
      .toLowerCase()
      .split("_")
      .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" "),
  }));
}

export async function getCasesTrend(
  token: string,
  district?: string
): Promise<{ date: string; submitted: number; resolved: number }[]> {
  const locationId = await resolveLocationId(district, token);
  const payload = await request<RawApiSuccess<Array<{
    day: string;
    received: number;
    resolved: number;
  }>>>("/analytics/cases-trend", { token, query: { locationId } });

  const rows = unwrapData<Array<{ day: string; received: number; resolved: number }>>(payload);
  return (rows ?? []).map((row) => ({
    date: new Date(row.day).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    submitted: row.received,
    resolved: row.resolved,
  }));
}

export async function getAssemblyPerformance(
  token: string
): Promise<{ assembly: string; resolutionRate: number; avgResponseHours: number; activeCases: number }[]> {
  const payload = await request<RawApiSuccess<Array<{
    location: string;
    resolutionRate: number;
    avgResponseHours: number;
    activeCases: number;
  }>>>("/analytics/location-performance", { token });
  const rows = unwrapData<Array<{
    location: string;
    resolutionRate: number;
    avgResponseHours: number;
    activeCases: number;
  }>>(payload);
  return (rows ?? []).map((row) => ({
    assembly: row.location,
    resolutionRate: row.resolutionRate,
    avgResponseHours: row.avgResponseHours,
    activeCases: row.activeCases,
  }));
}

export async function getLocationPerformance(
  token: string
): Promise<{ location: string; resolutionRate: number; avgResponseHours: number; activeCases: number }[]> {
  const rows = await getAssemblyPerformance(token);
  return rows.map((row) => ({
    location: row.assembly,
    resolutionRate: row.resolutionRate,
    avgResponseHours: row.avgResponseHours,
    activeCases: row.activeCases,
  }));
}

export async function getResponseTimeDistribution(
  token: string,
  district?: string
): Promise<{ bucket: string; count: number }[]> {
  const locationId = await resolveLocationId(district, token);
  const payload = await request<RawApiSuccess<Array<{ bucket: string; count: number }>>>(
    "/analytics/response-time-distribution",
    { token, query: { locationId } }
  );
  return unwrapData(payload) ?? [];
}

export async function getResolutionTimeByCategory(
  token: string,
  district?: string
): Promise<{ category: string; avgDays: number; count: number }[]> {
  const locationId = await resolveLocationId(district, token);
  const payload = await request<RawApiSuccess<Array<{ category: string; avgDays: number; count: number }>>>(
    "/analytics/resolution-time-by-category",
    { token, query: { locationId } }
  );
  return unwrapData(payload) ?? [];
}

export async function getDistrictOfficerPerformance(
  token: string
): Promise<{ name: string; totalCases: number; resolved: number; avgResponseHours: number; resolutionRate: number }[]> {
  const payload = await request<RawApiSuccess<Array<{
    name: string;
    totalCases: number;
    resolved: number;
    avgResponseHours: number;
    resolutionRate: number;
  }>>>("/analytics/officer-performance", { token });
  return unwrapData(payload) ?? [];
}

export async function getWeeklyActivityPattern(
  token: string,
  district?: string
): Promise<{ day: string; submitted: number; resolved: number }[]> {
  const locationId = await resolveLocationId(district, token);
  const payload = await request<RawApiSuccess<Array<{ day: string; received: number; resolved: number }>>>(
    "/analytics/cases-trend",
    { token, query: { locationId } }
  );
  const trend = unwrapData<Array<{ day: string; received: number; resolved: number }>>(payload) ?? [];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const aggregate: Record<string, { submitted: number; resolved: number }> = {
    Sun: { submitted: 0, resolved: 0 },
    Mon: { submitted: 0, resolved: 0 },
    Tue: { submitted: 0, resolved: 0 },
    Wed: { submitted: 0, resolved: 0 },
    Thu: { submitted: 0, resolved: 0 },
    Fri: { submitted: 0, resolved: 0 },
    Sat: { submitted: 0, resolved: 0 },
  };

  trend.forEach((entry) => {
    const date = new Date(entry.day);
    const day = days[date.getDay()];
    aggregate[day].submitted += entry.received;
    aggregate[day].resolved += entry.resolved;
  });

  return days.map((day) => ({ day, ...aggregate[day] }));
}

export async function getEscalationAnalytics(
  token: string,
  district?: string
): Promise<{
  totalEscalated: number;
  escalationRate: number;
  byCategory: { category: string; count: number; percentage: number }[];
  avgDaysBeforeEscalation: number;
}> {
  const locationId = await resolveLocationId(district, token);
  const payload = await request<
    RawApiSuccess<{
      totalEscalated: number;
      escalationRate: number;
      avgDaysBeforeEscalation: number;
      byCategory: { category: string; count: number; percentage: number }[];
    }>
  >("/analytics/escalations", { token, query: { locationId } });
  return unwrapData(payload);
}

export async function getPublicStats(locationId?: string): Promise<{
  totalCases: number;
  resolved: number;
  inProgress: number;
  pending: number;
  byCategory: { category: string; count: number }[];
}> {
  const payload = await request<
    RawApiSuccess<{
      totalCases: number;
      resolved: number;
      inProgress: number;
      assigned: number;
      received: number;
      byCategory: { category: string; count: number }[];
    }>
  >("/public/stats", {
    query: { locationId },
  });
  const data = unwrapData<{
    totalCases: number;
    resolved: number;
    inProgress: number;
    assigned: number;
    received: number;
    byCategory: { category: string; count: number }[];
  }>(payload);
  return {
    totalCases: data.totalCases,
    resolved: data.resolved,
    inProgress: (data.inProgress ?? 0) + (data.assigned ?? 0),
    pending: data.received ?? 0,
    byCategory: data.byCategory ?? [],
  };
}

export async function getLocations(): Promise<{ rows: ApiLocation[] }> {
  const payload = await request<RawPaginated<RawLocation>>("/locations", {
    query: { page: 1, pageSize: 100 },
  });
  return { rows: (payload.rows ?? []).map(mapLocation) };
}

export async function createLocation(
  token: string,
  input: { name: string; region?: string }
): Promise<ApiLocation> {
  const payload = await request<RawApiSuccess<RawLocation>>("/locations", {
    method: "POST",
    token,
    body: input,
  });
  return mapLocation(unwrapData<RawLocation>(payload));
}

export { ApiError };

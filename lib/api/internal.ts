import {
  ApiError,
  ensureLocationCache,
  fromBackendStatus,
  mapCase,
  mapLocation,
  mapUser,
  request,
  resolveLocationId,
  toBackendCategory,
  toBackendRole,
  toBackendStatus,
  toDisplayLabel,
  toDisplayStatus,
  type ApiComplaint,
  type ApiLocation,
  type ApiUser,
  type FrontendRole,
  type FrontendStatus,
  type RawApiSuccess,
  type RawCase,
  type RawLocation,
  type RawPaginated,
  type RawUser,
  unwrapArray,
  unwrapData,
  unwrapPaginated,
} from "./core";

interface AuthResponse {
  user: ApiUser;
  accessToken: string;
}

export async function loginUser(input: { email: string; password: string }): Promise<AuthResponse> {
  try {
    await ensureLocationCache();
  } catch {}
  const payload = await request<RawApiSuccess<{ accessToken: string; user: RawUser }>>("/auth/login", {
    method: "POST",
    body: input,
  });
  const data = unwrapData<{ accessToken: string; user: RawUser }>(payload);
  return { accessToken: data.accessToken, user: mapUser(data.user) };
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
  const query = { locationId, page: options?.page ?? 1, pageSize: options?.pageSize ?? 10 };
  let page: { rows: RawCase[]; total: number; page: number; pageSize: number };
  try {
    const payload = await request<RawPaginated<RawCase> | RawApiSuccess<RawPaginated<RawCase>>>("/cases", {
      token,
      query,
    });
    page = unwrapPaginated<RawCase>(payload);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status < 500 || !locationId) throw error;
    const fallbackPayload = await request<RawPaginated<RawCase> | RawApiSuccess<RawPaginated<RawCase>>>(
      "/cases",
      { token, query: { page: options?.page ?? 1, pageSize: options?.pageSize ?? 10 } }
    );
    const fallbackPage = unwrapPaginated<RawCase>(fallbackPayload);
    const filteredRows = fallbackPage.rows.filter((item) => item.locationId === locationId);
    page = { ...fallbackPage, rows: filteredRows, total: filteredRows.length };
  }
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
  if (!found) throw new ApiError("User not found", 404);
  await ensureLocationCache(token);
  return mapUser(found);
}

export async function submitComplaint(
  token: string,
  input: { phoneNumber: string; district: string; category: string; otherCategory?: string; description?: string }
): Promise<{ code: string }> {
  const locationId = await resolveLocationId(input.district, token);
  if (!locationId) throw new ApiError("No locations are configured yet. Please create at least one location.", 400);
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
  if (!locationId) throw new ApiError("No locations are configured yet. Please create at least one location.", 400);
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

export async function getDistrictOfficers(token: string, district?: string): Promise<{ rows: ApiUser[] }> {
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
  const body: { status: ReturnType<typeof toBackendStatus>; closureReason?: string } = {
    status: toBackendStatus(input.status),
  };
  if (input.status === "rejected") body.closureReason = "Closed with reasons";
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

export async function getComplaintStats(
  token: string,
  options?: { district?: string }
): Promise<ComplaintStatsWithTrends> {
  const locationId = await resolveLocationId(options?.district, token);
  const payload = await request<RawApiSuccess<ComplaintStatsWithTrends>>("/analytics/stats", {
    token,
    query: { locationId },
  });
  return unwrapData(payload);
}

export async function getNavigatorUpdates(
  token: string,
  options?: { district?: string; page?: number; pageSize?: number }
): Promise<NavigatorUpdate[]> {
  const locationId = await resolveLocationId(options?.district, token);
  const payload = await request<
    RawPaginated<{
      id: string;
      caseId: string;
      caseCode: string;
      agentName: string;
      agentEmail: string;
      oldStatus: string;
      newStatus: string;
      updatedAt: string;
    }>
  >("/analytics/recent-activity", {
    token,
    query: { locationId, page: options?.page ?? 1, pageSize: options?.pageSize ?? 10 },
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

export async function getCasesByAssembly(token: string) {
  const payload = await request<
    RawApiSuccess<
      Array<{
        location: string;
        total: number;
        received: number;
        assigned: number;
        inProgress: number;
        resolved: number;
        closedWithReasons: number;
        escalated: number;
      }>
    >
  >("/analytics/cases-by-location", { token });
  const rows = unwrapData<Array<any>>(payload) ?? [];
  return rows.map((row) => ({
    assembly: row.location,
    total: row.total,
    pending: row.received,
    inProgress: row.assigned + row.inProgress,
    resolved: row.resolved,
    rejected: row.closedWithReasons,
  }));
}

export async function getCasesByLocation(token: string) {
  const rows = await getCasesByAssembly(token);
  return rows.map((row) => ({ ...row, location: row.assembly }));
}

export async function getCasesByCategory(token: string, district?: string) {
  const locationId = await resolveLocationId(district, token);
  const payload = await request<RawApiSuccess<Array<{ category: string; count: number }>>>(
    "/analytics/cases-by-category",
    { token, query: { locationId } }
  );
  return unwrapArray<{ category: string; count: number }>(payload).map((row) => ({
    category: toDisplayLabel(row.category),
    count: row.count,
  }));
}

export async function getCasesByStatus(token: string, district?: string) {
  const locationId = await resolveLocationId(district, token);
  const payload = await request<RawApiSuccess<Array<{ status: string; count: number; percentage: number }>>>(
    "/analytics/cases-by-status",
    { token, query: { locationId } }
  );
  return (unwrapData<Array<{ status: string; count: number; percentage: number }>>(payload) ?? []).map((row) => ({
    ...row,
    status: toDisplayStatus(row.status),
  }));
}

export async function getCasesTrend(token: string, district?: string) {
  const locationId = await resolveLocationId(district, token);
  const payload = await request<RawApiSuccess<Array<{ day: string; received: number; resolved: number }>>>(
    "/analytics/cases-trend",
    { token, query: { locationId } }
  );
  return (unwrapData<Array<{ day: string; received: number; resolved: number }>>(payload) ?? []).map((row) => ({
    date: new Date(row.day).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    submitted: row.received,
    resolved: row.resolved,
  }));
}

export async function getAssemblyPerformance(token: string) {
  const payload = await request<
    RawApiSuccess<Array<{ location: string; resolutionRate: number; avgResponseHours: number; activeCases: number }>>
  >("/analytics/location-performance", { token });
  return (unwrapData<Array<any>>(payload) ?? []).map((row) => ({
    assembly: row.location,
    resolutionRate: row.resolutionRate,
    avgResponseHours: row.avgResponseHours,
    activeCases: row.activeCases,
  }));
}

export async function getLocationPerformance(token: string) {
  const rows = await getAssemblyPerformance(token);
  return rows.map((row) => ({ ...row, location: row.assembly }));
}

export async function getResponseTimeDistribution(token: string, district?: string) {
  const locationId = await resolveLocationId(district, token);
  const payload = await request<RawApiSuccess<Array<{ bucket: string; count: number }>>>(
    "/analytics/response-time-distribution",
    { token, query: { locationId } }
  );
  return unwrapArray<{ bucket: string; count: number }>(payload);
}

export async function getResolutionTimeByCategory(token: string, district?: string) {
  const locationId = await resolveLocationId(district, token);
  const payload = await request<RawApiSuccess<Array<{ category: string; avgDays: number; count: number }>>>(
    "/analytics/resolution-time-by-category",
    { token, query: { locationId } }
  );
  return unwrapArray<{ category: string; avgDays: number; count: number }>(payload).map((row) => ({
    ...row,
    category: toDisplayLabel(row.category),
  }));
}

export async function getDistrictOfficerPerformance(token: string) {
  const payload = await request<
    RawApiSuccess<Array<{ name: string; totalCases: number; resolved: number; avgResponseHours: number; resolutionRate: number }>>
  >("/analytics/officer-performance", { token });
  return unwrapArray(payload);
}

export async function getWeeklyActivityPattern(token: string, district?: string) {
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
    const day = days[new Date(entry.day).getDay()];
    aggregate[day].submitted += entry.received;
    aggregate[day].resolved += entry.resolved;
  });
  return days.map((day) => ({ day, ...aggregate[day] }));
}

export async function getEscalationAnalytics(token: string, district?: string) {
  const locationId = await resolveLocationId(district, token);
  const payload = await request<
    RawApiSuccess<{
      totalEscalated: number;
      escalationRate: number;
      avgDaysBeforeEscalation: number;
      byCategory: { category: string; count: number; percentage: number }[];
    }>
  >("/analytics/escalations", { token, query: { locationId } });
  const data = unwrapData<{
    totalEscalated: number;
    escalationRate: number;
    avgDaysBeforeEscalation: number;
    byCategory: { category: string; count: number; percentage: number }[];
  }>(payload);
  return {
    ...data,
    byCategory: (data.byCategory ?? []).map((row) => ({ ...row, category: toDisplayLabel(row.category) })),
  };
}

export async function getPublicStats(locationId?: string) {
  const payload = await request<
    RawApiSuccess<{
      totalCases: number;
      resolved: number;
      inProgress: number;
      assigned: number;
      received: number;
      byCategory: { category: string; count: number }[];
    }>
  >("/public/stats", { query: { locationId } });
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
  return mapLocation(unwrapData(payload));
}

export { ApiError, type ApiLocation, type ApiUser, type ApiComplaint };

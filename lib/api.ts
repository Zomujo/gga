// Mock API for GGA Governance System
// This simulates the backend API with comprehensive mock data for demo purposes

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3305/api/v1";

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

export interface ApiUser {
  id: string;
  email: string;
  fullName: string;
  username?: string;
  role: "district_officer" | "admin" | "navigator";
  district?: string | null;
}

export interface ApiComplaint {
  id: string;
  code: string;
  // Citizen Information
  fullName?: string;
  age?: number;
  gender?: "male" | "female" | "other" | string;
  assistiveDevice?: string;
  otherAssistiveDevice?: string | null;
  // Contact Information
  phoneNumber: string;
  caregiverPhoneNumber?: string;
  language?: string;
  // Issue Classification
  category:
    | "roads_infrastructure"
    | "water_sanitation"
    | "electricity_energy"
    | "waste_management"
    | "healthcare_services"
    | "education_services"
    | "public_safety"
    | "market_commerce"
    | "environmental_issues"
    | "other";
  otherCategory?: string | null;
  issueTypes?: string[];
  otherIssueType?: string | null;
  // Request Information
  requestType?: string;
  otherRequest?: string | null;
  // Location & Details
  district: "assembly_a" | "assembly_b" | "assembly_c";
  description?: string;
  status: "pending" | "in_progress" | "resolved" | "rejected" | "escalated";
  assignedToId?: string | null;
  assignedTo?: ApiUser;
  createdById?: string | null;
  createdBy?: ApiUser;
  expectedResolutionDate?: string | null;
  respondedAt?: string | null;
  escalatedAt?: string | null;
  escalationReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AuthResponse {
  user: ApiUser;
  accessToken: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================

// Mock Users
const mockUsers: ApiUser[] = [
  // Public/Anonymous user for citizen submissions
  {
    id: "public",
    email: "public@system.gga",
    fullName: "Public Citizen",
    role: "navigator",
    district: null,
  },
  // Admins
  {
    id: "admin-1",
    email: "admin@gga.org",
    fullName: "Sarah Administrator",
    role: "admin",
    district: null,
  },
  {
    id: "admin-2",
    email: "coordinator@gga.org",
    fullName: "Michael Coordinator",
    role: "admin",
    district: null,
  },
  // District Officers - Assembly A
  {
    id: "officer-a1",
    email: "officer.a1@assembly-a.gov",
    fullName: "John Officer",
    role: "district_officer",
    district: "assembly_a",
  },
  {
    id: "officer-a2",
    email: "officer.a2@assembly-a.gov",
    fullName: "Mary Smith",
    role: "district_officer",
    district: "assembly_a",
  },
  // District Officers - Assembly B
  {
    id: "officer-b1",
    email: "officer.b1@assembly-b.gov",
    fullName: "David Johnson",
    role: "district_officer",
    district: "assembly_b",
  },
  {
    id: "officer-b2",
    email: "officer.b2@assembly-b.gov",
    fullName: "Grace Williams",
    role: "district_officer",
    district: "assembly_b",
  },
  // District Officers - Assembly C
  {
    id: "officer-c1",
    email: "officer.c1@assembly-c.gov",
    fullName: "Peter Brown",
    role: "district_officer",
    district: "assembly_c",
  },
  // Navigators - Assembly A
  {
    id: "nav-a1",
    email: "navigator.a1@gga.org",
    fullName: "Alice Navigator",
    role: "navigator",
    district: "assembly_a",
  },
  {
    id: "nav-a2",
    email: "navigator.a2@gga.org",
    fullName: "Bob Field",
    role: "navigator",
    district: "assembly_a",
  },
  // Navigators - Assembly B
  {
    id: "nav-b1",
    email: "navigator.b1@gga.org",
    fullName: "Carol Community",
    role: "navigator",
    district: "assembly_b",
  },
  {
    id: "nav-b2",
    email: "navigator.b2@gga.org",
    fullName: "Daniel Outreach",
    role: "navigator",
    district: "assembly_b",
  },
  // Navigators - Assembly C
  {
    id: "nav-c1",
    email: "navigator.c1@gga.org",
    fullName: "Emma Service",
    role: "navigator",
    district: "assembly_c",
  },
];

// Mock Complaints/Cases
let mockComplaints: ApiComplaint[] = [
  // Assembly A Cases (High Volume - 45 cases)
  {
    id: "case-a001",
    code: "GGA-A-001",
    fullName: "Kwame Mensah",
    phoneNumber: "+233241234567",
    category: "roads_infrastructure",
    district: "assembly_a",
    description: "Large pothole on Main Street near the market causing damage to vehicles",
    status: "in_progress",
    assignedToId: "officer-a1",
    createdById: "nav-a1",
    expectedResolutionDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    respondedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "case-a002",
    code: "GGA-A-002",
    fullName: "Ama Osei",
    phoneNumber: "+233242345678",
    category: "water_sanitation",
    district: "assembly_a",
    description: "No water supply in Community 5 for 3 days",
    status: "escalated",
    assignedToId: "admin-1",
    createdById: "nav-a1",
    escalatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    escalationReason: "Critical issue affecting 500+ households. Requires urgent attention.",
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "case-a003",
    code: "GGA-A-003",
    fullName: "Kofi Asante",
    phoneNumber: "+233243456789",
    category: "waste_management",
    district: "assembly_a",
    description: "Garbage not collected for 2 weeks at Community Center",
    status: "pending",
    createdById: "nav-a2",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "case-a004",
    code: "GGA-A-004",
    fullName: "Abena Owusu",
    phoneNumber: "+233244567890",
    category: "electricity_energy",
    district: "assembly_a",
    description: "Streetlights not working on Park Road for a month",
    status: "resolved",
    assignedToId: "officer-a2",
    createdById: "nav-a1",
    respondedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "case-a005",
    code: "GGA-A-005",
    fullName: "Yaw Boateng",
    phoneNumber: "+233245678901",
    category: "market_commerce",
    district: "assembly_a",
    description: "Market drainage blocked causing flooding during rain",
    status: "in_progress",
    assignedToId: "officer-a1",
    createdById: "nav-a2",
    expectedResolutionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    respondedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  // Assembly B Cases (Medium Volume - 23 cases)
  {
    id: "case-b001",
    code: "GGA-B-001",
    fullName: "Ekow Mensah",
    phoneNumber: "+233246789012",
    category: "healthcare_services",
    district: "assembly_b",
    description: "Clinic closed for 3 days without notice",
    status: "resolved",
    assignedToId: "officer-b1",
    createdById: "nav-b1",
    respondedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "case-b002",
    code: "GGA-B-002",
    fullName: "Afua Osei",
    phoneNumber: "+233247890123",
    category: "education_services",
    district: "assembly_b",
    description: "School building roof leaking badly",
    status: "in_progress",
    assignedToId: "officer-b2",
    createdById: "nav-b1",
    expectedResolutionDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    respondedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "case-b003",
    code: "GGA-B-003",
    fullName: "Kwabena Darko",
    phoneNumber: "+233248901234",
    category: "public_safety",
    district: "assembly_b",
    description: "Dangerous open gutter near school needs covering",
    status: "pending",
    createdById: "nav-b2",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "case-b004",
    code: "GGA-B-004",
    fullName: "Akosua Frimpong",
    phoneNumber: "+233249012345",
    category: "water_sanitation",
    district: "assembly_b",
    description: "Public toilet facility not functioning",
    status: "rejected",
    assignedToId: "officer-b1",
    createdById: "nav-b1",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  // Assembly C Cases (Low Volume - 12 cases)
  {
    id: "case-c001",
    code: "GGA-C-001",
    fullName: "Emmanuel Adjei",
    phoneNumber: "+233240123456",
    category: "environmental_issues",
    district: "assembly_c",
    description: "Illegal dumping site near residential area",
    status: "in_progress",
    assignedToId: "officer-c1",
    createdById: "nav-c1",
    expectedResolutionDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    respondedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "case-c002",
    code: "GGA-C-002",
    fullName: "Esi Quaye",
    phoneNumber: "+233241234560",
    category: "roads_infrastructure",
    district: "assembly_c",
    description: "Bridge requires repair after recent floods",
    status: "resolved",
    assignedToId: "officer-c1",
    createdById: "nav-c1",
    respondedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "case-c003",
    code: "GGA-C-003",
    fullName: "Kwesi Nkrumah",
    phoneNumber: "+233242345671",
    category: "electricity_energy",
    district: "assembly_c",
    description: "Frequent power outages in northern sector",
    status: "pending",
    createdById: "nav-c1",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Generate additional cases to reach target numbers
const generateAdditionalCases = () => {
  const categories = [
    "roads_infrastructure",
    "water_sanitation",
    "electricity_energy",
    "waste_management",
    "healthcare_services",
    "education_services",
    "public_safety",
    "market_commerce",
    "environmental_issues",
  ] as const;

  const statuses = ["pending", "in_progress", "resolved", "rejected"] as const;

  const descriptions: Record<string, string[]> = {
    roads_infrastructure: [
      "Road needs repair",
      "Speed bumps needed",
      "Road markings faded",
      "Bridge maintenance required",
    ],
    water_sanitation: [
      "Pipe burst in area",
      "Water pressure too low",
      "Drainage blocked",
      "Sewer overflow issue",
    ],
    waste_management: [
      "Bins overflowing",
      "Collection schedule inconsistent",
      "Illegal dumping reported",
      "Need more waste bins",
    ],
    electricity_energy: [
      "Power outage frequent",
      "Transformer issues",
      "Streetlights needed",
      "Cable hanging dangerously",
    ],
    healthcare_services: [
      "Clinic understaffed",
      "Medicine shortage",
      "Long wait times",
      "Facility needs cleaning",
    ],
    education_services: [
      "School needs desks",
      "Classroom overcrowded",
      "Library inadequate",
      "Sports facilities poor",
    ],
    public_safety: [
      "Crime rate increased",
      "Street lighting poor",
      "Security patrol needed",
      "Emergency access blocked",
    ],
    market_commerce: [
      "Market stalls damaged",
      "Sanitation poor",
      "Price exploitation",
      "Access roads bad",
    ],
    environmental_issues: [
      "Trees need trimming",
      "Park needs maintenance",
      "Pollution complaint",
      "Noise levels high",
    ],
  };

  let caseNumber = {
    assembly_a: 6,
    assembly_b: 5,
    assembly_c: 4,
  };

  const targetCounts = {
    assembly_a: 45,
    assembly_b: 23,
    assembly_c: 12,
  };

  for (const district of ["assembly_a", "assembly_b", "assembly_c"] as const) {
    const currentCount = mockComplaints.filter(c => c.district === district).length;
    const needCount = targetCounts[district] - currentCount;

    for (let i = 0; i < needCount; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const descList = descriptions[category];
      const description = descList[Math.floor(Math.random() * descList.length)];

      const navigators = mockUsers.filter(
        u => u.role === "navigator" && u.district === district
      );
      const officers = mockUsers.filter(
        u => u.role === "district_officer" && u.district === district
      );

      const createdBy = navigators[Math.floor(Math.random() * navigators.length)];
      const assignedTo =
        status !== "pending"
          ? officers[Math.floor(Math.random() * officers.length)]
          : undefined;

      const daysAgo = Math.floor(Math.random() * 60) + 1;
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

      mockComplaints.push({
        id: `case-${district.slice(-1)}${String(caseNumber[district]).padStart(3, "0")}`,
        code: `GGA-${district.slice(-1).toUpperCase()}-${String(caseNumber[district]).padStart(3, "0")}`,
        fullName: `Citizen ${caseNumber[district]}`,
        phoneNumber: `+23324${Math.floor(Math.random() * 10000000)}`,
        category,
        district,
        description,
        status,
        assignedToId: assignedTo?.id,
        createdById: createdBy.id,
        expectedResolutionDate:
          status === "in_progress"
            ? new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString()
            : undefined,
        respondedAt:
          status !== "pending"
            ? new Date(createdAt.getTime() + Math.random() * 2 * 24 * 60 * 60 * 1000).toISOString()
            : undefined,
        createdAt: createdAt.toISOString(),
        updatedAt: new Date(
          createdAt.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000
        ).toISOString(),
      });

      caseNumber[district]++;
    }
  }
};

generateAdditionalCases();

// Generate additional mock data for analytics (60 more cases across 60 days)
const generateAdditionalMockCases = (): ApiComplaint[] => {
  const categories = [
    "roads_infrastructure",
    "water_sanitation",
    "electricity_energy",
    "waste_management",
    "healthcare_services",
    "education_services",
    "public_safety",
    "market_commerce",
    "environmental_issues",
  ];
  const statuses: ("pending" | "in_progress" | "resolved" | "rejected" | "escalated")[] = [
    "pending",
    "in_progress",
    "resolved",
    "rejected",
    "escalated",
  ];
  const districts: ("assembly_a" | "assembly_b" | "assembly_c")[] = [
    "assembly_a",
    "assembly_b",
    "assembly_c",
  ];
  const navigatorIds = ["nav-a1", "nav-a2", "nav-b1", "nav-b2", "nav-c1"];
  const officerIds = ["officer-a1", "officer-a2", "officer-b1", "officer-b2", "officer-c1"];

  const additionalCases: ApiComplaint[] = [];

  for (let i = 0; i < 60; i++) {
    const daysAgo = 60 - i; // Spread cases across 60 days
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    const category = categories[i % categories.length];
    const district = districts[i % districts.length];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const navigatorId = navigatorIds[i % navigatorIds.length];
    const officerId = status !== "pending" ? officerIds[i % officerIds.length] : undefined;

    // Generate response time (1-72 hours for responded cases)
    const responseHours = Math.floor(Math.random() * 72) + 1;
    const respondedAt =
      status !== "pending"
        ? new Date(createdAt.getTime() + responseHours * 60 * 60 * 1000)
        : undefined;

    // Generate resolution time (3-30 days for resolved cases)
    const resolutionDays = Math.floor(Math.random() * 28) + 3;
    const resolvedAt =
      status === "resolved"
        ? new Date(createdAt.getTime() + resolutionDays * 24 * 60 * 60 * 1000)
        : new Date(Date.now() - Math.floor(Math.random() * 24) * 60 * 60 * 1000);

    // Generate escalation date (5-15 days after creation for escalated)
    const escalationDays = Math.floor(Math.random() * 10) + 5;
    const escalatedAt =
      status === "escalated"
        ? new Date(createdAt.getTime() + escalationDays * 24 * 60 * 60 * 1000)
        : undefined;

    additionalCases.push({
      id: `case-gen-${i + 1}`,
      code: `GGA-G-${String(i + 1).padStart(3, "0")}`,
      fullName: `Citizen ${i + 1}`,
      phoneNumber: `+23324${String(i).padStart(7, "0")}`,
      category: category as any,
      district: district,
      description: `Generated case for ${category.replace(/_/g, " ")}`,
      status: status,
      assignedToId: officerId,
      createdById: navigatorId,
      respondedAt: respondedAt?.toISOString(),
      escalatedAt: escalatedAt?.toISOString(),
      escalationReason:
        status === "escalated" ? "Requires higher level attention" : undefined,
      createdAt: createdAt.toISOString(),
      updatedAt: resolvedAt.toISOString(),
    });
  }

  return additionalCases;
};

// Add generated cases to mock complaints
mockComplaints = [...mockComplaints, ...generateAdditionalMockCases()];

// Hydrate user references
mockComplaints = mockComplaints.map((complaint) => {
  const assignedTo = complaint.assignedToId
    ? mockUsers.find((u) => u.id === complaint.assignedToId)
    : undefined;
  const createdBy = complaint.createdById
    ? mockUsers.find((u) => u.id === complaint.createdById)
    : undefined;
  return { ...complaint, assignedTo, createdBy };
});

// ============================================================================
// MOCK API FUNCTIONS
// ============================================================================

// Simulate network delay
const delay = (ms: number = 500) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to convert category code to readable label
const getCategoryLabel = (category: string): string => {
  return category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  await delay();

  const user = mockUsers.find((u) => u.email === input.email);
  if (!user) {
    throw new ApiError("Invalid credentials", 401);
  }

  return {
    user,
    accessToken: `mock-token-${user.id}`,
  };
}

export async function registerUser(input: {
  email: string;
  password: string;
  fullName: string;
  role?: "district_officer" | "admin" | "navigator";
  district?: "assembly_a" | "assembly_b" | "assembly_c";
}): Promise<AuthResponse> {
  await delay();

  const existingUser = mockUsers.find((u) => u.email === input.email);
  if (existingUser) {
    throw new ApiError("Email already exists", 400);
  }

  const newUser: ApiUser = {
    id: `user-${Date.now()}`,
    email: input.email,
    fullName: input.fullName,
    role: input.role || "navigator",
    district: input.district || null,
  };

  mockUsers.push(newUser);

  return {
    user: newUser,
    accessToken: `mock-token-${newUser.id}`,
  };
}

export async function getProfile(token: string): Promise<ApiUser> {
  await delay();

  const userId = token.replace("mock-token-", "");
  const user = mockUsers.find((u) => u.id === userId);

  if (!user) {
    throw new ApiError("Unauthorized", 401);
  }

  return user;
}

export async function getComplaints(
  token: string,
  options?: { district?: string; page?: number; pageSize?: number }
): Promise<{
  rows: ApiComplaint[];
  total: number;
  page: number;
  pageSize: number;
}> {
  await delay();

  let filtered = [...mockComplaints];

  if (options?.district) {
    filtered = filtered.filter((c) => c.district === options.district);
  }

  // Sort by most recent first
  filtered.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const page = options?.page || 1;
  const pageSize = options?.pageSize || 10;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return {
    rows: filtered.slice(start, end),
    total: filtered.length,
    page,
    pageSize,
  };
}

export async function getComplaint(
  token: string,
  id: string
): Promise<ApiComplaint> {
  await delay();

  const complaint = mockComplaints.find((c) => c.id === id);
  if (!complaint) {
    throw new ApiError("Complaint not found", 404);
  }

  return complaint;
}

export async function getUser(token: string, id: string): Promise<ApiUser> {
  await delay();

  const user = mockUsers.find((u) => u.id === id);
  if (!user) {
    throw new ApiError("User not found", 404);
  }

  return user;
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
  await delay();

  const userId = token.replace("mock-token-", "");
  let user = mockUsers.find((u) => u.id === userId);

  // Allow public submissions (citizen portal)
  if (!user && userId === "public") {
    user = mockUsers.find((u) => u.id === "public");
  }

  if (!user) {
    throw new ApiError("Unauthorized", 401);
  }

  const district = input.district as "assembly_a" | "assembly_b" | "assembly_c";
  const districtLetter = district.slice(-1).toUpperCase();
  const districtCases = mockComplaints.filter((c) => c.district === district);
  const nextNumber = districtCases.length + 1;
  const code = `GGA-${districtLetter}-${String(nextNumber).padStart(3, "0")}`;

  const newComplaint: ApiComplaint = {
    id: `case-${Date.now()}`,
    code,
    phoneNumber: input.phoneNumber,
    category: input.category as ApiComplaint["category"],
    otherCategory: input.otherCategory,
    district,
    description: input.description,
    status: "pending",
    createdById: user.id,
    createdBy: user,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockComplaints.unshift(newComplaint);

  return { code };
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
  await delay();

  const userId = token.replace("mock-token-", "");
  const user = mockUsers.find((u) => u.id === userId);

  if (!user) {
    throw new ApiError("Unauthorized", 401);
  }

  const district = input.district as "assembly_a" | "assembly_b" | "assembly_c";
  const districtLetter = district.slice(-1).toUpperCase();
  const districtCases = mockComplaints.filter((c) => c.district === district);
  const nextNumber = districtCases.length + 1;
  const code = options?.code || `GGA-${districtLetter}-${String(nextNumber).padStart(3, "0")}`;

  const newComplaint: ApiComplaint = {
    id: `case-${Date.now()}`,
    code,
    fullName: input.fullName,
    age: input.age,
    gender: input.gender,
    phoneNumber: input.phoneNumber,
    caregiverPhoneNumber: input.caregiverPhoneNumber,
    language: input.language,
    category: input.category as ApiComplaint["category"],
    otherCategory: input.otherCategory,
    issueTypes: input.issueTypes,
    otherIssueType: input.otherIssueType,
    requestType: input.requestType,
    otherRequest: input.otherRequest,
    district,
    description: input.description,
    status: "pending",
    createdById: user.id,
    createdBy: user,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockComplaints.unshift(newComplaint);

  return { code };
}

export async function getNavigators(token: string): Promise<{
  rows: ApiUser[];
}> {
  await delay();

  const navigators = mockUsers.filter((u) => u.role === "navigator");
  return { rows: navigators };
}

export async function getDistrictOfficers(
  token: string,
  district?: string
): Promise<{
  rows: ApiUser[];
}> {
  await delay();

  let officers = mockUsers.filter((u) => u.role === "district_officer");

  if (district) {
    officers = officers.filter((u) => u.district === district);
  }

  return { rows: officers };
}

export async function getAdmins(token: string): Promise<{
  rows: ApiUser[];
}> {
  await delay();

  const admins = mockUsers.filter((u) => u.role === "admin");
  return { rows: admins };
}

export async function assignComplaint(
  token: string,
  complaintId: string,
  input: {
    assignedToId: string;
    expectedResolutionDate?: string;
  }
): Promise<ApiComplaint> {
  await delay();

  const complaintIndex = mockComplaints.findIndex((c) => c.id === complaintId);
  if (complaintIndex === -1) {
    throw new ApiError("Complaint not found", 404);
  }

  const assignedTo = mockUsers.find((u) => u.id === input.assignedToId);

  mockComplaints[complaintIndex] = {
    ...mockComplaints[complaintIndex],
    assignedToId: input.assignedToId,
    assignedTo,
    expectedResolutionDate: input.expectedResolutionDate,
    status: "in_progress",
    respondedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return mockComplaints[complaintIndex];
}

export async function escalateComplaint(
  token: string,
  complaintId: string,
  input: {
    assignedToId: string;
    escalationReason: string;
  }
): Promise<ApiComplaint> {
  await delay();

  const complaintIndex = mockComplaints.findIndex((c) => c.id === complaintId);
  if (complaintIndex === -1) {
    throw new ApiError("Complaint not found", 404);
  }

  const assignedTo = mockUsers.find((u) => u.id === input.assignedToId);

  mockComplaints[complaintIndex] = {
    ...mockComplaints[complaintIndex],
    assignedToId: input.assignedToId,
    assignedTo,
    escalationReason: input.escalationReason,
    status: "escalated",
    escalatedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return mockComplaints[complaintIndex];
}

export async function updateComplaintStatus(
  token: string,
  complaintId: string,
  input: {
    status: "pending" | "in_progress" | "resolved" | "rejected" | "escalated";
  }
): Promise<ApiComplaint> {
  await delay();

  const complaintIndex = mockComplaints.findIndex((c) => c.id === complaintId);
  if (complaintIndex === -1) {
    throw new ApiError("Complaint not found", 404);
  }

  mockComplaints[complaintIndex] = {
    ...mockComplaints[complaintIndex],
    status: input.status,
    updatedAt: new Date().toISOString(),
  };

  return mockComplaints[complaintIndex];
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
  await delay();

  let cases = mockComplaints;

  if (options?.district) {
    cases = cases.filter((c) => c.district === options.district);
  }

  // Current week calculations
  const activeCases = cases.filter((c) =>
    ["pending", "in_progress", "escalated"].includes(c.status)
  ).length;

  const resolvedCases = cases.filter((c) => c.status === "resolved").length;
  const totalCases = cases.length;
  const resolutionRate = totalCases > 0 ? (resolvedCases / totalCases) * 100 : 0;

  // Calculate average response time
  const respondedCases = cases.filter((c) => c.respondedAt);
  const totalResponseTime = respondedCases.reduce((sum, c) => {
    const created = new Date(c.createdAt).getTime();
    const responded = new Date(c.respondedAt!).getTime();
    return sum + (responded - created);
  }, 0);
  const avgResponseHours =
    respondedCases.length > 0
      ? totalResponseTime / respondedCases.length / (1000 * 60 * 60)
      : 0;

  // Calculate overdue cases (pending for more than 7 days)
  const overdueCases = cases.filter((c) => {
    if (c.status !== "pending") return false;
    const created = new Date(c.createdAt).getTime();
    const now = Date.now();
    const daysOld = (now - created) / (1000 * 60 * 60 * 24);
    return daysOld > 7;
  }).length;

  // Last week calculations (cases created/updated 7-14 days ago)
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;

  const lastWeekCases = cases.filter((c) => {
    const created = new Date(c.createdAt).getTime();
    return created >= twoWeeksAgo && created < oneWeekAgo;
  });

  const lastWeekActiveCases = lastWeekCases.filter((c) =>
    ["pending", "in_progress", "escalated"].includes(c.status)
  ).length;

  const lastWeekResolvedCases = lastWeekCases.filter((c) => c.status === "resolved").length;
  const lastWeekTotalCases = lastWeekCases.length;
  const lastWeekResolutionRate =
    lastWeekTotalCases > 0 ? (lastWeekResolvedCases / lastWeekTotalCases) * 100 : 0;

  const lastWeekRespondedCases = lastWeekCases.filter((c) => c.respondedAt);
  const lastWeekTotalResponseTime = lastWeekRespondedCases.reduce((sum, c) => {
    const created = new Date(c.createdAt).getTime();
    const responded = new Date(c.respondedAt!).getTime();
    return sum + (responded - created);
  }, 0);
  const lastWeekAvgResponseHours =
    lastWeekRespondedCases.length > 0
      ? lastWeekTotalResponseTime / lastWeekRespondedCases.length / (1000 * 60 * 60)
      : 0;

  const lastWeekOverdueCases = lastWeekCases.filter((c) => {
    if (c.status !== "pending") return false;
    const created = new Date(c.createdAt).getTime();
    const daysOld = (Date.now() - created) / (1000 * 60 * 60 * 24);
    return daysOld > 7;
  }).length;

  return {
    activeCases,
    avgResponseHours: Math.round(avgResponseHours * 10) / 10,
    resolutionRate: Math.round(resolutionRate * 10) / 10,
    overdueCases,
    activeCasesChange: activeCases - lastWeekActiveCases,
    avgResponseHoursChange: Math.round((avgResponseHours - lastWeekAvgResponseHours) * 10) / 10,
    resolutionRateChange: Math.round((resolutionRate - lastWeekResolutionRate) * 10) / 10,
    overdueCasesChange: overdueCases - lastWeekOverdueCases,
  };
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
  options?: {
    district?: string;
    page?: number;
    pageSize?: number;
  }
): Promise<NavigatorUpdate[]> {
  await delay();

  let cases = mockComplaints;

  if (options?.district) {
    cases = cases.filter((c) => c.district === options.district);
  }

  // Get recent updates (cases updated in last 7 days)
  const recentUpdates = cases
    .filter((c) => {
      const updated = new Date(c.updatedAt).getTime();
      const now = Date.now();
      const daysAgo = (now - updated) / (1000 * 60 * 60 * 24);
      return daysAgo <= 7;
    })
    .slice(0, options?.pageSize || 10);

  return recentUpdates.map((c) => ({
    id: `update-${c.id}`,
    complaintId: c.id,
    complaintTitle: `Case ${c.code}`,
    navigatorName: c.createdBy?.fullName || "Unknown",
    navigatorEmail: c.createdBy?.email || "",
    oldStatus: "pending",
    newStatus: c.status,
    updatedAt: c.updatedAt,
  }));
}

export async function getOverdueComplaints(
  token: string
): Promise<ApiComplaint[]> {
  await delay();

  const overdue = mockComplaints.filter((c) => {
    if (c.status !== "pending" && c.status !== "in_progress") return false;
    const created = new Date(c.createdAt).getTime();
    const now = Date.now();
    const daysOld = (now - created) / (1000 * 60 * 60 * 24);
    return daysOld > 7;
  });

  return overdue;
}

// Analytics & Chart Data Functions
export async function getCasesByAssembly(
  token: string
): Promise<{ assembly: string; total: number; pending: number; inProgress: number; resolved: number; rejected: number }[]> {
  await delay(200);

  const assemblies = ["assembly_a", "assembly_b", "assembly_c"];
  
  return assemblies.map((assembly) => {
    const cases = mockComplaints.filter((c) => c.district === assembly);
    return {
      assembly: assembly === "assembly_a" ? "Assembly A" : assembly === "assembly_b" ? "Assembly B" : "Assembly C",
      total: cases.length,
      pending: cases.filter((c) => c.status === "pending").length,
      inProgress: cases.filter((c) => c.status === "in_progress").length,
      resolved: cases.filter((c) => c.status === "resolved").length,
      rejected: cases.filter((c) => c.status === "rejected").length,
    };
  });
}

export async function getCasesByCategory(
  token: string,
  district?: string
): Promise<{ category: string; count: number }[]> {
  await delay(200);

  let cases = mockComplaints;
  if (district) {
    cases = cases.filter((c) => c.district === district);
  }

  const categoryMap: Record<string, number> = {};
  cases.forEach((c) => {
    const categoryLabel = c.category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    categoryMap[categoryLabel] = (categoryMap[categoryLabel] || 0) + 1;
  });

  return Object.entries(categoryMap)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getCasesByStatus(
  token: string,
  district?: string
): Promise<{ status: string; count: number; percentage: number }[]> {
  await delay(200);

  let cases = mockComplaints;
  if (district) {
    cases = cases.filter((c) => c.district === district);
  }

  const total = cases.length;
  const statusMap: Record<string, number> = {};
  
  cases.forEach((c) => {
    const statusLabel = c.status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    statusMap[statusLabel] = (statusMap[statusLabel] || 0) + 1;
  });

  return Object.entries(statusMap).map(([status, count]) => ({
    status,
    count,
    percentage: Math.round((count / total) * 100),
  }));
}

export async function getCasesTrend(
  token: string,
  district?: string
): Promise<{ date: string; submitted: number; resolved: number }[]> {
  await delay(200);

  let cases = mockComplaints;
  if (district) {
    cases = cases.filter((c) => c.district === district);
  }

  // Group by last 30 days
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date;
  });

  return last30Days.map((date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const submitted = cases.filter((c) => {
      const created = new Date(c.createdAt);
      return created >= dayStart && created <= dayEnd;
    }).length;

    const resolved = cases.filter((c) => {
      if (c.status !== "resolved") return false;
      const updated = new Date(c.updatedAt);
      return updated >= dayStart && updated <= dayEnd;
    }).length;

    return {
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      submitted,
      resolved,
    };
  });
}

export async function getAssemblyPerformance(
  token: string
): Promise<{ assembly: string; resolutionRate: number; avgResponseHours: number; activeCases: number }[]> {
  await delay(200);

  const assemblies = ["assembly_a", "assembly_b", "assembly_c"];

  return assemblies.map((assembly) => {
    const cases = mockComplaints.filter((c) => c.district === assembly);
    const resolved = cases.filter((c) => c.status === "resolved").length;
    const resolutionRate = cases.length > 0 ? Math.round((resolved / cases.length) * 100) : 0;

    const respondedCases = cases.filter((c) => c.respondedAt);
    const totalResponseTime = respondedCases.reduce((sum, c) => {
      const created = new Date(c.createdAt).getTime();
      const responded = new Date(c.respondedAt!).getTime();
      return sum + (responded - created);
    }, 0);
    const avgResponseHours =
      respondedCases.length > 0
        ? Math.round((totalResponseTime / respondedCases.length / (1000 * 60 * 60)) * 10) / 10
        : 0;

    const activeCases = cases.filter((c) =>
      ["pending", "in_progress", "escalated"].includes(c.status)
    ).length;

    return {
      assembly: assembly === "assembly_a" ? "Assembly A" : assembly === "assembly_b" ? "Assembly B" : "Assembly C",
      resolutionRate,
      avgResponseHours,
      activeCases,
    };
  });
}

// Response Time Distribution - categorize cases by response time buckets
export async function getResponseTimeDistribution(
  token: string,
  district?: string
): Promise<{ bucket: string; count: number }[]> {
  await delay(200);

  let cases = mockComplaints.filter((c) => c.respondedAt);
  if (district) {
    cases = cases.filter((c) => c.district === district);
  }

  const buckets = {
    "0-6h": 0,
    "6-12h": 0,
    "12-24h": 0,
    "1-3d": 0,
    "3-7d": 0,
    "7d+": 0,
  };

  cases.forEach((c) => {
    const created = new Date(c.createdAt).getTime();
    const responded = new Date(c.respondedAt!).getTime();
    const hours = (responded - created) / (1000 * 60 * 60);

    if (hours <= 6) buckets["0-6h"]++;
    else if (hours <= 12) buckets["6-12h"]++;
    else if (hours <= 24) buckets["12-24h"]++;
    else if (hours <= 72) buckets["1-3d"]++;
    else if (hours <= 168) buckets["3-7d"]++;
    else buckets["7d+"]++;
  });

  return Object.entries(buckets).map(([bucket, count]) => ({ bucket, count }));
}

// Resolution Time by Category
export async function getResolutionTimeByCategory(
  token: string,
  district?: string
): Promise<{ category: string; avgDays: number; count: number }[]> {
  await delay(200);

  let cases = mockComplaints.filter((c) => c.status === "resolved");
  if (district) {
    cases = cases.filter((c) => c.district === district);
  }

  const categoryMap: Record<string, { totalTime: number; count: number }> = {};

  cases.forEach((c) => {
    const category = getCategoryLabel(c.category);
    const created = new Date(c.createdAt).getTime();
    const updated = new Date(c.updatedAt).getTime();
    const days = (updated - created) / (1000 * 60 * 60 * 24);

    if (!categoryMap[category]) {
      categoryMap[category] = { totalTime: 0, count: 0 };
    }
    categoryMap[category].totalTime += days;
    categoryMap[category].count++;
  });

  return Object.entries(categoryMap)
    .map(([category, data]) => ({
      category,
      avgDays: Math.round((data.totalTime / data.count) * 10) / 10,
      count: data.count,
    }))
    .sort((a, b) => b.avgDays - a.avgDays);
}

// District Officer Performance
export async function getDistrictOfficerPerformance(
  token: string
): Promise<{ name: string; totalCases: number; resolved: number; avgResponseHours: number; resolutionRate: number }[]> {
  await delay(200);

  const officers = mockUsers.filter((u) => u.role === "district_officer");

  return officers.map((officer) => {
    const cases = mockComplaints.filter((c) => c.assignedToId === officer.id);
    const resolved = cases.filter((c) => c.status === "resolved").length;
    const resolutionRate = cases.length > 0 ? Math.round((resolved / cases.length) * 100) : 0;

    const respondedCases = cases.filter((c) => c.respondedAt);
    const totalResponseTime = respondedCases.reduce((sum, c) => {
      const created = new Date(c.createdAt).getTime();
      const responded = new Date(c.respondedAt!).getTime();
      return sum + (responded - created);
    }, 0);
    const avgResponseHours =
      respondedCases.length > 0
        ? Math.round((totalResponseTime / respondedCases.length / (1000 * 60 * 60)) * 10) / 10
        : 0;

    return {
      name: officer.fullName,
      totalCases: cases.length,
      resolved,
      avgResponseHours,
      resolutionRate,
    };
  }).sort((a, b) => b.resolutionRate - a.resolutionRate);
}

// Weekly Activity Pattern - cases by day of week
export async function getWeeklyActivityPattern(
  token: string,
  district?: string
): Promise<{ day: string; submitted: number; resolved: number }[]> {
  await delay(200);

  let cases = mockComplaints;
  if (district) {
    cases = cases.filter((c) => c.district === district);
  }

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayMap: Record<string, { submitted: number; resolved: number }> = {};

  days.forEach((day) => {
    dayMap[day] = { submitted: 0, resolved: 0 };
  });

  cases.forEach((c) => {
    const createdDay = days[new Date(c.createdAt).getDay()];
    dayMap[createdDay].submitted++;

    if (c.status === "resolved") {
      const resolvedDay = days[new Date(c.updatedAt).getDay()];
      dayMap[resolvedDay].resolved++;
    }
  });

  return days.map((day) => ({
    day: day.substring(0, 3), // Mon, Tue, etc.
    submitted: dayMap[day].submitted,
    resolved: dayMap[day].resolved,
  }));
}

// Escalation Analytics
export async function getEscalationAnalytics(
  token: string,
  district?: string
): Promise<{
  totalEscalated: number;
  escalationRate: number;
  byCategory: { category: string; count: number; percentage: number }[];
  avgDaysBeforeEscalation: number;
}> {
  await delay(200);

  let allCases = mockComplaints;
  if (district) {
    allCases = allCases.filter((c) => c.district === district);
  }

  const escalatedCases = allCases.filter((c) => c.status === "escalated" || c.escalatedAt);
  const escalationRate = allCases.length > 0 ? Math.round((escalatedCases.length / allCases.length) * 100) : 0;

  // By category
  const categoryMap: Record<string, number> = {};
  escalatedCases.forEach((c) => {
    const category = getCategoryLabel(c.category);
    categoryMap[category] = (categoryMap[category] || 0) + 1;
  });

  const byCategory = Object.entries(categoryMap)
    .map(([category, count]) => ({
      category,
      count,
      percentage: Math.round((count / escalatedCases.length) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  // Average days before escalation
  const casesWithEscalationDate = escalatedCases.filter((c) => c.escalatedAt);
  const totalDays = casesWithEscalationDate.reduce((sum, c) => {
    const created = new Date(c.createdAt).getTime();
    const escalated = new Date(c.escalatedAt!).getTime();
    return sum + (escalated - created) / (1000 * 60 * 60 * 24);
  }, 0);
  const avgDaysBeforeEscalation =
    casesWithEscalationDate.length > 0
      ? Math.round((totalDays / casesWithEscalationDate.length) * 10) / 10
      : 0;

  return {
    totalEscalated: escalatedCases.length,
    escalationRate,
    byCategory,
    avgDaysBeforeEscalation,
  };
}

export { ApiError };

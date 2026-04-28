export const tabs = [
  { id: "monitoring", label: "Dashboard" },
  { id: "staff_dashboard", label: "My Dashboard" },
  { id: "cases", label: "Cases" },
  { id: "locations", label: "Locations" },
  { id: "ussd", label: "USSD Flow" },
];

export const baseFlow = [
  {
    level: "L0",
    title: "Location selection",
    prompt:
      "Welcome to GGA Governance! Select your location:\n1. Location A\n2. Location B\n3. Location C",
    userAction: "Input: 2",
    rationale: "Fast routing. User only needs location number.",
  },
  {
    level: "L1",
    title: "Main menu",
      prompt:
        "How can we help?\n1. Report a service issue\n2. Track my case\n3. Speak to an officer",
    userAction: "",
    rationale: "Clear choices, option 3 hands off to human quickly.",
  },
];

export const ussdPaths = {
  report: [
    {
      level: "L2",
      title: "Issue & details",
      prompt:
        "Select the service issue:\n1. Roads & Infrastructure\n2. Water & Sanitation\n3. Waste Management\n4. Electricity\n5. Healthcare\n6. Other\nThen type brief details (50 chars).",
      userAction: "Input: 1 and detail (e.g., Pothole on Main Street).",
      rationale:
        "Combines category selection + short context to keep flow efficient.",
    },
    {
      level: "L3",
      title: "Confirmation",
      prompt:
        "Thank you! Report logged (Case Code: [XXXXXXXXXX]). An officer will review your case.",
      userAction: "Session ends",
      rationale: "Positive feedback that report succeeded.",
    },
  ],
  info: [
    {
      level: "L2",
      title: "Select topic",
      prompt:
        "Choose a frequently asked question:\n1. How long for resolution?\n2. Are there any fees?\n3. Who handles my case?",
      userAction: "Input: 1, 2, or 3",
      rationale: "Keeps the info menu short and memorable for USSD users.",
    },
    {
      level: "L3",
      title: "Share answer + next step",
      prompt:
        "Display the answer for the selected topic.\nOffer option: 'Press 1 to speak to an officer if you still need help.'",
      userAction: "Input: 1 to connect with officer or 0 to end session",
      rationale: "Allows user to transition to human support seamlessly.",
    },
  ],
  navigator: [
    {
      level: "L2",
      title: "Officer connect",
      prompt:
        "You selected Speak to an Officer. We will call you back within 15 minutes. Press 1 to confirm.",
      userAction: "Input: 1",
      rationale: "Reduces anxiety; call comes to the user.",
    },
    {
      level: "L3",
      title: "Call-back trigger",
      prompt: "Confirmed! Please ensure your line is open. Thank you.",
      userAction: "Session ends",
      rationale: "Back-end triggers call from a staff officer.",
    },
  ],
};

export const issueTypeOptions = [
  {
    value: "roads_infrastructure",
    label: "Roads & Infrastructure",
  },
  {
    value: "water_sanitation",
    label: "Water & Sanitation",
  },
  {
    value: "electricity_energy",
    label: "Electricity & Energy",
  },
  {
    value: "waste_management",
    label: "Waste Management",
  },
  {
    value: "healthcare_services",
    label: "Healthcare Services",
  },
  {
    value: "education_services",
    label: "Education Services",
  },
  {
    value: "public_safety",
    label: "Public Safety",
  },
  {
    value: "market_commerce",
    label: "Market & Commerce",
  },
  {
    value: "environmental_issues",
    label: "Environmental Issues",
  },
  {
    value: "documentation_services",
    label: "Documentation Services",
  },
  {
    value: "transportation",
    label: "Transportation",
  },
  { value: "other", label: "Other" },
];

export const categoryOptions = [
  { value: "roads_infrastructure", label: "Roads & Infrastructure" },
  { value: "water_sanitation", label: "Water & Sanitation" },
  { value: "electricity_energy", label: "Electricity & Energy" },
  { value: "waste_management", label: "Waste Management" },
  { value: "healthcare_services", label: "Healthcare Services" },
  { value: "education_services", label: "Education Services" },
  { value: "public_safety", label: "Public Safety" },
  { value: "market_commerce", label: "Market & Commerce" },
  { value: "environmental_issues", label: "Environmental Issues" },
  { value: "other", label: "Other" },
];

export const assistiveDeviceOptions = [
  { value: "none", label: "None" },
  { value: "other", label: "Other" },
];

export const requestTypeOptions = [
  { value: "infrastructure_repair", label: "Infrastructure Repair" },
  { value: "service_restoration", label: "Service Restoration" },
  { value: "new_service_request", label: "New Service Request" },
  { value: "complaint", label: "Complaint" },
  { value: "information_request", label: "Information Request" },
  { value: "emergency", label: "Emergency" },
  { value: "other", label: "Other" },
];

export const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
];

export const statusOptionsWithEscalated = [
  { value: "escalated", label: "Escalated" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
];

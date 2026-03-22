// Filter option constants for search and filter UI
// Single source of truth for all filter dropdowns

export const SCHOOL_TYPES = [
  { value: "public", label: "Public" },
  { value: "charter", label: "Charter" },
  { value: "private", label: "Private" },
  { value: "iu", label: "Intermediate Unit" },
  { value: "cyber", label: "Cyber/Remote" },
] as const;

export const GRADE_BANDS = [
  { value: "prek", label: "PreK" },
  { value: "elementary", label: "Elementary" },
  { value: "middle", label: "Middle School" },
  { value: "high", label: "High School" },
] as const;

// PDE Certification Subject Areas (grouped from official PDE list)
export const SUBJECT_AREAS = [
  { value: "early-childhood", label: "Early Childhood (N-3)" },
  { value: "elementary", label: "Elementary (K-6)" },
  { value: "math", label: "Mathematics (7-12)" },
  { value: "english", label: "English (7-12)" },
  { value: "science-biology", label: "Biology (7-12)" },
  { value: "science-chemistry", label: "Chemistry (7-12)" },
  { value: "science-physics", label: "Physics (7-12)" },
  { value: "science-general", label: "General Science (7-12)" },
  { value: "science-earth", label: "Earth & Space Science (7-12)" },
  { value: "social-studies", label: "Social Studies (7-12)" },
  { value: "special-education", label: "Special Education (PK-12)" },
  { value: "art", label: "Art Education (PK-12)" },
  { value: "music", label: "Music Education (PK-12)" },
  { value: "health-pe", label: "Health & Physical Ed (PK-12)" },
  { value: "world-languages", label: "World Languages (PK-12)" },
  { value: "computer-science", label: "Computer Science (7-12)" },
  { value: "business", label: "Business/Computer/IT (PK-12)" },
  { value: "library", label: "Library Science (PK-12)" },
  { value: "reading-specialist", label: "Reading Specialist (PK-12)" },
  { value: "technology-ed", label: "Technology Education (PK-12)" },
  { value: "career-technical", label: "Career & Technical (7-12)" },
  { value: "esl", label: "ESL Program Specialist" },
  { value: "agriculture", label: "Agriculture (PK-12)" },
  { value: "family-consumer", label: "Family & Consumer Science (PK-12)" },
  { value: "dance", label: "Dance (PK-12)" },
  { value: "environmental", label: "Environmental Education (PK-12)" },
  { value: "other", label: "Other" },
] as const;

// PDE Certificate Types
export const CERTIFICATION_TYPES = [
  { value: "instructional", label: "Instructional (Type 61)" },
  { value: "educational-specialist", label: "Educational Specialist (Type 31)" },
  { value: "administrative", label: "Administrative" },
  { value: "supervisory", label: "Supervisory" },
  { value: "career-technical", label: "Career & Technical" },
  { value: "emergency-permit", label: "Emergency Permit" },
  { value: "intern", label: "Intern Certificate" },
  { value: "not-required", label: "No Certification Required" },
] as const;

// Mapping from certification type filter values to canonical PDE cert names
// stored in the database. Used to expand filter selections before querying.
// Types with empty arrays (emergency-permit, intern, not-required) have no
// canonical cert names -- they rely on the "include unspecified" toggle.
export const CERT_TYPE_TO_NAMES: Record<string, string[]> = {
  "instructional": [
    "Mathematics", "English", "Biology", "Chemistry", "Physics",
    "General Science", "Earth and Space Science", "Social Studies",
    "Spanish", "French", "German", "Chinese", "Latin", "American Sign Language",
    "Elementary Education K-6", "Early Childhood Education PK-4",
    "Middle Level Education 4-8", "Special Education PK-8", "Special Education 7-12",
    "Art Education", "Music Education", "Theatre", "Dance", "Technology Education",
    "Health and Physical Education", "Health Education",
    "Environmental Education", "Citizenship Education",
    "Agriculture", "Family and Consumer Science",
    "ESL Program Specialist", "Gifted Education",
  ],
  "educational-specialist": [
    "School Counselor", "School Nurse", "School Psychologist",
    "School Social Worker", "Speech-Language Pathologist",
    "Reading Specialist", "Library Science",
  ],
  "administrative": [
    "Principal", "Superintendent",
  ],
  "supervisory": [
    "Supervisor", "Special Education Supervisor", "Instructional Coach",
  ],
  "career-technical": [
    "Career and Technical Education", "Business, Computer, Information Technology",
  ],
  "emergency-permit": [],
  "intern": [],
  "not-required": [],
};

export const RADIUS_OPTIONS = {
  min: 5,
  max: 150,
  step: 5,
  default: 25,
} as const;

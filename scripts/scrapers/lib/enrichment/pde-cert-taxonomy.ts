/**
 * Official PDE certification areas for Pennsylvania educators.
 * Source: https://www.pa.gov/agencies/education/programs-and-services/educators/certification/
 *
 * Each entry has a canonical name and optional aliases/variants found in job postings.
 */
export interface CertArea {
  name: string; // Canonical PDE name
  aliases: string[]; // Common variations in job postings
}

export const PDE_CERT_AREAS: CertArea[] = [
  // Core Academic
  { name: "Mathematics", aliases: ["Math", "Mathematics 7-12"] },
  { name: "English", aliases: ["English/Language Arts", "ELA", "English 7-12"] },
  { name: "Biology", aliases: ["Biology 7-12"] },
  { name: "Chemistry", aliases: ["Chemistry 7-12"] },
  { name: "Physics", aliases: ["Physics 7-12"] },
  { name: "General Science", aliases: ["Science 7-12"] },
  { name: "Earth and Space Science", aliases: ["Earth Science"] },
  { name: "Social Studies", aliases: ["Social Studies 7-12"] },

  // World Languages
  { name: "Spanish", aliases: ["Spanish K-12", "Spanish 7-12"] },
  { name: "French", aliases: ["French K-12", "French 7-12"] },
  { name: "German", aliases: ["German K-12"] },
  { name: "Chinese", aliases: ["Mandarin", "Chinese K-12"] },
  { name: "Latin", aliases: [] },
  { name: "American Sign Language", aliases: ["ASL"] },

  // Special Education
  { name: "Special Education PK-8", aliases: ["Special Education", "SpEd PK-8"] },
  { name: "Special Education 7-12", aliases: ["SpEd 7-12", "Special Ed 7-12"] },
  { name: "Special Education Supervisor", aliases: [] },

  // Elementary & Early Childhood
  {
    name: "Elementary Education K-6",
    aliases: ["Elementary Education", "Elementary K-6", "Elementary Ed"],
  },
  {
    name: "Early Childhood Education PK-4",
    aliases: ["Early Childhood", "PreK-4", "PK-4"],
  },
  {
    name: "Middle Level Education 4-8",
    aliases: ["Middle Level", "Middle School 4-8", "Grades 4-8"],
  },

  // Arts
  { name: "Art Education", aliases: ["Art K-12", "Visual Arts"] },
  { name: "Music Education", aliases: ["Music K-12", "Music"] },
  { name: "Theatre", aliases: ["Theater", "Drama"] },
  { name: "Dance", aliases: [] },

  // CTE & Technical
  { name: "Technology Education", aliases: ["Technology Ed", "Tech Ed"] },
  {
    name: "Business, Computer, Information Technology",
    aliases: ["BCIT", "Business Education", "Computer Science"],
  },
  {
    name: "Career and Technical Education",
    aliases: ["Vocational Education"],
  },
  { name: "Agriculture", aliases: ["Agriculture Education", "Ag Education"] },
  {
    name: "Family and Consumer Science",
    aliases: ["Family Consumer Science", "Home Economics"],
  },

  // Health & PE
  {
    name: "Health and Physical Education",
    aliases: ["Health & PE", "Physical Education"],
  },
  { name: "Health Education", aliases: [] },

  // Specialized
  {
    name: "Reading Specialist",
    aliases: ["Literacy Specialist", "Literacy Coach"],
  },
  { name: "Library Science", aliases: ["School Librarian", "Library Media"] },
  { name: "Environmental Education", aliases: [] },
  { name: "Citizenship Education", aliases: ["Civics"] },

  // Support Services
  {
    name: "School Counselor",
    aliases: [
      "Guidance Counselor",
      "Elementary School Counselor",
      "Secondary School Counselor",
    ],
  },
  { name: "School Nurse", aliases: ["Certified School Nurse"] },
  { name: "School Psychologist", aliases: [] },
  { name: "School Social Worker", aliases: [] },
  {
    name: "Speech-Language Pathologist",
    aliases: ["Speech Therapist", "Speech Language"],
  },

  // Administrative
  {
    name: "Principal",
    aliases: ["Building Principal", "Assistant Principal", "Vice Principal"],
  },
  { name: "Superintendent", aliases: ["Assistant Superintendent"] },
  {
    name: "Supervisor",
    aliases: ["Curriculum Supervisor", "Instructional Supervisor"],
  },

  // Endorsements
  {
    name: "ESL Program Specialist",
    aliases: ["English as a Second Language", "ESOL"],
  },
  { name: "Gifted Education", aliases: ["Gifted", "Talented and Gifted"] },
  { name: "Autism", aliases: ["Autism Endorsement"] },
  { name: "Instructional Coach", aliases: ["Instructional Coaching"] },
];

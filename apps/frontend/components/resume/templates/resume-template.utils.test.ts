import test from "node:test";
import assert from "node:assert/strict";
import type { ResumeContent } from "@shared-types/resume";
import {
  getDescriptionItems,
  getVisibleSectionOrder,
} from "./resume-template.utils";

const realisticResume: ResumeContent = {
  contact: {
    fullName: "Alexandra Morgan-Santiago",
    title: "Senior Platform Engineering and Reliability Lead",
    email: "alexandra.morgan@example.com",
    phone: "",
    location: "Washington, DC",
    linkedin:
      "https://www.linkedin.com/in/alexandra-morgan-santiago-with-a-very-long-profile-url",
    github: "https://github.com/alexandra",
    portfolio: "https://alexandra.example.com",
  },
  summary: "Platform engineer focused on reliable distributed systems.",
  skillGroups: [
    {
      id: "skills-1",
      label: "Engineering",
      skills: ["TypeScript", "Distributed Systems"],
    },
  ],
  experience: [
    {
      id: "exp-1",
      jobTitle: "Senior Platform Engineer",
      company: "Example Corporation",
      location: "Remote",
      current: true,
      startMonth: "January",
      startYear: "2021",
      endMonth: "",
      endYear: "",
      description: "Long accomplishment text. ".repeat(60),
    },
    {
      id: "exp-2",
      jobTitle: "Software Engineer",
      company: "Previous Company",
      location: "",
      current: false,
      startMonth: "June",
      startYear: "2017",
      endMonth: "December",
      endYear: "2020",
      description: "Additional multi-page fixture content. ".repeat(50),
    },
  ],
  education: [
    {
      id: "edu-1",
      institution: "State University",
      degree: "Master of Science",
      field: "Computer Science",
      location: "Washington",
      country: "United States",
      startMonth: "September",
      startYear: "2015",
      endMonth: "June",
      endYear: "2017",
      current: false,
      gradYear: "2017",
    },
    {
      id: "edu-2",
      institution: "City College",
      degree: "Bachelor of Science",
      field: "Information Systems",
      location: "Washington",
      country: "United States",
      startMonth: "September",
      startYear: "2011",
      endMonth: "June",
      endYear: "2015",
      current: false,
      gradYear: "2015",
    },
  ],
  certifications: [],
  skills: ["TypeScript", "Distributed Systems", "Technical Leadership"],
  projects: [],
};

test("missing optional resume sections are omitted", () => {
  assert.deepEqual(
    getVisibleSectionOrder({
      ...realisticResume,
      experience: [],
      education: [],
      certifications: [],
      skills: [],
      summary: "",
      skillGroups: [],
    }),
    [],
  );
});

test("hidden sections are not included in the rendered section sequence", () => {
  assert.deepEqual(
    getVisibleSectionOrder(realisticResume, { hiddenSections: ["experience"] }),
    ["summary", "skills", "education"],
  );
});

test("configured section order is preserved while empty sections stay hidden", () => {
  assert.deepEqual(
    getVisibleSectionOrder(realisticResume, {
      sectionOrder: ["skills", "education", "certifications", "experience"],
    }),
    ["skills", "education", "experience", "summary"],
  );
});

test("experience descriptions become clean bullet items", () => {
  assert.deepEqual(
    getDescriptionItems(
      "- Built accessible interfaces\n\u2022 Improved performance\n2. Added tests",
    ),
    ["Built accessible interfaces", "Improved performance", "Added tests"],
  );
});

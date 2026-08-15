import type { ResumeContent } from "@shared-types/resume";
import { ProfessionalAtsTemplate } from "@/components/resume/templates/ProfessionalAtsTemplate";

const resume: ResumeContent = {
  contact: {
    fullName: "Jordan D. Morgan",
    title: "Computer Systems Engineer",
    email: "jordan.morgan@example.com",
    phone: "+970 56 000 0000",
    location: "",
    github: "https://github.com/jordanmorgan",
    linkedin: "https://linkedin.com/in/jordanmorgan",
    portfolio: "https://jordanmorgan.example.com",
  },
  summary:
    "I am a motivated, detail-oriented software engineering student with a strong interest in artificial intelligence and practical product development. I enjoy developing intelligent systems and solving real-world problems with technology. I build scalable applications with accessibility in mind, work confidently with APIs, learn quickly, and contribute productively to teams focused on delivering high-quality software and successful project outcomes.",
  skillGroups: [
    { id: "sg-1", label: "Frontend", skills: ["React.js", "HTML/CSS", "Tailwind CSS", "Bootstrap", "JavaScript"] },
    { id: "sg-2", label: "Backend", skills: ["C", "Java", "Python", "Node.js", "Express.js", "MongoDB", "Mongoose", "SQL", "JWT"] },
    { id: "sg-3", label: "Tools", skills: ["Git", "VS Code", "Visual Studio", "Postman", "Stripe", "Jest", "Supertest"] },
    { id: "sg-4", label: "Other Skills", skills: ["RESTful APIs", "Agile Development"] },
  ],
  skills: [],
  experience: [
    {
      id: "exp-1",
      jobTitle: "Frontend Developer",
      company: "Commerce Stores",
      location: "",
      current: false,
      startMonth: "January",
      startYear: "2022",
      endMonth: "",
      endYear: "2023",
      description:
        "- Designed and implemented dynamic user interfaces for client stores using CSS and JavaScript, focusing on intuitive and responsive front-end solutions.\n- Improved usability for all users.",
    },
    {
      id: "exp-2",
      jobTitle: "Backend Development Bootcamp",
      company: "Technology Academy",
      location: "",
      current: false,
      startMonth: "June",
      startYear: "2025",
      endMonth: "January",
      endYear: "2026",
      description:
        "- Completed an intensive backend development bootcamp focused on real-world software engineering practices.\n- Built RESTful APIs and backend services using Node.js and TypeScript.\n- Worked on hands-on projects including authentication systems, database design, and API development.\n- Gained experience with testing tools such as Jest and Supertest.\n- Improved clean-code, problem-solving, and teamwork skills in a simulated work environment.",
    },
  ],
  projects: [
    {
      id: "project-1",
      name: "Tours Reservation",
      technologies: ["Node", "Express.js", "REST API", "MongoDB"],
      link: "https://github.com/jordanmorgan/tours",
      startMonth: "January",
      startYear: "2024",
      description:
        "- Developed a REST API for a tour reservation website.\n- Leveraged MongoDB for seamless database integration.\n- Implemented secure payment functionality using Stripe.",
    },
    {
      id: "project-2",
      name: "Quote Searcher",
      technologies: ["JavaScript", "HTML", "CSS", "Dummy JSON API"],
      link: "",
      startMonth: "May",
      startYear: "2024",
      description:
        "- Developed a simple tool that filters quotes according to the search input.\n- Used a public JSON API to retrieve quote data.",
    },
  ],
  education: [
    {
      id: "edu-1",
      institution: "AUG University",
      degree: "Bachelor (BSc)",
      field: "Computer Systems Engineering",
      location: "Gaza",
      country: "Palestine",
      startMonth: "August",
      startYear: "2021",
      endMonth: "",
      endYear: "2026",
      current: false,
      gradYear: "2026",
    },
  ],
  certifications: [],
};

export default function ReferenceCheckPage() {
  return (
    <main style={{ margin: 0, background: "#fff" }}>
      <ProfessionalAtsTemplate resume={resume} />
    </main>
  );
}

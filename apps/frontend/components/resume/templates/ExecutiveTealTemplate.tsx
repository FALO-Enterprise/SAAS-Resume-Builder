import type { CSSProperties, ReactNode } from "react";
import {
  DEFAULT_RESUME_CUSTOMIZATION,
  type ResumeContent,
  type ResumeSectionId,
} from "@shared-types/resume";
import type { ResumeTemplateProps } from "./ProfessionalAtsTemplate";
import {
  getDescriptionItems,
  getVisibleSectionOrder,
} from "./resume-template.utils";
import styles from "./ExecutiveTealTemplate.module.css";

type ExecutivePageStyle = CSSProperties & {
  "--resume-font-scale": number;
  "--resume-accent"?: string;
  "--resume-font-family"?: string;
};

function hasText(value: string | null | undefined): value is string {
  return Boolean(value?.trim());
}

function joinText(
  values: Array<string | null | undefined>,
  separator = " · ",
) {
  return values
    .filter(hasText)
    .map((value) => value.trim())
    .join(separator);
}

function formatRange(
  startMonth: string,
  startYear: string,
  endMonth: string,
  endYear: string,
  current = false,
) {
  const start = joinText([startMonth, startYear], " ");
  const end = current ? "Present" : joinText([endMonth, endYear], " ");
  return start && end ? `${start} – ${end}` : start || end;
}

function safeWebLink(value: string) {
  const trimmed = value.trim();
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(candidate);
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? parsed.href
      : null;
  } catch {
    return null;
  }
}

function displayWebLink(value: string) {
  return value
    .trim()
    .replace(/^https?:\/\/(?:www\.)?/i, "")
    .replace(/\/$/, "");
}

function getMonogram(fullName: string) {
  const initials = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toLocaleUpperCase())
    .join("");

  return initials || "CV";
}

function isLanguageLabel(label: string) {
  const normalized = label.trim().toLocaleLowerCase();
  return /\blanguages?\b/.test(normalized) || normalized.includes("اللغ");
}

function hasExperienceContent(item: ResumeContent["experience"][number]) {
  return [
    item.jobTitle,
    item.company,
    item.location,
    item.startMonth,
    item.startYear,
    item.endMonth,
    item.endYear,
    item.description,
  ].some(hasText);
}

function hasEducationContent(item: ResumeContent["education"][number]) {
  return [
    item.institution,
    item.degree,
    item.field,
    item.location,
    item.country,
    item.startMonth,
    item.startYear,
    item.endMonth,
    item.endYear,
    item.gradYear,
  ].some(hasText);
}

function hasProjectContent(item: ResumeContent["projects"][number]) {
  return (
    [
      item.name,
      item.link,
      item.startMonth,
      item.startYear,
      item.description,
    ].some(hasText) || item.technologies.some(hasText)
  );
}

function hasSectionContent(section: ResumeSectionId, resume: ResumeContent) {
  if (section === "summary") return hasText(resume.summary);
  if (section === "skills") {
    return (
      resume.skills.some(hasText) ||
      resume.skillGroups.some((group) => group.skills.some(hasText))
    );
  }
  if (section === "projects") return resume.projects.some(hasProjectContent);
  if (section === "experience") {
    return resume.experience.some(hasExperienceContent);
  }
  if (section === "education") {
    return resume.education.some(hasEducationContent);
  }
  return resume.certifications.some(
    (item) => hasText(item.name) || hasText(item.org),
  );
}

function Section({
  title,
  children,
  compact = false,
}: {
  title: string;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <section
      className={`${styles.section} ${compact ? styles.compactSection : ""}`}
      aria-label={title}
    >
      <h2 className={styles.sectionHeading}>{title}</h2>
      {children}
    </section>
  );
}

function DescriptionList({ description }: { description: string }) {
  const items = getDescriptionItems(description);
  if (items.length === 0) return null;

  return (
    <ul className={styles.descriptionList}>
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

function ContactDetails({ resume }: { resume: ResumeContent }) {
  const details: Array<{
    key: string;
    label: string;
    value: string;
    href?: string | null;
  }> = [];

  if (hasText(resume.contact.phone)) {
    details.push({
      key: "phone",
      label: "Phone",
      value: resume.contact.phone.trim(),
      href: `tel:${resume.contact.phone.trim()}`,
    });
  }
  if (hasText(resume.contact.email)) {
    details.push({
      key: "email",
      label: "Email",
      value: resume.contact.email.trim(),
      href: `mailto:${resume.contact.email.trim()}`,
    });
  }
  if (hasText(resume.contact.location)) {
    details.push({
      key: "location",
      label: "Location",
      value: resume.contact.location.trim(),
    });
  }

  const webDetails = [
    ["linkedin", "LinkedIn", resume.contact.linkedin],
    ["github", "GitHub", resume.contact.github],
    ["portfolio", "Portfolio", resume.contact.portfolio],
  ] as const;

  for (const [key, label, value] of webDetails) {
    if (!hasText(value)) continue;
    details.push({
      key,
      label,
      value: displayWebLink(value),
      href: safeWebLink(value),
    });
  }

  if (details.length === 0) return null;

  return (
    <address className={styles.contactDetails}>
      <ul className={styles.contactList}>
        {details.map((detail) => (
          <li key={detail.key}>
            <span className={styles.contactMarker} aria-hidden="true" />
            <span className={styles.visuallyHidden}>{detail.label}: </span>
            {detail.href ? (
              <a href={detail.href}>{detail.value}</a>
            ) : (
              <span>{detail.value}</span>
            )}
          </li>
        ))}
      </ul>
    </address>
  );
}

function SummarySection({ resume }: { resume: ResumeContent }) {
  return (
    <Section title="Summary" compact>
      <p className={styles.summary}>{resume.summary.trim()}</p>
    </Section>
  );
}

function SkillsSection({ resume }: { resume: ResumeContent }) {
  const populatedGroups = resume.skillGroups.filter(
    (group) => group.skills.some((skill) => hasText(skill)),
  );
  const languageGroups = populatedGroups.filter((group) =>
    isLanguageLabel(group.label),
  );
  const skillGroups = populatedGroups.filter(
    (group) => !isLanguageLabel(group.label),
  );
  const legacySkills = resume.skills.filter(hasText);

  return (
    <Section title="Skills" compact>
      <div className={styles.skillGroups}>
        {skillGroups.map((group) => {
          const skills = group.skills.filter(hasText);
          if (!hasText(group.label) && skills.length === 0) return null;

          return (
            <div className={styles.skillGroup} key={group.id}>
              {hasText(group.label) && (
                <h3 className={styles.skillGroupTitle}>{group.label.trim()}</h3>
              )}
              {skills.length > 0 && (
                <ul className={styles.skillPills}>
                  {skills.map((skill, index) => (
                    <li key={`${skill}-${index}`}>{skill.trim()}</li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}

        {skillGroups.length === 0 && legacySkills.length > 0 && (
          <ul className={styles.skillPills}>
            {legacySkills.map((skill, index) => (
              <li key={`${skill}-${index}`}>{skill.trim()}</li>
            ))}
          </ul>
        )}
      </div>

      {languageGroups.length > 0 && (
        <div className={styles.languages}>
          <h3 className={styles.subsectionHeading}>Languages</h3>
          <ul className={styles.languageList}>
            {languageGroups.flatMap((group) =>
              group.skills.filter(hasText).map((language, index) => (
                <li key={`${group.id}-${language}-${index}`}>
                  {language.trim()}
                </li>
              )),
            )}
          </ul>
        </div>
      )}
    </Section>
  );
}

function ProjectsSection({ resume }: { resume: ResumeContent }) {
  const projects = resume.projects.filter(hasProjectContent);

  return (
    <Section title="Projects & Achievements" compact>
      <ol className={styles.projectList}>
        {projects.map((project) => {
          const date = joinText([project.startMonth, project.startYear], " ");
          const technologies = project.technologies.filter(hasText);
          const projectLink = hasText(project.link)
            ? safeWebLink(project.link)
            : null;

          return (
            <li className={styles.project} key={project.id}>
              <div className={styles.projectHeading}>
                {hasText(project.name) && (
                  <h3>
                    {projectLink ? (
                      <a href={projectLink}>{project.name.trim()}</a>
                    ) : (
                      project.name.trim()
                    )}
                  </h3>
                )}
                {hasText(date) && <time>{date}</time>}
              </div>
              {technologies.length > 0 && (
                <p className={styles.technologies}>
                  {technologies.map((technology) => technology.trim()).join(" · ")}
                </p>
              )}
              <DescriptionList description={project.description} />
            </li>
          );
        })}
      </ol>
    </Section>
  );
}

function ExperienceSection({ resume }: { resume: ResumeContent }) {
  const entries = resume.experience.filter(hasExperienceContent);

  return (
    <Section title="Experience">
      <ol className={styles.entryList}>
        {entries.map((item) => {
          const date = formatRange(
            item.startMonth,
            item.startYear,
            item.endMonth,
            item.endYear,
            item.current,
          );

          return (
            <li className={styles.entry} key={item.id}>
              <div className={styles.entryHeading}>
                <div>
                  {hasText(item.jobTitle) && <h3>{item.jobTitle.trim()}</h3>}
                  {hasText(item.company) && (
                    <p className={styles.organization}>{item.company.trim()}</p>
                  )}
                </div>
                {hasText(date) && <time>{date}</time>}
              </div>
              {hasText(item.location) && (
                <p className={styles.entryLocation}>{item.location.trim()}</p>
              )}
              <DescriptionList description={item.description} />
            </li>
          );
        })}
      </ol>
    </Section>
  );
}

function EducationSection({ resume }: { resume: ResumeContent }) {
  const entries = resume.education.filter(hasEducationContent);

  return (
    <Section title="Education">
      <ol className={styles.entryList}>
        {entries.map((item) => {
          const degree =
            hasText(item.degree) && hasText(item.field)
              ? `${item.degree.trim()} in ${item.field.trim()}`
              : joinText([item.degree, item.field], " ");
          const date =
            formatRange(
              item.startMonth,
              item.startYear,
              item.endMonth,
              item.endYear,
              item.current,
            ) || item.gradYear.trim();
          const location = joinText([item.location, item.country], ", ");

          return (
            <li className={styles.entry} key={item.id}>
              <div className={styles.entryHeading}>
                <div>
                  {hasText(degree) && <h3>{degree}</h3>}
                  {hasText(item.institution) && (
                    <p className={styles.organization}>
                      {item.institution.trim()}
                    </p>
                  )}
                </div>
                {hasText(date) && <time>{date}</time>}
              </div>
              {hasText(location) && (
                <p className={styles.entryLocation}>{location}</p>
              )}
            </li>
          );
        })}
      </ol>
    </Section>
  );
}

function CertificationsSection({ resume }: { resume: ResumeContent }) {
  const entries = resume.certifications.filter(
    (item) => hasText(item.name) || hasText(item.org),
  );

  return (
    <Section title="Certifications">
      <ul className={styles.certificationList}>
        {entries.map((item) => (
          <li key={item.id}>
            {hasText(item.name) && <h3>{item.name.trim()}</h3>}
            {hasText(item.org) && <p>{item.org.trim()}</p>}
          </li>
        ))}
      </ul>
    </Section>
  );
}

function renderSection(section: ResumeSectionId, resume: ResumeContent) {
  if (section === "summary") return <SummarySection resume={resume} />;
  if (section === "skills") return <SkillsSection resume={resume} />;
  if (section === "projects") return <ProjectsSection resume={resume} />;
  if (section === "experience") return <ExperienceSection resume={resume} />;
  if (section === "education") return <EducationSection resume={resume} />;
  if (section === "certifications") {
    return <CertificationsSection resume={resume} />;
  }
  return null;
}

const LEFT_SECTIONS = new Set<ResumeSectionId>([
  "summary",
  "skills",
  "projects",
]);

export function ExecutiveTealTemplate({
  resume,
  customization,
}: ResumeTemplateProps) {
  const fontScale =
    customization?.fontScale ?? DEFAULT_RESUME_CUSTOMIZATION.fontScale;
  const fontFamily = customization?.fontFamily;
  const visibleSections = getVisibleSectionOrder(resume, customization).filter(
    (section) => hasSectionContent(section, resume),
  );
  const leftSections = visibleSections.filter((section) =>
    LEFT_SECTIONS.has(section),
  );
  const rightSections = visibleSections.filter(
    (section) => !LEFT_SECTIONS.has(section),
  );
  const accentColor =
    customization?.accentColor ?? DEFAULT_RESUME_CUSTOMIZATION.accentColor;
  const pageStyle: ExecutivePageStyle = {
    "--resume-font-scale": fontScale,
    "--resume-accent": accentColor,
    ...(fontFamily ? { "--resume-font-family": fontFamily } : {}),
  };

  return (
    <article
      className={styles.resumePage}
      style={pageStyle}
      data-resume-template="executive"
    >
      <header className={styles.header}>
        <div className={styles.identityRow}>
          <div className={styles.identity}>
            {hasText(resume.contact.fullName) && (
              <h1>{resume.contact.fullName.trim()}</h1>
            )}
            {hasText(resume.contact.title) && (
              <p>{resume.contact.title.trim()}</p>
            )}
          </div>
          {hasText(resume.contact.photo) ? (
            <div className={styles.avatarWrapper}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resume.contact.photo.trim()}
                alt={resume.contact.fullName || "Profile photo"}
                className={styles.avatarImage}
              />
            </div>
          ) : (
            <div className={styles.monogram} aria-hidden="true">
              {getMonogram(resume.contact.fullName)}
            </div>
          )}
        </div>
        <ContactDetails resume={resume} />
      </header>

      <div className={styles.bodyGrid}>
        <aside className={styles.leftColumn}>
          {leftSections.map((section) => (
            <div className={styles.sectionSlot} key={section}>
              {renderSection(section, resume)}
            </div>
          ))}
        </aside>
        <div className={styles.rightColumn}>
          {rightSections.map((section) => (
            <div className={styles.sectionSlot} key={section}>
              {renderSection(section, resume)}
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

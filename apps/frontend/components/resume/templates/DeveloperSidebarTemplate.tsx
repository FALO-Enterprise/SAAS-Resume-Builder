import type { CSSProperties, ReactNode } from "react";
import {
  AtSign,
  Globe2,
  Link2,
  MapPin,
  Phone,
  type LucideIcon,
} from "lucide-react";
import { DEFAULT_RESUME_CUSTOMIZATION } from "@shared-types/resume";
import type { ResumeTemplateProps } from "./ProfessionalAtsTemplate";
import {
  getDescriptionItems,
  getVisibleSectionOrder,
} from "./resume-template.utils";
import styles from "./DeveloperSidebarTemplate.module.css";

type DeveloperPageStyle = CSSProperties & {
  "--resume-font-scale": number;
};

type ContactItem = {
  key: string;
  icon: LucideIcon;
  label: string;
  href?: string;
};

const LANGUAGE_GROUP_LABELS = new Set([
  "language",
  "languages",
  "language skills",
  "لغات",
  "اللغات",
]);

function hasText(value: string | null | undefined): value is string {
  return Boolean(value?.trim());
}

function hasAnyText(values: Array<string | null | undefined>) {
  return values.some(hasText);
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

  if (start && end) return `${start} \u2013 ${end}`;
  return start || end;
}

function safeLink(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

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

function compactLinkLabel(value: string) {
  return value
    .trim()
    .replace(/^https?:\/\/(?:www\.)?/i, "")
    .replace(/\/$/, "");
}

function uniqueText(values: string[]) {
  const seen = new Set<string>();

  return values.filter((value) => {
    const trimmed = value.trim();
    if (!trimmed) return false;

    const key = trimmed.toLocaleLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isLanguageGroup(label: string) {
  return LANGUAGE_GROUP_LABELS.has(label.trim().toLocaleLowerCase());
}

function SidebarSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.sidebarSection} aria-label={title}>
      <h2 className={styles.sidebarHeading}>{title}</h2>
      {children}
    </section>
  );
}

function MainSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.mainSection} aria-label={title}>
      <h2 className={styles.mainHeading}>{title}</h2>
      {children}
    </section>
  );
}

function ContactRow({ item }: { item: ContactItem }) {
  const Icon = item.icon;
  const content = item.href ? (
    <a href={item.href}>{item.label}</a>
  ) : (
    <span>{item.label}</span>
  );

  return (
    <li className={styles.contactItem}>
      <Icon size={11} strokeWidth={1.9} aria-hidden="true" />
      {content}
    </li>
  );
}

export function DeveloperSidebarTemplate({
  resume,
  customization,
}: ResumeTemplateProps) {
  const fontScale =
    customization?.fontScale ?? DEFAULT_RESUME_CUSTOMIZATION.fontScale;
  const pageStyle: DeveloperPageStyle = {
    "--resume-font-scale": fontScale,
  };
  const visibleSectionOrder = getVisibleSectionOrder(resume, customization);
  const sidebarOrder = visibleSectionOrder.filter((section) =>
    ["skills", "projects", "certifications"].includes(section),
  );
  const mainOrder = visibleSectionOrder.filter((section) =>
    ["summary", "experience", "education"].includes(section),
  );

  const contactItems: ContactItem[] = [];
  if (hasText(resume.contact.phone)) {
    contactItems.push({
      key: "phone",
      icon: Phone,
      label: resume.contact.phone.trim(),
      href: `tel:${resume.contact.phone.trim()}`,
    });
  }
  if (hasText(resume.contact.email)) {
    contactItems.push({
      key: "email",
      icon: AtSign,
      label: resume.contact.email.trim(),
      href: `mailto:${resume.contact.email.trim()}`,
    });
  }
  if (hasText(resume.contact.location)) {
    contactItems.push({
      key: "location",
      icon: MapPin,
      label: resume.contact.location.trim(),
    });
  }

  const linkedContacts = [
    { key: "linkedin", icon: Link2, value: resume.contact.linkedin },
    { key: "github", icon: Link2, value: resume.contact.github },
    { key: "portfolio", icon: Globe2, value: resume.contact.portfolio },
  ] as const;

  linkedContacts.forEach(({ key, icon, value }) => {
    if (!hasText(value)) return;
    const href = safeLink(value);
    contactItems.push({
      key,
      icon,
      label: compactLinkLabel(value),
      ...(href ? { href } : {}),
    });
  });

  const cleanGroups = resume.skillGroups
    .map((group) => ({
      ...group,
      label: group.label.trim(),
      skills: uniqueText(group.skills),
    }))
    .filter((group) => group.skills.length > 0);
  const languageSkills = uniqueText(
    cleanGroups
      .filter((group) => isLanguageGroup(group.label))
      .flatMap((group) => group.skills),
  );
  const regularSkillGroups = cleanGroups.filter(
    (group) => !isLanguageGroup(group.label),
  );
  const legacySkills = uniqueText(resume.skills);
  const displayedSkillGroups =
    regularSkillGroups.length > 0
      ? regularSkillGroups
      : legacySkills.length > 0
        ? [{ id: "legacy-skills", label: "", skills: legacySkills }]
        : [];

  const projects = resume.projects.filter((project) =>
    hasAnyText([
      project.name,
      project.link,
      project.startMonth,
      project.startYear,
      project.description,
      ...project.technologies,
    ]),
  );
  const certifications = resume.certifications.filter((certification) =>
    hasAnyText([certification.name, certification.org]),
  );
  const experience = resume.experience.filter((item) =>
    hasAnyText([
      item.jobTitle,
      item.company,
      item.location,
      item.startMonth,
      item.startYear,
      item.endMonth,
      item.endYear,
      item.description,
    ]),
  );
  const education = resume.education.filter((item) =>
    hasAnyText([
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
    ]),
  );

  const renderSidebarSection = (section: (typeof sidebarOrder)[number]) => {
    if (section === "skills") {
      if (displayedSkillGroups.length === 0 && languageSkills.length === 0) {
        return null;
      }

      return (
        <div className={styles.sidebarSectionGroup} key={section}>
          {displayedSkillGroups.length > 0 && (
            <SidebarSection title="Skills">
              <div className={styles.skillGroups}>
                {displayedSkillGroups.map((group) => (
                  <div className={styles.skillGroup} key={group.id}>
                    {hasText(group.label) && (
                      <h3 className={styles.skillGroupLabel}>{group.label}</h3>
                    )}
                    <ul className={styles.skillPills}>
                      {group.skills.map((skill) => (
                        <li key={skill}>{skill.trim()}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </SidebarSection>
          )}

          {languageSkills.length > 0 && (
            <SidebarSection title="Languages">
              <ul className={styles.languageList}>
                {languageSkills.map((language) => (
                  <li key={language}>
                    <span className={styles.languageDot} aria-hidden="true" />
                    <span>{language.trim()}</span>
                  </li>
                ))}
              </ul>
            </SidebarSection>
          )}
        </div>
      );
    }

    if (section === "projects") {
      if (projects.length === 0) return null;

      return (
        <SidebarSection key={section} title="Projects & Achievements">
          <ol className={styles.sidebarEntryList}>
            {projects.map((project) => {
              const href = hasText(project.link) ? safeLink(project.link) : null;
              const date = joinText(
                [project.startMonth, project.startYear],
                " ",
              );
              const descriptions = getDescriptionItems(project.description);
              const technologies = uniqueText(project.technologies);
              const title = project.name.trim();

              return (
                <li className={styles.sidebarEntry} key={project.id}>
                  {(hasText(title) || hasText(project.link)) && (
                    <h3 className={styles.sidebarEntryTitle}>
                      {href ? (
                        <a href={href}>
                          {title || compactLinkLabel(project.link)}
                        </a>
                      ) : (
                        title || project.link.trim()
                      )}
                    </h3>
                  )}
                  {hasText(date) && <time>{date}</time>}
                  {technologies.length > 0 && (
                    <p className={styles.projectTechnologies}>
                      {technologies.join(", ")}
                    </p>
                  )}
                  {descriptions.length > 0 && (
                    <ul className={styles.sidebarBullets}>
                      {descriptions.map((description, index) => (
                        <li key={index}>{description}</li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>
        </SidebarSection>
      );
    }

    if (section === "certifications") {
      if (certifications.length === 0) return null;

      return (
        <SidebarSection key={section} title="Certifications">
          <ul className={styles.certificationList}>
            {certifications.map((certification) => (
              <li key={certification.id}>
                <strong>
                  {certification.name.trim() || certification.org.trim()}
                </strong>
                {hasText(certification.name) && hasText(certification.org) && (
                  <span>{certification.org.trim()}</span>
                )}
              </li>
            ))}
          </ul>
        </SidebarSection>
      );
    }

    return null;
  };

  const renderMainSection = (section: (typeof mainOrder)[number]) => {
    if (section === "summary") {
      if (!hasText(resume.summary)) return null;

      return (
        <MainSection key={section} title="Summary">
          <p className={styles.summary}>{resume.summary.trim()}</p>
        </MainSection>
      );
    }

    if (section === "experience") {
      if (experience.length === 0) return null;

      return (
        <MainSection key={section} title="Experience">
          <ol className={styles.mainEntryList}>
            {experience.map((item) => {
              const dateRange = formatRange(
                item.startMonth,
                item.startYear,
                item.endMonth,
                item.endYear,
                item.current,
              );
              const descriptionItems = getDescriptionItems(item.description);
              const companyLine = joinText([item.company, item.location], " · ");

              return (
                <li className={styles.mainEntry} key={item.id}>
                  <div className={styles.entryHeader}>
                    {hasText(item.jobTitle) && <h3>{item.jobTitle.trim()}</h3>}
                    {hasText(dateRange) && <time>{dateRange}</time>}
                  </div>
                  {hasText(companyLine) && (
                    <p className={styles.entryOrganization}>{companyLine}</p>
                  )}
                  {descriptionItems.length > 0 && (
                    <ul className={styles.mainBullets}>
                      {descriptionItems.map((description, index) => (
                        <li key={index}>{description}</li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>
        </MainSection>
      );
    }

    if (section === "education") {
      if (education.length === 0) return null;

      return (
        <MainSection key={section} title="Education">
          <ol className={styles.mainEntryList}>
            {education.map((item) => {
              const degreeAndField =
                hasText(item.degree) && hasText(item.field)
                  ? `${item.degree.trim()} in ${item.field.trim()}`
                  : joinText([item.degree, item.field], " ");
              const dateRange =
                formatRange(
                  item.startMonth,
                  item.startYear,
                  item.endMonth,
                  item.endYear,
                  item.current,
                ) || item.gradYear.trim();
              const location = joinText([item.location, item.country], ", ");
              const institutionLine = joinText(
                [item.institution, location],
                " · ",
              );

              return (
                <li className={styles.mainEntry} key={item.id}>
                  <div className={styles.entryHeader}>
                    {hasText(degreeAndField) && <h3>{degreeAndField}</h3>}
                    {hasText(dateRange) && <time>{dateRange}</time>}
                  </div>
                  {hasText(institutionLine) && (
                    <p className={styles.entryOrganization}>
                      {institutionLine}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        </MainSection>
      );
    }

    return null;
  };

  return (
    <article
      className={styles.resumePage}
      style={pageStyle}
      data-resume-template="developer"
    >
      <aside className={styles.sidebar}>
        {contactItems.length > 0 && (
          <SidebarSection title="Contact Info">
            <address className={styles.contactAddress}>
              <ul className={styles.contactList}>
                {contactItems.map((item) => (
                  <ContactRow item={item} key={item.key} />
                ))}
              </ul>
            </address>
          </SidebarSection>
        )}
        {sidebarOrder.map(renderSidebarSection)}
      </aside>

      <div className={styles.content}>
        {(hasText(resume.contact.fullName) || hasText(resume.contact.title)) && (
          <header className={styles.identity}>
            {hasText(resume.contact.fullName) && (
              <h1>{resume.contact.fullName.trim()}</h1>
            )}
            {hasText(resume.contact.title) && (
              <p>{resume.contact.title.trim()}</p>
            )}
          </header>
        )}
        {mainOrder.map(renderMainSection)}
      </div>
    </article>
  );
}

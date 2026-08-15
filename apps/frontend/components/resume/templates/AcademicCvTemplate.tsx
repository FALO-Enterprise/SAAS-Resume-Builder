import type { CSSProperties, ReactNode } from "react";
import {
  DEFAULT_RESUME_CUSTOMIZATION,
  type ResumeContent,
  type ResumeCustomization,
} from "@shared-types/resume";
import styles from "./AcademicCvTemplate.module.css";
import {
  getDescriptionItems,
  getVisibleSectionOrder,
} from "./resume-template.utils";

export interface ResumeTemplateProps {
  resume: ResumeContent;
  customization?: Partial<ResumeCustomization>;
}

type PageStyle = CSSProperties & {
  "--resume-accent": string;
  "--resume-font-scale": number;
};

function hasText(value: string | null | undefined): value is string {
  return Boolean(value?.trim());
}

function joinText(values: Array<string | null | undefined>, separator = " · ") {
  return values
    .filter(hasText)
    .map((v) => v.trim())
    .join(separator);
}

function formatRange(
  startMonth?: string,
  startYear?: string,
  endMonth?: string,
  endYear?: string,
  current = false,
) {
  const start = joinText([startMonth, startYear], " ");
  const end = current ? "Present" : joinText([endMonth, endYear], " ");
  return start && end ? `${start} – ${end}` : start || end;
}

function safeLink(value: string) {
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

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.section} aria-label={title}>
      <h2 className={styles.sectionHeading}>{title}</h2>
      {children}
    </section>
  );
}

export function AcademicCvTemplate({
  resume,
  customization,
}: ResumeTemplateProps) {
  const accentColor = customization?.accentColor ?? "#1e3a8a";
  const fontScale =
    customization?.fontScale ?? DEFAULT_RESUME_CUSTOMIZATION.fontScale;

  // For Academic CVs, standard academic ordering places Education first
  const rawVisible = getVisibleSectionOrder(resume, customization);
  const sectionOrder = [...rawVisible].sort((a, b) => {
    if (a === "education") return -1;
    if (b === "education") return 1;
    return 0;
  });

  const pageStyle: PageStyle = {
    "--resume-accent": accentColor,
    "--resume-font-scale": fontScale,
  };

  const contactItems = [
    hasText(resume.contact.email) ? (
      <a key="email" href={`mailto:${resume.contact.email.trim()}`}>
        {resume.contact.email.trim()}
      </a>
    ) : null,
    hasText(resume.contact.phone) ? (
      <a key="phone" href={`tel:${resume.contact.phone.trim()}`}>
        {resume.contact.phone.trim()}
      </a>
    ) : null,
    hasText(resume.contact.location) ? (
      <span key="location">{resume.contact.location.trim()}</span>
    ) : null,
    hasText(resume.contact.portfolio) ? (
      <a key="portfolio" href={safeLink(resume.contact.portfolio) || "#"}>
        Research Profile / Website
      </a>
    ) : null,
  ].filter(Boolean);

  return (
    <article
      className={styles.resumePage}
      style={pageStyle}
      data-resume-template="academic"
    >
      <header className={styles.header}>
        {hasText(resume.contact.fullName) && (
          <h1 className={styles.fullName}>{resume.contact.fullName.trim()}</h1>
        )}
        {hasText(resume.contact.title) && (
          <p className={styles.jobTitle}>{resume.contact.title.trim()}</p>
        )}

        {contactItems.length > 0 && (
          <ul className={styles.contactList}>
            {contactItems.map((item, idx) => (
              <li key={idx}>
                {idx > 0 && <span className={styles.contactDot}>•</span>}
                {item}
              </li>
            ))}
          </ul>
        )}
      </header>

      {sectionOrder.map((section) => {
        if (section === "education") {
          const entries = resume.education.filter((i) =>
            Object.values(i).some((v) => typeof v === "string" && hasText(v)),
          );
          return (
            <Section key={section} title="Education & Academic Qualifications">
              <ol className={styles.entryList}>
                {entries.map((item) => {
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
                    ) || item.gradYear?.trim();

                  return (
                    <li className={styles.entry} key={item.id}>
                      <div className={styles.entryHeader}>
                        <h3 className={styles.entryTitle}>
                          {degreeAndField}{" "}
                          {hasText(item.institution) && (
                            <span className={styles.institution}>
                              , {item.institution.trim()}
                            </span>
                          )}
                        </h3>
                        {hasText(dateRange) && (
                          <time className={styles.date}>{dateRange}</time>
                        )}
                      </div>
                      {hasText(item.location) && (
                        <p className={styles.location}>{item.location.trim()}</p>
                      )}
                    </li>
                  );
                })}
              </ol>
            </Section>
          );
        }

        if (section === "summary") {
          return (
            <Section key={section} title="Research Profile & Abstract">
              <p className={styles.summary}>{resume.summary.trim()}</p>
            </Section>
          );
        }

        if (section === "experience") {
          const entries = resume.experience.filter((i) =>
            Object.values(i).some((v) => typeof v === "string" && hasText(v)),
          );
          return (
            <Section key={section} title="Academic & Teaching Appointments">
              <ol className={styles.entryList}>
                {entries.map((item) => {
                  const descriptionItems = getDescriptionItems(
                    item.description,
                  );
                  const dateRange = formatRange(
                    item.startMonth,
                    item.startYear,
                    item.endMonth,
                    item.endYear,
                    item.current,
                  );

                  return (
                    <li className={styles.entry} key={item.id}>
                      <div className={styles.entryHeader}>
                        <h3 className={styles.entryTitle}>
                          {item.jobTitle.trim()}{" "}
                          {hasText(item.company) && (
                            <span className={styles.institution}>
                              — {item.company.trim()}
                            </span>
                          )}
                        </h3>
                        {hasText(dateRange) && (
                          <time className={styles.date}>{dateRange}</time>
                        )}
                      </div>
                      {hasText(item.location) && (
                        <p className={styles.location}>{item.location.trim()}</p>
                      )}
                      {descriptionItems.length > 0 && (
                        <ul className={styles.descriptionList}>
                          {descriptionItems.map((desc, idx) => (
                            <li key={idx}>{desc}</li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ol>
            </Section>
          );
        }

        if (section === "projects") {
          const entries = resume.projects.filter((i) =>
            Object.values(i).some((v) =>
              Array.isArray(v)
                ? v.some(hasText)
                : typeof v === "string" && hasText(v),
            ),
          );
          return (
            <Section key={section} title="Publications, Grants & Research Projects">
              <ol className={styles.entryList}>
                {entries.map((item) => {
                  const descriptionItems = getDescriptionItems(
                    item.description,
                  );
                  const projectHref = hasText(item.link)
                    ? safeLink(item.link)
                    : null;

                  return (
                    <li className={styles.entry} key={item.id}>
                      <div className={styles.entryHeader}>
                        <h3 className={styles.entryTitle}>
                          {projectHref ? (
                            <a href={projectHref}>{item.name.trim()}</a>
                          ) : (
                            item.name.trim()
                          )}
                        </h3>
                      </div>
                      {descriptionItems.length > 0 && (
                        <ul className={styles.descriptionList}>
                          {descriptionItems.map((desc, idx) => (
                            <li key={idx}>{desc}</li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ol>
            </Section>
          );
        }

        if (section === "skills") {
          const groups = resume.skillGroups.filter(
            (g) => hasText(g.label) || g.skills.some(hasText),
          );
          const legacySkills = resume.skills.filter(hasText);

          return (
            <Section key={section} title="Methodologies & Scholarly Expertise">
              <div className={styles.skillsContainer}>
                {groups.length > 0
                  ? groups.map((group) => (
                      <div className={styles.skillLine} key={group.id}>
                        {hasText(group.label) && (
                          <span className={styles.skillLabel}>
                            {group.label.trim()}:
                          </span>
                        )}
                        <span className={styles.skillValues}>
                          {group.skills.filter(hasText).join(", ")}
                        </span>
                      </div>
                    ))
                  : legacySkills.join(", ")}
              </div>
            </Section>
          );
        }

        if (section === "certifications") {
          const entries = resume.certifications.filter(
            (i) => hasText(i.name) || hasText(i.org),
          );
          return (
            <Section key={section} title="Academic Fellowships & Honors">
              <ul className={styles.entryList}>
                {entries.map((item) => (
                  <li className={styles.entry} key={item.id}>
                    <h3 className={styles.entryTitle}>
                      {item.name.trim()}{" "}
                      {hasText(item.org) && (
                        <span className={styles.institution}>
                          ({item.org.trim()})
                        </span>
                      )}
                    </h3>
                  </li>
                ))}
              </ul>
            </Section>
          );
        }

        return null;
      })}
    </article>
  );
}

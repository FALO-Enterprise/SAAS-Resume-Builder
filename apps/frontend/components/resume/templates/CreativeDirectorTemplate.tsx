import type { CSSProperties, ReactNode } from "react";
import {
  DEFAULT_RESUME_CUSTOMIZATION,
  type ResumeContent,
  type ResumeCustomization,
} from "@shared-types/resume";
import styles from "./CreativeDirectorTemplate.module.css";
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

export function CreativeDirectorTemplate({
  resume,
  customization,
}: ResumeTemplateProps) {
  const accentColor =
    customization?.accentColor ?? "#c25e2e";
  const fontScale =
    customization?.fontScale ?? DEFAULT_RESUME_CUSTOMIZATION.fontScale;
  const sectionOrder = getVisibleSectionOrder(resume, customization);
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
        Portfolio
      </a>
    ) : null,
    hasText(resume.contact.linkedin) ? (
      <a key="linkedin" href={safeLink(resume.contact.linkedin) || "#"}>
        LinkedIn
      </a>
    ) : null,
  ].filter(Boolean);

  return (
    <article
      className={styles.resumePage}
      style={pageStyle}
      data-resume-template="director"
    >
      <header className={styles.header}>
        <div className={styles.topBadge}>Creative Portfolio & Resume</div>
        <div className={styles.identityBlock}>
          <div>
            {hasText(resume.contact.fullName) && (
              <h1 className={styles.fullName}>
                {resume.contact.fullName.trim()}
              </h1>
            )}
            {hasText(resume.contact.title) && (
              <p className={styles.jobTitle}>{resume.contact.title.trim()}</p>
            )}
          </div>
        </div>

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
        if (section === "summary") {
          return (
            <Section key={section} title="Executive Summary">
              <p className={styles.summary}>{resume.summary.trim()}</p>
            </Section>
          );
        }

        if (section === "experience") {
          const entries = resume.experience.filter((i) =>
            Object.values(i).some((v) => typeof v === "string" && hasText(v)),
          );
          return (
            <Section key={section} title="Creative Leadership & Experience">
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
                            <span className={styles.companyName}>
                              @ {item.company.trim()}
                            </span>
                          )}
                        </h3>
                        {hasText(dateRange) && (
                          <time className={styles.date}>{dateRange}</time>
                        )}
                      </div>
                      {hasText(item.location) && (
                        <p className={styles.entryLocation}>
                          {item.location.trim()}
                        </p>
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
            <Section key={section} title="Featured Campaigns & Projects">
              <div className={styles.projectsGrid}>
                {entries.map((item) => {
                  const descriptionItems = getDescriptionItems(
                    item.description,
                  );
                  const projectHref = hasText(item.link)
                    ? safeLink(item.link)
                    : null;
                  const technologies = item.technologies.filter(hasText);

                  return (
                    <div className={styles.projectCard} key={item.id}>
                      <div className={styles.projectHeader}>
                        <h3 className={styles.projectTitle}>
                          {projectHref ? (
                            <a href={projectHref}>{item.name.trim()}</a>
                          ) : (
                            item.name.trim()
                          )}
                        </h3>
                      </div>
                      {descriptionItems.length > 0 && (
                        <p
                          className={styles.summary}
                          style={{ marginTop: 4, fontSize: 11.5 }}
                        >
                          {descriptionItems[0]}
                        </p>
                      )}
                      {technologies.length > 0 && (
                        <div style={{ marginTop: 6 }}>
                          {technologies.map((tech, idx) => (
                            <span key={idx} className={styles.techBadge}>
                              {tech.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Section>
          );
        }

        if (section === "skills") {
          const groups = resume.skillGroups.filter(
            (g) => hasText(g.label) || g.skills.some(hasText),
          );
          const legacySkills = resume.skills.filter(hasText);

          return (
            <Section key={section} title="Creative Capabilities & Stack">
              {groups.length > 0 ? (
                <div className={styles.skillGroups}>
                  {groups.map((group) => {
                    const skills = group.skills.filter(hasText);
                    return (
                      <div className={styles.skillGroup} key={group.id}>
                        {hasText(group.label) && (
                          <div className={styles.skillGroupTitle}>
                            {group.label.trim()}
                          </div>
                        )}
                        <div className={styles.skillList}>
                          {skills.join(" • ")}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className={styles.summary}>{legacySkills.join(" • ")}</p>
              )}
            </Section>
          );
        }

        if (section === "education") {
          const entries = resume.education.filter((i) =>
            Object.values(i).some((v) => typeof v === "string" && hasText(v)),
          );
          return (
            <Section key={section} title="Education & Design Foundations">
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
                          {item.institution.trim()}{" "}
                          {hasText(degreeAndField) && (
                            <span className={styles.companyName}>
                              — {degreeAndField}
                            </span>
                          )}
                        </h3>
                        {hasText(dateRange) && (
                          <time className={styles.date}>{dateRange}</time>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </Section>
          );
        }

        if (section === "certifications") {
          const entries = resume.certifications.filter(
            (i) => hasText(i.name) || hasText(i.org),
          );
          return (
            <Section key={section} title="Awards & Honors">
              <ul className={styles.entryList}>
                {entries.map((item) => (
                  <li className={styles.entry} key={item.id}>
                    <h3 className={styles.entryTitle}>
                      {item.name.trim()}{" "}
                      {hasText(item.org) && (
                        <span className={styles.companyName}>
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

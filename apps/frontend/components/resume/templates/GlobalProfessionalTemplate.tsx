import type { CSSProperties, ReactNode } from "react";
import {
  DEFAULT_RESUME_CUSTOMIZATION,
  type ResumeContent,
  type ResumeCustomization,
} from "@shared-types/resume";
import styles from "./GlobalProfessionalTemplate.module.css";
import {
  getDescriptionItems,
  getVisibleSectionOrder,
} from "./resume-template.utils";

const IconMail = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

const IconPhone = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const IconMapPin = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const IconLinkedin = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.7a1.63 1.63 0 1 0 0 3.26 1.63 1.63 0 0 0 0-3.26Z"/>
  </svg>
);

const IconGithub = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z"/>
  </svg>
);

const IconGlobe = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
    <path d="M2 12h20"/>
  </svg>
);

export interface ResumeTemplateProps {
  resume: ResumeContent;
  customization?: Partial<ResumeCustomization>;
}

type PageStyle = CSSProperties & {
  "--resume-accent": string;
  "--resume-font-scale": number;
  "--resume-font-family"?: string;
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

export function GlobalProfessionalTemplate({
  resume,
  customization,
}: ResumeTemplateProps) {
  const accentColor = customization?.accentColor ?? "#0f766e";
  const fontScale =
    customization?.fontScale ?? DEFAULT_RESUME_CUSTOMIZATION.fontScale;
  const fontFamily = customization?.fontFamily;
  const sectionOrder = getVisibleSectionOrder(resume, customization);
  const pageStyle: PageStyle = {
    "--resume-accent": accentColor,
    "--resume-font-scale": fontScale,
    ...(fontFamily ? { "--resume-font-family": fontFamily } : {}),
  };

  const contactItems = [
    hasText(resume.contact.email) ? (
      <a
        key="email"
        href={`mailto:${resume.contact.email.trim()}`}
        className={styles.contactLink}
      >
        <span className={styles.contactIcon}><IconMail /></span>
        <span>{resume.contact.email.trim()}</span>
      </a>
    ) : null,
    hasText(resume.contact.phone) ? (
      <a
        key="phone"
        href={`tel:${resume.contact.phone.trim()}`}
        className={styles.contactLink}
      >
        <span className={styles.contactIcon}><IconPhone /></span>
        <span>{resume.contact.phone.trim()}</span>
      </a>
    ) : null,
    hasText(resume.contact.location) ? (
      <span key="location" className={styles.contactItem}>
        <span className={styles.contactIcon}><IconMapPin /></span>
        <span>{resume.contact.location.trim()}</span>
      </span>
    ) : null,
    hasText(resume.contact.linkedin) ? (
      <a
        key="linkedin"
        href={safeLink(resume.contact.linkedin) || "#"}
        className={styles.contactLink}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className={styles.contactIcon}><IconLinkedin /></span>
        <span>LinkedIn</span>
      </a>
    ) : null,
    hasText(resume.contact.github) ? (
      <a
        key="github"
        href={safeLink(resume.contact.github) || "#"}
        className={styles.contactLink}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className={styles.contactIcon}><IconGithub /></span>
        <span>GitHub</span>
      </a>
    ) : null,
    hasText(resume.contact.portfolio) ? (
      <a
        key="portfolio"
        href={safeLink(resume.contact.portfolio) || "#"}
        className={styles.contactLink}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className={styles.contactIcon}><IconGlobe /></span>
        <span>Portfolio</span>
      </a>
    ) : null,
  ].filter(Boolean);

  return (
    <article
      className={styles.resumePage}
      style={pageStyle}
      data-resume-template="global"
    >
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <div className={styles.identityRow}>
            {hasText(resume.contact.photo) && (
              <div className={styles.avatarWrapper}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resume.contact.photo.trim()}
                  alt={resume.contact.fullName || "Profile photo"}
                  className={styles.avatarImage}
                />
              </div>
            )}
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
        </div>

        {contactItems.length > 0 && (
          <div className={styles.contactGrid}>
            {contactItems.map((item, idx) => (
              <span key={idx}>{item}</span>
            ))}
          </div>
        )}
      </header>

      {sectionOrder.map((section) => {
        if (section === "summary") {
          return (
            <Section key={section} title="Executive Profile">
              <p className={styles.summary}>{resume.summary.trim()}</p>
            </Section>
          );
        }

        if (section === "skills") {
          const groups = resume.skillGroups.filter(
            (g) => hasText(g.label) || g.skills.some(hasText),
          );
          const legacySkills = resume.skills.filter(hasText);

          return (
            <Section key={section} title="Core Competencies & Expertise">
              {groups.length > 0 ? (
                <div className={styles.competencyGrid}>
                  {groups.map((group) => {
                    const skills = group.skills.filter(hasText);
                    return (
                      <div className={styles.competencyCard} key={group.id}>
                        {hasText(group.label) && (
                          <div className={styles.competencyLabel}>
                            {group.label.trim()}
                          </div>
                        )}
                        <div className={styles.competencyTags}>
                          {skills.map((skill, idx) => (
                            <span key={idx} className={styles.tag}>
                              {skill.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={styles.competencyTags}>
                  {legacySkills.map((skill, idx) => (
                    <span key={idx} className={styles.tag}>
                      {skill.trim()}
                    </span>
                  ))}
                </div>
              )}
            </Section>
          );
        }

        if (section === "experience") {
          const entries = resume.experience.filter((i) =>
            Object.values(i).some((v) => typeof v === "string" && hasText(v)),
          );
          return (
            <Section key={section} title="International Experience">
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
                            <span className={styles.company}>
                              | {item.company.trim()}
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
            <Section key={section} title="Global Initiatives & Projects">
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

        if (section === "education") {
          const entries = resume.education.filter((i) =>
            Object.values(i).some((v) => typeof v === "string" && hasText(v)),
          );
          return (
            <Section key={section} title="Education & Credentials">
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
                            <span className={styles.company}>
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
            <Section key={section} title="Global Certifications & Licenses">
              <ul className={styles.entryList}>
                {entries.map((item) => (
                  <li className={styles.entry} key={item.id}>
                    <h3 className={styles.entryTitle}>
                      {item.name.trim()}{" "}
                      {hasText(item.org) && (
                        <span className={styles.company}>
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

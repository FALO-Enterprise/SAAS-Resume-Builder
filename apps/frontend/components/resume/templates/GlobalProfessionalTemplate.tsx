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

export function GlobalProfessionalTemplate({
  resume,
  customization,
}: ResumeTemplateProps) {
  const accentColor = customization?.accentColor ?? "#0f766e";
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
        ✉ {resume.contact.email.trim()}
      </a>
    ) : null,
    hasText(resume.contact.phone) ? (
      <a key="phone" href={`tel:${resume.contact.phone.trim()}`}>
        📞 {resume.contact.phone.trim()}
      </a>
    ) : null,
    hasText(resume.contact.location) ? (
      <span key="location">📍 {resume.contact.location.trim()}</span>
    ) : null,
    hasText(resume.contact.linkedin) ? (
      <a key="linkedin" href={safeLink(resume.contact.linkedin) || "#"}>
        LinkedIn
      </a>
    ) : null,
    hasText(resume.contact.github) ? (
      <a key="github" href={safeLink(resume.contact.github) || "#"}>
        GitHub
      </a>
    ) : null,
    hasText(resume.contact.portfolio) ? (
      <a key="portfolio" href={safeLink(resume.contact.portfolio) || "#"}>
        Portfolio
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
          <span className={styles.globalBadge}>Global Standard</span>
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

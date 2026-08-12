import type { CSSProperties, ReactNode } from "react";
import {
  DEFAULT_RESUME_CUSTOMIZATION,
  type ResumeContent,
  type ResumeCustomization,
} from "@shared-types/resume";
import styles from "./ProfessionalAtsTemplate.module.css";
import {
  getDescriptionItems,
  getVisibleSectionOrder,
} from "./resume-template.utils";

export interface ResumeTemplateProps {
  resume: ResumeContent;
  customization?: Partial<ResumeCustomization>;
}

type ResumePageStyle = CSSProperties & {
  "--resume-accent": string;
  "--resume-font-scale": number;
};

function hasText(value: string | null | undefined): value is string {
  return Boolean(value?.trim());
}

function joinText(values: Array<string | null | undefined>, separator = " · ") {
  return values
    .filter(hasText)
    .map((value) => value.trim())
    .join(separator);
}

function formatRange(
  startMonth: string | undefined,
  startYear: string | undefined,
  endMonth: string | undefined,
  endYear: string | undefined,
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

function ContactLink({
  value,
  label,
}: {
  value: string | undefined;
  label: string;
}) {
  if (!hasText(value)) return null;
  const href = safeLink(value);
  return href ? <a href={href}>{label}</a> : <span>{value.trim()}</span>;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.section} aria-label={title}>
      <h2 className={styles.sectionHeading}>{title}</h2>
      {children}
    </section>
  );
}

export function ProfessionalAtsTemplate({
  resume,
  customization,
}: ResumeTemplateProps) {
  const accentColor =
    customization?.accentColor ?? DEFAULT_RESUME_CUSTOMIZATION.accentColor;
  const fontScale =
    customization?.fontScale ?? DEFAULT_RESUME_CUSTOMIZATION.fontScale;
  const sectionOrder = getVisibleSectionOrder(resume, customization);
  const pageStyle: ResumePageStyle = {
    "--resume-accent": accentColor,
    "--resume-font-scale": fontScale,
  };

  const contactItems = [
    hasText(resume.contact.phone) ? (
      <a
        className={styles.phoneLink}
        key="phone"
        href={`tel:${resume.contact.phone.trim()}`}
      >
        {resume.contact.phone.trim()}
      </a>
    ) : null,
    hasText(resume.contact.email) ? (
      <span key="email" className={styles.labeledContact}>
        <span>Email :</span>
        <a href={`mailto:${resume.contact.email.trim()}`}>
          {resume.contact.email.trim()}
        </a>
      </span>
    ) : null,
    hasText(resume.contact.location) ? (
      <span key="location">{resume.contact.location.trim()}</span>
    ) : null,
    hasText(resume.contact.github) ? (
      <ContactLink key="github" value={resume.contact.github} label="Github" />
    ) : null,
    hasText(resume.contact.linkedin) ? (
      <ContactLink
        key="linkedin"
        value={resume.contact.linkedin}
        label="LinkedIn"
      />
    ) : null,
    hasText(resume.contact.portfolio) ? (
      <ContactLink
        key="portfolio"
        value={resume.contact.portfolio}
        label="Portfolio"
      />
    ) : null,
  ].filter((item) => item !== null);

  return (
    <article
      className={styles.resumePage}
      style={pageStyle}
      data-resume-template="minimal"
    >
      <header className={styles.header}>
        <p className={styles.documentTitle}>A RESUME</p>
        {(hasText(resume.contact.fullName) ||
          hasText(resume.contact.title)) && (
          <h1 className={styles.identity}>
            {hasText(resume.contact.fullName) && (
              <span>{resume.contact.fullName.trim()}</span>
            )}
            {hasText(resume.contact.fullName) &&
              hasText(resume.contact.title) && (
                <span aria-hidden="true"> - </span>
              )}
            {hasText(resume.contact.title) && (
              <span>{resume.contact.title.trim()}</span>
            )}
          </h1>
        )}
        {contactItems.length > 0 && (
          <address>
            <ul className={styles.contactList}>
              {contactItems.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </address>
        )}
      </header>

      {sectionOrder.map((section) => {
        if (section === "summary") {
          return (
            <Section key={section} title="Professional Summary">
              <p className={styles.summary}>{resume.summary.trim()}</p>
            </Section>
          );
        }

        if (section === "skills") {
          const groups = resume.skillGroups.filter(
            (group) =>
              hasText(group.label) || group.skills.some((skill) => hasText(skill)),
          );
          const legacySkills = resume.skills.filter(hasText);

          return (
            <Section key={section} title="Skills">
              {groups.length > 0 ? (
                <dl className={styles.skillGroups}>
                  {groups.map((group) => {
                    const skills = group.skills.filter(hasText);
                    return (
                      <div className={styles.skillGroup} key={group.id}>
                        {hasText(group.label) && <dt>{group.label.trim()}:</dt>}
                        <dd>{skills.map((skill) => skill.trim()).join(", ")}</dd>
                      </div>
                    );
                  })}
                </dl>
              ) : (
                <p className={styles.legacySkills}>{legacySkills.join(", ")}</p>
              )}
            </Section>
          );
        }

        if (section === "experience") {
          const entries = resume.experience.filter((item) =>
            Object.values(item).some(
              (value) => typeof value === "string" && hasText(value),
            ),
          );
          return (
            <Section key={section} title="Experience">
              <ol className={styles.entryList}>
                {entries.map((item) => {
                  const descriptionItems = getDescriptionItems(item.description);
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
                          {joinText([item.jobTitle, item.company], " at ")}
                        </h3>
                        {hasText(dateRange) && (
                          <time className={styles.date}>{dateRange}</time>
                        )}
                      </div>
                      {hasText(item.location) && (
                        <p className={styles.entryMeta}>{item.location.trim()}</p>
                      )}
                      {descriptionItems.length > 0 && (
                        <ul className={styles.descriptionList}>
                          {descriptionItems.map((description, index) => (
                            <li key={index}>{description}</li>
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
          const entries = resume.projects.filter((item) =>
            Object.values(item).some((value) =>
              Array.isArray(value)
                ? value.some(hasText)
                : typeof value === "string" && hasText(value),
            ),
          );
          return (
            <Section key={section} title="Projects">
              <ol className={styles.entryList}>
                {entries.map((item) => {
                  const descriptionItems = getDescriptionItems(item.description);
                  const date = joinText([item.startMonth, item.startYear], " ");
                  const technologies = item.technologies.filter(hasText);
                  const projectHref = hasText(item.link)
                    ? safeLink(item.link)
                    : null;
                  const projectName = item.name.trim();

                  return (
                    <li className={styles.entry} key={item.id}>
                      <div className={styles.entryHeader}>
                        <h3 className={styles.entryTitle}>
                          {projectHref ? (
                            <a href={projectHref}>{projectName}</a>
                          ) : (
                            projectName
                          )}
                          {technologies.length > 0 && (
                            <span className={styles.technologies}>
                              {` (${technologies.join(", ")})`}
                            </span>
                          )}
                        </h3>
                        {hasText(date) && <time className={styles.date}>{date}</time>}
                      </div>
                      {descriptionItems.length > 0 && (
                        <ul className={styles.descriptionList}>
                          {descriptionItems.map((description, index) => (
                            <li key={index}>{description}</li>
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
          const entries = resume.education.filter((item) =>
            Object.values(item).some(
              (value) => typeof value === "string" && hasText(value),
            ),
          );
          return (
            <Section key={section} title="Education">
              <ol className={styles.entryList}>
                {entries.map((item) => {
                  const institution = joinText(
                    [item.institution, item.location],
                    ", ",
                  );
                  const degreeAndField =
                    hasText(item.degree) && hasText(item.field)
                      ? `${item.degree.trim()} of ${item.field.trim()}`
                      : joinText([item.degree, item.field], " ");
                  const qualification = joinText(
                    [degreeAndField, item.country],
                    ", ",
                  );
                  const dateRange =
                    formatRange(
                      item.startMonth,
                      item.startYear,
                      item.endMonth,
                      item.endYear,
                      item.current,
                    ) || item.gradYear.trim();

                  return (
                    <li
                      className={`${styles.entry} ${styles.educationEntry}`}
                      key={item.id}
                    >
                      <div className={styles.entryHeader}>
                        <h3 className={styles.entryTitle}>
                          {institution || qualification}
                        </h3>
                        {hasText(dateRange) && (
                          <time className={styles.date}>{dateRange}</time>
                        )}
                      </div>
                      {hasText(institution) && hasText(qualification) && (
                        <p className={styles.educationDetail}>{qualification}</p>
                      )}
                    </li>
                  );
                })}
              </ol>
            </Section>
          );
        }

        if (section === "certifications") {
          const entries = resume.certifications.filter(
            (item) => hasText(item.name) || hasText(item.org),
          );
          return (
            <Section key={section} title="Certifications">
              <ul className={styles.entryList}>
                {entries.map((item) => (
                  <li className={styles.entry} key={item.id}>
                    <h3 className={styles.entryTitle}>
                      {item.name.trim() || item.org.trim()}
                    </h3>
                    {hasText(item.name) && hasText(item.org) && (
                      <p className={styles.entryMeta}>{item.org.trim()}</p>
                    )}
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

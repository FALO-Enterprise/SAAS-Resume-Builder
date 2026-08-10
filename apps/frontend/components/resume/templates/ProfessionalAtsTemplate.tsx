import type { CSSProperties, ReactNode } from 'react';
import {
  DEFAULT_RESUME_CUSTOMIZATION,
  type ResumeContent,
  type ResumeCustomization,
} from '@shared-types/resume';
import styles from './ProfessionalAtsTemplate.module.css';
import { getVisibleSectionOrder } from './resume-template.utils';

export interface ResumeTemplateProps {
  resume: ResumeContent;
  customization?: Partial<ResumeCustomization>;
}

type ResumePageStyle = CSSProperties & {
  '--resume-accent': string;
  '--resume-font-scale': number;
};

function hasText(value: string | null | undefined): value is string {
  return Boolean(value?.trim());
}

function joinText(values: Array<string | null | undefined>, separator = ' · ') {
  return values.filter(hasText).map((value) => value.trim()).join(separator);
}

function formatRange(
  startMonth: string,
  startYear: string,
  endMonth: string,
  endYear: string,
  current: boolean,
) {
  const start = joinText([startMonth, startYear], ' ');
  const end = current ? 'Present' : joinText([endMonth, endYear], ' ');
  return start && end ? `${start} – ${end}` : start || end;
}

function safeLink(value: string) {
  const trimmed = value.trim();
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(candidate);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : null;
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

export function ProfessionalAtsTemplate({ resume, customization }: ResumeTemplateProps) {
  const accentColor = customization?.accentColor ?? DEFAULT_RESUME_CUSTOMIZATION.accentColor;
  const fontScale = customization?.fontScale ?? DEFAULT_RESUME_CUSTOMIZATION.fontScale;
  const sectionOrder = getVisibleSectionOrder(resume, customization);
  const contactItems = [
    hasText(resume.contact.email) ? (
      <a key="email" href={`mailto:${resume.contact.email.trim()}`}>{resume.contact.email.trim()}</a>
    ) : null,
    hasText(resume.contact.phone) ? (
      <a key="phone" href={`tel:${resume.contact.phone.trim()}`}>{resume.contact.phone.trim()}</a>
    ) : null,
    hasText(resume.contact.location) ? <span key="location">{resume.contact.location.trim()}</span> : null,
    hasText(resume.contact.linkedin) ? (
      safeLink(resume.contact.linkedin) ? (
        <a key="linkedin" href={safeLink(resume.contact.linkedin) ?? undefined}>{resume.contact.linkedin.trim()}</a>
      ) : <span key="linkedin">{resume.contact.linkedin.trim()}</span>
    ) : null,
  ].filter((item) => item !== null);
  const pageStyle: ResumePageStyle = {
    '--resume-accent': accentColor,
    '--resume-font-scale': fontScale,
  };

  return (
    <article className={styles.resumePage} style={pageStyle} data-resume-template="minimal">
      <header className={styles.header}>
        {hasText(resume.contact.fullName) && <h1 className={styles.name}>{resume.contact.fullName.trim()}</h1>}
        {hasText(resume.contact.title) && <p className={styles.title}>{resume.contact.title.trim()}</p>}
        {contactItems.length > 0 && <address><ul className={styles.contactList}>{contactItems.map((item, index) => <li key={index}>{item}</li>)}</ul></address>}
      </header>

      {sectionOrder.map((section) => {
        if (section === 'experience') {
          const entries = resume.experience.filter((item) => Object.values(item).some((value) => typeof value === 'string' && hasText(value)));
          return (
            <Section key={section} title="Professional Experience">
              <ol className={styles.entryList}>{entries.map((item) => (
                <li className={styles.entry} key={item.id}>
                  <div className={styles.entryHeader}>
                    <h3 className={styles.entryTitle}>{joinText([item.jobTitle, item.company])}</h3>
                    {hasText(formatRange(item.startMonth, item.startYear, item.endMonth, item.endYear, item.current)) && <time className={styles.date}>{formatRange(item.startMonth, item.startYear, item.endMonth, item.endYear, item.current)}</time>}
                  </div>
                  {hasText(item.location) && <p className={styles.entryMeta}>{item.location.trim()}</p>}
                  {hasText(item.description) && <p className={styles.description}>{item.description.trim()}</p>}
                </li>
              ))}</ol>
            </Section>
          );
        }

        if (section === 'education') {
          const entries = resume.education.filter((item) => Object.values(item).some((value) => typeof value === 'string' && hasText(value)));
          return (
            <Section key={section} title="Education">
              <ol className={styles.entryList}>{entries.map((item) => (
                <li className={styles.entry} key={item.id}>
                  <div className={styles.entryHeader}>
                    <h3 className={styles.entryTitle}>{joinText([item.degree, item.field], ', ') || item.institution}</h3>
                    {hasText(item.gradYear) && <time className={styles.date}>{item.gradYear.trim()}</time>}
                  </div>
                  {hasText(item.institution) && <p className={styles.entryMeta}>{item.institution.trim()}</p>}
                </li>
              ))}</ol>
            </Section>
          );
        }

        if (section === 'certifications') {
          const entries = resume.certifications.filter((item) => hasText(item.name) || hasText(item.org));
          return (
            <Section key={section} title="Certifications">
              <ul className={styles.entryList}>{entries.map((item) => (
                <li className={styles.entry} key={item.id}>
                  <h3 className={styles.entryTitle}>{item.name.trim()}</h3>
                  {hasText(item.org) && <p className={styles.entryMeta}>{item.org.trim()}</p>}
                </li>
              ))}</ul>
            </Section>
          );
        }

        const skills = resume.skills.filter(hasText);
        return <Section key={section} title="Skills"><ul className={styles.skills}>{skills.map((skill, index) => <li key={`${skill}-${index}`}>{skill.trim()}</li>)}</ul></Section>;
      })}
    </article>
  );
}

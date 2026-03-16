import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type ReactNode,
} from "react";

type LinkEntry = {
  id: string;
  label: string;
  url: string;
};

type PersonalDetails = {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  links: LinkEntry[];
  photoDataUrl: string;
};

type SkillSet = {
  core: string;
  frontend: string;
  backend: string;
  databases: string;
  tools: string;
};

type Experience = {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  achievements: string;
};

type Project = {
  id: string;
  name: string;
  stack: string;
  link: string;
  description: string;
};

type Education = {
  id: string;
  school: string;
  degree: string;
  field: string;
  location: string;
  graduationDate: string;
  gpa: string;
};

type CvData = {
  personal: PersonalDetails;
  summary: string;
  skills: SkillSet;
  experiences: Experience[];
  projects: Project[];
  education: Education[];
  certifications: string;
  languages: string;
  additionalInfo: string;
};

type FieldProps = {
  label: string;
  hint?: string;
  children: ReactNode;
};

type CvSheetProps = {
  cvData: CvData;
  contactLine: string;
  linkLine: string;
  fitScale: number;
  frameRef?: React.RefObject<HTMLDivElement | null>;
  contentRef?: React.RefObject<HTMLDivElement | null>;
};

const STORAGE_KEY = "ats-cv-builder-data-v2";
const DEFAULT_CONTENT_SCALE = 0.93;
const MIN_CONTENT_SCALE = 0.5;
const FIT_SCALE_BUFFER = 0.985;
const DEFAULT_PREVIEW_ZOOM = 0.93;
const MIN_PREVIEW_ZOOM = 0.85;
const MAX_PREVIEW_ZOOM = 1.2;
const PREVIEW_ZOOM_STEP = 0.05;

const inputClassName =
  "w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-900";
const textAreaClassName = `${inputClassName} min-h-28 resize-y`;
const secondaryButtonClassName =
  "rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900";
const primaryButtonClassName =
  "rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700";

function createId() {
  return Math.random().toString(36).slice(2, 10);
}

function createLink(overrides?: Partial<LinkEntry>): LinkEntry {
  return {
    id: createId(),
    label: "",
    url: "",
    ...overrides,
  };
}

function createExperience(overrides?: Partial<Experience>): Experience {
  return {
    id: createId(),
    company: "",
    role: "",
    location: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    achievements: "",
    ...overrides,
  };
}

function createProject(overrides?: Partial<Project>): Project {
  return {
    id: createId(),
    name: "",
    stack: "",
    link: "",
    description: "",
    ...overrides,
  };
}

function createEducation(overrides?: Partial<Education>): Education {
  return {
    id: createId(),
    school: "",
    degree: "",
    field: "",
    location: "",
    graduationDate: "",
    gpa: "",
    ...overrides,
  };
}

function createDefaultLinks() {
  return [createLink()];
}

function createTemplateCv(): CvData {
  return {
    personal: {
      fullName: "",
      title: "",
      email: "",
      phone: "",
      location: "",
      links: createDefaultLinks(),
      photoDataUrl: "",
    },
    summary: "",
    skills: {
      core: "",
      frontend: "",
      backend: "",
      databases: "",
      tools: "",
    },
    experiences: [createExperience()],
    projects: [createProject()],
    education: [createEducation()],
    certifications: "",
    languages: "",
    additionalInfo: "",
  };
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeLink(value: unknown): LinkEntry | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Partial<LinkEntry>;

  return createLink({
    id: asString(item.id, createId()),
    label: asString(item.label),
    url: asString(item.url),
  });
}

function normalizeExperience(value: unknown): Experience | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Partial<Experience>;

  return createExperience({
    id: asString(item.id, createId()),
    company: asString(item.company),
    role: asString(item.role),
    location: asString(item.location),
    startDate: asString(item.startDate),
    endDate: asString(item.endDate),
    isCurrent: asBoolean(item.isCurrent),
    achievements: asString(item.achievements),
  });
}

function normalizeProject(value: unknown): Project | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Partial<Project>;

  return createProject({
    id: asString(item.id, createId()),
    name: asString(item.name),
    stack: asString(item.stack),
    link: asString(item.link),
    description: asString(item.description),
  });
}

function normalizeEducation(value: unknown): Education | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Partial<Education>;

  return createEducation({
    id: asString(item.id, createId()),
    school: asString(item.school),
    degree: asString(item.degree),
    field: asString(item.field),
    location: asString(item.location),
    graduationDate: asString(item.graduationDate),
    gpa: asString(item.gpa),
  });
}

function normalizeCvData(raw: unknown): CvData | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const template = createTemplateCv();
  const value = raw as Partial<CvData> & {
    personal?: Partial<PersonalDetails> & {
      linkedin?: string;
      github?: string;
      website?: string;
    };
  };

  const normalizedLinks = Array.isArray(value.personal?.links)
    ? value.personal.links.map(normalizeLink).filter((item): item is LinkEntry => Boolean(item))
    : [];

  const legacyLinks = [
    createLink({ label: "LinkedIn", url: asString(value.personal?.linkedin) }),
    createLink({ label: "GitHub", url: asString(value.personal?.github) }),
    createLink({ label: "Web Sitesi", url: asString(value.personal?.website) }),
  ].filter((item) => item.url.trim());

  return {
    personal: {
      fullName: asString(value.personal?.fullName, template.personal.fullName),
      title: asString(value.personal?.title, template.personal.title),
      email: asString(value.personal?.email, template.personal.email),
      phone: asString(value.personal?.phone, template.personal.phone),
      location: asString(value.personal?.location, template.personal.location),
      links: normalizedLinks.length > 0 ? normalizedLinks : legacyLinks.length > 0 ? legacyLinks : template.personal.links,
      photoDataUrl: asString(value.personal?.photoDataUrl),
    },
    summary: asString(value.summary, template.summary),
    skills: {
      core: asString(value.skills?.core, template.skills.core),
      frontend: asString(value.skills?.frontend, template.skills.frontend),
      backend: asString(value.skills?.backend, template.skills.backend),
      databases: asString(value.skills?.databases, template.skills.databases),
      tools: asString(value.skills?.tools, template.skills.tools),
    },
    experiences: Array.isArray(value.experiences)
      ? value.experiences.map(normalizeExperience).filter((item): item is Experience => Boolean(item))
      : template.experiences,
    projects: Array.isArray(value.projects)
      ? value.projects.map(normalizeProject).filter((item): item is Project => Boolean(item))
      : template.projects,
    education: Array.isArray(value.education)
      ? value.education.map(normalizeEducation).filter((item): item is Education => Boolean(item))
      : template.education,
    certifications: asString(value.certifications, template.certifications),
    languages: asString(value.languages, template.languages),
    additionalInfo: asString(value.additionalInfo, template.additionalInfo),
  };
}

function getInitialCv() {
  const template = createTemplateCv();

  if (typeof window === "undefined") {
    return template;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? normalizeCvData(JSON.parse(stored)) ?? template : template;
  } catch {
    return template;
  }
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getAppliedContentScale(fitScale: number) {
  const preferredScale = fitScale >= 1 ? DEFAULT_CONTENT_SCALE : Math.min(DEFAULT_CONTENT_SCALE, fitScale * FIT_SCALE_BUFFER);

  return clampNumber(preferredScale, MIN_CONTENT_SCALE, 1);
}

function formatMonth(value: string) {
  if (!value) {
    return "";
  }

  const date = new Date(`${value}-01T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("tr-TR", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDateRange(startDate: string, endDate: string, isCurrent = false) {
  const start = formatMonth(startDate);
  const end = isCurrent ? "Devam Ediyor" : formatMonth(endDate);

  if (start && end) {
    return `${start} - ${end}`;
  }

  return start || end;
}

function updateItemById<T extends { id: string }>(items: T[], id: string, updater: (item: T) => T) {
  return items.map((item) => (item.id === id ? updater(item) : item));
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatLinkLabel(link: LinkEntry) {
  const label = link.label.trim();
  const url = link.url.trim();

  if (!url) {
    return "";
  }

  return label ? `${label}: ${url}` : url;
}

function getSafePrintScale(fitScale: number) {
  const appliedScale = getAppliedContentScale(fitScale);

  if (appliedScale >= 0.999) {
    return 1;
  }

  return clampNumber(Number((appliedScale - 0.02).toFixed(3)), MIN_CONTENT_SCALE, 1);
}

function renderPrintList(lines: string[]) {
  if (lines.length === 0) {
    return "";
  }

  return `<ul class="cv-list">${lines
    .map((line) => `<li class="cv-list-item">${escapeHtml(line)}</li>`)
    .join("")}</ul>`;
}

function renderPrintSection(title: string, content: string, withDivider: boolean) {
  return `<section class="cv-section${withDivider ? " cv-section-divider" : ""}"><h2 class="cv-section-title">${escapeHtml(
    title,
  )}</h2>${content}</section>`;
}

function buildPrintDocument(cvData: CvData, contactLine: string, linkLine: string, fitScale: number) {
  const safeScale = getSafePrintScale(fitScale);
  const skillRows = [
    { label: "Temel Yetkinlikler", value: cvData.skills.core },
    { label: "Frontend", value: cvData.skills.frontend },
    { label: "Backend", value: cvData.skills.backend },
    { label: "Veri Tabanlari", value: cvData.skills.databases },
    { label: "Araclar", value: cvData.skills.tools },
  ].filter((item) => item.value.trim());

  const sections: string[] = [];

  if (cvData.summary.trim()) {
    sections.push(renderPrintSection("Profesyonel Ozet", `<p class="cv-copy">${escapeHtml(cvData.summary.trim())}</p>`, false));
  }

  if (skillRows.length > 0) {
    sections.push(
      renderPrintSection(
        "Beceriler",
        skillRows
          .map(
            (item) =>
              `<p class="cv-copy cv-skill-row"><span class="cv-label">${escapeHtml(item.label)}:</span> ${escapeHtml(item.value.trim())}</p>`,
          )
          .join(""),
        sections.length > 0,
      ),
    );
  }

  const experiences = cvData.experiences
    .filter((item) => item.company.trim() || item.role.trim() || item.achievements.trim())
    .map((item) => {
      const topLine = [item.role.trim(), item.company.trim()].filter(Boolean).join(" | ");
      const subLine = [item.location.trim()].filter(Boolean).join(" | ");
      const dateLine = formatDateRange(item.startDate, item.endDate, item.isCurrent);

      return `<article class="cv-entry"><div class="cv-row"><p class="cv-row-primary">${escapeHtml(
        topLine || "Deneyim",
      )}</p>${dateLine ? `<p class="cv-date">${escapeHtml(dateLine)}</p>` : ""}</div>${
        subLine ? `<p class="cv-row-secondary">${escapeHtml(subLine)}</p>` : ""
      }${renderPrintList(splitLines(item.achievements))}</article>`;
    });

  if (experiences.length > 0) {
    sections.push(renderPrintSection("Deneyim", experiences.join(""), sections.length > 0));
  }

  const projects = cvData.projects
    .filter((item) => item.name.trim() || item.description.trim())
    .map((item) => {
      return `<article class="cv-entry"><p class="cv-row-primary">${escapeHtml(item.name.trim() || "Proje")}</p>${
        item.stack.trim() ? `<p class="cv-row-secondary"><span class="cv-label">Teknoloji:</span> ${escapeHtml(item.stack.trim())}</p>` : ""
      }${item.link.trim() ? `<p class="cv-link"><span class="cv-label">Baglanti:</span> ${escapeHtml(item.link.trim())}</p>` : ""}<p class="cv-copy">${escapeHtml(
        item.description.trim(),
      )}</p></article>`;
    });

  if (projects.length > 0) {
    sections.push(renderPrintSection("Projeler", projects.join(""), sections.length > 0));
  }

  const education = cvData.education
    .filter((item) => item.school.trim() || item.field.trim())
    .map((item) => {
      const topLine = [item.degree.trim(), item.field.trim()].filter(Boolean).join(" | ");
      const subParts = [item.school.trim(), item.location.trim()].filter(Boolean);

      if (item.gpa.trim()) {
        subParts.push(`Not Ortalamasi: ${item.gpa.trim()}`);
      }

      return `<article class="cv-entry"><div class="cv-row"><p class="cv-row-primary">${escapeHtml(
        topLine || "Egitim",
      )}</p>${item.graduationDate.trim() ? `<p class="cv-date">${escapeHtml(formatMonth(item.graduationDate.trim()))}</p>` : ""}</div>${
        subParts.length > 0 ? `<p class="cv-row-secondary">${escapeHtml(subParts.join(" | "))}</p>` : ""
      }</article>`;
    });

  if (education.length > 0) {
    sections.push(renderPrintSection("Egitim", education.join(""), sections.length > 0));
  }

  const additionalBlocks = [
    { label: "Sertifikalar", lines: splitLines(cvData.certifications), text: cvData.certifications.trim() },
    { label: "Diller", lines: splitLines(cvData.languages), text: cvData.languages.trim() },
    { label: "Ek Notlar", lines: splitLines(cvData.additionalInfo), text: cvData.additionalInfo.trim() },
  ].filter((item) => item.lines.length > 0 || item.text);

  if (additionalBlocks.length > 0) {
    sections.push(
      renderPrintSection(
        "Ek Bilgiler",
        additionalBlocks
          .map((block) => {
            if (block.lines.length > 1 || block.label !== "Ek Notlar") {
              return `<article class="cv-entry"><p class="cv-row-primary">${escapeHtml(block.label)}</p>${renderPrintList(block.lines)}</article>`;
            }

            return `<article class="cv-entry"><p class="cv-row-primary">${escapeHtml(block.label)}</p><p class="cv-copy">${escapeHtml(
              block.text,
            )}</p></article>`;
          })
          .join(""),
        sections.length > 0,
      ),
    );
  }

  return `<!doctype html>
<html lang="tr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(cvData.personal.fullName || "CV")}</title>
    <style>
      @page { size: A4 portrait; margin: 0; }
      html, body { margin: 0; padding: 0; background: #ffffff; color: #18181b; font-family: Arial, Helvetica, sans-serif; }
      * { box-sizing: border-box; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .print-shell { width: 210mm; min-height: 297mm; padding: 10mm; overflow: hidden; }
      .cv-document { font-size: ${(13.7 * safeScale).toFixed(2)}px; line-height: 1.32; color: #27272a; }
      .cv-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1.1em; padding-bottom: 0.9em; }
      .cv-header-main { min-width: 0; flex: 1; }
      .cv-heading { margin: 0; font-size: 2.18em; line-height: 1; font-weight: 600; letter-spacing: -0.03em; color: #09090b; }
      .cv-subheading { margin: 0.22em 0 0; font-size: 1.17em; font-weight: 500; color: #3f3f46; }
      .cv-meta { margin: 0.55em 0 0; font-size: 0.82em; line-height: 1.35; color: #52525b; }
      .cv-meta + .cv-meta { margin-top: 0.24em; }
      .cv-photo { width: ${(28 * safeScale).toFixed(2)}mm; height: ${(34 * safeScale).toFixed(2)}mm; object-fit: cover; object-position: center; flex-shrink: 0; }
      .cv-section + .cv-section { margin-top: 0.95em; }
      .cv-section-divider { border-top: 1px solid #e4e4e7; padding-top: 0.95em; }
      .cv-section-title { margin: 0 0 0.55em; font-size: 0.77em; line-height: 1.2; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #3f3f46; }
      .cv-copy, .cv-row-secondary, .cv-link, .cv-list-item { margin: 0; text-align: justify; text-justify: inter-word; }
      .cv-entry + .cv-entry { margin-top: 0.75em; }
      .cv-row { display: flex; align-items: baseline; justify-content: space-between; gap: 1em; }
      .cv-row-primary { margin: 0; font-weight: 600; color: #18181b; }
      .cv-row-secondary { margin-top: 0.18em; font-size: 0.93em; color: #3f3f46; }
      .cv-date { margin: 0; font-size: 0.9em; white-space: nowrap; color: #52525b; }
      .cv-list { margin: 0.35em 0 0; padding-left: 1.15em; }
      .cv-list-item + .cv-list-item { margin-top: 0.2em; }
      .cv-link { margin-top: 0.24em; font-size: 0.93em; }
      .cv-skill-row + .cv-skill-row { margin-top: 0.38em; }
      .cv-label { font-weight: 600; color: #18181b; }
    </style>
  </head>
  <body>
    <div class="print-shell">
      <div class="cv-document">
        <header class="cv-header">
          <div class="cv-header-main">
            <h1 class="cv-heading">${escapeHtml(cvData.personal.fullName.trim() || "Ad Soyad")}</h1>
            ${cvData.personal.title.trim() ? `<p class="cv-subheading">${escapeHtml(cvData.personal.title.trim())}</p>` : ""}
            ${contactLine ? `<p class="cv-meta">${escapeHtml(contactLine)}</p>` : ""}
            ${linkLine ? `<p class="cv-meta">${escapeHtml(linkLine)}</p>` : ""}
          </div>
          ${cvData.personal.photoDataUrl ? `<img class="cv-photo" src="${cvData.personal.photoDataUrl}" alt="CV fotografi" />` : ""}
        </header>
        ${sections.join("")}
      </div>
    </div>
    <script>
      window.onload = function () {
        setTimeout(function () {
          window.focus();
      window.print();
        }, 180);
      };
      window.onafterprint = function () {
        setTimeout(function () {
          window.close();
        }, 120);
      };
    </script>
  </body>
</html>`;
}

function Field({ label, hint, children }: FieldProps) {
  return (
    <label className="block space-y-2">
      <span className="flex items-center justify-between gap-3 text-sm font-medium text-zinc-800">
        <span>{label}</span>
        {hint ? <span className="text-xs font-normal text-zinc-500">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

function Panel({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-[28px] border border-zinc-200 bg-white p-5">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-zinc-950">{title}</h2>
        <p className="text-sm text-zinc-500">{description}</p>
      </div>
      {children}
    </section>
  );
}

function CvSheet({ cvData, contactLine, linkLine, fitScale, frameRef, contentRef }: CvSheetProps) {
  const experienceItems = cvData.experiences.filter((item) => item.company.trim() || item.role.trim() || item.achievements.trim());
  const projectItems = cvData.projects.filter((item) => item.name.trim() || item.description.trim());
  const educationItems = cvData.education.filter((item) => item.school.trim() || item.field.trim());
  const skillRows = [
    { label: "Temel Yetkinlikler", value: cvData.skills.core },
    { label: "Frontend", value: cvData.skills.frontend },
    { label: "Backend", value: cvData.skills.backend },
    { label: "Veri Tabanlari", value: cvData.skills.databases },
    { label: "Araclar", value: cvData.skills.tools },
  ].filter((item) => item.value.trim());
  const additionalBlocks = [
    { label: "Sertifikalar", lines: splitLines(cvData.certifications) },
    { label: "Diller", lines: splitLines(cvData.languages) },
    { label: "Ek Notlar", lines: splitLines(cvData.additionalInfo) },
  ].filter((item) => item.lines.length > 0);

  const scaleStyle: CSSProperties =
    fitScale < 0.999
      ? {
          transform: `scale(${fitScale})`,
          transformOrigin: "top left",
          width: `${100 / fitScale}%`,
        }
      : {};

  let sectionIndex = 0;
  const nextSectionClassName = () => {
    const className = sectionIndex === 0 ? "cv-section" : "cv-section cv-section-divider";
    sectionIndex += 1;
    return className;
  };

  return (
    <div className="print-shell rounded-[28px] border border-zinc-200 bg-white" ref={frameRef}>
      <div className="print-frame">
        <div className="cv-scale" style={scaleStyle}>
          <div className="cv-document" ref={contentRef}>
            <header className="cv-header">
              <div className="cv-header-main">
                <h1 className="cv-heading">{cvData.personal.fullName || "Ad Soyad"}</h1>
                {cvData.personal.title ? <p className="cv-subheading">{cvData.personal.title}</p> : null}
                {contactLine ? <p className="cv-meta">{contactLine}</p> : null}
                {linkLine ? <p className="cv-meta">{linkLine}</p> : null}
              </div>
              {cvData.personal.photoDataUrl ? <img alt="CV fotografi" className="cv-photo" src={cvData.personal.photoDataUrl} /> : null}
            </header>

            {cvData.summary.trim() ? (
              <section className={nextSectionClassName()}>
                <h2 className="cv-section-title">Profesyonel Ozet</h2>
                <p className="cv-copy">{cvData.summary.trim()}</p>
              </section>
            ) : null}

            {skillRows.length > 0 ? (
              <section className={nextSectionClassName()}>
                <h2 className="cv-section-title">Beceriler</h2>
                <div className="cv-skill-grid">
                  {skillRows.map((item) => (
                    <p className="cv-copy" key={item.label}>
                      <span className="cv-label">{item.label}:</span> {item.value}
                    </p>
                  ))}
                </div>
              </section>
            ) : null}

            {experienceItems.length > 0 ? (
              <section className={nextSectionClassName()}>
                <h2 className="cv-section-title">Deneyim</h2>
                <div className="space-y-3">
                  {experienceItems.map((experience) => {
                    const bullets = splitLines(experience.achievements);
                    const dateText = formatDateRange(experience.startDate, experience.endDate, experience.isCurrent);

                    return (
                      <article className="cv-entry" key={experience.id}>
                        <div className="cv-row">
                          <p className="cv-row-primary">{[experience.role.trim(), experience.company.trim()].filter(Boolean).join(" | ") || "Deneyim"}</p>
                          {dateText ? <p className="cv-date">{dateText}</p> : null}
                        </div>
                        {experience.location.trim() ? <p className="cv-row-secondary">{experience.location.trim()}</p> : null}
                        {bullets.length > 0 ? (
                          <ul className="cv-list">
                            {bullets.map((line, index) => (
                              <li className="cv-list-item" key={`${experience.id}-${index}`}>
                                {line}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {projectItems.length > 0 ? (
              <section className={nextSectionClassName()}>
                <h2 className="cv-section-title">Projeler</h2>
                <div className="space-y-3">
                  {projectItems.map((project) => (
                    <article className="cv-entry" key={project.id}>
                      <p className="cv-row-primary">{project.name.trim() || "Proje"}</p>
                      {project.stack.trim() ? (
                        <p className="cv-row-secondary">
                          <span className="cv-label">Teknoloji:</span> {project.stack.trim()}
                        </p>
                      ) : null}
                      {project.link.trim() ? (
                        <p className="cv-link">
                          <span className="cv-label">Baglanti:</span> {project.link.trim()}
                        </p>
                      ) : null}
                      {project.description.trim() ? <p className="cv-copy">{project.description.trim()}</p> : null}
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {educationItems.length > 0 ? (
              <section className={nextSectionClassName()}>
                <h2 className="cv-section-title">Egitim</h2>
                <div className="space-y-3">
                  {educationItems.map((education) => {
                    const subParts = [education.school.trim(), education.location.trim()].filter(Boolean);

                    if (education.gpa.trim()) {
                      subParts.push(`Not Ortalamasi: ${education.gpa.trim()}`);
                    }

                    return (
                      <article className="cv-entry" key={education.id}>
                        <div className="cv-row">
                          <p className="cv-row-primary">{[education.degree.trim(), education.field.trim()].filter(Boolean).join(" | ") || "Egitim"}</p>
                          {education.graduationDate.trim() ? <p className="cv-date">{formatMonth(education.graduationDate.trim())}</p> : null}
                        </div>
                        {subParts.length > 0 ? <p className="cv-row-secondary">{subParts.join(" | ")}</p> : null}
                      </article>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {additionalBlocks.length > 0 ? (
              <section className={nextSectionClassName()}>
                <h2 className="cv-section-title">Ek Bilgiler</h2>
                <div className="space-y-3">
                  {additionalBlocks.map((block) => (
                    <article className="cv-entry" key={block.label}>
                      <p className="cv-row-primary">{block.label}</p>
                      {block.lines.length > 1 || block.label !== "Ek Notlar" ? (
                        <ul className="cv-list">
                          {block.lines.map((line, index) => (
                            <li className="cv-list-item" key={`${block.label}-${index}`}>
                              {line}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="cv-copy">{block.lines[0]}</p>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function App() {
  const [cvData, setCvData] = useState<CvData>(() => getInitialCv());
  const [previewZoom, setPreviewZoom] = useState(DEFAULT_PREVIEW_ZOOM);
  const [fitScale, setFitScale] = useState(1);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const importRef = useRef<HTMLInputElement | null>(null);
  const photoRef = useRef<HTMLInputElement | null>(null);

  const contactLine = useMemo(
    () => [cvData.personal.email.trim(), cvData.personal.phone.trim(), cvData.personal.location.trim()].filter(Boolean).join(" | "),
    [cvData.personal.email, cvData.personal.phone, cvData.personal.location],
  );

  const linkLine = useMemo(
    () => cvData.personal.links.map(formatLinkLabel).filter(Boolean).join(" | "),
    [cvData.personal.links],
  );

  const recalculateFit = useCallback(() => {
    const frame = frameRef.current;
    const content = contentRef.current;

    if (!frame || !content) {
      return;
    }

    const frameHeight = frame.clientHeight;
    const contentHeight = content.scrollHeight;

    if (!frameHeight || !contentHeight) {
      setFitScale(1);
      return;
    }

    const nextScale = clampNumber(Number(Math.min(1, frameHeight / contentHeight).toFixed(3)), 0.6, 1);
    setFitScale(nextScale);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cvData));
  }, [cvData]);

  useLayoutEffect(() => {
    recalculateFit();
    const rafId = window.requestAnimationFrame(recalculateFit);
    window.addEventListener("resize", recalculateFit);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", recalculateFit);
    };
  }, [cvData, recalculateFit]);

  const previewZoomPercent = Math.round(previewZoom * 100);

  const changePreviewZoom = (nextZoom: number) => {
    setPreviewZoom(clampNumber(Number(nextZoom.toFixed(2)), MIN_PREVIEW_ZOOM, MAX_PREVIEW_ZOOM));
  };

  const updatePersonalField = (field: Exclude<keyof PersonalDetails, "links" | "photoDataUrl">, value: string) => {
    setCvData((current) => ({
      ...current,
      personal: {
        ...current.personal,
        [field]: value,
      },
    }));
  };

  const handlePhotoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCvData((current) => ({
        ...current,
        personal: {
          ...current.personal,
          photoDataUrl: typeof reader.result === "string" ? reader.result : "",
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(cvData, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ats-cv-data.json";
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = normalizeCvData(JSON.parse(typeof reader.result === "string" ? reader.result : ""));

        if (parsed) {
          setCvData(parsed);
        }
      } catch {
        window.alert("JSON dosyasi okunamadi.");
      } finally {
        event.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handlePrintPdf = () => {
    const popup = window.open("", "_blank", "width=900,height=1200");

    if (!popup) {
      window.alert("PDF olusturmak icin yeni pencere izni verin.");
      return;
    }

    popup.document.open();
    popup.document.write(buildPrintDocument(cvData, contactLine, linkLine, fitScale));
    popup.document.close();
  };

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-950">
      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 space-y-3 rounded-[32px] bg-white px-6 py-6 shadow-[0_18px_50px_rgba(24,24,27,0.06)]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">ATS CV Builder</p>
              <div>
                <h1 className="text-3xl font-semibold tracking-[-0.04em] text-zinc-950 sm:text-4xl">Tek sayfa, duzenlenebilir ve PDF hazir CV</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600 sm:text-base">
                  Sol tarafta bilgilerini duzenle, sag tarafta A4 onizlemesini kontrol et. PDF cikisi icin sadece tek buton kullanilir.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button className={secondaryButtonClassName} onClick={handleExport} type="button">
                JSON Disa Aktar
              </button>
              <button className={secondaryButtonClassName} onClick={() => importRef.current?.click()} type="button">
                JSON Ice Aktar
              </button>
              <button
                className={secondaryButtonClassName}
                onClick={() => {
                  setCvData(createTemplateCv());
                  setPreviewZoom(1);
                }}
                type="button"
              >
                Varsayilana Don
              </button>
              <button className={primaryButtonClassName} onClick={handlePrintPdf} type="button">
                PDF Kaydet
              </button>
            </div>
          </div>
          <input accept="application/json" className="hidden" onChange={handleImport} ref={importRef} type="file" />
        </header>

        <main className="page-grid grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.86fr)]">
          <section className="editor-panel space-y-5">
            <Panel title="Kisisel Bilgiler" description="Kimlik, iletisim ve baglanti alanlarini duzenle.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Ad Soyad">
                  <input className={inputClassName} onChange={(event) => updatePersonalField("fullName", event.target.value)} type="text" value={cvData.personal.fullName} />
                </Field>
                <Field label="Pozisyon">
                  <input className={inputClassName} onChange={(event) => updatePersonalField("title", event.target.value)} type="text" value={cvData.personal.title} />
                </Field>
                <Field label="E-posta">
                  <input className={inputClassName} onChange={(event) => updatePersonalField("email", event.target.value)} type="email" value={cvData.personal.email} />
                </Field>
                <Field label="Telefon">
                  <input className={inputClassName} onChange={(event) => updatePersonalField("phone", event.target.value)} type="tel" value={cvData.personal.phone} />
                </Field>
              </div>

              <Field label="Konum">
                <input className={inputClassName} onChange={(event) => updatePersonalField("location", event.target.value)} type="text" value={cvData.personal.location} />
              </Field>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900">Baglantilar</h3>
                    <p className="text-sm text-zinc-500">GitHub, LinkedIn, web sitesi veya farkli profilleri ekleyebilirsin.</p>
                  </div>
                  <button
                    className={secondaryButtonClassName}
                    onClick={() =>
                      setCvData((current) => ({
                        ...current,
                        personal: {
                          ...current.personal,
                          links: [...current.personal.links, createLink()],
                        },
                      }))
                    }
                    type="button"
                  >
                    Baglanti Ekle
                  </button>
                </div>

                <div className="space-y-3">
                  {cvData.personal.links.map((link, index) => (
                    <div className="grid gap-3 rounded-2xl border border-zinc-200 p-4 sm:grid-cols-[0.7fr_1fr_auto]" key={link.id}>
                      <input
                        className={inputClassName}
                        onChange={(event) =>
                          setCvData((current) => ({
                            ...current,
                            personal: {
                              ...current.personal,
                              links: updateItemById(current.personal.links, link.id, (item) => ({ ...item, label: event.target.value })),
                            },
                          }))
                        }
                        placeholder={`Baglanti ${index + 1} etiketi`}
                        type="text"
                        value={link.label}
                      />
                      <input
                        className={inputClassName}
                        onChange={(event) =>
                          setCvData((current) => ({
                            ...current,
                            personal: {
                              ...current.personal,
                              links: updateItemById(current.personal.links, link.id, (item) => ({ ...item, url: event.target.value })),
                            },
                          }))
                        }
                        placeholder="https://..."
                        type="url"
                        value={link.url}
                      />
                      <button
                        className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:border-zinc-900 hover:text-zinc-900"
                        onClick={() =>
                          setCvData((current) => ({
                            ...current,
                            personal: {
                              ...current.personal,
                              links: current.personal.links.length > 1 ? current.personal.links.filter((item) => item.id !== link.id) : [createLink()],
                            },
                          }))
                        }
                        type="button"
                      >
                        Sil
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-zinc-200 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900">Fotograf</h3>
                    <p className="text-sm text-zinc-500">Yuklendigi zaman onizlemede sag ustte gorunur.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button className={secondaryButtonClassName} onClick={() => photoRef.current?.click()} type="button">
                      Fotograf Yukle
                    </button>
                    {cvData.personal.photoDataUrl ? (
                      <button
                        className={secondaryButtonClassName}
                        onClick={() =>
                          setCvData((current) => ({
                            ...current,
                            personal: { ...current.personal, photoDataUrl: "" },
                          }))
                        }
                        type="button"
                      >
                        Kaldir
                      </button>
                    ) : null}
                  </div>
                </div>
                <input accept="image/*" className="hidden" onChange={handlePhotoUpload} ref={photoRef} type="file" />
                {cvData.personal.photoDataUrl ? <p className="text-sm text-zinc-500">Fotograf yüklendi. PDF ciktisinda da kullanilacak.</p> : null}
              </div>
            </Panel>

            <Panel title="Ozet" description="ATS sistemleri icin kisa, net ve gorev odakli bir paragraf kullan.">
              <Field label="Profesyonel Ozet">
                <textarea className={textAreaClassName} onChange={(event) => setCvData((current) => ({ ...current, summary: event.target.value }))} value={cvData.summary} />
              </Field>
            </Panel>

            <Panel title="Beceriler" description="Anahtar kelimeleri kategori bazinda yaz.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Temel Yetkinlikler">
                  <textarea className={textAreaClassName} onChange={(event) => setCvData((current) => ({ ...current, skills: { ...current.skills, core: event.target.value } }))} value={cvData.skills.core} />
                </Field>
                <Field label="Frontend">
                  <textarea className={textAreaClassName} onChange={(event) => setCvData((current) => ({ ...current, skills: { ...current.skills, frontend: event.target.value } }))} value={cvData.skills.frontend} />
                </Field>
                <Field label="Backend">
                  <textarea className={textAreaClassName} onChange={(event) => setCvData((current) => ({ ...current, skills: { ...current.skills, backend: event.target.value } }))} value={cvData.skills.backend} />
                </Field>
                <Field label="Veri Tabanlari">
                  <textarea className={textAreaClassName} onChange={(event) => setCvData((current) => ({ ...current, skills: { ...current.skills, databases: event.target.value } }))} value={cvData.skills.databases} />
                </Field>
              </div>
              <Field label="Araclar">
                <textarea className={textAreaClassName} onChange={(event) => setCvData((current) => ({ ...current, skills: { ...current.skills, tools: event.target.value } }))} value={cvData.skills.tools} />
              </Field>
            </Panel>

            <Panel title="Deneyim" description="Her satira bir gorev veya basari yaz.">
              <div className="space-y-4">
                {cvData.experiences.map((experience, index) => (
                  <div className="space-y-4 rounded-2xl border border-zinc-200 p-4" key={experience.id}>
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-sm font-semibold text-zinc-900">Deneyim {index + 1}</h3>
                      <button
                        className="text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
                        onClick={() =>
                          setCvData((current) => ({
                            ...current,
                            experiences: current.experiences.length > 1 ? current.experiences.filter((item) => item.id !== experience.id) : [createExperience()],
                          }))
                        }
                        type="button"
                      >
                        Sil
                      </button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Sirket">
                        <input
                          className={inputClassName}
                          onChange={(event) =>
                            setCvData((current) => ({
                              ...current,
                              experiences: updateItemById(current.experiences, experience.id, (item) => ({ ...item, company: event.target.value })),
                            }))
                          }
                          type="text"
                          value={experience.company}
                        />
                      </Field>
                      <Field label="Rol">
                        <input
                          className={inputClassName}
                          onChange={(event) =>
                            setCvData((current) => ({
                              ...current,
                              experiences: updateItemById(current.experiences, experience.id, (item) => ({ ...item, role: event.target.value })),
                            }))
                          }
                          type="text"
                          value={experience.role}
                        />
                      </Field>
                      <Field label="Konum">
                        <input
                          className={inputClassName}
                          onChange={(event) =>
                            setCvData((current) => ({
                              ...current,
                              experiences: updateItemById(current.experiences, experience.id, (item) => ({ ...item, location: event.target.value })),
                            }))
                          }
                          type="text"
                          value={experience.location}
                        />
                      </Field>
                      <Field label="Baslangic Tarihi">
                        <input
                          className={inputClassName}
                          onChange={(event) =>
                            setCvData((current) => ({
                              ...current,
                              experiences: updateItemById(current.experiences, experience.id, (item) => ({ ...item, startDate: event.target.value })),
                            }))
                          }
                          type="month"
                          value={experience.startDate}
                        />
                      </Field>
                      <Field label="Bitis Tarihi">
                        <input
                          className={inputClassName}
                          disabled={experience.isCurrent}
                          onChange={(event) =>
                            setCvData((current) => ({
                              ...current,
                              experiences: updateItemById(current.experiences, experience.id, (item) => ({ ...item, endDate: event.target.value })),
                            }))
                          }
                          type="month"
                          value={experience.endDate}
                        />
                      </Field>
                      <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700 sm:self-end">
                        <input
                          checked={experience.isCurrent}
                          className="h-4 w-4 accent-zinc-900"
                          onChange={(event) =>
                            setCvData((current) => ({
                              ...current,
                              experiences: updateItemById(current.experiences, experience.id, (item) => ({
                                ...item,
                                isCurrent: event.target.checked,
                                endDate: event.target.checked ? "" : item.endDate,
                              })),
                            }))
                          }
                          type="checkbox"
                        />
                        Halen devam ediyor
                      </label>
                    </div>

                    <Field label="Basarilar / Gorevler" hint="Her satira bir madde yazin.">
                      <textarea
                        className={textAreaClassName}
                        onChange={(event) =>
                          setCvData((current) => ({
                            ...current,
                            experiences: updateItemById(current.experiences, experience.id, (item) => ({ ...item, achievements: event.target.value })),
                          }))
                        }
                        value={experience.achievements}
                      />
                    </Field>
                  </div>
                ))}
              </div>

              <button
                className={secondaryButtonClassName}
                onClick={() => setCvData((current) => ({ ...current, experiences: [...current.experiences, createExperience()] }))}
                type="button"
              >
                Deneyim Ekle
              </button>
            </Panel>

            <Panel title="Projeler" description="Teknoloji, link ve kisa aciklama ekle.">
              <div className="space-y-4">
                {cvData.projects.map((project, index) => (
                  <div className="space-y-4 rounded-2xl border border-zinc-200 p-4" key={project.id}>
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-sm font-semibold text-zinc-900">Proje {index + 1}</h3>
                      <button
                        className="text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
                        onClick={() =>
                          setCvData((current) => ({
                            ...current,
                            projects: current.projects.length > 1 ? current.projects.filter((item) => item.id !== project.id) : [createProject()],
                          }))
                        }
                        type="button"
                      >
                        Sil
                      </button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Proje Adi">
                        <input
                          className={inputClassName}
                          onChange={(event) =>
                            setCvData((current) => ({
                              ...current,
                              projects: updateItemById(current.projects, project.id, (item) => ({ ...item, name: event.target.value })),
                            }))
                          }
                          type="text"
                          value={project.name}
                        />
                      </Field>
                      <Field label="Teknoloji Yigini">
                        <input
                          className={inputClassName}
                          onChange={(event) =>
                            setCvData((current) => ({
                              ...current,
                              projects: updateItemById(current.projects, project.id, (item) => ({ ...item, stack: event.target.value })),
                            }))
                          }
                          type="text"
                          value={project.stack}
                        />
                      </Field>
                    </div>

                    <Field label="Baglanti">
                      <input
                        className={inputClassName}
                        onChange={(event) =>
                          setCvData((current) => ({
                            ...current,
                            projects: updateItemById(current.projects, project.id, (item) => ({ ...item, link: event.target.value })),
                          }))
                        }
                        type="url"
                        value={project.link}
                      />
                    </Field>

                    <Field label="Aciklama">
                      <textarea
                        className={textAreaClassName}
                        onChange={(event) =>
                          setCvData((current) => ({
                            ...current,
                            projects: updateItemById(current.projects, project.id, (item) => ({ ...item, description: event.target.value })),
                          }))
                        }
                        value={project.description}
                      />
                    </Field>
                  </div>
                ))}
              </div>

              <button className={secondaryButtonClassName} onClick={() => setCvData((current) => ({ ...current, projects: [...current.projects, createProject()] }))} type="button">
                Proje Ekle
              </button>
            </Panel>

            <Panel title="Egitim" description="Okul, bolum, mezuniyet ve not ortalamasi.">
              <div className="space-y-4">
                {cvData.education.map((education, index) => (
                  <div className="space-y-4 rounded-2xl border border-zinc-200 p-4" key={education.id}>
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-sm font-semibold text-zinc-900">Egitim {index + 1}</h3>
                      <button
                        className="text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
                        onClick={() =>
                          setCvData((current) => ({
                            ...current,
                            education: current.education.length > 1 ? current.education.filter((item) => item.id !== education.id) : [createEducation()],
                          }))
                        }
                        type="button"
                      >
                        Sil
                      </button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Okul">
                        <input
                          className={inputClassName}
                          onChange={(event) =>
                            setCvData((current) => ({
                              ...current,
                              education: updateItemById(current.education, education.id, (item) => ({ ...item, school: event.target.value })),
                            }))
                          }
                          type="text"
                          value={education.school}
                        />
                      </Field>
                      <Field label="Derece">
                        <input
                          className={inputClassName}
                          onChange={(event) =>
                            setCvData((current) => ({
                              ...current,
                              education: updateItemById(current.education, education.id, (item) => ({ ...item, degree: event.target.value })),
                            }))
                          }
                          type="text"
                          value={education.degree}
                        />
                      </Field>
                      <Field label="Bolum">
                        <input
                          className={inputClassName}
                          onChange={(event) =>
                            setCvData((current) => ({
                              ...current,
                              education: updateItemById(current.education, education.id, (item) => ({ ...item, field: event.target.value })),
                            }))
                          }
                          type="text"
                          value={education.field}
                        />
                      </Field>
                      <Field label="Konum">
                        <input
                          className={inputClassName}
                          onChange={(event) =>
                            setCvData((current) => ({
                              ...current,
                              education: updateItemById(current.education, education.id, (item) => ({ ...item, location: event.target.value })),
                            }))
                          }
                          type="text"
                          value={education.location}
                        />
                      </Field>
                      <Field label="Mezuniyet Tarihi">
                        <input
                          className={inputClassName}
                          onChange={(event) =>
                            setCvData((current) => ({
                              ...current,
                              education: updateItemById(current.education, education.id, (item) => ({ ...item, graduationDate: event.target.value })),
                            }))
                          }
                          type="month"
                          value={education.graduationDate}
                        />
                      </Field>
                      <Field label="Not Ortalamasi" hint="Ornek: 3.73 / 4.00">
                        <input
                          className={inputClassName}
                          onChange={(event) =>
                            setCvData((current) => ({
                              ...current,
                              education: updateItemById(current.education, education.id, (item) => ({ ...item, gpa: event.target.value })),
                            }))
                          }
                          type="text"
                          value={education.gpa}
                        />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>

              <button className={secondaryButtonClassName} onClick={() => setCvData((current) => ({ ...current, education: [...current.education, createEducation()] }))} type="button">
                Egitim Ekle
              </button>
            </Panel>

            <Panel title="Ek Bilgiler" description="Sertifika, dil ve ek notlari satir satir yaz.">
              <Field label="Sertifikalar" hint="Her satira bir kayit yazin.">
                <textarea className={textAreaClassName} onChange={(event) => setCvData((current) => ({ ...current, certifications: event.target.value }))} value={cvData.certifications} />
              </Field>
              <Field label="Diller" hint="Her satira bir dil ve seviye yazin.">
                <textarea className={textAreaClassName} onChange={(event) => setCvData((current) => ({ ...current, languages: event.target.value }))} value={cvData.languages} />
              </Field>
              <Field label="Ek Notlar">
                <textarea className={textAreaClassName} onChange={(event) => setCvData((current) => ({ ...current, additionalInfo: event.target.value }))} value={cvData.additionalInfo} />
              </Field>
            </Panel>
          </section>

          <section className="print-area space-y-4 overflow-x-auto xl:sticky xl:top-6 xl:self-start">
            <div className="screen-only flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">A4 Onizleme</p>
                <p className="text-sm text-zinc-500">
                  {getAppliedContentScale(fitScale) < 0.995
                    ? `Icerik, tek sayfada kalmasi icin otomatik olarak %${Math.round(getAppliedContentScale(fitScale) * 100)} olcegine ayarlandi`
                    : "Icerik A4'e tam sigiyor"}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2">
                <span className="text-sm font-medium text-zinc-600">Onizleme Olcegi</span>
                <button
                  aria-label="Onizlemeyi kucult"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 text-lg leading-none text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900"
                  onClick={() => changePreviewZoom(previewZoom - PREVIEW_ZOOM_STEP)}
                  type="button"
                >
                  -
                </button>
                <input
                  aria-label="Onizleme olcegi"
                  className="h-2 w-28 accent-zinc-900"
                  max={MAX_PREVIEW_ZOOM}
                  min={MIN_PREVIEW_ZOOM}
                  onChange={(event) => changePreviewZoom(Number(event.target.value))}
                  step={PREVIEW_ZOOM_STEP}
                  type="range"
                  value={previewZoom}
                />
                <button
                  aria-label="Onizlemeyi buyut"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 text-lg leading-none text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900"
                  onClick={() => changePreviewZoom(previewZoom + PREVIEW_ZOOM_STEP)}
                  type="button"
                >
                  +
                </button>
                <button
                  className="rounded-full border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900"
                  onClick={() => changePreviewZoom(DEFAULT_PREVIEW_ZOOM)}
                  type="button"
                >
                  Sifirla
                </button>
                <span className="min-w-12 text-right text-sm font-semibold text-zinc-900">{previewZoomPercent}%</span>
              </div>
            </div>

            <div className="screen-preview pb-4">
              <div className="preview-zoom" style={{ transform: `scale(${previewZoom})` }}>
                <CvSheet
                  contactLine={contactLine}
                  contentRef={contentRef}
                  cvData={cvData}
                  fitScale={getAppliedContentScale(fitScale)}
                  frameRef={frameRef}
                  linkLine={linkLine}
                />
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;

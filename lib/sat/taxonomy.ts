/**
 * Official Digital SAT content taxonomy (College Board): section → domain → skill.
 * Question topics for SAT are stored as the exact skill name, which is what the question bank filters on.
 */
export type SatSection = "Math" | "Reading and Writing";
export type SatDomain = { section: SatSection; name: string; skills: string[] };

export const SAT_DOMAINS: SatDomain[] = [
  { section: "Reading and Writing", name: "Information and Ideas", skills: ["Central Ideas and Details", "Command of Evidence", "Inferences"] },
  { section: "Reading and Writing", name: "Craft and Structure", skills: ["Words in Context", "Text Structure and Purpose", "Cross-Text Connections"] },
  { section: "Reading and Writing", name: "Expression of Ideas", skills: ["Rhetorical Synthesis", "Transitions"] },
  { section: "Reading and Writing", name: "Standard English Conventions", skills: ["Boundaries", "Form, Structure, and Sense"] },
  { section: "Math", name: "Algebra", skills: ["Linear equations in one variable", "Linear functions", "Linear equations in two variables", "Systems of two linear equations in two variables", "Linear inequalities in one or two variables"] },
  { section: "Math", name: "Advanced Math", skills: ["Equivalent expressions", "Nonlinear equations in one variable and systems of equations in two variables", "Nonlinear functions"] },
  { section: "Math", name: "Problem-Solving and Data Analysis", skills: ["Ratios, rates, proportional relationships, and units", "Percentages", "One-variable data: Distributions and measures of center and spread", "Two-variable data: Models and scatterplots", "Probability and conditional probability", "Inference from sample statistics and margin of error", "Evaluating statistical claims: Observational studies and experiments"] },
  { section: "Math", name: "Geometry and Trigonometry", skills: ["Area and volume", "Lines, angles, and triangles", "Right triangles and trigonometry", "Circles"] },
];

const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");
const skillIndex = new Map(SAT_DOMAINS.flatMap((domain) => domain.skills.map((skill) => [normalize(skill), { skill, domain }] as const)));

/** Common informal names mapped to the official skill. */
const aliases: Record<string, string> = {
  "systems of equations": "Systems of two linear equations in two variables",
  "inequalities": "Linear inequalities in one or two variables",
  "quadratic functions": "Nonlinear functions",
  "exponential functions": "Nonlinear functions",
  "absolute value": "Nonlinear functions",
  "lines and angles": "Lines, angles, and triangles",
  "right triangle trigonometry": "Right triangles and trigonometry",
  "шугаман функц": "Linear functions",
};

/** Older free-text topics that name a whole domain rather than one skill. */
const domainAliases: Record<string, string> = {
  "algebra": "Algebra", "алгебр": "Algebra",
  "advanced math": "Advanced Math", "зэрэг": "Advanced Math",
  "problem-solving and data analysis": "Problem-Solving and Data Analysis", "data analysis": "Problem-Solving and Data Analysis",
  "geometry and trigonometry": "Geometry and Trigonometry", "geometry": "Geometry and Trigonometry", "геометр": "Geometry and Trigonometry",
};

/** Resolves a stored or imported topic to its official skill and domain; unknown topics return null. */
export function resolveSatSkill(topic: string | null | undefined) {
  if (!topic) return null;
  const key = normalize(topic);
  return skillIndex.get(key) ?? (aliases[key] ? skillIndex.get(normalize(aliases[key]))! : null);
}

/** The test subject decides the section when a question's topic doesn't. */
export function sectionForSubject(subject: string): SatSection | null {
  const key = normalize(subject);
  if (key === "math" || key.includes("математик")) return "Math";
  if (key.startsWith("reading")) return "Reading and Writing";
  return null;
}

export type SatPlacement = { section: SatSection | null; domain: string | null; skill: string | null };

/** Where a question sits in the bank: its skill when the topic names one, else its domain, else only its section. */
export function placeSatQuestion(topic: string | null | undefined, subject: string): SatPlacement {
  const subjectSection = sectionForSubject(subject);
  const skill = resolveSatSkill(topic);
  const domainName = topic ? domainAliases[normalize(topic)] : undefined;
  const domain = skill?.domain ?? SAT_DOMAINS.find((item) => item.name === domainName);
  // A section test is the stronger signal: a Math topic on a Reading and Writing test is a mislabel, not a Math question.
  if (!domain || (subjectSection && subjectSection !== domain.section)) return { section: subjectSection, domain: null, skill: null };
  return { section: domain.section, domain: domain.name, skill: skill?.skill ?? null };
}

const slug = (value: string) => normalize(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/**
 * Filter group of a placed question, safe for URLs: the skill's slug, `other-<domain>` for a domain-level topic,
 * or `unclassified-<section>` when only the section is known.
 */
export function satGroupKey(placement: SatPlacement) {
  if (placement.skill) return slug(placement.skill);
  if (placement.domain) return `other-${slug(placement.domain)}`;
  return `unclassified-${slug(placement.section ?? "none")}`;
}

/** Display name of a filter group key. */
export function satGroupLabel(key: string) {
  for (const domain of SAT_DOMAINS) {
    const skill = domain.skills.find((item) => slug(item) === key);
    if (skill) return skill;
    if (key === `other-${slug(domain.name)}`) return `${domain.name} — бусад`;
  }
  return "Ангилаагүй";
}

export const satSkillKey = slug;

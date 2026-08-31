import type {
  CodeProgressionSection,
  CoursePage,
  CourseSection,
  CourseTopicJourney,
  MathProofSection,
  MentalModelSection,
  ProblemCheckpointSection,
  QuestionBankSuiteSection,
} from "./courseTypes";
import { ALL_COURSE_JOURNEYS } from "./catalog";

/**
 * Result returned by the curriculum full-text search engine.
 */
export interface SearchResult {
  readonly topicId: string;
  readonly courseTitle: string;
  readonly trackId: string;
  readonly chapterNumber: number;
  readonly chapterTitle: string;
  readonly pageNumber: number;
  readonly pageTitle: string;
  readonly pageId: string;
  readonly sectionType: string;
  readonly sectionTitle: string;
  readonly snippet: string;
  readonly score: number;
}

/**
 * Configuration options for curriculum queries.
 */
export interface SearchOptions {
  readonly trackFilter?: string;
  readonly sectionTypeFilter?: readonly string[];
  readonly limit?: number;
  readonly minScore?: number;
}

/**
 * Internal indexable document unit representing a section within a course page.
 */
interface SearchDocument {
  readonly docId: string;
  readonly topicId: string;
  readonly courseTitle: string;
  readonly trackId: string;
  readonly chapterNumber: number;
  readonly chapterTitle: string;
  readonly pageNumber: number;
  readonly pageTitle: string;
  readonly pageId: string;
  readonly sectionType: string;
  readonly sectionTitle: string;
  readonly fullText: string;
  readonly titleText: string;
  readonly theoremText: string;
  readonly codeText: string;
  readonly bodyText: string;
}

/**
 * Canonical Concept Glossary Entry.
 */
export interface ConceptIndexEntry {
  readonly concept: string;
  readonly topicId: string;
  readonly courseTitle: string;
  readonly chapterTitle: string;
  readonly pageTitle: string;
  readonly pageId: string;
  readonly category: "theorem" | "systems_invariant" | "algorithm" | "data_structure" | "metric";
}

/**
 * Tokenizes text into search terms, keeping alphanumerics and technical symbols.
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s+\-$\\_]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

/**
 * Extracts plain text from a section based on its discriminated union type.
 */
function extractSectionTexts(section: CourseSection): {
  sectionTitle: string;
  titleText: string;
  theoremText: string;
  codeText: string;
  bodyText: string;
} {
  let sectionTitle = "";
  let titleText = "";
  let theoremText = "";
  let codeText = "";
  let bodyText = "";

  switch (section.type) {
    case "prose":
      sectionTitle = section.title || "Foundations Overview";
      titleText = section.title || "";
      bodyText = section.content || "";
      break;

    case "callout":
      sectionTitle = section.title || "Systems Callout";
      titleText = `${section.title} ${section.variant}`;
      bodyText = section.content || "";
      break;

    case "code_progression": {
      const sec = section as CodeProgressionSection;
      sectionTitle = sec.title || "Code Progression";
      titleText = sec.title || "";
      codeText = sec.stages.map((s) => `${s.label} ${s.code} ${s.explanation}`).join(" ");
      bodyText = sec.stepByStep?.join(" ") || "";
      break;
    }

    case "mental_model": {
      const sec = section as MentalModelSection;
      sectionTitle = sec.title || "Mental Model";
      titleText = sec.title || "";
      theoremText = sec.invariant || "";
      bodyText = `${sec.visualIntuition} ${sec.stateTransitions} ${sec.naiveBottleneck} ${sec.optimalInsight}`;
      break;
    }

    case "math_proof": {
      const sec = section as MathProofSection;
      sectionTitle = sec.title || "Mathematical Proof";
      titleText = sec.title || "";
      theoremText = sec.theorem || "";
      bodyText = sec.proof || "";
      break;
    }

    case "problem_checkpoint": {
      const sec = section as ProblemCheckpointSection;
      sectionTitle = sec.title || "Problem Checkpoint";
      titleText = `${sec.title} ${sec.problemId}`;
      codeText = sec.starterCode || "";
      bodyText = sec.rationale || "";
      break;
    }

    case "question_bank_suite": {
      const sec = section as QuestionBankSuiteSection;
      sectionTitle = sec.title || "Question Bank Suite";
      titleText = sec.title || "";
      bodyText = [
        ...(sec.partA_dsaCoding?.map(
          (p) => `${p.title} ${p.description || ""} ${p.problemStatement || ""}`,
        ) || []),
        ...(sec.partB_mathProofs?.map(
          (p) =>
            `${p.title} ${p.statement || ""} ${p.proofOutline || ""} ${p.engineeringContext || ""}`,
        ) || []),
        ...(sec.partC_systemsQuestions?.map(
          (p) => `${p.title} ${p.prompt} ${p.engineeringContext || ""}`,
        ) || []),
        ...(sec.partD_stressTests?.map(
          (p) => `${p.title} ${p.scenario || ""} ${p.failureMode || ""}`,
        ) || []),
      ].join(" ");
      break;
    }
  }

  return { sectionTitle, titleText, theoremText, codeText, bodyText };
}

/**
 * Builds an index of all searchable sections across all course journeys.
 */
function buildSearchDocuments(journeys: readonly CourseTopicJourney[]): SearchDocument[] {
  const documents: SearchDocument[] = [];

  for (const journey of journeys) {
    const trackId =
      (journey.trackId as string) || (journey.id.startsWith("dsa_") ? "dsa" : "machine-learning");

    for (const chapter of journey.chapters || []) {
      const pages: readonly CoursePage[] =
        chapter.pages && chapter.pages.length > 0
          ? chapter.pages
          : [
              {
                id: `${chapter.id}_p1`,
                pageNumber: 1,
                title: chapter.title,
                sections: chapter.sections || [],
              },
            ];

      for (const page of pages) {
        for (let sIdx = 0; sIdx < (page.sections || []).length; sIdx++) {
          const section = page.sections[sIdx];
          const { sectionTitle, titleText, theoremText, codeText, bodyText } =
            extractSectionTexts(section);

          const fullText = `${journey.title} ${journey.subtitle} ${chapter.title} ${page.title} ${sectionTitle} ${titleText} ${theoremText} ${codeText} ${bodyText}`;

          documents.push({
            docId: `${journey.id}__c${chapter.chapterNumber}__p${page.pageNumber}__s${sIdx}`,
            topicId: journey.id,
            courseTitle: journey.title,
            trackId,
            chapterNumber: chapter.chapterNumber,
            chapterTitle: chapter.title,
            pageNumber: page.pageNumber,
            pageTitle: page.title,
            pageId: page.id,
            sectionType: section.type,
            sectionTitle,
            fullText,
            titleText: `${journey.title} ${chapter.title} ${page.title} ${titleText}`,
            theoremText,
            codeText,
            bodyText,
          });
        }
      }
    }
  }

  return documents;
}

// Global cached documents index
let cachedDocuments: SearchDocument[] | null = null;

function getSearchDocuments(): SearchDocument[] {
  if (!cachedDocuments) {
    cachedDocuments = buildSearchDocuments(ALL_COURSE_JOURNEYS);
  }
  return cachedDocuments;
}

/**
 * Generates an excerpt window around the best matching query term with formatting.
 */
function generateSnippet(fullText: string, queryTerms: string[], windowSize: number = 160): string {
  const clean = fullText.replace(/\s+/g, " ").trim();
  const lower = clean.toLowerCase();

  let bestIndex = -1;
  for (const term of queryTerms) {
    const idx = lower.indexOf(term.toLowerCase());
    if (idx !== -1 && (bestIndex === -1 || idx < bestIndex)) {
      bestIndex = idx;
    }
  }

  if (bestIndex === -1) {
    return clean.slice(0, windowSize) + (clean.length > windowSize ? "..." : "");
  }

  const start = Math.max(0, bestIndex - Math.floor(windowSize / 3));
  const end = Math.min(clean.length, start + windowSize);

  let snippet = clean.slice(start, end);
  if (start > 0) snippet = "..." + snippet;
  if (end < clean.length) snippet = snippet + "...";

  return snippet;
}

/**
 * Executes a full-text ranked query across all 64 course journeys.
 */
export function searchCurriculum(query: string, options: SearchOptions = {}): SearchResult[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const queryTerms = tokenize(trimmed);
  if (queryTerms.length === 0) return [];

  const queryLower = trimmed.toLowerCase();
  const documents = getSearchDocuments();
  const results: SearchResult[] = [];

  const { trackFilter, sectionTypeFilter, limit = 20, minScore = 5 } = options;

  for (const doc of documents) {
    // 1. Apply Track & Section Filters
    if (trackFilter) {
      const matchDsa = trackFilter === "dsa" && doc.trackId === "dsa";
      const matchMl =
        (trackFilter === "machine-learning" ||
          trackFilter === "ml" ||
          trackFilter === "ml-infra") &&
        (doc.trackId === "machine-learning" || doc.trackId === "ml" || doc.trackId === "ml-infra");
      if (!matchDsa && !matchMl && doc.trackId !== trackFilter) {
        continue;
      }
    }

    if (sectionTypeFilter && sectionTypeFilter.length > 0) {
      if (!sectionTypeFilter.includes(doc.sectionType)) {
        continue;
      }
    }

    // 2. Relevance Scoring
    let score = 0;
    const docLower = doc.fullText.toLowerCase();
    const titleLower = doc.titleText.toLowerCase();
    const theoremLower = doc.theoremText.toLowerCase();
    const codeLower = doc.codeText.toLowerCase();
    const topicIdLower = doc.topicId.toLowerCase();

    // Exact full query match boosts
    if (titleLower.includes(queryLower)) score += 120;
    if (theoremLower.includes(queryLower)) score += 80;
    if (docLower.includes(queryLower)) score += 40;
    if (topicIdLower.includes(queryLower.replace(/\s+/g, "_"))) score += 90;

    // Individual term matches
    let matchedTermsCount = 0;
    for (const term of queryTerms) {
      let termMatched = false;

      if (titleLower.includes(term)) {
        score += 35;
        termMatched = true;
      }
      if (theoremLower.includes(term)) {
        score += 25;
        termMatched = true;
      }
      if (codeLower.includes(term)) {
        score += 15;
        termMatched = true;
      }
      if (docLower.includes(term)) {
        score += 8;
        termMatched = true;
      }
      if (topicIdLower.includes(term)) {
        score += 30;
        termMatched = true;
      }

      if (termMatched) matchedTermsCount++;
    }

    // Require matching at least one term
    if (matchedTermsCount === 0 || score < minScore) {
      continue;
    }

    // Boost documents matching all query terms
    if (matchedTermsCount === queryTerms.length && queryTerms.length > 1) {
      score += 25;
    }

    const snippet = generateSnippet(doc.fullText, queryTerms);

    results.push({
      topicId: doc.topicId,
      courseTitle: doc.courseTitle,
      trackId: doc.trackId,
      chapterNumber: doc.chapterNumber,
      chapterTitle: doc.chapterTitle,
      pageNumber: doc.pageNumber,
      pageTitle: doc.pageTitle,
      pageId: doc.pageId,
      sectionType: doc.sectionType,
      sectionTitle: doc.sectionTitle,
      snippet,
      score,
    });
  }

  // 3. Sort by score descending and truncate
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

/**
 * Generates an alphabetized master concept glossary indexing core theorems, algorithms, and systems invariants.
 */
export function getConceptIndex(): ConceptIndexEntry[] {
  const documents = getSearchDocuments();
  const conceptsMap = new Map<string, ConceptIndexEntry>();

  for (const doc of documents) {
    // 1. Index Math Proof Theorems
    if (doc.sectionType === "math_proof" && doc.sectionTitle) {
      const cleanConcept = doc.sectionTitle
        .replace(/^(Theorem|Proof|Derivation)\s*\d*[:-]?\s*/i, "")
        .trim();

      if (cleanConcept.length > 4 && !conceptsMap.has(cleanConcept)) {
        conceptsMap.set(cleanConcept, {
          concept: cleanConcept,
          topicId: doc.topicId,
          courseTitle: doc.courseTitle,
          chapterTitle: doc.chapterTitle,
          pageTitle: doc.pageTitle,
          pageId: doc.pageId,
          category: "theorem",
        });
      }
    }

    // 2. Index Mental Model Systems Invariants
    if (doc.sectionType === "mental_model" && doc.theoremText) {
      const cleanConcept = doc.sectionTitle.trim();
      if (cleanConcept.length > 4 && !conceptsMap.has(cleanConcept)) {
        conceptsMap.set(cleanConcept, {
          concept: cleanConcept,
          topicId: doc.topicId,
          courseTitle: doc.courseTitle,
          chapterTitle: doc.chapterTitle,
          pageTitle: doc.pageTitle,
          pageId: doc.pageId,
          category: "systems_invariant",
        });
      }
    }

    // 3. Index Problem Checkpoints & Algorithmic Engines
    if (doc.sectionType === "problem_checkpoint" && doc.sectionTitle) {
      const cleanConcept = doc.sectionTitle.trim();
      if (cleanConcept.length > 4 && !conceptsMap.has(cleanConcept)) {
        conceptsMap.set(cleanConcept, {
          concept: cleanConcept,
          topicId: doc.topicId,
          courseTitle: doc.courseTitle,
          chapterTitle: doc.chapterTitle,
          pageTitle: doc.pageTitle,
          pageId: doc.pageId,
          category: "algorithm",
        });
      }
    }
  }

  return Array.from(conceptsMap.values()).sort((a, b) => a.concept.localeCompare(b.concept));
}

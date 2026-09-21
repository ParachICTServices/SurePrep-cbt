import { collection, getDocs, query, where } from "firebase/firestore";
import { FIRESTORE_COLLECTIONS, getRecord, listRecords } from "@/app/lib/firebaseData";
import { db } from "@/app/lib/firebase";
import type { Subject } from "@/app/lib/api/services/subjectService";
import type { Question, QuestionsFilter } from "@/app/lib/api/services/questionService";
import { questionService } from "@/app/lib/api/services/questionService";
import { subjectService } from "@/app/lib/api/services/subjectService";

export interface ExamSpecializationRule {
  subjectIds?: string[];
  courseSubjectIds?: Record<string, string[]>;
}

export interface ExamConfiguration {
  id: string;
  name?: string;
  aliases?: string[];
  specializations?: Record<string, ExamSpecializationRule>;
  subjectIds?: string[];
  subjects?: string[];
  specialization?: string;
  courses?: Record<string, ExamSpecializationRule | string[]>;
  questionLimit?: number;
  durationMinutes?: number;
  numberOfQuestions?: number;
}

export interface AvailableSubject extends Subject {
  questionCount: number;
}

export interface AvailableTopic {
  id: string;
  name: string;
  questionCount: number;
}

export interface ContentQuestion extends Question {
  examType?: string;
  subjectId?: string;
  topic?: string;
  source?: string;
  year?: number | string;
}

function normalize(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\/_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function canonicalSubjectKey(value: unknown): string {
  const key = normalize(value);
  const aliases: Record<string, string> = {
    math: "mathematics",
    maths: "mathematics",
    "english language": "english",
    englishlanguage: "english",
    "use of english": "english",
    "useofenglish": "english",
  };
  return aliases[key] ?? key;
}

function questionSubjectValues(question: unknown): string[] {
  const record = question as Record<string, unknown>;
  const values = [
    record.subjectId,
    record.subject_id,
    record.subject,
    record.subjectName,
    typeof record.subject === "object" && record.subject !== null
      ? (record.subject as Record<string, unknown>).id
      : undefined,
    typeof record.subject === "object" && record.subject !== null
      ? (record.subject as Record<string, unknown>).name
      : undefined,
  ];
  return Array.from(new Set(values.filter(Boolean).map(canonicalSubjectKey)));
}

function questionExamType(question: unknown): string | undefined {
  const record = question as Record<string, unknown>;
  const value = record.examType ?? record.exam ?? record.source;
  return value ? normalize(value) : undefined;
}

function canonicalExamKey(value: unknown): string {
  const key = normalize(value);
  if (key === "utme" || key === "jamb utme" || key === "jamb/utme") return "jamb";
  return key;
}

const BROAD_SPECIALIZATIONS = new Set(["science", "sciences", "arts", "commercial", "general"]);

function canonicalSpecialization(value: unknown): string | null {
  const key = normalize(value);
  if (!key || key === "general") return null;
  if (key === "science") return "sciences";
  return BROAD_SPECIALIZATIONS.has(key) ? key : null;
}

function questionTopics(question: unknown): string[] {
  const record = question as Record<string, unknown>;
  const topics = Array.isArray(record.topics) ? record.topics : [];
  const names = topics
    .map((topic) => typeof topic === "string" ? topic : (topic as { name?: string })?.name)
    .filter((topic): topic is string => Boolean(topic?.trim()));
  const singleTopic = typeof record.topic === "string" ? record.topic : "";
  return Array.from(new Set([...names, singleTopic].filter(Boolean)));
}

function matchesExam(question: unknown, examType: string): boolean {
  const storedExam = questionExamType(question);
  // The existing export contains untagged legacy questions from the original JAMB bank.
  // They are available for JAMB only; they must not silently become WAEC or NECO content.
  return storedExam
    ? canonicalExamKey(storedExam) === canonicalExamKey(examType)
    : canonicalExamKey(examType) === "jamb";
}

function matchesSubject(question: unknown, subject: Subject): boolean {
  const subjectKeys = [subject.id, subject.name].map(canonicalSubjectKey);
  return questionSubjectValues(question).some((value) => subjectKeys.includes(value));
}

async function getConfiguration(examType: string): Promise<ExamConfiguration | null> {
  try {
    const requested = canonicalExamKey(examType);
    const direct = await getRecord(FIRESTORE_COLLECTIONS.examConfigurations, requested);
    if (direct) return { ...direct, id: direct.id } as ExamConfiguration;

    const configurations = await listRecords(FIRESTORE_COLLECTIONS.examConfigurations);
    const match = configurations.find((configuration) => {
      const values = [configuration.id, configuration.name, ...(Array.isArray(configuration.aliases) ? configuration.aliases : [])];
      return values.some((value) => canonicalExamKey(value) === requested);
    });
    return match ? (match as ExamConfiguration) : null;
  } catch (error) {
    debugContent(`exam configuration unavailable for ${examType}`, error instanceof Error ? error.message : error);
    return null;
  }
}

function subjectQueryValues(subject: Subject): string[] {
  const values = [subject.id, subject.name, canonicalSubjectKey(subject.id), canonicalSubjectKey(subject.name)];
  if (canonicalSubjectKey(subject.id) === "mathematics") values.push("math", "maths");
  if (canonicalSubjectKey(subject.id) === "english") values.push("english", "english language", "use of english");
  return Array.from(new Set(values.filter(Boolean)));
}

async function getQuestionsForSubject(subject: Subject): Promise<ContentQuestion[]> {
  const values = subjectQueryValues(subject);
  const snapshots = await Promise.all([
    getDocs(query(collection(db, FIRESTORE_COLLECTIONS.questions), where("subject", "in", values))),
    getDocs(query(collection(db, FIRESTORE_COLLECTIONS.questions), where("subjectId", "in", values))),
    getDocs(query(collection(db, FIRESTORE_COLLECTIONS.questions), where("subjectName", "in", values))),
  ]);
  const unique = new Map<string, ContentQuestion>();
  for (const snapshot of snapshots) {
    for (const document of snapshot.docs) {
      unique.set(document.id, { id: document.id, ...document.data() } as ContentQuestion);
    }
  }
  return Array.from(unique.values());
}

async function getQuestionsForExam(examType: string, subjects?: Subject[]): Promise<ContentQuestion[]> {
  const questions = subjects
    ? (await Promise.all(subjects.map((subject) => getQuestionsForSubject(subject)))).flat()
    : await listRecords(FIRESTORE_COLLECTIONS.questions);
  return questions
    .filter((question) => matchesExam(question, examType))
    .map((question) => question as ContentQuestion);
}

function configuredSubjectIds(
  config: ExamConfiguration | null,
  specialization?: string,
  course?: string,
): string[] | null {
  const specializationKey = canonicalSpecialization(specialization);
  const specializationEntry = config?.specializations
    ? Object.entries(config.specializations).find(([key]) => canonicalSpecialization(key) === specializationKey)?.[1]
    : undefined;
  if (specializationEntry) {
    const rule = specializationEntry;
    if (course && rule.courseSubjectIds?.[course]) return rule.courseSubjectIds[course];
    if (rule.subjectIds) return rule.subjectIds;
  }
  if (config?.courses && specializationKey) {
    const courseRule = config.courses[specializationKey];
    if (Array.isArray(courseRule)) return courseRule;
    if (courseRule && !Array.isArray(courseRule) && courseRule.subjectIds) return courseRule.subjectIds;
  }
  // A top-level subject list is an exam-wide allow-list only when no
  // specialization-specific rules exist. It must not silently become the
  // selection for an unselected or invalid profile specialization.
  if (!config?.specializations && !config?.courses) return config?.subjectIds ?? config?.subjects ?? null;
  return null;
}

function debugContent(message: string, details?: unknown): void {
  if (process.env.NODE_ENV === "development") {
    console.debug(`[CBT DEBUG] ${message}`, details ?? "");
  }
}

export const contentService = {
  async getExamConfiguration(examType: string): Promise<ExamConfiguration | null> {
    return getConfiguration(examType);
  },

  async getAvailableSubjects(params: {
    examType: string;
    specialization?: string;
    course?: string;
  }): Promise<AvailableSubject[]> {
    const [subjects, config] = await Promise.all([
      subjectService.getAllSubjects({ limit: 1000 }),
      getConfiguration(params.examType),
    ]);
    const questions = await getQuestionsForExam(params.examType, subjects);
    const specialization = canonicalSpecialization(params.specialization);
    const configuredIds = configuredSubjectIds(config, params.specialization, params.course)?.map(canonicalSubjectKey);
    const counts = new Map<string, number>();

    for (const question of questions) {
      for (const key of questionSubjectValues(question)) {
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }

    debugContent("JAMB selection input", {
      examType: params.examType,
      specialization: params.specialization ?? null,
      canonicalSpecialization: specialization,
      course: params.course ?? null,
      category: params.specialization ?? null,
    });
    debugContent("JAMB subjects before filtering", subjects.map((subject) => subject.name));
    debugContent("JAMB subjects after exam filter", subjects.filter((subject) =>
      subjects.some((candidate) => candidate.id === subject.id && counts.has(canonicalSubjectKey(candidate.id)))
    ).map((subject) => subject.name));

    const matched: AvailableSubject[] = [];
    const rejected: string[] = [];
    for (const subject of subjects) {
      const subjectKeys = [subject.id, subject.name].map(canonicalSubjectKey);
      const allowedByConfig = configuredIds
        ? configuredIds.some((id) => subjectKeys.includes(id))
        : (config?.specializations || config?.courses) && !specialization
          ? false
          : (config?.specializations || config?.courses) && specialization
            ? false
        : !specialization
          ? true
          : canonicalSubjectKey(subject.category) === specialization
            || subject.category === "general";
      const questionCount = subjectKeys.reduce((total, key) => total + (counts.get(key) ?? 0), 0);
      if (allowedByConfig && questionCount > 0) {
        matched.push({ ...subject, questionCount });
      } else {
        rejected.push(`${subject.name}: ${!allowedByConfig ? "configuration/specialization mismatch" : "no matching questions"}`);
      }
    }

    debugContent(`examType=${params.examType} specialization=${params.specialization ?? "none"}`);
    debugContent("questions fetched", questions.length);
    debugContent("question subject samples", questions.slice(0, 5).map(questionSubjectValues));
    debugContent("subjects fetched", subjects.length);
    debugContent("subject samples", subjects.slice(0, 10).map((subject) => ({ id: subject.id, name: subject.name })));
    debugContent("exam configuration", config);
    debugContent("matched subjects", matched.map((subject) => `${subject.name} (${subject.questionCount})`));
    debugContent("rejected subjects", rejected);
    debugContent("JAMB subjects after specialization filter", subjects.filter((subject) => {
      const keys = [subject.id, subject.name].map(canonicalSubjectKey);
      return !configuredIds || configuredIds.some((id) => keys.includes(id));
    }).map((subject) => subject.name));
    debugContent("JAMB subjects after question availability filter", matched.map((subject) => subject.name));
    debugContent("Final JAMB subjects", matched.map((subject) => subject.name));
    return matched;
  },

  async getAvailableTopics(params: {
    examType: string;
    subjectId: string;
  }): Promise<AvailableTopic[]> {
    const subject = await subjectService.getSubject(params.subjectId);
    const questions = await getQuestionsForExam(params.examType, [subject]);
    const counts = new Map<string, { name: string; count: number }>();

    for (const question of questions) {
      if (!matchesSubject(question, subject)) continue;
      for (const topic of questionTopics(question)) {
        const key = normalize(topic);
        const current = counts.get(key);
        counts.set(key, { name: current?.name ?? topic, count: (current?.count ?? 0) + 1 });
      }
    }

    return Array.from(counts.entries())
      .map(([id, value]) => ({ id, name: value.name, questionCount: value.count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  async getQuestionCount(params: {
    examType: string;
    subjectId: string;
    topic?: string;
  }): Promise<number> {
    const questions = await this.getPracticeQuestions({ ...params });
    return questions.length;
  },

  async getPracticeQuestions(params: QuestionsFilter & {
    examType: string;
    subjectId: string;
    topicId?: string | null;
  }): Promise<ContentQuestion[]> {
    const subject = await subjectService.getSubject(params.subjectId);
    const questions = await getQuestionsForExam(params.examType, [subject]);
    const topic = params.topicId ?? params.topic;
    return questions
      .filter((question) => matchesSubject(question, subject))
      .filter((question) => !topic || questionTopics(question).some((value) => normalize(value) === normalize(topic)))
      .filter((question) => !params.difficulty || question.difficulty === params.difficulty)
      .slice(params.offset ?? 0, (params.offset ?? 0) + (params.limit ?? Number.MAX_SAFE_INTEGER));
  },

  async syncTopicMetadata(examType: string, subjectId: string): Promise<AvailableTopic[]> {
    // Topics are intentionally returned from questions rather than written as empty metadata.
    return this.getAvailableTopics({ examType, subjectId });
  },
};

export async function getLegacyQuestionCount(subjectId: string): Promise<number> {
  return questionService.getQuestions({ subject: subjectId, limit: Number.MAX_SAFE_INTEGER }).then((items) => items.length);
}

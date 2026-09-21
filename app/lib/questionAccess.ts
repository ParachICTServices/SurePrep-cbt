export const FREE_QUESTION_LIMIT = 100;

export type QuestionAccess = "free" | "paid";

export function buildAvailableQuestionsQuery(params: {
  subjectId: string;
  topic?: string | null;
  subjectIds?: string | null;
}) {
  const query = new URLSearchParams({
    access: "available",
    freeLimit: String(FREE_QUESTION_LIMIT),
    limit: "1000",
  });

  if (params.subjectIds) query.set("subjectIds", params.subjectIds);
  else query.set("subjectId", params.subjectId);

  if (params.topic) query.set("topic", params.topic);

  return query.toString();
}
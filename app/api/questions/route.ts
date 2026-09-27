import { questions, publicQuestion } from "@/lib/questions";
import { defaultCourse, courseKey, topics } from "@/lib/catalog";
import {
  NO_STORE_HEADERS,
  PUBLIC_QUESTION_CACHE_HEADERS,
} from "@/lib/http-cache";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const allowedParams = new Set(["course", "topic"]);
  const invalidShape =
    [...url.searchParams.keys()].some((key) => !allowedParams.has(key)) ||
    [...allowedParams].some((key) => url.searchParams.getAll(key).length > 1);
  if (invalidShape)
    return Response.json(
      { error: "题库查询参数不正确。" },
      { status: 400, headers: NO_STORE_HEADERS },
    );

  const key = url.searchParams.get("course");
  if (url.searchParams.has("course") && key !== courseKey(defaultCourse))
    return Response.json(
      { questions: [] },
      { headers: NO_STORE_HEADERS },
    );
  const topic = url.searchParams.get("topic");
  if (url.searchParams.has("topic") && !topics.some((item) => item.id === topic))
    return Response.json({ questions: [] }, { headers: NO_STORE_HEADERS });
  return Response.json(
    {
      questions: questions
        .filter((q) => !topic || q.topic === topic)
        .map(publicQuestion),
    },
    { headers: PUBLIC_QUESTION_CACHE_HEADERS },
  );
}

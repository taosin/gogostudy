import { questions, publicQuestion } from "@/lib/questions";
import { defaultCourse, courseKey } from "@/lib/catalog";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get("course");
  if (key && key !== courseKey(defaultCourse))
    return Response.json({ questions: [] });
  const topic = url.searchParams.get("topic");
  return Response.json({
    questions: questions
      .filter((q) => !topic || q.topic === topic)
      .map(publicQuestion),
  });
}

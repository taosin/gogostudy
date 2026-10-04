import { mathLessons } from "./math-curriculum";
import { createLearningEngine, learningStorageKey } from "./learning-progress";

// Preserve the existing mathematical journey API and browser progress.
export const LEARNING_STORAGE_KEY = learningStorageKey("math");
export { learningSteps } from "./learning-progress";
export type { LearningProgress, LearningStep, LessonReadiness } from "./learning-progress";

export const {
  emptyLearningProgress,
  parseLearningProgress,
  selectLesson,
  setLessonStep,
  recordLearningCheck,
  getLessonReadiness,
  getRecommendedLesson,
} = createLearningEngine(mathLessons);

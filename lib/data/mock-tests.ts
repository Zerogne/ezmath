import type { Choice, Question, StudentQuestion, Test } from "@/types/exam";

export const tests: Test[] = [
  { id: "sat-full-01", title: "SAT Full Practice Test 01", description: "Digital SAT-ийн бүтэн хэмжээний жишиг шалгалт.", examType: "SAT", subject: "Full Test", questionCount: 98, durationMinutes: 134, difficulty: "Medium", type: "full", featured: true },
  { id: "sat-math-01", title: "SAT Math Practice Test 01", description: "Алгебр, функц болон өгөгдлийн бодлогууд.", examType: "SAT", subject: "Math", questionCount: 22, durationMinutes: 35, difficulty: "Medium", type: "practice", module: "Module 1", featured: true },
  { id: "sat-rw-01", title: "SAT Reading & Writing 01", description: "Унших, найруулга болон хэлзүйн дасгал.", examType: "SAT", subject: "Reading & Writing", questionCount: 27, durationMinutes: 32, difficulty: "Medium", type: "practice" },
  { id: "eyesh-math-2025", title: "ЭЕШ Математик 2025", description: "2025 оны бодит шалгалтын материал.", examType: "EYESH", subject: "Математик", year: 2025, questionCount: 36, durationMinutes: 80, type: "previous-year", featured: true },
  { id: "eyesh-english-2025", title: "ЭЕШ Англи хэл 2025", description: "2025 оны англи хэлний бодит материал.", examType: "EYESH", subject: "Англи хэл", year: 2025, questionCount: 50, durationMinutes: 80, type: "previous-year", featured: true },
  { id: "eyesh-physics-2024", title: "ЭЕШ Физик 2024", description: "2024 оны физикийн бодит материал.", examType: "EYESH", subject: "Физик", year: 2024, questionCount: 40, durationMinutes: 80, difficulty: "Hard", type: "previous-year" },
  { id: "eyesh-math-practice", title: "ЭЕШ Математик — Алгебр", description: "Алгебрын сэдэвчилсэн дасгал.", examType: "EYESH", subject: "Математик", year: 2026, questionCount: 20, durationMinutes: 40, difficulty: "Medium", type: "practice" }
];

const baseChoices: Choice[] = [
  { id: "a", label: "A", text: "4" }, { id: "b", label: "B", text: "6" },
  { id: "c", label: "C", text: "8" }, { id: "d", label: "D", text: "10" }
];

const prompts = [
  ["If f(x) = 3x + 7 and f(a) = 25, what is the value of a?", "b", "Шугаман функц"],
  ["2x + 5 = 17 тэгшитгэлийн x-ийн утгыг олно уу.", "b", "Алгебр"],
  ["Квадратын талын урт 4 бол талбай хэд вэ?", "d", "Геометр"],
  ["12, 18 тоонуудын хамгийн их ерөнхий хуваагч хэд вэ?", "b", "Тооны онол"],
  ["y = 2x + 1 шулууны налалт хэд вэ?", "a", "Шугаман функц"],
  ["5² − 3² илэрхийллийн утгыг олно уу.", "d", "Зэрэг"],
  ["x/3 = 2 бол x хэд вэ?", "b", "Алгебр"],
  ["Гурвалжны дотоод өнцгүүдийн нийлбэр хэд вэ?", "c", "Геометр"]
] as const;

function choicesFor(index: number): Choice[] {
  const variants = [baseChoices, [{ id: "a", label: "A", text: "2" }, { id: "b", label: "B", text: "6" }, { id: "c", label: "C", text: "12" }, { id: "d", label: "D", text: "16" }], [{ id: "a", label: "A", text: "90°" }, { id: "b", label: "B", text: "120°" }, { id: "c", label: "C", text: "180°" }, { id: "d", label: "D", text: "360°" }]];
  return variants[index === 2 || index === 7 ? 2 : index === 4 ? 1 : 0];
}

export const questionsByTest: Record<string, Question[]> = Object.fromEntries(
  tests.map((test) => [test.id, Array.from({ length: test.questionCount }, (_, index) => {
    const prompt = prompts[index % prompts.length];
    return { id: `${test.id}-q${index + 1}`, testId: test.id, questionNumber: index + 1, questionText: prompt[0], choices: choicesFor(index % prompts.length), correctAnswer: prompt[1], explanation: "Тэгшитгэлийг алхам бүрээр хялбарчилж зөв утгыг олно.", topic: prompt[2], difficulty: test.difficulty ?? "Medium" };
  })])
);

export function getTest(id: string) { return tests.find((test) => test.id === id); }
export function getQuestions(id: string) { return questionsByTest[id] ?? []; }
export function getStudentQuestions(id: string): StudentQuestion[] { return getQuestions(id).map((question) => ({ id: question.id, testId: question.testId, questionNumber: question.questionNumber, questionText: question.questionText, choices: question.choices, topic: question.topic })); }

import { tests } from "@/lib/data/mock-tests";
export const adminStudents = [
  { id: "student-1", name: "Бат-Эрдэнэ", email: "bat@example.com", joined: "2026-08-17", satAttempts: 5, eyeshAttempts: 3, lastActive: "Өнөөдөр", status: "active" },
  { id: "student-2", name: "Номин", email: "nomin@example.com", joined: "2026-08-15", satAttempts: 8, eyeshAttempts: 0, lastActive: "Өчигдөр", status: "active" },
  { id: "student-3", name: "Тэмүүлэн", email: "temuulen@example.com", joined: "2026-08-12", satAttempts: 2, eyeshAttempts: 4, lastActive: "3 хоногийн өмнө", status: "active" },
  { id: "student-4", name: "Саруул", email: "saruul@example.com", joined: "2026-08-08", satAttempts: 6, eyeshAttempts: 1, lastActive: "8-р сарын 15", status: "active" },
  { id: "student-5", name: "Анударь", email: "anudari@example.com", joined: "2026-08-03", satAttempts: 0, eyeshAttempts: 5, lastActive: "8-р сарын 13", status: "inactive" },
];
export const adminMaterials = tests.map((test, index) => ({ ...test, status: index === 5 ? "draft" : "published", updated: `2026-08-${17 - index}` }));

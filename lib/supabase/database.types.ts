export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
type Table<Row, Insert = Partial<Row>, Update = Partial<Insert>> = { Row: Row; Insert: Insert; Update: Update; Relationships: [] };

type Profile = { id: string; full_name: string | null; avatar_url: string | null; role: "student" | "admin"; created_at: string };
type TestRow = { id: string; exam_type: "SAT" | "EYESH"; title: string; subject: string; year: number | null; duration_minutes: number; difficulty: "Easy" | "Medium" | "Hard" | null; test_type: "full" | "practice" | "previous-year"; status: "draft" | "published" | "archived"; instructions: string | null; created_by: string | null; created_at: string; updated_at: string };
type QuestionRow = { id: string; test_id: string; question_number: number; question_text: string; question_type: string; topic: string | null; difficulty: "Easy" | "Medium" | "Hard" | null; explanation: string | null; image_url: string | null; created_at: string; updated_at: string };
type ChoiceRow = { id: string; question_id: string; label: string; text: string; is_correct: boolean; sort_order: number };
type AttemptRow = { id: string; user_id: string; test_id: string; started_at: string; completed_at: string | null; score: number | null; duration_seconds: number | null; status: "not_started" | "in_progress" | "submitted"; session_snapshot: Json | null; session_version: number; last_saved_at: string | null; created_at: string };
type AttemptAnswerRow = { id: string; attempt_id: string; question_id: string; selected_choice_id: string | null; is_correct: boolean | null; time_spent_seconds: number | null; marked_for_review: boolean };
type SupportQuestionRow = { id: string; user_id: string; subject: string; message: string; status: "open" | "answered" | "closed"; answer: string | null; answered_at: string | null; created_at: string };

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile, { id: string; full_name?: string | null; avatar_url?: string | null; role?: "student" | "admin" }>;
      tests: Table<TestRow, Omit<TestRow, "id" | "created_at" | "updated_at"> & { id?: string }>;
      questions: Table<QuestionRow, Omit<QuestionRow, "id" | "created_at" | "updated_at"> & { id?: string }>;
      answer_choices: Table<ChoiceRow, Omit<ChoiceRow, "id"> & { id?: string }>;
      test_attempts: Table<AttemptRow, Partial<AttemptRow> & Pick<AttemptRow, "user_id" | "test_id">>;
      attempt_answers: Table<AttemptAnswerRow, Omit<AttemptAnswerRow, "id"> & { id?: string }>;
      student_support_questions: Table<SupportQuestionRow, Pick<SupportQuestionRow, "user_id" | "subject" | "message"> & Partial<SupportQuestionRow>>;
    };
    Views: {
      student_questions: { Row: Pick<QuestionRow, "id" | "test_id" | "question_number" | "question_text" | "topic" | "image_url">; Relationships: [] };
      student_answer_choices: { Row: Pick<ChoiceRow, "id" | "question_id" | "label" | "text" | "sort_order">; Relationships: [] };
    };
    Functions: {
      save_admin_material: {
        Args: {
          p_test_id: string | null;
          p_exam_type: "SAT" | "EYESH";
          p_title: string;
          p_subject: string;
          p_year: number | null;
          p_duration_minutes: number;
          p_test_type: "full" | "practice" | "previous-year";
          p_status: "draft" | "published" | "archived";
          p_instructions: string;
          p_questions: Json;
        };
        Returns: string;
      };
    };
    Enums: {
      exam_type: "SAT" | "EYESH";
      test_type: "full" | "practice" | "previous-year";
      difficulty: "Easy" | "Medium" | "Hard";
      profile_role: "student" | "admin";
      content_status: "draft" | "published" | "archived";
      attempt_status: "not_started" | "in_progress" | "submitted";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
type Table<Row, Insert = Partial<Row>, Update = Partial<Insert>> = { Row: Row; Insert: Insert; Update: Update; Relationships: [] };

type Profile = { id: string; full_name: string | null; avatar_url: string | null; role: "student" | "teacher" | "school_admin" | "admin"; school_id: string | null; created_at: string };
type SchoolRow = { id: string; name: string; slug: string; is_active: boolean; registration_code_hash: string; teacher_registration_code: string | null; created_at: string };
type ClassroomRow = { id: string; teacher_id: string; school_id: string; name: string; code: string; created_at: string; updated_at: string };
type ClassroomStudentRow = { classroom_id: string; student_id: string; joined_at: string };
type TestRow = { id: string; exam_type: "SAT" | "EYESH"; title: string; subject: string; year: number | null; duration_minutes: number; difficulty: "Easy" | "Medium" | "Hard" | null; test_type: "full" | "practice" | "previous-year"; status: "draft" | "published" | "archived"; instructions: string | null; created_by: string | null; created_at: string; updated_at: string };
type QuestionRow = { id: string; test_id: string; question_number: number; question_text: string; question_type: string; topic: string | null; difficulty: "Easy" | "Medium" | "Hard" | null; explanation: string | null; image_url: string | null; created_at: string; updated_at: string };
type ChoiceRow = { id: string; question_id: string; label: string; text: string; is_correct: boolean; sort_order: number };
type AttemptRow = { id: string; user_id: string; test_id: string; started_at: string; completed_at: string | null; score: number | null; duration_seconds: number | null; status: "not_started" | "in_progress" | "submitted"; session_snapshot: Json | null; session_version: number; last_saved_at: string | null; created_at: string };
type AttemptAnswerRow = { id: string; attempt_id: string; question_id: string; selected_choice_id: string | null; is_correct: boolean | null; time_spent_seconds: number | null; marked_for_review: boolean };
type SupportQuestionRow = { id: string; user_id: string; subject: string; message: string; status: "open" | "answered" | "closed"; answer: string | null; answered_at: string | null; created_at: string };
type PaymentOrderRow = { id: string; user_id: string; provider: "byl"; plan_code: string; amount_mnt: number; status: "pending" | "checkout_created" | "paid" | "expired" | "canceled" | "failed" | "refunded"; provider_checkout_id: number | null; checkout_url: string | null; payment_method: string | null; expires_at: string | null; paid_at: string | null; metadata: Json; created_at: string; updated_at: string };
type PaymentWebhookEventRow = { id: string; provider: "byl"; provider_event_id: number; event_type: string; processing_status: "received" | "processed" | "ignored" | "failed"; payload: Json; error_message: string | null; received_at: string; processed_at: string | null };
type StudentSubscriptionRow = { id: string; user_id: string; provider: "byl"; plan_code: "standard_monthly" | "mentor_monthly"; status: "trialing" | "active" | "past_due" | "canceled"; provider_customer_id: number | null; provider_subscription_id: number; current_period_start: string | null; current_period_end: string | null; canceled_at: string | null; provider_updated_at: string; created_at: string; updated_at: string };
type StudentLessonProgressRow = { id: string; user_id: string; lesson_id: string; completed_at: string | null; last_opened_at: string; created_at: string; updated_at: string };
type CourseLessonRow = { id: string; slug: string; course_slug: string; module_id: string; title: string; duration_minutes: number; summary: string; objectives: string[]; sections: Json; status: "draft" | "published" | "archived"; sort_order: number; created_by: string | null; created_at: string; updated_at: string };

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile, { id: string; full_name?: string | null; avatar_url?: string | null; role?: "student" | "teacher" | "school_admin" | "admin"; school_id?: string | null }>;
      schools: Table<SchoolRow, Pick<SchoolRow, "name" | "slug"> & Partial<SchoolRow>>;
      classrooms: Table<ClassroomRow, Pick<ClassroomRow, "teacher_id" | "school_id" | "name" | "code"> & Partial<ClassroomRow>>;
      classroom_students: Table<ClassroomStudentRow, ClassroomStudentRow>;
      tests: Table<TestRow, Omit<TestRow, "id" | "created_at" | "updated_at"> & { id?: string }>;
      questions: Table<QuestionRow, Omit<QuestionRow, "id" | "created_at" | "updated_at"> & { id?: string }>;
      answer_choices: Table<ChoiceRow, Omit<ChoiceRow, "id"> & { id?: string }>;
      test_attempts: Table<AttemptRow, Partial<AttemptRow> & Pick<AttemptRow, "user_id" | "test_id">>;
      attempt_answers: Table<AttemptAnswerRow, Omit<AttemptAnswerRow, "id"> & { id?: string }>;
      student_support_questions: Table<SupportQuestionRow, Pick<SupportQuestionRow, "user_id" | "subject" | "message"> & Partial<SupportQuestionRow>>;
      payment_orders: Table<PaymentOrderRow, Pick<PaymentOrderRow, "user_id" | "plan_code" | "amount_mnt"> & Partial<PaymentOrderRow>>;
      payment_webhook_events: Table<PaymentWebhookEventRow, Pick<PaymentWebhookEventRow, "provider_event_id" | "event_type" | "payload"> & Partial<PaymentWebhookEventRow>>;
      student_subscriptions: Table<StudentSubscriptionRow, Pick<StudentSubscriptionRow, "user_id" | "plan_code" | "status" | "provider_subscription_id"> & Partial<StudentSubscriptionRow>>;
      student_lesson_progress: Table<StudentLessonProgressRow, Pick<StudentLessonProgressRow, "user_id" | "lesson_id"> & Partial<StudentLessonProgressRow>>;
      course_lessons: Table<CourseLessonRow, Pick<CourseLessonRow, "slug" | "course_slug" | "module_id" | "title" | "duration_minutes" | "summary" | "objectives" | "sections" | "status" | "sort_order"> & Partial<CourseLessonRow>>;
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
      profile_role: "student" | "teacher" | "school_admin" | "admin";
      content_status: "draft" | "published" | "archived";
      attempt_status: "not_started" | "in_progress" | "submitted";
    };
    CompositeTypes: Record<string, never>;
  };
};

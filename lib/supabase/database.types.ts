export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
type Table<Row, Insert = Partial<Row>, Update = Partial<Insert>> = { Row: Row; Insert: Insert; Update: Update; Relationships: [] };

export type TeacherVerificationStatus = "pending" | "approved" | "rejected";
export type SchoolLibraryAnswerType = "multiple_choice" | "numeric" | "free_response";
export type ClassExamStatus = "draft" | "scheduled" | "active" | "closed";
export type ClassExamSubmissionStatus = "in_progress" | "submitted" | "graded";
type Profile = { id: string; full_name: string | null; avatar_url: string | null; role: "student" | "teacher" | "school_admin" | "admin"; school_id: string | null; teacher_status: TeacherVerificationStatus | null; created_at: string };
type SchoolRow = { id: string; name: string; slug: string; is_active: boolean; registration_code_hash: string; teacher_registration_code: string | null; created_at: string };
type ClassroomRow = { id: string; teacher_id: string; school_id: string; name: string; code: string; created_at: string; updated_at: string };
type ClassroomStudentRow = { classroom_id: string; student_id: string; joined_at: string };
type SchoolLibraryMaterialRow = { id: string; school_id: string; created_by: string | null; title: string; topic: string; question_latex: string; answer_type: SchoolLibraryAnswerType; answer_key: string; choices: Json; collection_id: string | null; position: number | null; created_at: string; updated_at: string };
type SchoolLibraryCollectionRow = { id: string; school_id: string; created_by: string | null; title: string; subject: string; year: number | null; variant: string | null; description: string; created_at: string; updated_at: string };
type ClassExamRow = { id: string; classroom_id: string; school_id: string; teacher_id: string; title: string; instructions: string; duration_minutes: number; starts_at: string | null; closes_at: string | null; status: ClassExamStatus; created_at: string; updated_at: string };
type ClassExamQuestionRow = { id: string; exam_id: string; source_material_id: string | null; position: number; title: string; topic: string; question_latex: string; answer_type: SchoolLibraryAnswerType; answer_key: string; choices: Json; max_points: number; created_at: string };
type ClassExamSubmissionRow = { id: string; exam_id: string; student_id: string; status: ClassExamSubmissionStatus; started_at: string; submitted_at: string | null; graded_at: string | null; auto_score: number; manual_score: number; total_score: number; max_score: number; needs_manual_grading: boolean; teacher_feedback: string; created_at: string; updated_at: string };
type ClassExamAnswerRow = { id: string; submission_id: string; question_id: string; selected_choice: string | null; response_text: string | null; is_correct: boolean | null; auto_score: number; manual_score: number | null; teacher_feedback: string; created_at: string; updated_at: string };
type TestRow = { id: string; exam_type: "SAT" | "EYESH"; title: string; subject: string; year: number | null; variant: "A" | "B" | "C" | "D" | "E" | null; duration_minutes: number; difficulty: "Easy" | "Medium" | "Hard" | null; test_type: "full" | "practice" | "previous-year"; status: "draft" | "published" | "archived"; instructions: string | null; created_by: string | null; created_at: string; updated_at: string };
type QuestionRow = { id: string; test_id: string; question_number: number; question_text: string; question_type: string; response_fields: Json; topic: string | null; difficulty: "Easy" | "Medium" | "Hard" | null; explanation: string | null; image_url: string | null; created_at: string; updated_at: string };
type ChoiceRow = { id: string; question_id: string; label: string; text: string; image_url: string | null; is_correct: boolean; sort_order: number };
type QuestionResponseAnswerRow = { question_id: string; field_id: string; accepted_answers: string[] };
type AttemptRow = { id: string; user_id: string; test_id: string; started_at: string; completed_at: string | null; score: number | null; duration_seconds: number | null; status: "not_started" | "in_progress" | "submitted"; session_snapshot: Json | null; session_version: number; last_saved_at: string | null; created_at: string };
type AttemptAnswerRow = { id: string; attempt_id: string; question_id: string; selected_choice_id: string | null; written_response: Json | null; is_correct: boolean | null; time_spent_seconds: number | null; marked_for_review: boolean };
type TestIntegrityEventRow = { id: string; attempt_id: string; user_id: string; event_type: "page_hidden" | "window_blur" | "fullscreen_exit"; occurred_at: string; created_at: string };
type SupportQuestionRow = { id: string; user_id: string; subject: string; message: string; status: "open" | "answered" | "closed"; answer: string | null; answered_at: string | null; created_at: string };
type PaymentOrderRow = { id: string; user_id: string; provider: "byl"; plan_code: string; amount_mnt: number; status: "pending" | "checkout_created" | "paid" | "expired" | "canceled" | "failed" | "refunded"; provider_checkout_id: number | null; checkout_url: string | null; payment_method: string | null; expires_at: string | null; paid_at: string | null; metadata: Json; created_at: string; updated_at: string };
type PaymentWebhookEventRow = { id: string; provider: "byl"; provider_event_id: number; event_type: string; processing_status: "received" | "processed" | "ignored" | "failed"; payload: Json; error_message: string | null; received_at: string; processed_at: string | null };
type StudentSubscriptionRow = { id: string; user_id: string; provider: "byl"; plan_code: "standard_monthly" | "mentor_monthly"; status: "trialing" | "active" | "past_due" | "canceled"; provider_customer_id: number | null; provider_subscription_id: number; current_period_start: string | null; current_period_end: string | null; canceled_at: string | null; provider_updated_at: string; created_at: string; updated_at: string };
type StudentLessonProgressRow = { id: string; user_id: string; lesson_id: string; completed_at: string | null; last_opened_at: string; created_at: string; updated_at: string };
type CourseLessonRow = { id: string; slug: string; course_slug: string; module_id: string; title: string; duration_minutes: number; summary: string; objectives: string[]; sections: Json; status: "draft" | "published" | "archived"; sort_order: number; created_by: string | null; created_at: string; updated_at: string };
type CourseModuleRow = { id: string; course_slug: string; title: string; description: string; parent_id: string | null; sort_order: number; created_by: string | null; created_at: string; updated_at: string };
type QuestionBankProgressRow = { user_id: string; question_id: string; attempts: number; correct_count: number; last_correct: boolean | null; marked: boolean; last_answered_at: string | null; updated_at: string };

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile, { id: string; full_name?: string | null; avatar_url?: string | null; role?: "student" | "teacher" | "school_admin" | "admin"; school_id?: string | null; teacher_status?: TeacherVerificationStatus | null }>;
      schools: Table<SchoolRow, Pick<SchoolRow, "name" | "slug"> & Partial<SchoolRow>>;
      classrooms: Table<ClassroomRow, Pick<ClassroomRow, "teacher_id" | "school_id" | "name" | "code"> & Partial<ClassroomRow>>;
      classroom_students: Table<ClassroomStudentRow, ClassroomStudentRow>;
      school_library_materials: Table<SchoolLibraryMaterialRow, Pick<SchoolLibraryMaterialRow, "school_id" | "created_by" | "title" | "topic" | "question_latex" | "answer_type" | "answer_key" | "choices"> & Partial<SchoolLibraryMaterialRow>>;
      school_library_collections: Table<SchoolLibraryCollectionRow, Pick<SchoolLibraryCollectionRow, "school_id" | "created_by" | "title" | "subject"> & Partial<SchoolLibraryCollectionRow>>;
      class_exams: Table<ClassExamRow, Pick<ClassExamRow, "classroom_id" | "school_id" | "teacher_id" | "title" | "duration_minutes" | "status"> & Partial<ClassExamRow>>;
      class_exam_questions: Table<ClassExamQuestionRow, Pick<ClassExamQuestionRow, "exam_id" | "position" | "title" | "topic" | "question_latex" | "answer_type" | "answer_key" | "choices" | "max_points"> & Partial<ClassExamQuestionRow>>;
      class_exam_submissions: Table<ClassExamSubmissionRow, Pick<ClassExamSubmissionRow, "exam_id" | "student_id" | "max_score"> & Partial<ClassExamSubmissionRow>>;
      class_exam_answers: Table<ClassExamAnswerRow, Pick<ClassExamAnswerRow, "submission_id" | "question_id"> & Partial<ClassExamAnswerRow>>;
      tests: Table<TestRow, Omit<TestRow, "id" | "created_at" | "updated_at"> & { id?: string }>;
      questions: Table<QuestionRow, Omit<QuestionRow, "id" | "created_at" | "updated_at"> & { id?: string }>;
      answer_choices: Table<ChoiceRow, Omit<ChoiceRow, "id"> & { id?: string }>;
      question_response_answers: Table<QuestionResponseAnswerRow, QuestionResponseAnswerRow>;
      test_attempts: Table<AttemptRow, Partial<AttemptRow> & Pick<AttemptRow, "user_id" | "test_id">>;
      attempt_answers: Table<AttemptAnswerRow, Omit<AttemptAnswerRow, "id"> & { id?: string }>;
      test_integrity_events: Table<TestIntegrityEventRow, Pick<TestIntegrityEventRow, "attempt_id" | "user_id" | "event_type" | "occurred_at"> & Partial<TestIntegrityEventRow>>;
      student_support_questions: Table<SupportQuestionRow, Pick<SupportQuestionRow, "user_id" | "subject" | "message"> & Partial<SupportQuestionRow>>;
      payment_orders: Table<PaymentOrderRow, Pick<PaymentOrderRow, "user_id" | "plan_code" | "amount_mnt"> & Partial<PaymentOrderRow>>;
      payment_webhook_events: Table<PaymentWebhookEventRow, Pick<PaymentWebhookEventRow, "provider_event_id" | "event_type" | "payload"> & Partial<PaymentWebhookEventRow>>;
      student_subscriptions: Table<StudentSubscriptionRow, Pick<StudentSubscriptionRow, "user_id" | "plan_code" | "status" | "provider_subscription_id"> & Partial<StudentSubscriptionRow>>;
      student_lesson_progress: Table<StudentLessonProgressRow, Pick<StudentLessonProgressRow, "user_id" | "lesson_id"> & Partial<StudentLessonProgressRow>>;
      course_lessons: Table<CourseLessonRow, Pick<CourseLessonRow, "slug" | "course_slug" | "module_id" | "title" | "duration_minutes" | "summary" | "objectives" | "sections" | "status" | "sort_order"> & Partial<CourseLessonRow>>;
      course_modules: Table<CourseModuleRow, Pick<CourseModuleRow, "id" | "course_slug" | "title"> & Partial<CourseModuleRow>>;
      question_bank_progress: Table<QuestionBankProgressRow, Pick<QuestionBankProgressRow, "user_id" | "question_id"> & Partial<QuestionBankProgressRow>>;
    };
    Views: {
      student_questions: { Row: Pick<QuestionRow, "id" | "test_id" | "question_number" | "question_text" | "question_type" | "response_fields" | "topic" | "image_url">; Relationships: [] };
      student_answer_choices: { Row: Pick<ChoiceRow, "id" | "question_id" | "label" | "text" | "image_url" | "sort_order">; Relationships: [] };
    };
    Functions: {
      save_school_library_collection: {
        Args: {
          p_collection_id: string | null;
          p_title: string;
          p_subject: string;
          p_year: number | null;
          p_variant: string | null;
          p_description: string;
          p_problems: Json;
        };
        Returns: string;
      };
      submit_class_exam: {
        Args: {
          p_exam_id: string;
          p_answers?: Json;
        };
        Returns: Json;
      };
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
      teacher_verification_status: TeacherVerificationStatus;
      school_library_answer_type: SchoolLibraryAnswerType;
      class_exam_status: ClassExamStatus;
      class_exam_submission_status: ClassExamSubmissionStatus;
      content_status: "draft" | "published" | "archived";
      attempt_status: "not_started" | "in_progress" | "submitted";
    };
    CompositeTypes: Record<string, never>;
  };
};

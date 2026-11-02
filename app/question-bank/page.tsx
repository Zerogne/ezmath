import { permanentRedirect } from "next/navigation";

/** The question bank now lives on the SAT page together with the mocks and section tests. */
export default function QuestionBankPage() {
  permanentRedirect("/tests?exam=SAT#bank");
}

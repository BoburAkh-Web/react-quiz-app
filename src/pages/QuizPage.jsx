import { Link, useParams } from "react-router-dom";
import { ArrowLeft, SearchX } from "lucide-react";
import { useQuizAttempt } from "../hooks/useQuizAttempt";
import { useStudentTests } from "../hooks/useStudentTests";
import ActiveQuiz from "../components/quiz/ActiveQuiz";
import AnswerReview from "../components/quiz/AnswerReview";
import QuizIntro from "../components/quiz/QuizIntro";
import QuizResult from "../components/quiz/QuizResult";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import Loading from "../components/ui/Loading";

function QuizPage() {
  const { testId } = useParams();
  const { data: tests, isPending, error, refetch } = useStudentTests();
  const quiz = useQuizAttempt(testId);
  const test = tests?.find((item) => item.id === testId);

  if (quiz.status === "active" || quiz.status === "finishing") return <ActiveQuiz quiz={quiz} />;

  if (quiz.status === "finished") {
    return (
      <div className="mx-auto max-w-2xl">
        <QuizResult result={quiz.result} onRetry={quiz.start} />
        <AnswerReview review={quiz.result.review} />
      </div>
    );
  }

  if (isPending) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  if (!test) {
    return (
      <EmptyState
        icon={SearchX}
        title="Test topilmadi"
        description="Bu test o'chirilgan yoki hali o'quvchilarga ochilmagan."
      >
        <Link to="/tests" className="btn gap-2 btn-primary">
          <ArrowLeft className="size-4" /> Testlarga qaytish
        </Link>
      </EmptyState>
    );
  }

  return (
    <>
      {quiz.status === "error" && (
        <div className="mx-auto mb-4 max-w-2xl">
          <ErrorState error={{ message: quiz.error }} />
        </div>
      )}
      <QuizIntro test={test} isStarting={quiz.status === "starting"} onStart={quiz.start} />
    </>
  );
}

export default QuizPage;

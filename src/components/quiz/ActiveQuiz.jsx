import { useEffect } from "react";
import { AnimatePresence } from "motion/react";
import { ArrowRight, Flag } from "lucide-react";
import { useCountdown } from "../../hooks/useCountdown";
import { useLocalStorageState } from "../../hooks/useLocalStorageState";
import { playAnswerFeedback } from "../../lib/feedback";
import QuestionCard from "./QuestionCard";
import QuizHeader from "./QuizHeader";
import QuizTimer from "./QuizTimer";

function ActiveQuiz({ quiz }) {
  const { attempt, question, currentAnswer, isLastQuestion } = quiz;
  const [isMuted, setIsMuted] = useLocalStorageState("hq.muted", false);
  const secondsLeft = useCountdown(attempt.endsAt, quiz.finish);
  const canContinue = currentAnswer && !currentAnswer.isPending;

  // Telefonda yangi savol tepadan boshlab ko'rinsin
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [quiz.index]);

  async function handleAnswer(option) {
    const result = await quiz.answer(option);
    if (result) playAnswerFeedback({ isCorrect: result.is_correct, isMuted });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <QuizHeader
        title={attempt.title}
        index={quiz.index}
        total={attempt.questions.length}
        answeredCount={quiz.answeredCount}
        score={quiz.score}
        maxScore={attempt.maxScore}
        isMuted={isMuted}
        onToggleMuted={() => setIsMuted(!isMuted)}
      />

      <AnimatePresence mode="wait">
        <QuestionCard
          key={question.id}
          question={question}
          answer={currentAnswer}
          onAnswer={handleAnswer}
        />
      </AnimatePresence>

      {/* Telefonda taymer va tugma bosh barmoq yetadigan joyda doim ko'rinib turadi */}
      <div className="sticky bottom-3 z-10 sm:static">
        <div className="surface flex items-center justify-between gap-3 rounded-full p-2 backdrop-blur-md sm:rounded-box sm:p-3">
          <QuizTimer secondsLeft={secondsLeft} totalSeconds={attempt.totalSeconds} />

          {canContinue ? (
            <button
              type="button"
              className="btn flex-1 rounded-full btn-primary sm:flex-none sm:rounded-field"
              onClick={isLastQuestion ? quiz.finish : quiz.next}
              disabled={quiz.status === "finishing"}
            >
              {quiz.status === "finishing" ? (
                <span className="loading loading-spinner" />
              ) : isLastQuestion ? (
                <>
                  Yakunlash <Flag className="size-4" />
                </>
              ) : (
                <>
                  Keyingi savol <ArrowRight className="size-4" />
                </>
              )}
            </button>
          ) : (
            <span className="pr-3 text-sm text-base-content/50">Javobni tanlang</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ActiveQuiz;

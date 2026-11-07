import { motion } from "motion/react";
import { Check, X } from "lucide-react";
import confetti from "canvas-confetti";
import correctAudio from "./dragon-correct.mp3";
import wrongAudio from "./wrong-answer.mp3";

const LETTERS = ["A", "B", "C", "D"];

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

function OptionMark({ index, isCorrect, isChosen, hasAnswered }) {
  if (hasAnswered && isCorrect) return <Check />;
  if (hasAnswered && isChosen) return <X />;
  return LETTERS[index];
}

function Options({ question, dispatch, answer, isMuted }) {
  const hasAnswered = answer !== null;

  function handleSelectOption(index) {
    const isCorrect = index === question.correctOption;

    dispatch({ type: "newAnswer", payload: index });

    if (!isMuted) new Audio(isCorrect ? correctAudio : wrongAudio).play();

    if (isCorrect) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        disableForReducedMotion: true,
      });
    } else {
      navigator.vibrate?.(150);
    }
  }

  return (
    <motion.div
      className="options"
      variants={listVariants}
      initial="hidden"
      animate="visible"
    >
      {question.options.map((option, index) => {
        const isCorrect = index === question.correctOption;
        const isChosen = index === answer;
        const resultClass = hasAnswered ? (isCorrect ? "correct" : "wrong") : "";

        return (
          <motion.div key={option} variants={itemVariants}>
            <motion.button
              className={`btn btn-option ${isChosen ? "answer" : ""} ${resultClass}`}
              disabled={hasAnswered}
              whileTap={hasAnswered ? undefined : { scale: 0.98 }}
              onClick={() => handleSelectOption(index)}
            >
              <span className="option-mark">
                <OptionMark
                  index={index}
                  isCorrect={isCorrect}
                  isChosen={isChosen}
                  hasAnswered={hasAnswered}
                />
              </span>
              <span className="option-text">{option}</span>
            </motion.button>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

export default Options;

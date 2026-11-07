import { motion } from "motion/react";
import { ArrowRight, Flag } from "lucide-react";

function NextButton({ dispatch, answer, index, numQuestions }) {
  if (answer === null) return null;

  const isLastQuestion = index === numQuestions - 1;

  return (
    <motion.button
      className="btn btn-ui"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.97 }}
      onClick={() =>
        dispatch({ type: isLastQuestion ? "finish" : "nextQuestion" })
      }
    >
      {isLastQuestion ? "Finish" : "Next"}
      {isLastQuestion ? <Flag /> : <ArrowRight />}
    </motion.button>
  );
}

export default NextButton;

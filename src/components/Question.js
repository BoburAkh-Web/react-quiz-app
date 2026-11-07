import { motion } from "motion/react";
import Options from "./Options";

function Question({ question, dispatch, answer, isMuted }) {
  return (
    <motion.section
      className="quiz-card"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <h4>{question.question}</h4>
      <Options
        question={question}
        dispatch={dispatch}
        answer={answer}
        isMuted={isMuted}
      />
    </motion.section>
  );
}

export default Question;

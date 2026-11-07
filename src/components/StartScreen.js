import { motion } from "motion/react";
import { Clock, Play, Star } from "lucide-react";

function StartScreen({ numQuestions, totalSeconds, maxPossiblePoints, dispatch }) {
  return (
    <motion.div
      className="start quiz-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <h2>Welcome to The Happy Quiz!</h2>

      <h3>{numQuestions} questions to test your Javascript mastery</h3>
      {numQuestions > 0 && (
        <>
          <ul className="start-stats">
            <li>
              <Clock />
              {Math.ceil(totalSeconds / 60)} min
            </li>
            <li>
              <Star />
              {maxPossiblePoints} points
            </li>
          </ul>

          <motion.button
            className="btn btn-ui"
            whileTap={{ scale: 0.97 }}
            onClick={() => dispatch({ type: "start" })}
          >
            <Play />
            Let's start
          </motion.button>
        </>
      )}
    </motion.div>
  );
}

export default StartScreen;

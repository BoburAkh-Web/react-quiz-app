import React from "react";

function StartScreen({ numQuestions, dispatch }) {
  return (
    <div className="start">
      <h2>Welcome to The Happy Quiz!</h2>

      <h3>{numQuestions} questions to test your Javascript mastery</h3>
      {numQuestions > 0 && (
        <button
          className="btn btn-ui"
          onClick={() => dispatch({ type: "start" })}
        >
          Let's start
        </button>
      )}
    </div>
  );
}

export default StartScreen;

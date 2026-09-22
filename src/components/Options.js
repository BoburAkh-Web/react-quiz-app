import React from "react";
import correctAudio from "./dragon-correct.mp3";
import wrongAudio from "./wrong-answer.mp3";
import confetti from "canvas-confetti";
function Options({ question, dispatch, answer }) {
  const hasAnswered = answer !== null;

  // handleSelectOption funksiyasi index'ni o'zining argumenti sifatida qabul qilishi kerak
  function handleSelectOption(index) {
    // 1. Reducer'ga tanlangan javob indeksini yuboramiz
    dispatch({ type: "newAnswer", payload: index });

    // 2. Ovoz effektini ijro etamiz
    if (index === question.correctOption) {
      const correctSound = new Audio(correctAudio);
      correctSound.play();
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } else {
      const wrongSound = new Audio(wrongAudio);
      wrongSound.play();
    }
  }

  return (
    <div className="options">
      {question.options.map((option, index) => (
        <button
          className={`btn btn-option ${index === answer ? "answer" : ""} ${
            hasAnswered
              ? index === question.correctOption
                ? "correct"
                : "wrong"
              : ""
          }`}
          key={option}
          disabled={hasAnswered}
          /* map ichida har bir tugma uchun mos 'index' funksiyaga uzatiladi */
          onClick={() => handleSelectOption(index)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export default Options;

import React, { useEffect, useReducer, useRef } from "react";
import Header from "../components/Header";
import Main from "../components/Main";
import Loader from "../components/Loader";
import StartScreen from "../components/StartScreen";
import Error from "../components/Error";
import Question from "../components/Question";
import NextButton from "../components/NextButton";
import Progress from "../components/Progress";
import FinishScreen from "../components/FinishScreen";
import Footer from "../components/Footer";
import Timer from "../components/Timer";
import { supabase } from "../components/supabase";
import { useAuth } from "../context/AuthContext";

const SECS_PER_QUESTION = 30;

const initialState = {
  questions: [],
  status: "loading",
  index: 0,
  answer: null,
  points: 0,
  correctCount: 0,
  wrongCount: 0,
  highscore: 0,
  secondsRemaining: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "loading":
      return {
        ...state,
        status: "loading",
      };

    case "dataReceived":
      return {
        ...state,
        questions: action.payload,
        status: "ready",
      };

    case "dataFailed":
      return {
        ...state,
        status: "error",
      };

    case "start":
      return {
        ...state,
        status: "active",
        secondsRemaining: state.questions.length * SECS_PER_QUESTION,
      };

    case "newAnswer": {
      const question = state.questions.at(state.index);
      const isCorrect = action.payload === question.correctOption;
      return {
        ...state,
        answer: action.payload,
        points: isCorrect ? state.points + question.points : state.points,
        correctCount: isCorrect ? state.correctCount + 1 : state.correctCount,
        wrongCount: isCorrect ? state.wrongCount : state.wrongCount + 1,
      };
    }

    case "nextQuestion":
      return {
        ...state,
        index: state.index + 1,
        answer: null,
      };

    case "finish":
      return {
        ...state,
        status: "finished",
        highscore:
          state.points > state.highscore ? state.points : state.highscore,
      };

    case "reset":
      return {
        ...initialState,
        status: "ready",
        questions: state.questions,
        highscore: state.highscore,
      };

    case "tick":
      return {
        ...state,
        secondsRemaining: state.secondsRemaining - 1,
        status: state.secondsRemaining === 0 ? "finished" : state.status,
      };

    default:
      throw new Error("Unknown action type");
  }
}

function QuizPage() {
  const [
    {
      questions,
      status,
      index,
      answer,
      points,
      correctCount,
      wrongCount,
      highscore,
      secondsRemaining,
    },
    dispatch,
  ] = useReducer(reducer, initialState);

  const { currentStudent } = useAuth();

  // Natija shu urinish uchun allaqachon saqlanganmi
  const hasSavedRef = useRef(false);
  // Context'dagi best_points eskirib qolmasligi uchun, saqlangandan keyin shu yerda yangilanadi
  const bestPointsRef = useRef(currentStudent?.best_points ?? 0);

  const numQuestions = questions.length;
  const maxPossiblePoints = questions.reduce(
    (prev, cur) => prev + cur.points,
    0,
  );

  async function fetchQuestions() {
    dispatch({ type: "loading" });
    const { data, error } = await supabase.from("questions").select("*");
    if (error) {
      dispatch({ type: "dataFailed" });
    } else {
      dispatch({ type: "dataReceived", payload: data });
    }
  }
  useEffect(() => {
    fetchQuestions();
  }, []);

  // "finished" holatiga birinchi kirganda natijani bir marta saqlash
  useEffect(() => {
    // Qayta boshlanganda (reset) keyingi urinish ham saqlanishi uchun flag tozalanadi
    if (status !== "finished") {
      hasSavedRef.current = false;
      return;
    }
    if (hasSavedRef.current || !currentStudent) return;
    hasSavedRef.current = true;

    const newBest = Math.max(points, bestPointsRef.current);

    async function saveResult() {
      const { error } = await supabase
        .from("students")
        .update({
          last_points: points,
          last_correct: correctCount,
          last_wrong: wrongCount,
          best_points: newBest,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentStudent.id);

      if (error) {
        console.error("Natijani saqlashda xatolik:", error.message);
        return;
      }
      bestPointsRef.current = newBest;
    }
    saveResult();
  }, [status, points, correctCount, wrongCount, currentStudent]);

  return (
    <div className="app">
      <Header />

      <Main>
        {status === "loading" && <Loader />}
        {status === "error" && <Error />}
        {status === "ready" && (
          <StartScreen numQuestions={numQuestions} dispatch={dispatch} />
        )}
        {status === "active" && (
          <>
            <Progress
              index={index}
              numQuestions={numQuestions}
              points={points}
              maxPossiblePoints={maxPossiblePoints}
              answer={answer}
            />
            <Question
              question={questions[index]}
              dispatch={dispatch}
              answer={answer}
            />
            <Footer>
              <Timer dispatch={dispatch} secondsRemaining={secondsRemaining} />
              <NextButton
                dispatch={dispatch}
                answer={answer}
                index={index}
                numQuestions={numQuestions}
              />
            </Footer>
          </>
        )}
        {status === "finished" && (
          <FinishScreen
            points={points}
            maxPossiblePoints={maxPossiblePoints}
            highscore={highscore}
            dispatch={dispatch}
          />
        )}
      </Main>
    </div>
  );
}

export default QuizPage;

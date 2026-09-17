import React, { useEffect, useReducer } from "react";
import DateCounter from "./DateCounter";
import Header from "./Header";
import Main from "./Main";
const initialState = {
  question: [],
  // loading, error, ready, active, finished
  status: "loading",
};
function reducer(state, action) {}
function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  useEffect(() => {
    fetch("http://localhost:8000/questions")
      .then((res) => res.json())
      .then((data) => console.log(data))
      .catch((err) => console.log("error"));
  }, []);
  return (
    <div className="app">
      <Header />
      <Main>
        <h3>5/15</h3>
        <p>Questins</p>
      </Main>
    </div>
  );
}

export default App;

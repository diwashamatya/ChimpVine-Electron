import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Heading from 'renderer/components/Heading';
import './quiz.css';
import Footer from 'renderer/components/Footer';

interface SentData {
  event: string;
  link: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

interface QuizData {
  questions: QuizQuestion[];
}

interface Analytics {
  // timestamp?: string;
  details?: string;
}

export default function Quiz() {
  const { quizlink } = useParams();

  const [quiz, setQuiz] = useState<QuizData>({ questions: [] });
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timer, setTimer] = useState(20);
  const [correctans, setCorrectans] = useState(0);
  const [wrongans, setWrongans] = useState(0);
  const [showScore, setShowScore] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      console.log(score);
    }, 5000);
  }, [score]);
  useEffect(() => {
    const sentData: SentData = {
      event: 'GetQuizQuestion',
      link: quizlink,
    };

    const analyticsData: Analytics = {
      // timestamp: new Date().toLocaleString(),
      details: 'Started Playing Quiz',
    };

    window.electron.ipcRenderer.sendMessage('Quiz-data', sentData);

    window.electron.ipcRenderer.once('Quiz-data', async (arg: any) => {
      const data = await arg;
      setQuiz(data);
      // console.log(data);
    });

    window.electron.ipcRenderer.sendMessage('Analytics', analyticsData);
  }, []);

  const analyticsData = (score: number) => {
    setTimeout(() => {
      const analyticsData = {
        details: `Quiz ended with the score of ${score}`,
      };
      window.electron.ipcRenderer.sendMessage('Analytics', analyticsData);
    }, 1000);
  };

  const handleNextButton = useCallback(() => {
    if (selectedOption !== null) {
      const isCorrect =
        quiz.questions[currentQuestion].answer ===
        quiz.questions[currentQuestion].options[selectedOption];
      if (isCorrect) {
        setScore(score + 1);
        setCorrectans(correctans + 1);
      } else {
        setWrongans(wrongans + 1);
      }
    }

    setSelectedOption(null);
    setTimer(20);

    if (currentQuestion + 1 < quiz.questions.length) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowScore(true);
      setTimeout(() => {
        analyticsData(score);
      }, 10000);
    }
  }, [
    correctans,
    currentQuestion,
    quiz.questions,
    score,
    selectedOption,
    wrongans,
  ]);

  useEffect(() => {
    let timeLeft;

    if (timer > 0 && !showScore) {
      timeLeft = setTimeout(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else if (timer === 0 && !showScore) {
      handleNextButton();
    }

    return () => clearTimeout(timeLeft);
  }, [timer, showScore, handleNextButton]);

  const handleOptionClick = (index: number) => {
    if (selectedOption === null) {
      setSelectedOption(index);
      const isCorrect =
        quiz.questions[currentQuestion].answer ===
        quiz.questions[currentQuestion].options[index];
      if (isCorrect) {
        setScore(score + 1);
        console.log(score);
        setCorrectans(correctans + 1);
      } else {
        setWrongans(wrongans + 1);
      }
      setTimeout(() => {
        handleNextButton();
      }, 700);
    }
  };

  if (showScore) {
    return (
      <div className="container d-flex flex-column">
        <Heading />
        <div className=" d-flex flex-column align-items-center">
          <div className="  scoreContainer evaluation  ">
            <h2 className="heading2">Quiz Summary</h2>
            <p className=" d-flex justify-content-between">
              Total Questions:{' '}
              <span className="score "> {quiz.questions.length}</span>
            </p>
            <p className="  d-flex justify-content-between">
              Correct Answers: <span className="score-4"> {correctans}</span>{' '}
            </p>
            <p className=" d-flex justify-content-between">
              Wrong Answers: <span className="score-3"> {wrongans}</span>{' '}
            </p>
            <p className="d-flex justify-content-between">
              Score: <span className="score-2"> {score}</span>
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="container d-flex flex-column">
      <Heading />
      <div className="d-flex flex-column align-items-center">
        <div className="mainQuiz">
          <div className="top">
            <h1 className="heading">Quiz</h1>
          </div>
          <div className="questionBar">
            <div id="timer" className="timer">
              {timer}
            </div>
            <div className="qstnNumber">
              Question {currentQuestion + 1}/{quiz.questions.length}
            </div>
            <div className="qstn">
              {quiz.questions[currentQuestion]?.question}
            </div>
          </div>
          <div className="optionBar">
            <ul className="ulQuiz">
              {quiz.questions[currentQuestion]?.options.map((option, index) => (
                <li
                  className={`liQuiz ${
                    selectedOption === index
                      ? quiz.questions[currentQuestion].answer === option
                        ? 'correct'
                        : 'wrong'
                      : ''
                  }`}
                  key={option}
                  onClick={() => handleOptionClick(index)}
                >
                  {option}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

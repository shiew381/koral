import { numberifyArray } from "../../../app/utils/utils.js";
import { findIndexesOfCorrect } from "./qSetDisplayUtils.js";

//==========================================================================//
//====================== Multiple Choice Grading ===========================//

function gradeMultipleChoice(submittedQuestion, submittedResponse) {
  const numCorrectChoices = submittedQuestion.answerChoices?.reduce(
    (acc, cur) => (cur.isCorrect === true ? ++acc : acc),
    0
  );

  if (numCorrectChoices === 1) {
    const selectedResponseIndex = Number(submittedResponse);
    const correctResponseIndex = findIndexesOfCorrect(
      submittedQuestion.answerChoices
    )[0];

    return selectedResponseIndex === correctResponseIndex
      ? {
          earnedPoints: submittedQuestion.possiblePoints,
          answeredCorrectly: true,
        }
      : { earnedPoints: 0, answeredCorrectly: false };
  }

  if (numCorrectChoices > 1) {
    const selectedIndexes = numberifyArray(submittedResponse).sort((a, b) => {
      return a - b;
    });

    const correctIndexes = findIndexesOfCorrect(
      submittedQuestion.answerChoices
    ).sort((a, b) => {
      return a - b;
    });

    let numCorrectSelected = 0;

    selectedIndexes.forEach((element, index) => {
      if (correctIndexes.includes(element)) {
        numCorrectSelected = numCorrectSelected + 1;
      }
      return numCorrectSelected;
    });

    const numIncorrectSelected = selectedIndexes.length - numCorrectSelected;

    switch (submittedQuestion.scoringMethod) {
      case "allOrNothing":
        return numCorrectSelected === correctIndexes.length &&
          numIncorrectSelected === 0
          ? {
              earnedPoints: submittedQuestion.possiblePoints,
              answeredCorrectly: true,
            }
          : { earnedPoints: 0, answeredCorrectly: false };
      case "partial":
        switch (true) {
          case numCorrectSelected === correctIndexes.length &&
            numIncorrectSelected === 0:
            return {
              earnedPoints: submittedQuestion.possiblePoints,
              answeredCorrectly: true,
            };
          case numCorrectSelected > numIncorrectSelected:
            return {
              earnedPoints:
                (numCorrectSelected - numIncorrectSelected) *
                (submittedQuestion.possiblePoints / correctIndexes.length),
              answeredCorrectly: "partial",
            };
          case numCorrectSelected > 0:
            return {
              earnedPoints: 0,
              answeredCorrectly: "partial",
            };

          default:
            return { earnedPoints: 0, answeredCorrectly: false };
        }

      default:
        break;
    }
  }
}

//==========================================================================//
//======================= Short Answer Grading ============================//

async function gradeShortAnswer(submittedQuestion, submittedResponse) {
  switch (submittedQuestion.subtype) {
    case "wordOrPhrase":
      switch (true) {
        case submittedQuestion.acceptAlternateCapitalization &&
          submittedQuestion.acceptAlternateSpacing:
          return submittedResponse.wordOrPhrase
            .toLowerCase()
            .replace(/\s+/g, "") ===
            submittedQuestion.correctWordOrPhrase
              .toLowerCase()
              .replace(/\s+/g, "")
            ? {
                earnedPoints: submittedQuestion.possiblePoints,
                answeredCorrectly: true,
              }
            : { earnedPoints: 0, answeredCorrectly: false };
        case submittedQuestion.acceptAlternateCapitalization:
          return submittedResponse.wordOrPhrase.toLowerCase() ===
            submittedQuestion.correctWordOrPhrase.toLowerCase()
            ? {
                earnedPoints: submittedQuestion.possiblePoints,
                answeredCorrectly: true,
              }
            : { earnedPoints: 0, answeredCorrectly: false };

        case submittedQuestion.acceptAlternateSpacing:
          return submittedResponse.wordOrPhrase.replace(/\s+/g, "") ===
            submittedQuestion.correctWordOrPhrase.replace(/\s+/g, "")
            ? {
                earnedPoints: submittedQuestion.possiblePoints,
                answeredCorrectly: true,
              }
            : { earnedPoints: 0, answeredCorrectly: false };

        default:
          return submittedResponse.wordOrPhrase ===
            submittedQuestion.correctWordOrPhrase
            ? {
                earnedPoints: submittedQuestion.possiblePoints,
                answeredCorrectly: true,
              }
            : { earnedPoints: 0, answeredCorrectly: false };
      }
    case "number":
    case "symbolic":
    case "vector":
    case "vector symbolic": {
      const mathematicaResponse = await gradeNumberUsingMathematica(
        submittedQuestion,
        submittedResponse
      );
      const answeredCorrectly = extractAnsweredCorrectly(mathematicaResponse);

      return answeredCorrectly
        ? {
            earnedPoints: submittedQuestion.possiblePoints,
            answeredCorrectly: true,
          }
        : { earnedPoints: 0, answeredCorrectly: false };
    }
    case "vector with unit":
    case "measurement": {
      const mathematicaResponse = await gradeNumberAndUnitUsingMathematica(
        submittedQuestion,
        submittedResponse
      );

      const answeredCorrectly = extractAnsweredCorrectly(mathematicaResponse);

      return answeredCorrectly
        ? {
            earnedPoints: submittedQuestion.possiblePoints,
            answeredCorrectly: true,
          }
        : { earnedPoints: 0, answeredCorrectly: false };
    }

    default:
      break;
  }
}

function chooseMathematicaURL(subtype) {
  switch (subtype) {
    case "number":
      return "https://www.wolframcloud.com/obj/ptaborek/valueOnlyGradingFunc?";
    case "symbolic":
      return "https://www.wolframcloud.com/obj/ptaborek/symbolicGradingFunc?";
    case "measurement":
      return "https://www.wolframcloud.com/obj/ptaborek/valueUnitGradingFunc?";
    case "vector":
      return "https://www.wolframcloud.com/obj/ptaborek/vecsGradingFunc?";
    case "vector symbolic":
      return "https://www.wolframcloud.com/obj/ptaborek/symbolicVecGradingFunc?";
    case "vector with unit":
      return "https://www.wolframcloud.com/obj/ptaborek/vecsWunitsGradingFunc?";
    default:
      break;
  }
}

function gradeNumberUsingMathematica(question, response) {
  const studentVal = encodeURIComponent(response.number);
  const correctVal = encodeURIComponent(question.correctNumber);
  const percentTolerance = encodeURIComponent(question.percentTolerance);

  const request = require("request");

  const options = {
    method: "GET",
    url: chooseMathematicaURL(question.subtype),
  };

  console.log("request sent to: " + chooseMathematicaURL(question.subtype));

  console.log(
    `Sent to mathematica.... studentval: ${studentVal}, correctval: ${correctVal},  percentTolerance: ${percentTolerance}`
  );

  options.url =
    options.url +
    `studentval=${studentVal}&correctval=${correctVal}&percentTolerance=${percentTolerance}`;

  return new Promise((resolve, reject) => {
    request(options, function (error, response) {
      if (response) {
        console.log(`response from mathematica: ${response.body}`);
        resolve(response.body);
      } else if (error) {
        console.log(error);
        reject(error);
      }
    });
  });
}

function gradeNumberAndUnitUsingMathematica(question, response) {
  const studentVal = encodeURIComponent(response.number);
  const studentUnit = encodeURIComponent(response.unit);
  const correctVal = encodeURIComponent(question.correctNumber);
  const correctUnit = encodeURIComponent(question.correctUnit);
  const percentTolerance = encodeURIComponent(question.percentTolerance);

  const request = require("request");
  const options = {
    method: "GET",
    url: chooseMathematicaURL(question.subtype),
  };

  console.log("request sent to: " + chooseMathematicaURL(question.subtype));

  console.log(
    `Sent to mathematica.... studentval: ${studentVal}, correctval: ${correctVal},  percentTolerance: ${percentTolerance}`
  );

  options.url =
    options.url +
    `studentval=${studentVal}&studentunit=${studentUnit}&correctval=${correctVal}&correctunit=${correctUnit}&percentTolerance=${percentTolerance}`;

  return new Promise((resolve, reject) => {
    request(options, function (error, response) {
      if (response) {
        console.log(`response from mathematica: ${response.body}`);
        resolve(response.body);
      } else if (error) {
        console.log(error);
        reject(error);
      }
    });
  });
}

function extractAnsweredCorrectly(response) {
  const responseArray = response.substring(1, response.length - 1).split(",");
  if (!responseArray[0]) return false;
  return responseArray[0] === "true" ? true : false;
}

//==========================================================================//
//======================= Main Grading Function ============================//

export function grade(submittedQuestion, submittedResponse) {
  switch (submittedQuestion.type) {
    case "multiple choice":
      return gradeMultipleChoice(submittedQuestion, submittedResponse);
    case "short answer":
      return gradeShortAnswer(submittedQuestion, submittedResponse);
    default:
      break;
  }
}

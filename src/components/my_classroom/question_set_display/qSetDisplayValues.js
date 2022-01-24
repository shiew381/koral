import firebase from "../../../app/config/firebaseConfig";
import { generateResponseID } from "./qSetDisplayUtils";
import { alphabet } from "../../../app/utils/utils";

const titleCardInitValues = {
  type: "title card",
};

function multipleChoiceValues(question, submissionHistory, partIndex) {
  if (!submissionHistory) return { type: "multiple choice", response: "" };

  const responses_key =
    partIndex < 0
      ? `${question.id}_responses`
      : `${question.id}_${alphabet[partIndex]}_responses`;
  const pastResponses = submissionHistory[responses_key];
  const lastResponse = pastResponses
    ? pastResponses[pastResponses.length - 1]
    : null;
  const numCorrectChoices = question.answerChoices?.reduce(
    (numCorrect, answerChoice) =>
      answerChoice.isCorrect ? ++numCorrect : numCorrect,
    0
  );

  if (numCorrectChoices === 1)
    return {
      type: "multiple choice",
      response: lastResponse || "",
    };
  else if ((numCorrectChoices > 1) & !lastResponse)
    return {
      type: "multiple choice",
      response: [],
    };
  else if (numCorrectChoices > 1)
    return {
      type: "multiple choice",
      response: Object.values(lastResponse) || [],
    };
}

function shortAnswerValues(question, submissionHistory, partIndex) {
  const subtype = question.subtype;

  if (!submissionHistory && subtype === "wordOrPhrase")
    return { type: "short answer", response: { wordOrPhrase: "" } };
  if (
    !submissionHistory &&
    (subtype === "number" ||
      subtype === "symbolic" ||
      subtype === "vector" ||
      subtype === "vector symbolic")
  )
    return { type: "short answer", response: { number: "" } };
  if (
    !submissionHistory &&
    (subtype === "measurement" || subtype === "vector with unit")
  )
    return { type: "short answer", response: { number: "", unit: "" } };

  const responses_key =
    partIndex < 0
      ? `${question.id}_responses`
      : `${question.id}_${alphabet[partIndex]}_responses`;
  const pastResponses = submissionHistory[responses_key];
  const lastResponse = pastResponses
    ? pastResponses[pastResponses.length - 1]
    : null;

  switch (subtype) {
    case "wordOrPhrase":
      return {
        type: "short answer",
        response: { wordOrPhrase: lastResponse || "" },
      };
    case "number":
    case "symbolic":
    case "vector":
    case "vector symbolic":
      return {
        type: "short answer",
        response: {
          number: lastResponse?.number || "",
        },
      };
    case "measurement":
    case "vector with unit":
      return {
        type: "short answer",
        response: {
          number: lastResponse?.number || "",
          unit: lastResponse?.unit || "",
        },
      };

    default:
      break;
  }
}

function freeResponseValues(question, submissionHistory, partIndex) {
  if (!submissionHistory) return { type: "free response", response: "" };
  const response_key =
    partIndex < 0
      ? `${question.id}_response`
      : `${question.id}_${alphabet[partIndex]}_response`;
  const lastResponse = submissionHistory[response_key];

  return {
    type: "free response",
    response: lastResponse || "",
  };
}

function fileUploadValues(question, submissionHistory, partIndex) {
  if (!submissionHistory) return { type: "file upload", response: "" };
  const response_key =
    partIndex < 0
      ? `${question.id}_response`
      : `${question.id}_${alphabet[partIndex]}_response`;
  const lastResponse = submissionHistory[response_key];

  return {
    type: "file upload",
    response: lastResponse || "",
  };
}

function multipartValues(question, submissionHistory) {
  // if (!submissionHistory) return { type: "free response", parts: [] };

  const partsInitValues = [];
  question.parts.forEach((part, partIndex) => {
    const partPlusQuestionID = { id: question.id, ...part };
    let lastResponse = {};

    switch (part.type) {
      case "multiple choice":
        lastResponse = multipleChoiceValues(
          partPlusQuestionID,
          submissionHistory,
          partIndex
        );
        break;
      case "short answer":
        lastResponse = shortAnswerValues(
          partPlusQuestionID,
          submissionHistory,
          partIndex
        );
        break;
      case "free response":
        lastResponse = freeResponseValues(
          partPlusQuestionID,
          submissionHistory,
          partIndex
        );
        break;
      default:
        break;
    }

    partsInitValues.push(lastResponse);
  });

  return {
    type: "multipart",
    parts: partsInitValues,
  };
}

export function pickInitialValues(question, submissionHistory) {
  switch (question?.type) {
    case "title card":
      return titleCardInitValues;
    case "multiple choice":
      return multipleChoiceValues(question, submissionHistory, -1);
    case "short answer":
      return shortAnswerValues(question, submissionHistory, -1);
    case "free response":
      return freeResponseValues(question, submissionHistory, -1);
    case "file upload":
      return fileUploadValues(question, submissionHistory, -1);
    case "multipart":
      return multipartValues(question, submissionHistory);
    default:
      break;
  }
}

export function tidyResponse(
  submittedPart,
  question,
  response,
  grade,
  submissionHistory
) {
  //generate key names based on question number and part (if multipart question) being submitted
  const responseID = generateResponseID(question.id, submittedPart);
  const response_key = `${responseID}_response`;
  const responses_key = `${responseID}_responses`;
  const earnedPoints_key = `${responseID}_earnedPoints`;
  const answeredCorrectly_key = `${responseID}_answeredCorrectly`;
  const timestamp_key = `${responseID}_timestamp`;
  const timestamps_key = `${responseID}_timestamps`;

  const timestampHistory =
    submissionHistory && submissionHistory[timestamps_key]
      ? submissionHistory[timestamps_key]
      : [];

  timestampHistory.push(firebase.firestore.Timestamp.now());

  const responseHistory =
    submissionHistory && submissionHistory[responses_key]
      ? submissionHistory[responses_key]
      : [];

  const subtype = question.subtype;

  let saveData = {};

  switch (question.type) {
    case "multiple choice":
      const numCorrectChoices = question.answerChoices?.reduce(
        (acc, cur) => (cur.isCorrect === true ? ++acc : acc),
        0
      );

      if (numCorrectChoices === 1) {
        responseHistory.push(response);
      }

      if (numCorrectChoices > 1) {
        response.sort(function (a, b) {
          return a - b;
        });
        //firebase does not accept nested arrays like [["1","3","4"],["1","2"]], so converting response array into serialized object
        responseHistory.push({ ...response });
      }

      saveData = {
        [responses_key]: responseHistory,
        [earnedPoints_key]: grade.earnedPoints,
        [answeredCorrectly_key]: grade.answeredCorrectly,
        [timestamps_key]: timestampHistory,
      };

      break;
    case "short answer":
      if (subtype === "wordOrPhrase") {
        responseHistory.push(response.wordOrPhrase);
      } else if (
        subtype === "number" ||
        subtype === "symbolic" ||
        subtype === "vector" ||
        subtype === "vector symbolic"
      ) {
        responseHistory.push({
          number: response.number,
        });
      } else if (subtype === "measurement" || subtype === "vector with unit") {
        responseHistory.push({
          number: response.number,
          unit: response.unit,
        });
      }
      saveData = {
        [responses_key]: responseHistory,
        [earnedPoints_key]: grade.earnedPoints,
        [answeredCorrectly_key]: grade.answeredCorrectly,
        [timestamps_key]: timestampHistory,
      };
      break;

    case "free response":
      saveData = {
        [response_key]: response,
        [timestamp_key]: firebase.firestore.Timestamp.now(),
      };
      break;

    default:
      break;
  }

  return saveData;
}

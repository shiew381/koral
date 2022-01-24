import { addQuestionToSet } from "../../../app/firestoreClient.js";
import { addQuestionToMyLibrary } from "../../../app/firestoreClient.js";
import { updateQuestionInSet } from "../../../app/firestoreClient.js";
import { updateQuestionInMyLibrary } from "../../../app/firestoreClient.js";
import { addQuestionToLibrary } from "../../../app/firestoreClient.js";
import { updateQuestionInLibrary } from "../../../app/firestoreClient.js";
import { generateTotalPossiblePoints } from "../../../app/firestoreClient.js";

//TODO ENV Page

function updateQuestionSet(questions, questionSetID, tidiedValues, userID) {
  console.log(tidiedValues);
  const updatedQuestions = questions.map((question, index) => {
    if (question.id === tidiedValues.id) {
      question = tidiedValues;
    }
    return question;
  });

  console.log(updatedQuestions);
  // console.log(updatedQuestions);
  updateQuestionInSet(questionSetID, updatedQuestions, userID);
}

export function saveQuestion(
  tidiedValues,
  addOrEdit,
  saveTo,
  libraryID,
  libraryQuestionID,
  userID,
  questionSetID,
  questions
) {
  switch (saveTo) {
    case "my_library":
      if (addOrEdit === "add") {
        try {
          addQuestionToMyLibrary(tidiedValues, userID);
        } catch (error) {
          console.log(error.message);
        }
      }
      if (addOrEdit === "edit") {
        try {
          updateQuestionInMyLibrary(libraryQuestionID, tidiedValues, userID);
        } catch (error) {
          console.log(error.message);
        }
      }
      break;
    case "my_question_sets":
      if (addOrEdit === "add") {
        try {
          addQuestionToSet(questionSetID, tidiedValues, userID);
          generateTotalPossiblePoints(questionSetID, userID);
        } catch (error) {
          console.log(error.message);
        }
      }
      if (addOrEdit === "edit") {
        try {
          updateQuestionSet(questions, questionSetID, tidiedValues, userID);
          generateTotalPossiblePoints(questionSetID, userID);
        } catch (error) {
          console.log(error.message);
        }
      }
      break;

    case "libraries":
      if (addOrEdit === "add") {
        try {
          addQuestionToLibrary(tidiedValues, libraryID);
        } catch (error) {
          console.log(error.message);
        }
      } else if (addOrEdit === "edit") {
        try {
          updateQuestionInLibrary(libraryID, libraryQuestionID, tidiedValues);
        } catch (error) {
          console.log(error.message);
        }
      }
      break;
    default:
      break;
  }
}

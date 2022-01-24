import firebase from "../../../app/config/firebaseConfig.js";

//TODO ENV Page

export async function deleteAuxillaryFile(
  auxFileIndex,
  firestoreRef,
  question,
  questions,
  storagePath
) {
  const auxFileStorageRef = firebase.storage().ref().child(storagePath);

  const updatedQuestions = questions?.map((el) => {
    if (el.id === question.id) el.auxillaryFiles.splice(auxFileIndex, 1);
    return el;
  });

  await auxFileStorageRef.delete().then(() =>
    firestoreRef.update({
      questions: updatedQuestions,
    })
  );
}

export function generateStoragePath(
  saveTo,
  userID,
  libraryID,
  filename,
  folder
) {
  switch (saveTo) {
    case "my_question_sets":
      if (folder === "solution") {
        return `users/${userID}/questions/solutions/${filename}`;
      } else if (folder === "auxFile") {
        return `users/${userID}/questions/auxillary_files/${filename}`;
      }
      break;
    case "my_library":
      if (folder === "solution") {
        return `users/${userID}/questions/solutions/${filename}`;
      } else if (folder === "auxFile") {
        return `users/${userID}/questions/auxillary_files/${filename}`;
      }
      break;
    case "libraries":
      if (folder === "solution") {
        return `libraries/${libraryID}/solutions/${filename}`;
      } else if (folder === "auxFile") {
        return `libraries/${libraryID}/auxillary_files/${filename}`;
      }
      break;
    default:
      break;
  }
}

export function generateFirestoreRef(
  saveTo,
  userID,
  questionSetID,
  questionID,
  libraryID
) {
  switch (saveTo) {
    case "my_question_sets":
      return firebase
        .firestore()
        .collection("user_questions")
        .doc(userID)
        .collection(saveTo)
        .doc(questionSetID);
    case "my_library":
      return firebase
        .firestore()
        .collection("user_questions")
        .doc(userID)
        .collection(saveTo)
        .doc(questionID);
    case "libraries":
      return firebase
        .firestore()
        .collection(saveTo)
        .doc(libraryID)
        .collection("questions")
        .doc(questionID);
    default:
      break;
  }
}

import firebase from "./config/firebaseConfig.js";

export function setNamePending(email, displayName) {
  const ref = firebase
    .firestore()
    .collection("pendingActions")
    .doc("users")
    .collection("setDisplayName");
  ref.add({ email: email, displayName: displayName });
}

export function updateDisplayNameInFirestore(displayName, userID) {
  const ref = firebase.firestore().collection("users").doc(userID);
  ref.update({ displayName: displayName });
}

export function addCourse(courseInfo) {
  const ref = firebase.firestore().collection("courses");
  ref.add(courseInfo);
}

export function updateCourseTitle(courseID, updatedTitle) {
  const ref = firebase.firestore().collection("courses").doc(courseID);
  ref.update({
    title: updatedTitle,
  });
}

export function updateCourseDescription(courseID, updatedDescription) {
  const ref = firebase.firestore().collection("courses").doc(courseID);
  ref.update({
    description: updatedDescription,
  });
}

export async function generateTotalPossiblePoints(questionSetID, userID) {
  let ref = firebase
    .firestore()
    .collection("user_questions")
    .doc(userID)
    .collection("my_question_sets")
    .doc(questionSetID)
    .get();

  let questions = await ref;

  questions = questions.data().questions;

  let totalPossiblePoints = questions.reduce(
    (total, current) => total + (parseInt(current.possiblePoints) || 0),
    0
  );

  //Get totalPossiblePoints for multipart questions which are embedded in parts array
  let multiPartTotalPossiblePoints = 0;
  questions.forEach((question) => {
    multiPartTotalPossiblePoints += question.hasOwnProperty("parts")
      ? question.parts.reduce(
          (total, current) => total + (parseInt(current.possiblePoints) || 0),
          0
        )
      : 0;
  });

  totalPossiblePoints =
    parseInt(totalPossiblePoints) + parseInt(multiPartTotalPossiblePoints);

  updateTotalPossiblePoints(totalPossiblePoints, questionSetID, userID);
}

export function updateTotalPossiblePoints(
  totalPossiblePoints,
  questionSetID,
  userID
) {
  const ref = firebase
    .firestore()
    .collection("user_questions")
    .doc(userID)
    .collection("my_question_sets")
    .doc(questionSetID);

  ref.update({
    totalPossiblePoints: totalPossiblePoints,
  });
}

export function inviteStudentsToCourse(students, courseID) {
  const ref = firebase.firestore().collection("courses").doc(courseID);

  ref.update({
    invitedStudents: firebase.firestore.FieldValue.arrayUnion(...students),
    invitedStudentEmails: firebase.firestore.FieldValue.arrayUnion(
      ...students.map((student) => student.email)
    ),
  });
}

export async function inviteInstructorToCourse(values, courseID) {
  let ref = firebase.firestore().collection("courses").doc(courseID);

  await ref.update({
    invitedInstructorEmails: firebase.firestore.FieldValue.arrayUnion(
      values.instructorEmail
    ),
  });
}

export async function inviteStudentToCourse(values, courseID) {
  let ref = firebase.firestore().collection("courses").doc(courseID);

  ref.update({
    invitedStudents: firebase.firestore.FieldValue.arrayUnion({
      email: values.studentEmail,
      organizationUserID: values?.studentOrganizationUserId
        ? values.studentOrganizationUserId
        : "",
      organizationUserName: values.studentName,
    }),
    invitedStudentEmails: firebase.firestore.FieldValue.arrayUnion(
      values.studentEmail
    ),
  });
}

export function addCourseModule(moduleInfo, courseID) {
  const ref = firebase.firestore().collection("courses").doc(courseID);
  ref.update({
    modules: firebase.firestore.FieldValue.arrayUnion(moduleInfo),
  });
}

export function deleteCourseModule(moduleInfo, courseID) {
  const ref = firebase.firestore().collection("courses").doc(courseID);
  ref.update({
    modules: firebase.firestore.FieldValue.arrayRemove(moduleInfo),
  });
}

export function updateModuleTitle(courseID, updatedModules) {
  const ref = firebase.firestore().collection("courses").doc(courseID);
  ref.update({
    modules: updatedModules,
  });
}

export function updateCourseModuleContent(courseID, updatedModules) {
  const ref = firebase.firestore().collection("courses").doc(courseID);
  ref.update({
    modules: updatedModules,
  });
  return ref.response;
}

export function updateCourseModuleOrder(courseID, updatedModules) {
  const ref = firebase.firestore().collection("courses").doc(courseID);
  ref.update({
    modules: updatedModules,
  });
  return ref.response;
}

export async function updateCourseModuleContentOrder(
  courseID,
  currentModuleIndex,
  reorderedContent
) {
  const ref = firebase.firestore().collection("courses").doc(courseID);

  let course = await ref.get();
  let modules = course.data().modules;
  let currentModule = modules[currentModuleIndex];
  let updatedModule = {
    ...currentModule,
    content: reorderedContent,
  };
  let updatedModules = [...modules];
  updatedModules[currentModuleIndex] = updatedModule;

  await ref.update({ modules: updatedModules });

  // ref.update({
  //   modules[currentModuleIndex]: updatedModules,
  // });

  return ref.response;
}

export function updateQuestionSetQuestionsOrder(
  userID,
  questionSetID,
  updatedQuestionSetQuestions
) {
  const ref = firebase
    .firestore()
    .collection("user_questions")
    .doc(userID)
    .collection("my_question_sets")
    .doc(questionSetID);
  ref.update({
    questions: updatedQuestionSetQuestions,
  });
  return ref.response;
}

export function addQuestionSetToFolder(
  userID,
  questionSetID,
  folderID,
  questionSetTitle
) {
  const ref = firebase
    .firestore()
    .collection("user_questions")
    .doc(userID)
    .collection("my_question_sets")
    .doc(folderID);

  ref.update({
    children: firebase.firestore.FieldValue.arrayUnion({
      id: questionSetID,
      title: questionSetTitle,
    }),
  });
  return ref.response;
}

export function removeQuestionSetFromFolder(
  userID,
  questionSetID,
  folderID,
  questionSetTitle
) {
  const ref = firebase
    .firestore()
    .collection("user_questions")
    .doc(userID)
    .collection("my_question_sets")
    .doc(folderID);

  ref.update({
    children: firebase.firestore.FieldValue.arrayRemove({
      id: questionSetID,
      title: questionSetTitle,
    }),
  });
  return ref.response;
}

export function updateQuestionSetFolderProperties(
  userID,
  questionSetID,
  isChild,
  parentID = null,
  parentTitle = null
) {
  const ref = firebase
    .firestore()
    .collection("user_questions")
    .doc(userID)
    .collection("my_question_sets")
    .doc(questionSetID);

  ref.update({
    isChild: isChild,
    parentID: parentID,
    parentTitle: parentTitle,
  });
  return ref.response;
}

export function deleteContentFromModule(courseID, updatedModules) {
  const ref = firebase.firestore().collection("courses").doc(courseID);
  ref.update({
    modules: updatedModules,
  });
}

export async function addReportProblem(values) {
  const ref = firebase.firestore().collection("report_a_problem");
  ref.add(values);
}

export function addNewLibrary(libraryInfo) {
  const ref = firebase.firestore().collection("libraries");
  ref.add(libraryInfo);
}

export function addQuestionToLibrary(question, libraryID) {
  const libraryInfoRef = firebase
    .firestore()
    .collection("libraries")
    .doc(libraryID);

  const libraryRef = libraryInfoRef.collection("questions");

  libraryRef
    .add(question)
    .then((docRef) => libraryRef.doc(docRef.id).update({ id: docRef.id }))
    .then(() => {
      libraryInfoRef.update({
        questionCount: firebase.firestore.FieldValue.increment(1),
      });
    });
}

export function updateQuestionInLibrary(
  libraryID,
  libraryQuestionID,
  editedQuestion
) {
  const ref = firebase
    .firestore()
    .collection("libraries")
    .doc(libraryID)
    .collection("questions")
    .doc(libraryQuestionID);

  ref.update(editedQuestion);
}

export function deleteQuestionFromLibrary(questionID, libraryID) {
  const libraryInfoRef = firebase
    .firestore()
    .collection("libraries")
    .doc(libraryID);

  const libraryQuestionRef = libraryInfoRef
    .collection("questions")
    .doc(questionID);

  libraryQuestionRef.delete().then(() =>
    libraryInfoRef.update({
      questionCount: firebase.firestore.FieldValue.increment(-1),
    })
  );
}

export function addQuestionToMyLibrary(question, userID) {
  const myQuestionsRef = firebase
    .firestore()
    .collection("user_questions")
    .doc(userID);

  const myLibraryRef = myQuestionsRef.collection("my_library");

  myLibraryRef
    .add(question)
    .then((docRef) => myLibraryRef.doc(docRef.id).update({ id: docRef.id }))
    .then(() => {
      myQuestionsRef.update({
        questionCount: firebase.firestore.FieldValue.increment(1),
      });
    });
}

export function updateQuestionInMyLibrary(
  libraryQuestionID,
  editedQuestion,
  userID
) {
  const ref = firebase
    .firestore()
    .collection("user_questions")
    .doc(userID)
    .collection("my_library")
    .doc(libraryQuestionID);

  ref.update(editedQuestion);
}

export function deleteQuestionFromMyLibrary(questionID, userID) {
  const ref = firebase.firestore().collection("user_questions").doc(userID);

  ref
    .collection("my_library")
    .doc(questionID)
    .delete()
    .then(() =>
      ref.update({
        questionCount: firebase.firestore.FieldValue.increment(-1),
      })
    );
}

export function addQuestionToSet(questionSetID, question, userID) {
  const ref = firebase
    .firestore()
    .collection("user_questions")
    .doc(userID)
    .collection("my_question_sets")
    .doc(questionSetID);
  ref.update({
    questions: firebase.firestore.FieldValue.arrayUnion(question),
  });
}

export function updateQuestionInSet(questionSetID, updatedQuestions, userID) {
  const ref = firebase
    .firestore()
    .collection("user_questions")
    .doc(userID)
    .collection("my_question_sets")
    .doc(questionSetID);

  ref.update({
    questions: updatedQuestions,
  });
}

export async function deleteQuestionFromSet(
  qIndex,
  questions,
  questionSetID,
  userID
) {
  const question = questions[qIndex];
  console.log("attempting to delete from firestore");
  console.log("userID: " + userID);
  console.log("questionSetID: " + questionSetID);
  console.log("question id: " + question.id);
  console.log(questions);
  console.log(question);

  const updatedQuestions = questions.filter((el) => el.id !== question.id);

  console.log(updatedQuestions);

  const ref = firebase
    .firestore()
    .collection("user_questions")
    .doc(userID)
    .collection("my_question_sets")
    .doc(questionSetID);

  await ref.update({
    questions: updatedQuestions,
  });
}

export function copyQuestionToSet(questionSetID, selectedQuestions, userID) {
  const ref = firebase
    .firestore()
    .collection("user_questions")
    .doc(userID)
    .collection("my_question_sets")
    .doc(questionSetID);
  selectedQuestions.forEach((question) => {
    ref.update({
      questions: firebase.firestore.FieldValue.arrayUnion(question),
    });
  });
}

export function addQuestionSet(questionSetInfo, userID) {
  const ref = firebase
    .firestore()
    .collection("user_questions")
    .doc(userID)
    .collection("my_question_sets")
    .doc();

  ref.set(questionSetInfo);
}

export async function editQuestionSetTitle(values, userID, questionSetID) {
  const questionSetRef = firebase
    .firestore()
    .collection("user_questions")
    .doc(userID)
    .collection("my_question_sets")
    .doc(questionSetID);
  await questionSetRef.update({ title: values.title });
}

export function addFolderToQuestionSetCollection(questionSetInfo, userID) {
  const ref = firebase
    .firestore()
    .collection("user_questions")
    .doc(userID)
    .collection("my_question_sets")
    .doc();

  ref.set(questionSetInfo);
}

export function deleteQuestionSet(questionSetID, userID) {
  const ref = firebase
    .firestore()
    .collection("user_questions")
    .doc(userID)
    .collection("my_question_sets")
    .doc(questionSetID);

  ref.delete().catch((err) => {
    console.error(err);
  });
}

export function addLink(urlInfo, userID) {
  const ref = firebase
    .firestore()
    .collection("user_links")
    .doc(userID)
    .collection("urls");

  ref.add(urlInfo);
}

export function deleteLink(linkID, userID) {
  const ref = firebase
    .firestore()
    .collection("user_links")
    .doc(userID)
    .collection("urls")
    .doc(linkID);
  ref.delete();
}

export async function saveResponse(
  response,
  courseID,
  assignmentID,
  userID,
  questionSetID,
  collection
) {
  switch (collection) {
    case "courses":
      const coursesRef = firebase
        .firestore()
        .collection("courses")
        .doc(courseID)
        .collection("assignments")
        .doc(assignmentID)
        .collection("results")
        .doc(userID);

      await coursesRef.set(response, { merge: true });
      break;
    case "my_responses":
      const myResponsesRef = firebase
        .firestore()
        .collection("user_questions")
        .doc(userID)
        .collection("my_responses")
        .doc(questionSetID);

      await myResponsesRef.set(response, { merge: true });
      break;
    default:
      break;
  }
}

export function saveQuestionSetGradeSummary(
  response,
  courseID,
  assignmentID,
  userID,
  userDisplayName
) {
  const gradeSummariesRef = firebase
    .firestore()
    .collection("courses")
    .doc(courseID)
    .collection("grade_summaries")
    .doc(userID);
  gradeSummariesRef.set(
    {
      userID: userID,
      userDisplayName: userDisplayName,
      [assignmentID]: {
        assignmentType: "question set",
        totalEarnedPoints: response.totalEarnedPoints,
        totalPossiblePoints: response.totalPossiblePoints,
      },
    },
    { merge: true }
  );
}

export function fetchResponses(
  collection,
  courseID,
  assignmentID,
  userID,
  questionSetID,
  setSubmissionHistory
) {
  switch (collection) {
    case "courses":
      const coursesRef = firebase
        .firestore()
        .collection("courses")
        .doc(courseID)
        .collection("assignments")
        .doc(assignmentID)
        .collection("results")
        .doc(userID);
      coursesRef.onSnapshot((querySnapshot) => {
        setSubmissionHistory(querySnapshot.data());
      });
      break;
    case "my_responses":
      const myResponsesRef = firebase
        .firestore()
        .collection("user_questions")
        .doc(userID)
        .collection("my_responses")
        .doc(questionSetID || "placeholderID");
      myResponsesRef.onSnapshot((querySnapshot) => {
        setSubmissionHistory(querySnapshot.data());
      });
      break;
    default:
      break;
  }
}

export function fetchUserInfo(userID, setUserInfo) {
  const ref = firebase.firestore().collection("users").doc(userID);
  ref.onSnapshot((snapshot) => {
    setUserInfo(snapshot.data());
  });
}

export async function fetchUserIDFromEmail(userEmail) {
  const ref = firebase
    .firestore()
    .collection("users")
    .where("email", "==", userEmail);

  let user = await ref.get();

  return user.docs[0].id;
}

export async function getUserDisplayName(userID) {
  const ref = firebase
    .firestore()
    .collection("users")
    .where("userID", "==", userID);

  let user = await ref.get();

  return user.docs[0].data()?.displayName;
}

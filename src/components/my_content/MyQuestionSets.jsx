import React, { useState, useEffect } from "react";
import { Box, Typography } from "@material-ui/core";
import QuestionBuilder from "./QuestionBuilder.jsx";
import MultipartBuilder from "./MultipartBuilder.jsx";
import ImportFromLibrary from "./ImportFromLibrary.jsx";
import QuestionSnippetsDraggable from "./QuestionSnippetsDraggable.jsx";
import EditQuestionSetTitle from "./EditQuestionSetTitle.jsx";
import ShareQuestionSet from "./ShareQuestionSet.jsx";
import QuestionPreviewCard from "./question_preview/QuestionPreviewCard.jsx";

export default function MyQuestionSets({
  selectedQuestionSet,
  setSelectedQuestionSet,
  userID,
  userPermissions,
}) {
  const [selectedQuestion, setSelectedQuestion] = useState({});

  useEffect(() => {
    if (!selectedQuestion?.id) return;

    const updatedQuestions = selectedQuestionSet.questions;
    const updatedQuestionPreview = updatedQuestions.find(
      (el) => el.id === selectedQuestion.id
    );
    setSelectedQuestion(() => updatedQuestionPreview);

    // eslint-disable-next-line
  }, [selectedQuestionSet]);

  return (
    <Box className="question-list-and-preview-area">
      <Box className="question-list-panel">
        <Box
          pb="10px"
          style={{ position: "relative", left: "15px" }}
          className="flex-center-all"
        >
          <Typography color="primary" variant="h5">
            {selectedQuestionSet?.title || "(no title)"}
          </Typography>
          <EditQuestionSetTitle
            questionSetID={selectedQuestionSet?.id}
            title={selectedQuestionSet?.title}
            userID={userID}
          />
          <ShareQuestionSet
            questionSetID={selectedQuestionSet?.id}
            title={selectedQuestionSet?.title}
            userID={userID}
          />
        </Box>
        <QuestionSnippetsDraggable
          selectedQuestion={selectedQuestion}
          selectedQuestionSet={selectedQuestionSet}
          setSelectedQuestion={setSelectedQuestion}
          setSelectedQuestionSet={setSelectedQuestionSet}
          userID={userID}
        />
        <Box className="add-question-my-sets flex-column space-around">
          <QuestionBuilder
            questionSetID={selectedQuestionSet?.id}
            saveTo="my_question_sets"
            userID={userID}
          />
          <MultipartBuilder
            questionSetID={selectedQuestionSet?.id}
            saveTo="my_question_sets"
            userID={userID}
          />
          <ImportFromLibrary
            questionSetID={selectedQuestionSet?.id}
            userID={userID}
            userPermissions={userPermissions}
          />
        </Box>
      </Box>

      <QuestionPreviewCard
        question={selectedQuestion}
        questionSet={selectedQuestionSet}
        saveTo="my_question_sets"
        userID={userID}
      />
    </Box>
  );
}

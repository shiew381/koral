import React, { useState, useEffect } from "react";
import { Box, Typography, Select, MenuItem } from "@material-ui/core";
import { Pagination } from "@material-ui/lab";
import AddLibrary from "./AddLibrary.jsx";
import QuestionBuilder from "./QuestionBuilder.jsx";
import MultipartBuilder from "./MultipartBuilder.jsx";
import QuestionPreviewCard from "./question_preview/QuestionPreviewCard";
import firebase from "../../app/config/firebaseConfig.js";
import QuestionSnippets from "./QuestionSnippets.jsx";
import { artificialDelay } from "../../app/utils/utils.js";
import {
  countQuestionsInLibrary,
  countQuestionsReturnedFromQuery,
  fetchPageWithListener,
  fetchNextPageWithListener,
  fetchPreviousPageWithListener,
  jumpForwardToPageWithListener,
  jumpBackwardToPageWithListener,
  QuestionRangeCounter,
} from "./libraryPaginationUtils.js";
import LibrarySearchModule from "./LibrarySearchModule.jsx";

export default function Libraries() {
  const [currentPage, setCurrentPage] = useState(1);
  const [firstDoc, setFirstDoc] = useState({});
  const [lastDoc, setLastDoc] = useState({});
  const [libraries, setLibraries] = useState([]);
  const [libraryIndex, setLibraryIndex] = useState(-1);
  const [libraryQuestions, setLibraryQuestions] = useState([]);
  const [queryCount, setQueryCount] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [searchTerms, setSearchTerms] = useState([]);
  const [includeAll, setIncludeAll] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState({});
  const currentLibrary = libraries[libraryIndex];
  const orderBy = currentLibrary?.orderBy;

  const questionsPerPage = 10;
  const pageCount =
    searchTerms.length > 0
      ? Math.ceil(queryCount / questionsPerPage)
      : Math.ceil(questionCount / questionsPerPage);

  //==============================================================================================//
  //================================== Firestore references ======================================//

  const librariesInfoRef = firebase
    .firestore()
    .collection("libraries")
    .where("type", "==", "question library");

  const libraryInfoRef = firebase
    .firestore()
    .collection("libraries")
    .doc(currentLibrary?.id || "placeholderID");

  const libraryRef = libraryInfoRef.collection("questions");

  function fetchLibraries() {
    librariesInfoRef.onSnapshot((querySnapshot) => {
      const fetchedItems = [];
      querySnapshot.forEach((doc) => {
        fetchedItems.push({
          id: doc.id,
          title: doc.data().title,
          description: doc.data().description,
          tags: doc.data().tags,
          orderBy: doc.data().orderBy,
          created: doc.data().created.toDate().toLocaleString(),
          license: doc.data().license,
        });
      });
      setLibraries((prevState) => fetchedItems);
    });
  }

  //==============================================================================================//
  //======================================= Page Navigation ======================================//

  const handlePageChange = (event, selectedPage) => {
    const numPagesToTraverse = selectedPage - currentPage;
    if (numPagesToTraverse === 0) return;

    setIsFetching(true);

    if (numPagesToTraverse === 1) {
      setCurrentPage(selectedPage);
      const unsubscribe = fetchNextPageWithListener(
        libraryRef,
        orderBy,
        questionsPerPage,
        lastDoc,
        searchTerms,
        includeAll,
        setDisplayedQuestions
      );
      artificialDelay(500).then(() => {
        setIsFetching(false);
      });
      return unsubscribe;
    } else if (numPagesToTraverse === -1) {
      setCurrentPage(selectedPage);
      const unsubscribe = fetchPreviousPageWithListener(
        libraryRef,
        orderBy,
        questionsPerPage,
        firstDoc,
        searchTerms,
        includeAll,
        setDisplayedQuestions
      );
      artificialDelay(500).then(() => {
        setIsFetching(false);
      });
      return unsubscribe;
    } else if (numPagesToTraverse > 1) {
      setCurrentPage(selectedPage);
      const unsubscribe = jumpForwardToPageWithListener(
        libraryRef,
        orderBy,
        questionsPerPage,
        numPagesToTraverse,
        lastDoc,
        searchTerms,
        includeAll,
        setDisplayedQuestions
      );
      artificialDelay(500).then(() => {
        setIsFetching(false);
      });
      return unsubscribe;
    } else if (numPagesToTraverse < -1) {
      setCurrentPage(selectedPage);
      const unsubscribe = jumpBackwardToPageWithListener(
        libraryRef,
        orderBy,
        questionsPerPage,
        numPagesToTraverse,
        firstDoc,
        searchTerms,
        includeAll,
        setDisplayedQuestions
      );
      artificialDelay(500).then(() => {
        setIsFetching(false);
      });
      return unsubscribe;
    }
  };

  //==============================================================================================//
  //=======================---=========== other functions ========================================//

  function setDisplayedQuestions(fetchedItems) {
    setLibraryQuestions(() => fetchedItems);
    setFirstDoc((prev) => fetchedItems[0]);
    setLastDoc((prev) => fetchedItems[fetchedItems.length - 1]);
  }

  const handleLibraryChange = (event) => {
    setLibraryIndex((prevIndex) => event.target.value);
    setCurrentPage(() => 1);
  };

  //==============================================================================================//
  //====================================== side effects =========================================//

  useEffect(() => {
    const unsubscribe = fetchLibraries();
    return unsubscribe;
    //eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (libraryQuestions.length === 0) return;
    const updatedQuestion = libraryQuestions?.find(
      (el) => el.id === selectedQuestion?.id
    );
    setSelectedQuestion(updatedQuestion);
    //eslint-disable-next-line
  }, [libraryQuestions]);

  useEffect(() => {
    countQuestionsInLibrary(libraryInfoRef, libraryRef, setQuestionCount);
    const unsubscribe = fetchPageWithListener(
      libraryRef,
      orderBy,
      questionsPerPage,
      searchTerms,
      includeAll,
      setDisplayedQuestions
    );
    return unsubscribe;
    // eslint-disable-next-line
  }, [currentLibrary]);

  useEffect(() => {
    setCurrentPage(() => 1);
    countQuestionsReturnedFromQuery(
      libraryRef,
      searchTerms,
      includeAll,
      setQueryCount
    );
    setIsFetching(true);

    const unsubscribe = fetchPageWithListener(
      libraryRef,
      orderBy,
      questionsPerPage,
      searchTerms,
      includeAll,
      setDisplayedQuestions
    );
    artificialDelay(500).then(() => {
      setIsFetching(false);
    });
    return unsubscribe;
    // eslint-disable-next-line
  }, [searchTerms, includeAll]);

  return (
    <Box className="question-list-and-preview-area">
      <Box className="question-list-panel">
        <Box className="select-or-add-library">
          <Select
            value={libraryIndex}
            onChange={handleLibraryChange}
            displayEmpty
            variant="outlined"
          >
            <MenuItem value={-1} disabled>
              <Typography color="textSecondary">select a library</Typography>
            </MenuItem>
            {libraries.map((library, libIndex) => (
              <MenuItem key={libIndex} value={libIndex}>
                {library.title}
              </MenuItem>
            ))}
          </Select>
          <AddLibrary />
        </Box>
        <LibrarySearchModule
          currentLibrary={currentLibrary}
          includeAll={includeAll}
          searchTerms={searchTerms}
          setIncludeAll={setIncludeAll}
          setSearchTerms={setSearchTerms}
        />
        <QuestionSnippets
          currentPage={currentPage}
          deleteFrom={"libraries"}
          fetchPreviousPage={fetchPreviousPageWithListener}
          isFetching={isFetching}
          libraryID={currentLibrary?.id}
          queryCount={queryCount}
          questions={libraryQuestions}
          searchTerms={searchTerms}
          setCurrentPage={setCurrentPage}
          setQueryCount={setQueryCount}
          setSelectedQuestion={setSelectedQuestion}
        />
        <QuestionRangeCounter
          currentPage={currentPage}
          searchTerms={searchTerms}
          queryCount={queryCount}
          questionCount={questionCount}
          questionsPerPage={questionsPerPage}
        />
        {pageCount > 0 && (
          <Box className="flex-center-all pagination-nav">
            <Pagination
              count={pageCount}
              size="small"
              page={currentPage}
              disabled={isFetching}
              onChange={handlePageChange}
            />
          </Box>
        )}
        {currentLibrary && (
          <Box className="add-library-question-buttons flex-column space-between">
            <QuestionBuilder
              saveTo={"libraries"}
              libraryID={currentLibrary.id}
              setCurrentPage={setCurrentPage}
              setSearchTerms={setSearchTerms}
            />
            <MultipartBuilder
              libraryQuestionID={selectedQuestion?.id}
              libraryID={currentLibrary?.id}
              saveTo={"libraries"}
            />
          </Box>
        )}
      </Box>
      <QuestionPreviewCard
        license={currentLibrary?.license}
        libraryID={currentLibrary?.id}
        question={selectedQuestion}
        saveTo={"libraries"}
      />
    </Box>
  );
}

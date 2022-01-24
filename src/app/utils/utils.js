import firebase from "../config/firebaseConfig.js";
import { Box, IconButton, Typography, SvgIcon } from "@material-ui/core";
import { ZoomIn, ZoomOut } from "@material-ui/icons";
import { parseHTMLandTeX } from "./customParsers.js";

export function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export const handleImageUploadBefore = async (
  files,
  info,
  uploadHandler,
  userID,
  libraryID
) => {
  let imgName = files[0].name;
  let imgSize = files[0].size;
  let storagePath = "";

  storagePath = libraryID
    ? `libraries/${libraryID}/questions/${files[0].name}`
    : `users/${userID}/questions/${files[0].name}`;

  const storageRef = firebase.storage().ref().child(storagePath);
  await storageRef.put(files[0]);
  let imgSource = await storageRef.getDownloadURL();

  const response = {
    result: [
      {
        url: imgSource,
        name: imgName,
        size: imgSize,
      },
    ],
  };

  uploadHandler(response);
};

// Used in Search and Pagination
export function addSearchChip(searchTerm, mySearchChips, setMySearchChips) {
  if (searchTerm) {
    mySearchChips.push(searchTerm);
    setMySearchChips(mySearchChips);
  }
}

export function removeSearchChip(chipValue, mySearchChips, setMySearchChips) {
  let mySearchChipsLatest = mySearchChips.filter((item) => item !== chipValue);

  setMySearchChips(mySearchChipsLatest);
  return mySearchChipsLatest;
}

export function handleAndOperatorChange(
  event,
  setchkAnd,
  mySearchChips,
  fetchQuestionsFromSearch
) {
  setchkAnd(event.target.checked);
  fetchQuestionsFromSearch(mySearchChips, event.target.checked);
}

export function extractInner(editorContent) {
  return editorContent.slice(3, editorContent.length - 4);
}

export function numberifyArray(myArray) {
  const numberifiedArray = [];
  myArray.forEach((element, index) => numberifiedArray.push(Number(element)));
  return numberifiedArray;
}

export function makeSearchFriendly(rawValues) {
  if (Array.isArray(rawValues)) {
    const normalizedArray = rawValues.map((element) =>
      element.toLowerCase().replace(/\s+/g, " ")
    );
    return normalizedArray.flat();
  } else if (typeof rawValues === "string") {
    const normalizedArray = rawValues
      .toLowerCase()
      .replace(/\s+/g, " ")
      .split(" ");
    return normalizedArray;
  }
}

export function makeTagsSearchable(rawTags) {
  if (!Array.isArray(rawTags)) return [];

  // lower cases and replaces continguous spaces with a single space
  const wholeTags = rawTags.map((el) =>
    el.toLowerCase().replace(/\s+/g, " ").trim()
  );

  const phrases = wholeTags.filter((el) => checkIfPhrase(el));
  if (!phrases || phrases.length === 0) return wholeTags;

  const atomizedPhrases = [];
  phrases.forEach((phrase) => {
    const atomizedPhrase = phrase.split(" ");
    atomizedPhrases.push(...atomizedPhrase);
  });

  const filteredAtomizedPhrases = atomizedPhrases.filter((el) =>
    checkIfArticle(el)
  );

  const wholeAndAtomizedTags = [...wholeTags, ...filteredAtomizedPhrases];
  return wholeAndAtomizedTags;
}

function checkIfPhrase(str) {
  return /\s/.test(str);
}

export function makeSunEditorReadable(str) {
  if (!str) return "<p></p>";
  // wraps string in <p> </p>
  const latexCompatStr = str
    .replaceAll("<InlineTeX>", "&lt;InlineTeX&gt;")
    .replaceAll("</InlineTeX>", "&lt;/InlineTeX&gt;")
    .replaceAll("<BlockTeX>", "&lt;BlockTeX&gt;")
    .replaceAll("</BlockTeX>", "&lt;/BlockTeX&gt;");
  const readableStr = `<p>${latexCompatStr}</p>`;
  return readableStr;
}

export function updatePrompt(content, setFieldValue, isMultipart, partIndex) {
  return isMultipart
    ? setFieldValue(`parts.${partIndex}.prompt`, extractInner(content))
    : setFieldValue("prompt", extractInner(content));
}

export function updateAnswerChoice(
  content,
  setFieldValue,
  isMultipart,
  partIndex,
  answerIndex
) {
  return isMultipart
    ? setFieldValue(
        `parts.${partIndex}.answerChoices.${answerIndex}.answerChoice`,
        extractInner(content)
      )
    : setFieldValue(
        `answerChoices.${answerIndex}.answerChoice`,
        extractInner(content)
      );
}

function checkIfArticle(str) {
  switch (str) {
    case "of":
    case "the":
    case "and":
      return false;
    default:
      return true;
  }
}

function getQuestionSnippet(info) {
  const QUESTION_SNIPPET_LIMIT = 150;

  if (!info) return "(no prompt entered)";

  if (info.includes("<InlineTeX>")) return info;
  if (info.includes("<BlockTeX>")) return info;

  if (info.includes("<img")) return info;

  if (info.length < QUESTION_SNIPPET_LIMIT) return info;

  if (info.charAt(QUESTION_SNIPPET_LIMIT) === " ")
    return info.substring(0, QUESTION_SNIPPET_LIMIT) + "...";

  let indexLastCharWhitespace = info
    .substring(0, QUESTION_SNIPPET_LIMIT)
    .lastIndexOf(" ");
  info = info.substring(0, indexLastCharWhitespace) + "...";

  return info;
}

export function renderQuestionSnippet(question) {
  switch (question.type) {
    case "multiple choice":
    case "short answer":
    case "free response":
    case "file upload":
      return parseHTMLandTeX(getQuestionSnippet(question.prompt));
    case "title card":
      return parseHTMLandTeX(getQuestionSnippet(question.title));
    case "multipart":
      return parseHTMLandTeX(
        getQuestionSnippet(
          question.parts[0].prompt ||
            question.parts[0].title ||
            question.parts[0].info
        )
      );
    default:
      return "";
  }
}

export function generateRandomCode(length) {
  let randomCode = "";
  // removed 'I' and 'l' from characters on Jan 16, 2022  since these look identical with the website font
  // and may cause confusion for students trying to enter course code
  const characters =
    "ABCDEFGHJKLMNOPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    randomCode += characters.charAt(
      Math.floor(Math.random() * charactersLength)
    );
  }
  return randomCode;
}

export async function artificialDelay(milliseconds) {
  await new Promise((r) => setTimeout(r, milliseconds));
}

export function extractDate(dateObject) {
  const date = dateObject?.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const time = dateObject?.toLocaleTimeString();
  return date ? `${date} at  ${time}` : null;
}

export const alphabet = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

export function makeReadable(acceptedFileTypes) {
  const readableArray = [];
  acceptedFileTypes?.forEach((element, index) => {
    switch (element) {
      case "application/pdf":
        readableArray.push("PDF");
        break;
      case "image/jpeg":
        readableArray.push("JPEG");
        break;
      case "image/png":
        readableArray.push("PNG");
        break;
      default:
        break;
    }
  });
  return readableArray.join(", ");
}

export function ZoomControl({ zoom, setZoom }) {
  return (
    <Box
      style={{
        paddingLeft: "10px",
        minWidth: "140px",
        borderRadius: "5px",
        backgroundColor: "rgba(0,0,0,0.1)",
        position: "fixed",
        bottom: "8px",
        zIndex: 2,
      }}
    >
      <IconButton
        style={{ padding: "8px", marginRight: "2px" }}
        variant="contained"
        onClick={() => setZoom(() => zoom - 0.1)}
      >
        <ZoomOut />
      </IconButton>
      |
      <IconButton
        style={{ padding: "8px", marginLeft: "2px", marginRight: "5px" }}
        variant="contained"
        onClick={() => setZoom(() => zoom + 0.1)}
      >
        <ZoomIn />
      </IconButton>
      <Typography
        display="inline"
        variant="subtitle2"
        align="center"
        color="textSecondary"
      >
        {(zoom * 100).toFixed(0)} %
      </Typography>
    </Box>
  );
}

export const Eraser = ({ strokeColor }) => (
  <SvgIcon>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 88.02 85.43">
      <path
        stroke={strokeColor}
        strokeWidth="6px"
        fill="none"
        d="M144.35,414.41h-17L122,410.09l-13.22-13.21a18.64,18.64,0,0,1,.54-12.4q10.11-10.39,20.23-20.77L160,333.63l32.4,32Z"
        transform="translate(-106.44 -331.52)"
      />
      <line
        stroke={strokeColor}
        strokeWidth="6px"
        x1="19.03"
        y1="38.66"
        x2="47.21"
        y2="66.84"
      />
      <line
        stroke={strokeColor}
        strokeWidth="6px"
        x1="20.65"
        y1="83.43"
        x2="78.35"
        y2="83.43"
      />
    </svg>
  </SvgIcon>
);

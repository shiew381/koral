import { makeTagsSearchable } from "../../../app/utils/utils";

const titleCardValues = {
  type: "title card",
  title: "",
  body: "",
};

export const infoCardValues = {
  type: "info card",
  info: "",
};

export const multipleChoiceValues = {
  type: "multiple choice",
  prompt: "",
  answerChoices: [
    {
      answerChoice: "",
      isCorrect: false,
    },
    {
      answerChoice: "",
      isCorrect: false,
    },
    {
      answerChoice: "",
      isCorrect: false,
    },
    {
      answerChoice: "",
      isCorrect: false,
    },
  ],
  possiblePoints: 1,
  scoringMethod: "allOrNothing",
  attemptsAllowed: 1,
};

export const shortAnswerValues = {
  type: "short answer",
  subtype: "placeholder",
  prompt: "",
  correctWordOrPhrase: "",
  correctNumber: "",
  correctUnit: "",
  match: "exact",
  percentTolerance: "",
  possiblePoints: 1,
  attemptsAllowed: 1,
  acceptAlternateSpacing: true,
  acceptAlternateCapitalization: true,
};

export const freeResponseValues = {
  type: "free response",
  prompt: "",
  characterLimit: "1000",
  possiblePoints: 1,
};

export const fileUploadValues = {
  type: "file upload",
  prompt: "",
  possiblePoints: 1,
  accept: [],
};

const secondaryValues = {
  tags: [],
  currentTag: "",
  solution: "",
  auxillaryFiles: [],
};

export function pickInitialValues(selectedTab, question, edit) {
  switch (edit && selectedTab === question.type) {
    case true:
      question.currentTag = "";
      return question;
    default:
      break;
  }

  switch (selectedTab) {
    case "title card":
      return titleCardValues;
    case "multiple choice":
      return { ...multipleChoiceValues, ...secondaryValues };
    case "short answer":
      return { ...shortAnswerValues, ...secondaryValues };
    case "free response":
      return { ...freeResponseValues, ...secondaryValues };
    case "file upload":
      return { ...fileUploadValues, ...secondaryValues };
    default:
      break;
  }
}

export function tidy(values, addOrEdit) {
  const type = values.type;
  switch (type) {
    case "multiple choice":
      return tidyMultipleChoice(values);
    case "short answer":
      return tidyShortAnswer(values);
    case "free response":
      return tidyFreeResponse(values);
    case "title card":
      return tidyTitleCard(values);
    case "file upload":
      return tidyFileUpload(values);
    case "multipart":
      return tidyMultipart(values);
    default:
      break;
  }
}

function replacePromptCharEnt(str) {
  if (!str) return "";
  // sunEditor replaces characters like "<" with entities like "&lt;"
  // this function replaces the entity name with its original character
  // so tags like <InlineTeX> can be submitted to firestore
  const modifiedPrompt = str.replaceAll("&lt;", "<").replaceAll("&gt;", ">");
  return modifiedPrompt;
}

function replaceAnsCharEnt(answerChoices) {
  if (!Array.isArray(answerChoices)) return [];

  const modifiedChoices = [];

  answerChoices.forEach((el) => {
    const modifiedChoice = el.answerChoice
      .replaceAll("&lt;", "<")
      .replaceAll("&gt;", ">");

    modifiedChoices.push({
      answerChoice: modifiedChoice,
      isCorrect: el.isCorrect,
    });
  });

  return modifiedChoices;
}

function tidyTitleCard(values) {
  return {
    type: values.type,
    title: values.title,
    body: values.body,
  };
}

function tidyMultipleChoice(values) {
  return {
    type: values.type,
    prompt: replacePromptCharEnt(values.prompt),
    answerChoices: replaceAnsCharEnt(values.answerChoices),
    possiblePoints: values.possiblePoints || 0,
    attemptsAllowed: values.attemptsAllowed || 1,
    scoringMethod: values.scoringMethod,
    tags: values.tags,
    tags_searchable: makeTagsSearchable(values.tags),
    solution: values.solution || "",
    auxillaryFiles: values.auxillaryFiles || [],
  };
}

function tidyFreeResponse(values) {
  return {
    type: values.type,
    prompt: replacePromptCharEnt(values.prompt),
    typicalAnswer: values.typicalAnswer || "",
    characterLimit: values.characterLimit || 1000,
    possiblePoints: values.possiblePoints || 0,
    tags: values.tags,
    tags_searchable: makeTagsSearchable(values.tags),
    solution: values.solution || "",
    auxillaryFiles: values.auxillaryFiles || [],
  };
}

function tidyShortAnswer(values) {
  switch (values.subtype) {
    case "wordOrPhrase":
      return {
        type: values.type,
        subtype: values.subtype,
        prompt: replacePromptCharEnt(values.prompt),
        correctWordOrPhrase: values.correctWordOrPhrase,
        acceptAlternateSpacing: values.acceptAlternateSpacing,
        acceptAlternateCapitalization: values.acceptAlternateCapitalization,
        possiblePoints: values.possiblePoints || 0,
        attemptsAllowed: values.attemptsAllowed || 1,
        tags: values.tags,
        tags_searchable: makeTagsSearchable(values.tags),
        solution: values.solution || "",
        auxillaryFiles: values.auxillaryFiles || [],
      };
    case "number":
    case "symbolic":
    case "vector":
    case "vector symbolic":
      return {
        type: values.type,
        subtype: values.subtype,
        prompt: replacePromptCharEnt(values.prompt),
        correctNumber: values.correctNumber,
        match: values.match,
        percentTolerance: values.percentTolerance || 0,
        possiblePoints: values.possiblePoints || 0,
        attemptsAllowed: values.attemptsAllowed || 1,
        tags: values.tags,
        tags_searchable: makeTagsSearchable(values.tags),
        solution: values.solution || "",
        auxillaryFiles: values.auxillaryFiles || [],
      };
    case "measurement":
    case "vector with unit":
      return {
        type: values.type,
        subtype: values.subtype,
        prompt: replacePromptCharEnt(values.prompt),
        correctNumber: values.correctNumber,
        correctUnit: values.correctUnit,
        match: values.match,
        percentTolerance: values.percentTolerance || 0,
        possiblePoints: values.possiblePoints || 0,
        attemptsAllowed: values.attemptsAllowed || 1,
        tags: values.tags,
        tags_searchable: makeTagsSearchable(values.tags),
        solution: values.solution || "",
        auxillaryFiles: values.auxillaryFiles || [],
      };
    default:
      return values;
  }
}

function tidyFileUpload(values) {
  return {
    type: values.type,
    prompt: replacePromptCharEnt(values.prompt),
    accept: values.accept || [],
    possiblePoints: values.possiblePoints || 0,
    tags: values.tags,
    tags_searchable: makeTagsSearchable(values.tags),
    solution: values.solution || "",
    auxillaryFiles: values.auxillaryFiles || [],
  };
}

function tidyMultipart(values) {
  return {
    type: values.type,
    parts: values.parts,
    tags: values.tags,
    tags_searchable: makeTagsSearchable(values.tags),
    solution: values.solution || "",
    auxillaryFiles: values.auxillaryFiles || [],
  };
}

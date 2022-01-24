import React, { useState } from "react";
import { Select, MenuItem, Box, Divider, Typography } from "@material-ui/core";
import { PromptField } from "../../../app/utils/CustomInputFields";
import {
  makeSunEditorReadable,
  updatePrompt,
} from "../../../app/utils/utils.js";
import {
  AttemptsAllowed,
  ExactMatchRadioButton,
  PercentToleranceField,
  PossiblePoints,
  SaveButton,
  Tags,
  WithinRangeRadioButton,
  WordOrPhraseInput,
  WordOrPhraseScoringOptions,
} from "./CommonQuestCpnts.jsx";
import { questionDividerA } from "../../../app/utils/stylingSnippets";
import { AcceptableRange } from "../question_preview/QuestionPreviewCpnts.jsx";
import {
  LaTeXDisplayBox,
  LaTeXPallette,
} from "../../../app/utils/LaTeXPallette";

export default function ShortAnswer({
  values,
  isSubmitting,
  setFieldValue,
  handleChange,
  isMultipart,
  partIndex,
  dirty,
}) {
  const defaultPrompt = makeSunEditorReadable(values.prompt);
  const [unitPalletteOpen, setUnitPalletteOpen] = useState(false);
  const [numberPalletteOpen, setNumberPalletteOpen] = useState(false);

  const subtype = values.subtype;
  const subtypeName = isMultipart ? `parts.${partIndex}.subtype` : "subtype";
  const numberFieldname = isMultipart
    ? `parts.${partIndex}.correctNumber`
    : "correctNumber";
  const unitFieldname = isMultipart
    ? `parts.${partIndex}.correctUnit`
    : "correctUnit";

  return (
    <>
      <Box className="flex-row question-form-secondary-container">
        <Box className="question-form-left-column">
          <Select
            fullWidth
            value={values.subtype || "placeholder"}
            name={subtypeName}
            onChange={handleChange}
            variant="outlined"
            className="margin-bottom-light"
          >
            <MenuItem value="placeholder" disabled>
              select an option
            </MenuItem>
            <MenuItem value="wordOrPhrase">word or phrase</MenuItem>
            <MenuItem value="number">number</MenuItem>
            <MenuItem value="measurement">measurement</MenuItem>
            <MenuItem value="symbolic">symbolic expression</MenuItem>
            <MenuItem value="vector">vector</MenuItem>
            <MenuItem value="vector symbolic">vector (symbolic)</MenuItem>
            <MenuItem value="vector with unit">vector (with unit)</MenuItem>
          </Select>

          {subtype !== "placeholder" && (
            <>
              <PromptField
                height={150}
                onChange={(content) =>
                  updatePrompt(content, setFieldValue, isMultipart, partIndex)
                }
                defaultValue={defaultPrompt}
              />
              <Divider style={questionDividerA} />
              <Typography color="textSecondary" style={{ marginLeft: "50px" }}>
                response must match:
              </Typography>
            </>
          )}
          {subtype === "wordOrPhrase" && (
            <Box margin={2} className="flex-justify-center">
              <WordOrPhraseInput
                isMultipart={isMultipart}
                partIndex={partIndex}
              />
            </Box>
          )}
          <Box className="flex justify-center" margin={2}>
            {(subtype === "number" ||
              subtype === "measurement" ||
              subtype === "symbolic" ||
              subtype === "vector" ||
              subtype === "vector symbolic" ||
              subtype === "vector with unit") && (
              <>
                <LaTeXDisplayBox
                  value={values.correctNumber}
                  placeholder={choosePlaceholder(subtype)}
                />
                <LaTeXPallette
                  fieldname={numberFieldname}
                  value={values.correctNumber}
                  setFieldValue={setFieldValue}
                  palletteOpen={numberPalletteOpen}
                  setPalletteOpen={setNumberPalletteOpen}
                />
              </>
            )}
            {(subtype === "measurement" || subtype === "vector with unit") && (
              <>
                <Box width="25px" />
                <LaTeXDisplayBox
                  value={values.correctUnit}
                  placeholder="unit"
                />
                <LaTeXPallette
                  fieldname={unitFieldname}
                  value={values.correctUnit}
                  setFieldValue={setFieldValue}
                  palletteOpen={unitPalletteOpen}
                  setPalletteOpen={setUnitPalletteOpen}
                />
              </>
            )}
          </Box>

          {(subtype === "number" || subtype === "measurement") && (
            <>
              <Box className="flex-align-center" marginLeft={4}>
                <ExactMatchRadioButton
                  isMultipart={isMultipart}
                  partIndex={partIndex}
                />
                <Typography>exactly</Typography>
              </Box>
              <Box className="flex-align-center" marginLeft={4}>
                <WithinRangeRadioButton
                  isMultipart={isMultipart}
                  partIndex={partIndex}
                />
                <Typography variant="subtitle1" color="textPrimary">
                  within
                </Typography>
                <Box width={65} margin={1}>
                  <PercentToleranceField
                    isMultipart={isMultipart}
                    partIndex={partIndex}
                    values={values}
                  />
                </Box>
                <Typography variant="subtitle1" color="textPrimary">
                  of correct value
                </Typography>
              </Box>
              {values.match === "withinRange" &&
                values.correctNumber > 0 &&
                values.percentTolerance > 0 && (
                  <AcceptableRange
                    correctNumber={values.correctNumber}
                    correctUnit={values.correctUnit}
                    percentTolerance={values.percentTolerance}
                  />
                )}
            </>
          )}
        </Box>

        <Box className="question-form-right-column">
          <Box className="scoring-container">
            <PossiblePoints isMultipart={isMultipart} partIndex={partIndex} />
            {values.subtype === "wordOrPhrase" &&
            values.correctWordOrPhrase !== "" ? (
              <WordOrPhraseScoringOptions
                values={values}
                isMultipart={isMultipart}
                partIndex={partIndex}
              />
            ) : null}
          </Box>
          <Box className="scoring-container">
            <AttemptsAllowed isMultipart={isMultipart} partIndex={partIndex} />
          </Box>
          {!isMultipart && (
            <Tags values={values} setFieldValue={setFieldValue} />
          )}
        </Box>
      </Box>
      {!isMultipart && (
        <Box className="flex-justify-center padding-top-medium">
          <SaveButton isSubmitting={isSubmitting} dirty={dirty} />
        </Box>
      )}
    </>
  );
}

function choosePlaceholder(subtype) {
  switch (subtype) {
    case "number":
    case "measurement":
      return "number";
    case "vector":
    case "vector symbolic":
    case "vector with unit":
      return "vector";
    case "symbolic":
      return "expression";
    default:
      break;
  }
}

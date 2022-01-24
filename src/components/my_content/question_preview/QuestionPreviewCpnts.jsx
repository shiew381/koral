import { Box, Typography, Divider, Radio, TextField } from "@material-ui/core";
import { parseHTMLandTeX } from "../../../app/utils/customParsers.js";
import { multipleChoiceRadioStyling } from "../../../app/utils/stylingSnippets.js";
import { questionDividerA } from "../../../app/utils/stylingSnippets.js";
import { makeReadable } from "../../../app/utils/utils.js";
import TeX from "@matejmazur/react-katex";

export function PreviewHeader({ questionType, questionID, saveTo }) {
  return (
    <Box className="flex-row question-preview-header">
      {saveTo !== "libraries" && (
        <Typography variant="subtitle2" color="textSecondary">
          QUESTION PREVIEW
        </Typography>
      )}

      {saveTo === "libraries" && (
        <Box width="340px" className="flex space-between">
          <Typography variant="subtitle2" color="textSecondary">
            QUESTION PREVIEW
          </Typography>
          <Typography variant="subtitle2" color="textSecondary">
            <em>{questionID}</em>
          </Typography>
        </Box>
      )}

      <Typography variant="subtitle2" color="textSecondary">
        {questionType}
      </Typography>
    </Box>
  );
}

export function MultipleChoicePreview({ question }) {
  return (
    <>
      {question.prompt === "" && (
        <Typography color="textSecondary">(no prompt entered)</Typography>
      )}
      {question.prompt !== "" && (
        <Typography variant="subtitle1">
          {parseHTMLandTeX(question.prompt)}
        </Typography>
      )}

      <Divider style={questionDividerA} />

      {question.answerChoices.map((question, index) => (
        <Box key={index} display="flex" className="padding-vertical-tiny">
          <Radio
            disabled={true}
            checked={question.isCorrect}
            style={multipleChoiceRadioStyling}
          />
          <Typography
            variant="subtitle1"
            style={{ width: "510px", marginRight: "10px" }}
          >
            {parseHTMLandTeX(question.answerChoice)}
          </Typography>
          <Box width="60px">
            {question.isCorrect && (
              <Typography variant="subtitle1" color="textSecondary">
                (correct)
              </Typography>
            )}
          </Box>
        </Box>
      ))}
    </>
  );
}

export function ShortAnswerPreview({ question }) {
  const subtype = question.subtype;

  return (
    <>
      {question.prompt === "" && (
        <Typography color="textSecondary">{"(no prompt entered)"}</Typography>
      )}
      {question.prompt !== "" && (
        <Typography variant="subtitle1">
          {parseHTMLandTeX(question.prompt)}
        </Typography>
      )}

      <Divider style={questionDividerA} />

      {subtype === "wordOrPhrase" && (
        <Box padding={3} width={280}>
          <TextField
            fullWidth
            value={question.correctWordOrPhrase}
            disabled={true}
            variant="outlined"
          />
        </Box>
      )}

      {(subtype === "number" ||
        subtype === "symbolic" ||
        subtype === "vector" ||
        subtype === "vector symbolic") && (
        <>
          <Box className="flex-justify-center padding-medium">
            <Box
              className="padding-horizontal-medium padding-vertical-light margin-x-light"
              style={{
                backgroundColor: "gainsboro",
              }}
            >
              <TeX>{question.correctNumber}</TeX>
            </Box>
          </Box>
          {(question.match === "withinRange" ||
            question.percentTolerance > 0) && (
            <Typography
              variant="subtitle1"
              align="center"
              color="textSecondary"
            >
              percent tolerance: ± {question.percentTolerance} %
            </Typography>
            //  <AcceptableRange
            //  correctNumber={question.correctNumber}
            //  correctUnit={question.correctUnit}
            //  percentTolerance={question.percentTolerance}
            //  />
          )}
        </>
      )}

      {(subtype === "measurement" || subtype === "vector with unit") && (
        <>
          <Box className="flex-justify-center padding-medium">
            <Box
              className="padding-horizontal-medium padding-vertical-light margin-x-light"
              style={{
                backgroundColor: "gainsboro",
              }}
            >
              <TeX>{question.correctNumber}</TeX>
            </Box>
            <Box
              className="padding-horizontal-medium padding-vertical-light margin-x-light"
              style={{
                backgroundColor: "gainsboro",
              }}
            >
              <TeX>{question.correctUnit}</TeX>
            </Box>
          </Box>

          {(question.match === "withinRange" ||
            question.percentTolerance > 0) && (
            <Typography
              variant="subtitle1"
              align="center"
              color="textSecondary"
            >
              percent tolerance: ± {question.percentTolerance} %
            </Typography>
            //  <AcceptableRange
            //  correctNumber={question.correctNumber}
            //  correctUnit={question.correctUnit}
            //  percentTolerance={question.percentTolerance}
            //  />
          )}
        </>
      )}
    </>
  );
}

export function AcceptableRange({
  correctNumber,
  correctUnit,
  percentTolerance,
}) {
  const lowerBound = Number(correctNumber) * ((100 - percentTolerance) / 100);
  const upperBound = Number(correctNumber) * ((100 + percentTolerance) / 100);
  return (
    <Box display="flex" flexWrap="wrap" style={{ marginLeft: "45px" }}>
      <Typography style={{ marginRight: "0.3rem" }} color="textSecondary">
        accept answers between:
      </Typography>
      <Box className="flex">
        <Typography color="textSecondary">
          {lowerBound.toPrecision(3)}
        </Typography>
        <UnitLaTeXForm correctUnit={correctUnit} />
        <Typography
          style={{ marginLeft: "0.5rem", marginRight: "0.5rem" }}
          color="textSecondary"
        >
          —
        </Typography>
        <Typography color="textSecondary">
          {upperBound.toPrecision(3)}
        </Typography>
        <UnitLaTeXForm correctUnit={correctUnit} />
      </Box>
    </Box>
  );
}

function UnitLaTeXForm({ correctUnit }) {
  return (
    <TeX
      style={{
        color: "rgba(0, 0, 0, 0.54)",
        fontSize: "1rem",
        position: "relative",
        marginLeft: "5px",
      }}
    >
      {correctUnit}
    </TeX>
  );
}

export function FreeResponsePreview({ question }) {
  return (
    <>
      {question.prompt === "" && (
        <Typography color="textSecondary">{"(no prompt entered)"}</Typography>
      )}
      {question.prompt !== "" && (
        <Typography variant="subtitle1">
          {parseHTMLandTeX(question.prompt)}
        </Typography>
      )}

      <Divider style={questionDividerA} />

      <Box padding={3}>
        <Box
          padding="14px"
          style={{
            borderStyle: "solid",
            borderWidth: "1px",
            borderColor: "rgba(0,0,0,0.25)",
            borderRadius: "4px",
          }}
        >
          <Typography style={{ color: "rgba(0,0,0,0.38)" }}>
            {question.typicalAnswer
              ? parseHTMLandTeX(question.typicalAnswer)
              : "student response here"}
          </Typography>
        </Box>

        <Typography
          color="textSecondary"
          style={{ marginTop: "10px" }}
          align="right"
        >
          {"character limit: " + question.characterLimit}
        </Typography>
      </Box>
    </>
  );
}

export function TitleCardPreview({ question }) {
  return (
    <>
      <Box className="flex-center-all title-card-title-preview">
        {question.title === "" && (
          <Typography variant="h6" color="textSecondary">
            {"(no title entered)"}
          </Typography>
        )}
        {question.title !== "" && (
          <Typography variant="h6">
            {parseHTMLandTeX(question.title)}
          </Typography>
        )}
      </Box>
      <Box className="flex-center-all title-card-body-preview">
        {question.body === "" && (
          <Typography variant="subtitle1" color="textSecondary">
            (body)
          </Typography>
        )}
        {question.body !== "" && (
          <Typography variant="subtitle1">
            {parseHTMLandTeX(question.body)}
          </Typography>
        )}
      </Box>
    </>
  );
}

export function FileUploadPreview({ question }) {
  const acceptedFileTypes = question?.accept;
  return (
    <>
      {question.prompt === "" && (
        <Typography color="textSecondary">(no prompt entered)</Typography>
      )}
      {question.prompt !== "" && (
        <Typography variant="subtitle1">
          {parseHTMLandTeX(question.prompt)}
        </Typography>
      )}

      <Divider style={questionDividerA} />

      <Typography color="textSecondary">
        accepted file types: {makeReadable(acceptedFileTypes)}
      </Typography>
    </>
  );
}

export function InfoCardPreview({ question }) {
  return (
    <Box className="title-card-body-preview">
      {question.info === "" && (
        <Typography variant="subtitle1" color="textSecondary">
          (no info entered)
        </Typography>
      )}
      {question.info !== "" && (
        <Typography variant="subtitle1">
          {parseHTMLandTeX(question.info)}
        </Typography>
      )}
    </Box>
  );
}

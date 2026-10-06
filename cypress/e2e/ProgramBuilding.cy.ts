// E2E tests against the real running demo app (cy.visit, not cy.mount) -
// proves the visual and text editors round-trip correct JSON end-to-end,
// driving the UI through both editing surfaces. Shared with iotix-react's
// equivalent spec via iotix-shared-tests/scenarios/sharedE2EScenarios.js -
// only the confirm-button label ("Ok" here, "Add" on iotix-react) differs.
import { common } from "../../iotix-shared-tests/scenarios/selectors";
import * as e2e from "../../iotix-shared-tests/scenarios/sharedE2EScenarios";

const CONFIRM_BUTTON_LABEL = "Ok";
const STATEMENT_LABEL = "PowerStrip.toggle";

describe("Building a program via the UI (E2E, shared cross-repo scenario)", () => {
  beforeEach(() => {
    cy.visit("/");
    e2e.revealsTextEditorPane(common);
  });

  it("adding a statement via the visual editor produces the expected JSON in the text editor", () => {
    e2e.addsStatementViaVisualEditorProducesExpectedJson(common, {
      statementLabel: STATEMENT_LABEL,
      confirmButtonLabel: CONFIRM_BUTTON_LABEL,
      expectedName: "PowerStrip.1",
    });
  });

  it("typing a program into the text editor updates the visual editor", () => {
    e2e.typesProgramIntoTextEditorUpdatesVisualEditor(common, {
      typedBlock: [{ name: "PowerStrip.1", params: ["true"] }],
      expectedTitle: STATEMENT_LABEL,
    });
  });

  it("removing a statement via the visual editor updates the text editor's JSON", () => {
    e2e.removesLastAddedStatementViaVisualEditorUpdatesJson(common, {
      statementLabel: STATEMENT_LABEL,
      confirmButtonLabel: CONFIRM_BUTTON_LABEL,
    });
  });

  it("undoing via the menu reverts the last visual edit", () => {
    e2e.undoesLastVisualEditRevertingJsonLength(common, {
      statementLabel: STATEMENT_LABEL,
      confirmButtonLabel: CONFIRM_BUTTON_LABEL,
    });
  });
});

import { Component } from "@angular/core";
import { IotixVpModule, IotixVpProgramComponent, IotixVpExpressionComponent, IotixVpTextEditorComponent } from "iotixng";
import { createOutputSpy } from "@cypress/angular";

import language from "../../iotix-shared-tests/fixtures/language.json";
import languageMissingRoot from "../../iotix-shared-tests/fixtures/language-missing-root.json";
import siblings from "../../iotix-shared-tests/fixtures/programs/siblings.json";
import duplicateParams from "../../iotix-shared-tests/fixtures/programs/duplicateParams.json";
import structureParams from "../../iotix-shared-tests/fixtures/programs/structureParams.json";
import empty from "../../iotix-shared-tests/fixtures/programs/empty.json";
import write from "../../iotix-shared-tests/fixtures/programs/write.json";

// Shared, framework-agnostic assertions — see iotix-shared-tests/README.md
import * as selectorsModule from "../../iotix-shared-tests/scenarios/selectors";
import * as scenarios from "../../iotix-shared-tests/scenarios/sharedScenarios";

const common = selectorsModule.common;
const perRepo = selectorsModule.perRepo;
// This repo's full selector set: shared base + Angular-specific cosmetic classes.
const sel = Object.assign({}, common, perRepo.angular);

function mountEditor(program: any, lang: any = language) {
  cy.mount(IotixVpProgramComponent, {
    imports: [IotixVpModule],
    componentProperties: {
      program: program,
      language: lang,
    },
  });
}

describe("IotixVpProgramComponent (shared cross-repo scenarios)", () => {
  it("renders sibling statements in order", () => {
    mountEditor(siblings);
    scenarios.rendersStatementTitles(sel, ["Set Value", "Set Value"]);
  });

  it("reorders siblings via the move-down button", () => {
    mountEditor(siblings);
    scenarios.reordersSiblingsViaMoveButtons(sel);
  });

  it("removes a statement via the remove button", () => {
    mountEditor(siblings);
    scenarios.removesFirstStatement(sel);
  });

  it("toggles the accordion body open/closed on header click", () => {
    mountEditor(siblings);
    scenarios.togglesAccordionBody(sel);
  });

  it("renders duplicate-valued params as separate rows", () => {
    mountEditor(duplicateParams);
    scenarios.rendersDuplicateValuedParamsAsSeparateRows(sel);
  });

  it("renders bound values for structure-type command params", () => {
    mountEditor(structureParams);
    scenarios.rendersBoundStructureParamValues(sel);
  });

  it("renders the root add-statement button without crashing", () => {
    mountEditor(empty);
    scenarios.rootAddButtonRendersWithoutCrashing(sel);
  });

  // Regression test for the "_" root-statement crash bug (see main report:
  // iotix-vp-block.component.html's root "+" button read
  // language.statements[parent.name] with no `?.` guard, unlike every other
  // lookup in the same template).
  it("does not crash when the language has no '_' root entry", () => {
    mountEditor(empty, languageMissingRoot);
    scenarios.rootAddButtonRendersWithoutCrashing(sel);
  });
});

// Regression test for "IotixVpProgramComponent has zero @Output()s" (see
// main report: the host app had no way to be notified of program changes at
// all - AppComponent.onProgramChange() never fired from actual editing, only
// when loading a program via the More panel).
const fullSettings = (manualSync) => ({
  menu: {
    enabled: true,
    enableToggleVisual: true,
    enableSaveVisual: true,
    enableUndo: true,
    enableRedo: true,
    enableSync: true,
    enableSaveText: true,
    enableToggleText: true,
    enableLang: true,
  },
  visualEditor: { enabled: true },
  textEditor: { enabled: true, style: {} },
  common: { manualSync },
});

// Regression test for "Save Text->Visual can wipe the entire program" (see
// main report: actBlock had no initializer and was only ever assigned inside
// the 1000ms-debounced input handler - clicking "Save Text" without typing
// first, or within the debounce window, set program.block to undefined).
describe("IotixVpTextEditorComponent actBlock initialization", () => {
  it("does not wipe the program when Save Text is clicked without typing first", () => {
    const isolatedProgram = {
      block: [
        { name: "setValue", params: ["first"] },
        { name: "setValue", params: ["second"] },
      ],
    };

    cy.mount(IotixVpProgramComponent, {
      imports: [IotixVpModule],
      componentProperties: {
        program: isolatedProgram,
        language: language,
        settings: fullSettings(true),
        onProgramChange: createOutputSpy("onProgramChange"),
      },
    });

    cy.get(".text-editor").should("exist");

    // "Save Text" -> updateVisualEditor(), the menu-right save button.
    cy.get(".menu-right button").first().click({ force: true });

    cy.get("@onProgramChange").should("have.been.calledOnce");
    cy.get("@onProgramChange").should((stub) => {
      const emitted = stub.getCall(0).args[0];
      expect(emitted.block).to.deep.equal(isolatedProgram.block);
    });
  });
});

// Regression test for "undo()/redo() crash on an empty stack" (see main
// report: .pop() on an empty array returns undefined, and JSON.parse(undefined)
// throws - the only guard was the button's `disabled` attribute, which
// doesn't stop programmatic invocation, e.g. a host holding a @ViewChild
// reference or a future keyboard shortcut).
describe("IotixVpProgramComponent undo/redo empty-stack guard", () => {
  it("does not throw when undo() is called with an empty undo stack", () => {
    cy.mount(IotixVpProgramComponent, {
      imports: [IotixVpModule],
      componentProperties: {
        program: siblings,
        language: language,
      },
    }).then(({ component }) => {
      expect(component.undoList).to.have.length(0);
      expect(() => component.undo()).to.not.throw();
    });
  });

  it("does not throw when redo() is called with an empty redo stack", () => {
    cy.mount(IotixVpProgramComponent, {
      imports: [IotixVpModule],
      componentProperties: {
        program: siblings,
        language: language,
      },
    }).then(({ component }) => {
      expect(component.redoList).to.have.length(0);
      expect(() => component.redo()).to.not.throw();
    });
  });
});

describe("IotixVpProgramComponent onProgramChange output", () => {
  it("emits the updated program when a statement is removed", () => {
    // IotixVpBlockComponent mutates its @Input() block in place (see main
    // report), and earlier tests in this file mount the shared `siblings`
    // import directly - by this point it may already carry mutation damage
    // from those tests (e.g. spliced down from 2 elements to 1). Use an
    // independent fixture literal, not a clone of the shared import.
    const isolatedProgram = {
      block: [
        { name: "setValue", params: ["first"] },
        { name: "setValue", params: ["second"] },
      ],
    };

    cy.mount(IotixVpProgramComponent, {
      imports: [IotixVpModule],
      componentProperties: {
        program: isolatedProgram,
        language: language,
        onProgramChange: createOutputSpy("onProgramChange"),
      },
    });

    cy.get(`${sel.block} ${sel.accordion}`).should("have.length", 2);

    cy.get(`${sel.block} ${sel.accordion}`).first().find(sel.removeButton).click({ force: true });

    cy.get("@onProgramChange").should("have.been.calledOnce");
    cy.get("@onProgramChange").should((stub) => {
      const emitted = stub.getCall(0).args[0];
      expect(emitted.block).to.have.length(1);
    });
  });
});

// Regression test for "undo/redo/text-sync force full tree rebuild" (see
// main report: iotix-vp-block.component.html's *ngFor had no trackBy, so
// Angular's default identity-based tracking tore down and recreated every
// statement's whole component subtree whenever the block array was replaced
// wholesale - which undo()/redo() always do, via JSON.parse(JSON.stringify(...))
// round-trips that produce content-identical but reference-different arrays.
// A torn-down/recreated instance loses its own local state (e.g. the
// accordion's open/closed toggle), even though nothing about that statement
// actually changed.
describe("IotixVpBlockComponent trackBy across full-array replacements", () => {
  it("keeps a closed accordion closed after undo() replaces the block array", () => {
    const isolatedProgram = {
      block: [
        { name: "setValue", params: ["first"] },
        { name: "setValue", params: ["second"] },
      ],
    };

    cy.mount(IotixVpProgramComponent, {
      imports: [IotixVpModule],
      componentProperties: {
        program: isolatedProgram,
        language: language,
      },
    }).then(({ component, fixture }) => {
      cy.get(sel.accordionHeader).first().click();
      cy.get(sel.accordionBody).first().should("have.class", "closed");

      cy.then(() => {
        // Mirrors what undo() actually pops off the stack: a fresh
        // JSON.parse of the current program, same content, new object
        // identity throughout - no real edit happened.
        component.undoList = [JSON.stringify(component.program)];
        component.undo();
        // Mutating undoList/redoList directly (bypassing the zone-aware
        // click flow) is invisible to Angular's own change-detection
        // bookkeeping, so the disabled-button bindings legitimately differ
        // from what was last checked at mount time - skip the checkNoChanges
        // verification pass, we only care about the resulting state here.
        fixture.detectChanges(false);
      });

      cy.get(sel.accordionBody).first().should("have.class", "closed");
    });
  });
});

// Regression test for "IotixVpBlockComponent mutates its @Input() block
// in place" (see main report: up()/down()/delete()/add() all called
// splice()/push()/element-swap directly on the exact array instance passed
// in as `[block]`, corrupting whatever object the caller happened to hand
// over - e.g. a shared fixture reused across tests, or any other caller
// holding onto that same array reference).
describe("IotixVpBlockComponent does not mutate its @Input() block array", () => {
  it("leaves the original block array instance untouched when removing a statement", () => {
    const originalBlock = [
      { name: "setValue", params: ["first"] },
      { name: "setValue", params: ["second"] },
    ];
    const isolatedProgram = { block: originalBlock };

    cy.mount(IotixVpProgramComponent, {
      imports: [IotixVpModule],
      componentProperties: {
        program: isolatedProgram,
        language: language,
      },
    });

    cy.get(`${sel.block} ${sel.accordion}`).should("have.length", 2);
    cy.get(`${sel.block} ${sel.accordion}`).first().find(sel.removeButton).click({ force: true });
    cy.get(`${sel.block} ${sel.accordion}`).should("have.length", 1);

    cy.then(() => {
      expect(originalBlock, "the original array instance must not be spliced in place").to.have.length(2);
    });
  });
});

// Regression test for "checkExpression() is a no-op" (see main report:
// IotixVpExpressionComponent.checkExpression() had a `// TODO evaluate
// syntax of expression` stub that unconditionally cleared the error flag,
// so the already-wired disabled-button/error-styling never actually fired
// for any input, however malformed).
describe("IotixVpExpressionComponent syntax validation (shared cross-repo scenario)", () => {
  it("flags a malformed expression and disables the OK button", () => {
    cy.mount(IotixVpExpressionComponent, {
      imports: [IotixVpModule],
      componentProperties: {
        language: language,
        value: "",
      },
    });

    scenarios.flagsSyntaxErrorAndDisablesOk(sel, "5451.Relay1 ==");
  });

  it("does not flag a well-formed expression", () => {
    cy.mount(IotixVpExpressionComponent, {
      imports: [IotixVpModule],
      componentProperties: {
        language: language,
        value: "",
      },
    });

    scenarios.acceptsWellFormedExpression(sel, "5451.Relay1 == 1");
  });
});

// Regression test for "IotixVpModule missing exports for text-editor
// component/pipe" (see main report: IotixVpTextEditorComponent,
// IotixVpTestposPipe, and IotixVpTostringPipe were all declared in
// the module but not exported, so a host application importing
// IotixVpModule could use them internally through
// IotixVpProgramComponent but couldn't reference any of them directly
// in its own templates - Angular would reject the tag/pipe as unknown).
// Written as a plain decorator-factory call (not `@Component(...) class ...`)
// since this spec file isn't part of the Angular AOT compilation unit and
// the Cypress webpack bundler doesn't apply the TS decorator transform to
// it - Component() is a documented dual API (usable as a direct function
// call), so this is equivalent to the decorator form. `standalone: false` is
// required explicitly - Angular 19+ defaults an omitted `standalone` to
// `true`, which would make this harness resolve `iotix-vp-text-editor` only
// against its own (empty) `imports` array instead of the declaring NgModule,
// so the child component never matches (NG0304) and renders as an empty tag.
class TextEditorHostHarnessBase {
  program = { block: [{ name: "setValue", params: ["hello"] }] };
  settings = { common: { manualSync: true } };
}
const TextEditorHostHarness = Component({
  selector: "text-editor-host-harness",
  standalone: false,
  template: `<iotix-vp-text-editor [program]="program" [settings]="settings"></iotix-vp-text-editor>`,
})(TextEditorHostHarnessBase);

describe("IotixVpModule exports", () => {
  it("exports IotixVpTextEditorComponent for direct use in a host template", () => {
    cy.mount(TextEditorHostHarness, {
      imports: [IotixVpModule],
    });

    cy.get(".text-area").should("exist");
  });
});

// Regression test for "ngOnChanges switch fallthrough + missing parent/
// statements cases" (see main report: IoTiXGVPAbstracStatement.ngOnChanges()
// only recomputed `correctPos` when blockLength/position/language changed,
// never when `statements` or `parent` changed on their own). This was
// latent before item 27's trackBy fix (every edit tore down and rebuilt the
// whole tree, so ngOnInit's own checkPosition() call always ran fresh) -
// now that trackBy lets a statement's component instance survive an
// up()/down() swap, the SAME instance can end up displaying different
// statement content at the same position/blockLength/language, and only a
// `statements` change signals that.
describe("IoTiXGVPAbstracStatement position validity on swap", () => {
  it("re-validates position when trackBy reuses a component instance across an up/down swap", () => {
    const languageWithPositionRestriction = {
      ...language,
      statements: {
        ...language.statements,
        avoidFirstCmd: {
          name: "avoidFirstCmd",
          component: "cmd",
          label: "Avoid First",
          icon: "pi-ban",
          color: "#ffffff",
          backgroundColor: "#99A8D7",
          avoidPositions: ["first"],
        },
      },
    };

    const program = {
      block: [
        { name: "setValue", params: ["first"] },
        { name: "avoidFirstCmd", params: [] },
      ],
    };

    mountEditor(program, languageWithPositionRestriction);

    cy.get(`${sel.block} ${sel.accordion}`).should("have.length", 2);
    // Before the swap, "avoidFirstCmd" is last (allowed) - no error yet.
    cy.get(`${sel.block} ${sel.accordion}`).last().find(sel.accordionHeader).should("not.have.class", "error");

    // Swap the two statements - the first accordion's component instance
    // (trackBy'd by index) now displays "avoidFirstCmd" at position 0,
    // which its own language definition disallows.
    cy.get(`${sel.block} ${sel.accordion}`).first().find(sel.moveDownButton).click({ force: true });

    cy.get(`${sel.block} ${sel.accordion}`).first().find(sel.accordionHeader).should("have.class", "error");
  });
});

// Regression test for "mobile-responsive default state inverted between
// platforms" (see main report: iotix-react defaults to showing the
// visual editor pane on mobile, iotixng defaulted to showing the text
// editor pane instead - same product, opposite default behavior on a
// phone). iotixng's defaults now match react's: visual editor open,
// text editor closed.
describe("IotixVpProgramComponent mobile-responsive defaults (shared cross-repo scenario)", () => {
  it("shows the visual editor and hides the text editor by default", () => {
    cy.mount(IotixVpProgramComponent, {
      imports: [IotixVpModule],
      componentProperties: {
        program: siblings,
        language: language,
        settings: fullSettings(false),
      },
    });

    scenarios.showsVisualPaneHidesTextPaneByDefault();
  });
});

// Regression test for "no debounce-timer cleanup on unmount/destroy anywhere,
// on either platform" (see main report, cross-cutting section). iotix-react's
// TextEditor.cy.tsx already covers the React side (TextEditor.tsx clears its
// timer on unmount); this covers iotixng's matching fix -
// IotixVpTextEditorComponent.ngOnDestroy() clears its own debounce timer,
// so a component destroyed mid-debounce must not fire its callback later
// against a gone component.
describe("IotixVpTextEditorComponent debounce timer cleanup", () => {
  it("does not fire the debounced onUpdate callback after destroy", () => {
    cy.mount(IotixVpTextEditorComponent, {
      imports: [IotixVpModule],
      componentProperties: {
        program: { block: [] },
        settings: { common: { manualSync: false } },
        onUpdate: createOutputSpy("onUpdate"),
      },
    }).then(({ fixture }) => {
      cy.get(".text-area").clear().type("[]", { delay: 0 });

      cy.then(() => {
        fixture.destroy();
      });

      // Past the 1000ms debounce - if the timer wasn't cleared, its callback
      // fires now against the already-destroyed component.
      cy.wait(1200);

      cy.get("@onUpdate").should("not.have.been.called");
    });
  });
});

// Regression test for "no way for the host app to be notified of program
// changes at all" (see main report), specifically the undo()/redo() paths -
// the existing "empty-stack guard" tests above only prove undo()/redo() don't
// crash on an empty stack, never that a successful undo/redo actually emits
// onProgramChange so the host's own program reference doesn't go stale.
describe("IotixVpProgramComponent undo/redo onProgramChange emission", () => {
  it("emits the restored program when undo() pops a non-empty undo stack", () => {
    const previousProgram = {
      block: [{ name: "setValue", params: ["before"] }],
    };
    const currentProgram = {
      block: [{ name: "setValue", params: ["after"] }],
    };

    cy.mount(IotixVpProgramComponent, {
      imports: [IotixVpModule],
      componentProperties: {
        program: currentProgram,
        language: language,
        onProgramChange: createOutputSpy("onProgramChange"),
      },
    }).then(({ component, fixture }) => {
      component.undoList = [JSON.stringify(previousProgram)];
      component.undo();
      // See the "keeps a closed accordion closed" test above for why
      // checkNoChanges is skipped here.
      fixture.detectChanges(false);
    });

    cy.get("@onProgramChange").should("have.been.calledOnce");
    cy.get("@onProgramChange").should((stub) => {
      const emitted = stub.getCall(0).args[0];
      expect(emitted).to.deep.equal(previousProgram);
    });
  });

  it("emits the restored program when redo() pops a non-empty redo stack", () => {
    const currentProgram = {
      block: [{ name: "setValue", params: ["before"] }],
    };
    const nextProgram = {
      block: [{ name: "setValue", params: ["after"] }],
    };

    cy.mount(IotixVpProgramComponent, {
      imports: [IotixVpModule],
      componentProperties: {
        program: currentProgram,
        language: language,
        onProgramChange: createOutputSpy("onProgramChange"),
      },
    }).then(({ component, fixture }) => {
      component.redoList = [JSON.stringify(nextProgram)];
      component.redo();
      // See the "keeps a closed accordion closed" test above for why
      // checkNoChanges is skipped here.
      fixture.detectChanges(false);
    });

    cy.get("@onProgramChange").should("have.been.calledOnce");
    cy.get("@onProgramChange").should((stub) => {
      const emitted = stub.getCall(0).args[0];
      expect(emitted).to.deep.equal(nextProgram);
    });
  });
});

// Regression test for the other half of "structure-type command params being
// unrenderable/unbound" (see main report): rendersBoundStructureParamValues
// above only proves the INITIAL bound value renders correctly. This proves
// editing one of those values actually round-trips all the way out through
// onProgramChange, not just updating some local/unbound copy.
describe("IotixVpCmdStatementComponent structure param edit propagation (shared cross-repo scenario)", () => {
  it("emits an updated program after editing a structure-type param value", () => {
    cy.mount(IotixVpProgramComponent, {
      imports: [IotixVpModule],
      componentProperties: {
        program: structureParams,
        language: language,
        settings: { visualEditor: { enabled: true }, common: { manualSync: false } },
        onProgramChange: createOutputSpy("onProgramChange"),
      },
    });

    scenarios.editsStructureParamAndEmitsProgramChange(sel, {
      value: "42",
      // IotixVpCmdStatementComponent.onInputChange() debounces 1000ms before
      // committing to statements.params and calling update().
      commit: () => cy.wait(1200),
    });
  });
});

// A write is declared in the language as an ordinary "cmd" statement with
// "structure" params [reference, value] - no write-specific editor code
// exists, so these prove the existing structure-param path is enough.
describe("Write statement (shared cross-repo scenario)", () => {
  it("renders a write with its bound reference and value", () => {
    mountEditor(write);
    scenarios.rendersWriteStatement(sel, { title: "Write", reference: "1.temperature", value: "21" });
  });

  it("emits an updated program after editing the written value", () => {
    cy.mount(IotixVpProgramComponent, {
      imports: [IotixVpModule],
      componentProperties: {
        program: write,
        language: language,
        settings: { visualEditor: { enabled: true }, common: { manualSync: false } },
        onProgramChange: createOutputSpy("onProgramChange"),
      },
    });

    scenarios.editsStructureParamAndEmitsProgramChange(sel, {
      value: "25",
      // IotixVpCmdStatementComponent.onInputChange() debounces 1000ms before
      // committing to statements.params and calling update().
      commit: () => cy.wait(1200),
    });
  });
});

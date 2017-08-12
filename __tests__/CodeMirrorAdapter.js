const sinon = require("sinon");
const simulant = require("simulant");

const CodeMirrorAdapter = require("../src/CodeMirrorAdapter.js");
const { Range, Pos } = require("../src/util");

global.document.createRange = () => ({
  setEnd: jest.fn(),
  setStart: jest.fn(),
  getBoundingClientRect: () => ({ right: 0 }),
  getClientRects: () => ({
    length: 0,
    left: 0,
    right: 0
  })
});
global.document.body.createTextRange = global.document.createRange;

test("new CodeMirrorAdapter()", () => {
  expect(() => new CodeMirrorAdapter()).toThrow();
  expect(() => new CodeMirrorAdapter("beep")).toThrow();
  expect(() => new CodeMirrorAdapter(document.createElement("div"))).toThrow();
  expect(
    () => new CodeMirrorAdapter(document.createElement("textarea"))
  ).not.toThrow();
});

test("CodeMirrorAdapter#attach", () => {
  const container = document.createElement("div");
  const textarea = document.createElement("textarea");
  container.appendChild(textarea);
  const adapter = new CodeMirrorAdapter(textarea);

  expect(container.children[0]).toBe(textarea);
  adapter.attach();

  expect(container.children.length).toBe(1);
  expect(container.children[0]).toBe(adapter.wrapperNode);
  expect(container.contains(textarea)).toBeTruthy();

  adapter.destroy();
});

test("CodeMirrorAdapter#getText", () => {
  const textarea = document.createElement("textarea");
  textarea.value = "beep boop";

  const adapter = new CodeMirrorAdapter(textarea);
  adapter.attach();
  expect(adapter.getText()).toBe("beep boop");

  adapter.destroy();
});

test("CodeMirrorAdapter#setText", () => {
  const textarea = document.createElement("textarea");
  const adapter = new CodeMirrorAdapter(textarea);
  adapter.attach();

  adapter.setText("beep boop");
  expect(textarea.value).toBe("beep boop");
  adapter.setText("beep\nboop");
  expect(adapter.getText()).toBe("beep\nboop");

  adapter.destroy();
});

test("CodeMirrorAdapter#listSelections", () => {
  const textarea = document.createElement("textarea");
  const adapter = new CodeMirrorAdapter(textarea);
  adapter.attach();
  adapter.focus();

  adapter.setText("beep\nboop");
  adapter.cm.setSelection({ line: 1, ch: 2 }, { line: 0, ch: 2 });
  expect(adapter.listSelections()).toEqual([
    new Range(new Pos({ line: 0, ch: 2 }), new Pos({ line: 1, ch: 2 }))
  ]);

  adapter.destroy();
});

test("CodeMirrorAdapter#focus", () => {
  const textarea = document.createElement("textarea");
  document.body.appendChild(textarea);
  const adapter = new CodeMirrorAdapter(textarea);
  adapter.attach();

  expect(adapter.wrapperNode.contains(document.activeElement)).toBeFalsy();

  adapter.focus();
  expect(adapter.wrapperNode.contains(document.activeElement)).toBeTruthy();

  adapter.destroy();
  textarea.remove();
});

test("CodeMirrorAdapter#getRange", () => {
  const textarea = document.createElement("textarea");
  const adapter = new CodeMirrorAdapter(textarea);
  adapter.attach();

  adapter.setText("beep\nboop");
  expect(
    adapter.getRange(
      new Range(new Pos({ line: 0, ch: 0 }), new Pos({ line: 0, ch: 4 }))
    )
  ).toBe("beep");
  expect(
    adapter.getRange(
      new Range(new Pos({ line: 0, ch: 2 }), new Pos({ line: 1, ch: 2 }))
    )
  ).toBe("ep\nbo");

  adapter.destroy();
});

test("CodeMirrorAdapter#replaceRange", () => {
  const textarea = document.createElement("textarea");
  const adapter = new CodeMirrorAdapter(textarea);
  adapter.attach();

  adapter.setText("beep");
  adapter.replaceRange(
    "oo",
    new Range(new Pos({ line: 0, ch: 1 }), new Pos({ line: 0, ch: 3 }))
  );
  expect(adapter.getText()).toBe("boop");

  adapter.setText(`be like a while(1)
an infinite loop`);
  adapter.replaceRange(
    "ep bo",
    new Range(new Pos({ line: 0, ch: 2 }), new Pos({ line: 1, ch: 14 }))
  );
  expect(adapter.getText()).toBe("beep boop");

  adapter.destroy();
});

test("CodeMirrorAdapter#setSelection", () => {
  const textarea = document.createElement("textarea");
  const adapter = new CodeMirrorAdapter(textarea);
  adapter.attach();

  adapter.setText("beep\nboop");
  adapter.setSelection(
    new Range(new Pos({ line: 0, ch: 2 }), new Pos({ line: 1, ch: 2 }))
  );
  expect(adapter.cm.listSelections()).toEqual([
    { anchor: { line: 0, ch: 2 }, head: { line: 1, ch: 2 } }
  ]);

  adapter.setSelection(
    new Range(new Pos({ line: 0, ch: 2 }), new Pos({ line: 0, ch: 4 })),
    new Range(new Pos({ line: 1, ch: 1 }), new Pos({ line: 1, ch: 2 }))
  );
  expect(adapter.cm.listSelections()).toEqual([
    { anchor: { line: 0, ch: 2 }, head: { line: 0, ch: 4 } },
    { anchor: { line: 1, ch: 1 }, head: { line: 1, ch: 2 } }
  ]);

  adapter.destroy();
});

test("CodeMirrorAdapter#getLine", () => {
  const textarea = document.createElement("textarea");
  const adapter = new CodeMirrorAdapter(textarea);
  adapter.attach();

  adapter.setText("beep\nboop");
  expect(adapter.getLine(0)).toBe("beep");
  expect(adapter.getLine(1)).toBe("boop");

  adapter.destroy();
});

test("CodeMirrorAdapter#lock", () => {
  const textarea = document.createElement("textarea");
  const adapter = new CodeMirrorAdapter(textarea);
  adapter.attach();

  expect(adapter.cm.getOption("readOnly")).toBe(false);
  adapter.lock();
  expect(adapter.cm.getOption("readOnly")).toBe(true);

  adapter.destroy();
});

test("CodeMirrorAdapter#unlock", () => {
  const textarea = document.createElement("textarea");
  const adapter = new CodeMirrorAdapter(textarea, {
    codemirror: { readOnly: true }
  });
  adapter.attach();

  expect(adapter.cm.getOption("readOnly")).toBe(true);
  adapter.unlock();
  expect(adapter.cm.getOption("readOnly")).toBe(false);

  adapter.destroy();
});

test("CodeMirrorAdapter#setKeymap", () => {
  const textarea = document.createElement("textarea");
  const adapter = new CodeMirrorAdapter(textarea);
  adapter.attach();

  const keymap = new Map();
  keymap.set("Ctrl-B", { action: "beep" });
  keymap.set("Cmd-Ctrl-Alt-B", { action: "boop" });
  adapter.setKeymap(keymap);

  const keys = adapter.cm.getOption("keyMap");
  const handler = sinon.spy();
  adapter.on("action", handler);

  expect(keys["Ctrl-B"]).toBeTruthy();
  keys["Ctrl-B"].call();
  expect(handler.calledWith({ action: "beep" })).toBeTruthy();
  handler.reset();

  expect(keys["Cmd-Ctrl-Alt-B"]).toBeTruthy();
  keys["Cmd-Ctrl-Alt-B"].call();
  expect(handler.calledWith({ action: "boop" })).toBeTruthy();
  handler.reset();

  adapter.destroy();
});

test("CodeMirrorAdapter#setToolbar", () => {
  const textarea = document.createElement("textarea");
  const adapter = new CodeMirrorAdapter(textarea);
  adapter.attach();

  const toolbar = new Map();
  toolbar.set("beep", { action: "beep" });
  toolbar.set("boop", { action: "boop" });

  const handler = sinon.spy();
  adapter.on("action", handler);
  adapter.setToolbar(toolbar);

  const buttons = adapter.toolbarNode.querySelectorAll(".editor-button");
  expect(buttons[0].innerHTML).toBe("beep");
  expect(buttons[1].innerHTML).toBe("boop");

  simulant.fire(buttons[0], "click"); // Click first button
  expect(handler.calledWith("beep")).toBeTruthy();
  handler.reset();

  simulant.fire(buttons[1], "click"); // Click first button
  expect(handler.calledWith("boop")).toBeTruthy();
  handler.reset();
});

test("CodeMirrorAdapter#on paste", () => {
  const textarea = document.createElement("textarea");
  const adapter = new CodeMirrorAdapter(textarea);
  adapter.attach();
  const input = adapter.cm.display.input.getField();

  const handler = sinon.spy();
  adapter.on("paste", handler);

  simulant.fire(input, "paste");
  expect(handler.calledOnce).toBeTruthy();

  adapter.destroy();
});

test("CodeMirrorAdapter#on drop", () => {
  const textarea = document.createElement("textarea");
  const adapter = new CodeMirrorAdapter(textarea);
  adapter.attach();

  const handler = sinon.spy();
  adapter.on("drop", handler);

  const event = simulant("drop");
  event.dataTransfer = { files: [] };
  simulant.fire(adapter.cm.display.scroller, event);
  expect(handler.calledOnce).toBeTruthy();

  adapter.destroy();
});

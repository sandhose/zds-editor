const sinon = require("sinon");
const simulant = require("simulant");
const keycode = require("keycode");

const TextareaAdapter = require("../src/TextareaAdapter");
const { Pos, Range } = require("../src/util");

global.document.queryCommandEnabled = jest.fn();

test("new TextareaAdapter()", () => {
  expect(() => new TextareaAdapter()).toThrow();
  expect(() => new TextareaAdapter("beep")).toThrow();
  expect(() => new TextareaAdapter(document.createElement("div"))).toThrow();
  expect(
    () => new TextareaAdapter(document.createElement("textarea"))
  ).not.toThrow();
});

test("TextareaAdapter#attach", () => {
  const container = document.createElement("div");
  const textarea = document.createElement("textarea");
  container.appendChild(textarea);
  const adapter = new TextareaAdapter(textarea);

  expect(container.children[0]).toBe(textarea);
  adapter.attach();

  expect(container.children.length).toBe(1);
  expect(container.children[0]).toBe(adapter.wrapperNode);
  expect(container.contains(textarea)).toBeTruthy();

  adapter.destroy();
});

test("TextareaAdapter#destroy", () => {
  const container = document.createElement("div");
  const textarea = document.createElement("textarea");
  container.appendChild(textarea);
  const adapter = new TextareaAdapter(textarea);
  adapter.attach();
  const wrapper = adapter.wrapperNode;

  adapter.destroy();
  expect(textarea.parentNode).toBe(container);
  expect(container.contains(wrapper)).toBeFalsy();
  expect(container.children.length).toBe(1);
});

test("TextareaAdapter#getText", () => {
  const textarea = document.createElement("textarea");
  textarea.value = "beep boop";

  const adapter = new TextareaAdapter(textarea);
  adapter.attach();
  expect(adapter.getText()).toBe("beep boop");

  adapter.destroy();
});

test("TextareaAdapter#setText", () => {
  const textarea = document.createElement("textarea");
  const adapter = new TextareaAdapter(textarea);
  adapter.attach();

  adapter.setText("beep boop");
  expect(textarea.value).toBe("beep boop");
  adapter.setText("beep\nboop");
  expect(adapter.getText()).toBe("beep\nboop");

  adapter.destroy();
});

test("TextareaAdapter#getLines", () => {
  const textarea = document.createElement("textarea");
  const adapter = new TextareaAdapter(textarea);
  adapter.attach();

  expect(adapter.getLines()).toEqual([""]);
  adapter.setText("beep");
  expect(adapter.getLines()).toEqual(["beep"]);
  adapter.setText("beep\nboop");
  expect(adapter.getLines()).toEqual(["beep", "boop"]);

  adapter.destroy();
});

test("TextareaAdapter#getPosFromIndex", () => {
  const textarea = document.createElement("textarea");
  const adapter = new TextareaAdapter(textarea);
  adapter.attach();

  adapter.setText("beep\nboop");
  expect(adapter.getPosFromIndex(0)).toEqual(new Pos({ line: 0, ch: 0 }));
  expect(adapter.getPosFromIndex(4)).toEqual(new Pos({ line: 0, ch: 4 }));
  expect(adapter.getPosFromIndex(5)).toEqual(new Pos({ line: 1, ch: 0 }));
  expect(adapter.getPosFromIndex(9)).toEqual(new Pos({ line: 1, ch: 4 }));

  adapter.destroy();
});

test("TextareaAdapter#getIndexFromPos", () => {
  const textarea = document.createElement("textarea");
  const adapter = new TextareaAdapter(textarea);
  adapter.attach();

  adapter.setText("beep\nboop");
  expect(adapter.getIndexFromPos(new Pos({ line: 0, ch: 0 }))).toBe(0);
  expect(adapter.getIndexFromPos(new Pos({ line: 0, ch: 4 }))).toBe(4);
  expect(adapter.getIndexFromPos(new Pos({ line: 1, ch: 0 }))).toBe(5);
  expect(adapter.getIndexFromPos(new Pos({ line: 1, ch: 4 }))).toBe(9);

  adapter.destroy();
});

test("TextareaAdapter#listSelections", () => {
  const textarea = document.createElement("textarea");
  document.body.appendChild(textarea);
  const adapter = new TextareaAdapter(textarea);
  adapter.attach();
  adapter.focus();

  adapter.setText("beep\nboop");
  textarea.setSelectionRange(2, 7);
  expect(adapter.listSelections()).toEqual([
    new Range(new Pos({ line: 0, ch: 2 }), new Pos({ line: 1, ch: 2 }))
  ]);

  adapter.destroy();
  document.body.removeChild(textarea);
});

test("TextareaAdapter#focus", () => {
  const textarea = document.createElement("textarea");
  document.body.appendChild(textarea);
  const adapter = new TextareaAdapter(textarea);
  adapter.attach();

  textarea.blur();
  expect(document.activeElement).not.toBe(textarea);

  adapter.focus();
  expect(document.activeElement).toBe(textarea);

  adapter.destroy();
  document.body.removeChild(textarea);
});

test("TextareaAdapter#getRange", () => {
  const textarea = document.createElement("textarea");
  const adapter = new TextareaAdapter(textarea);
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

test("TextareaAdapter#replaceRange", () => {
  const textarea = document.createElement("textarea");
  const adapter = new TextareaAdapter(textarea);
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

test("TextareaAdapter#setSelection", () => {
  const textarea = document.createElement("textarea");
  document.body.appendChild(textarea);
  const adapter = new TextareaAdapter(textarea);
  adapter.attach();
  adapter.focus();

  adapter.setText("beep\nboop");
  adapter.setSelection(
    new Range(new Pos({ line: 0, ch: 2 }), new Pos({ line: 1, ch: 2 }))
  );
  expect(textarea.selectionStart).toBe(2);
  expect(textarea.selectionEnd).toBe(7);

  adapter.destroy();
  document.body.removeChild(textarea);
});

test("TextareaAdapter#getLine", () => {
  const textarea = document.createElement("textarea");
  const adapter = new TextareaAdapter(textarea);
  adapter.attach();

  adapter.setText("beep\nboop");
  expect(adapter.getLine(0)).toBe("beep");
  expect(adapter.getLine(1)).toBe("boop");

  adapter.destroy();
});

test("TextareaAdapter#lock", () => {
  const textarea = document.createElement("textarea");
  const adapter = new TextareaAdapter(textarea);
  adapter.attach();

  expect(textarea.disabled).toBe(false);
  adapter.lock();
  expect(textarea.disabled).toBe(true);

  adapter.destroy();
});

test("TextareaAdapter#unlock", () => {
  const textarea = document.createElement("textarea");
  const adapter = new TextareaAdapter(textarea);
  textarea.disabled = true;
  adapter.attach();

  expect(textarea.disabled).toBe(true);
  adapter.unlock();
  expect(textarea.disabled).toBe(false);

  adapter.destroy();
});

test("TextareaAdapter#handleKeydown", () => {
  const textarea = document.createElement("textarea");
  const adapter = new TextareaAdapter(textarea);
  adapter.attach();

  const keymap = new Map();
  keymap.set("Ctrl-B", { action: "beep" });
  keymap.set("Cmd-Ctrl-Shift-Alt-B", { action: "boop" });

  const handler = sinon.spy();
  adapter.on("action", handler);
  adapter.setKeymap(keymap);

  simulant.fire(textarea, "keydown", { which: keycode("b"), ctrlKey: true }); // Press `Ctrl-B`
  expect(handler.calledWith({ action: "beep" })).toBeTruthy();
  handler.reset();

  simulant.fire(textarea, "keydown", { which: keycode("b") }); // Press `B`
  expect(handler.called).toBe(false);
  handler.reset();

  simulant.fire(textarea, "keydown", {
    which: keycode("b"),
    ctrlKey: true,
    metaKey: true,
    shiftKey: true,
    altKey: true
  }); // `Cmd-Ctrl-Shift-Alt-B`
  expect(handler.calledWith({ action: "boop" })).toBeTruthy();
  handler.reset();

  adapter.destroy();
});

test("TextareaAdapter#setKeymap", () => {
  const textarea = document.createElement("textarea");
  const adapter = new TextareaAdapter(textarea);
  adapter.attach();

  const keymap = new Map();
  keymap.set("Ctrl-B", { action: "beep" });
  keymap.set("Cmd-Ctrl-Alt-B", { action: "boop" });

  adapter.setKeymap(keymap);
  expect(adapter.keymap).toBe(keymap);

  adapter.destroy();
});

test("TextareaAdapter#setToolbar", () => {
  const textarea = document.createElement("textarea");
  const adapter = new TextareaAdapter(textarea);
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

  adapter.destroy();
});

test("TextareaAdapter#on paste", () => {
  const textarea = document.createElement("textarea");
  const adapter = new TextareaAdapter(textarea);
  adapter.attach();

  const handler = sinon.spy();
  adapter.on("paste", handler);

  simulant.fire(textarea, "paste");
  expect(handler.calledOnce).toBeTruthy();

  adapter.destroy();
});

test("TextareaAdapter#on drop", () => {
  const textarea = document.createElement("textarea");
  const adapter = new TextareaAdapter(textarea);
  adapter.attach();

  const handler = sinon.spy();
  adapter.on("drop", handler);

  simulant.fire(textarea, "drop");
  expect(handler.calledOnce).toBeTruthy();

  adapter.destroy();
});

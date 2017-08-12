import Editor from "../src/Editor";

const test = require("tape");

test("Editor.getEmphasis", assert => {
  assert.plan(3);
  assert.deepEqual(
    Editor.getEmphasis("***beep***"),
    { level: 3, text: "beep", type: "*" },
    "extracts emphasis properties"
  );
  assert.deepEqual(
    Editor.getEmphasis("boop"),
    { level: 0, text: "boop", type: "*" },
    "extracts emphasis with level=0 when text has no emphasis"
  );
  assert.deepEqual(
    Editor.getEmphasis("____"),
    { level: 2, text: "", type: "_" },
    "extracts emphasis when there is nothing inside the emphasis"
  );
});

test("Editor.setEmphasis", assert => {
  assert.plan(3);
  assert.equal(
    Editor.setEmphasis({ level: 3, text: "beep", type: "*" }),
    "***beep***",
    "converts emphasis to string"
  );
  assert.equal(
    Editor.setEmphasis({ level: 0, text: "boop", type: "*" }),
    "boop",
    "converts emphasis to string with level=0"
  );
  assert.equal(
    Editor.setEmphasis({ level: 2, text: "", type: "_" }),
    "____",
    "converts emphasis to string without text"
  );
});

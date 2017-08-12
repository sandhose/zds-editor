import Editor from "../src/Editor";

const test = require("tape");

test("Editor.getBlockquote", assert => {
  assert.plan(3);
  assert.deepEqual(
    Editor.getBlockquote("> > beep"),
    { level: 2, text: "beep" },
    "extracts quote properties"
  );
  assert.deepEqual(
    Editor.getBlockquote("boop"),
    { level: 0, text: "boop" },
    "extracts quote with level=0 when text is not a quote"
  );
  assert.deepEqual(
    Editor.getBlockquote("> > > "),
    { level: 3, text: "" },
    "extracts quote when there is no text inside the quote"
  );
});

test("Editor.setBlockquote", assert => {
  assert.plan(3);
  assert.equal(
    Editor.setBlockquote({ level: 2, text: "beep" }),
    "> > beep",
    "converts quote to string"
  );
  assert.equal(
    Editor.setHeading({ level: 0, text: "Doloir sit amet" }),
    "Doloir sit amet",
    "converts quote to string with level=0"
  );
  assert.equal(
    Editor.setHeading({ level: 4, text: "" }),
    "#### ",
    "converts quote to string without text"
  );
});

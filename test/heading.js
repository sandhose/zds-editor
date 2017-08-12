const test = require("tape");
const Editor = require("../src/Editor");

test("Editor.getHeading", assert => {
  assert.plan(3);
  assert.deepEqual(
    Editor.getHeading("## beep"),
    { level: 2, text: "beep" },
    "extracts heading properties"
  );
  assert.deepEqual(
    Editor.getHeading("boop"),
    { level: 0, text: "boop" },
    "extracts heading with level=0 when text is not a heading"
  );
  assert.deepEqual(
    Editor.getHeading("#### "),
    { level: 4, text: "" },
    "extracts heading where there is no text inside the heading"
  );
});

test("Editor.setHeading", assert => {
  assert.plan(3);
  assert.equal(
    Editor.setHeading({ level: 2, text: "Lorem ipsum" }),
    "## Lorem ipsum",
    "converts heading to string"
  );
  assert.equal(
    Editor.setHeading({ level: 0, text: "Doloir sit amet" }),
    "Doloir sit amet",
    "converts heading to string with level=0"
  );
  assert.equal(
    Editor.setHeading({ level: 4, text: "" }),
    "#### ",
    "converts heading to string without text"
  );
});

const Editor = require("../src/Editor");

test("Editor.getHeading", () => {
  expect.assertions(3);
  expect(Editor.getHeading("## beep")).toEqual({ level: 2, text: "beep" });
  expect(Editor.getHeading("boop")).toEqual({ level: 0, text: "boop" });
  expect(Editor.getHeading("#### ")).toEqual({ level: 4, text: "" });
});

test("Editor.setHeading", () => {
  expect.assertions(3);
  expect(Editor.setHeading({ level: 2, text: "Lorem ipsum" })).toBe(
    "## Lorem ipsum"
  );
  expect(Editor.setHeading({ level: 0, text: "Doloir sit amet" })).toBe(
    "Doloir sit amet"
  );
  expect(Editor.setHeading({ level: 4, text: "" })).toBe("#### ");
});

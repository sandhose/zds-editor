import Editor from "../src/Editor";

test("Editor.getEmphasis", () => {
  expect.assertions(3);
  expect(Editor.getEmphasis("***beep***")).toEqual({
    level: 3,
    text: "beep",
    type: "*"
  });
  expect(Editor.getEmphasis("boop")).toEqual({
    level: 0,
    text: "boop",
    type: "*"
  });
  expect(Editor.getEmphasis("____")).toEqual({ level: 2, text: "", type: "_" });
});

test("Editor.setEmphasis", () => {
  expect.assertions(3);
  expect(Editor.setEmphasis({ level: 3, text: "beep", type: "*" })).toBe(
    "***beep***"
  );
  expect(Editor.setEmphasis({ level: 0, text: "boop", type: "*" })).toBe(
    "boop"
  );
  expect(Editor.setEmphasis({ level: 2, text: "", type: "_" })).toBe("____");
});

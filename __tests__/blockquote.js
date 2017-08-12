import Editor from "../src/Editor";

test("Editor.getBlockquote", () => {
  expect.assertions(3);
  expect(Editor.getBlockquote("> > beep")).toEqual({ level: 2, text: "beep" });
  expect(Editor.getBlockquote("boop")).toEqual({ level: 0, text: "boop" });
  expect(Editor.getBlockquote("> > > ")).toEqual({ level: 3, text: "" });
});

test("Editor.setBlockquote", () => {
  expect.assertions(3);
  expect(Editor.setBlockquote({ level: 2, text: "beep" })).toBe("> > beep");
  expect(Editor.setHeading({ level: 0, text: "Doloir sit amet" })).toBe(
    "Doloir sit amet"
  );
  expect(Editor.setHeading({ level: 4, text: "" })).toBe("#### ");
});

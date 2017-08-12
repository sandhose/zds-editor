// @flow

import type {
  Adapter,
  Keymap,
  Toolbar,
  EditorAction,
  ListItem,
  Emphasis,
  Blockquote,
  Heading,
  RangeMap,
  RawAction
} from "./Adapter";
import { Pos, Range } from "./util";

const isOSX =
  typeof navigator === "object" &&
  navigator.userAgent.indexOf("Mac OS X") !== -1;

type TabOption = boolean | "partial";
type UploadFunc = (File | Blob) => Promise<string>;
type EditorOption = {
  useTabToIndent: TabOption,
  upload: UploadFunc
};

class Editor {
  adapter: Adapter;
  options: EditorOption;
  keymap: Keymap;
  toolbar: Toolbar;
  locked: boolean;

  /**
   * @callback uploadFunc
   * @param {File} file - The input text
   * @return {Promise<string>} A Promise that resolves to the uploaded image's URL
   */

  /**
   * @constructor
   * @param {GenericAdapter} adapter
   * @param {object} options
   * @param {uploadFunc} options.upload - Called when an image need to be uploaded
   * @param {string|boolean} options.useTabToIndent=partial - can be true, false or `partial`
   */
  constructor(adapter: Adapter, options: EditorOption) {
    if (!adapter) throw new Error("No adapter provided");
    this.options = Object.assign(
      {},
      {
        useTabToIndent: "partial",
        upload: file =>
          new Promise(resolve =>
            setTimeout(() => resolve(URL.createObjectURL(file)), 200)
          )
      },
      options
    );

    /** @type {Map.<string, object>} */
    this.keymap = new Map();
    /** @type {Map.<string, object>} */
    this.toolbar = new Map();

    this.keymap.set("Enter", () => this.handleEnter());
    this.keymap.set("Tab", () => this.handleTab(false));
    this.keymap.set("Shift-Tab", () => this.handleTab(true));

    this.buildToolbar();

    this.setAdapter(adapter);
  }

  /**
   * Set the adapter to use
   * @param {Adapter} adapter - the adapter to use
   */
  setAdapter(adapter: Adapter) {
    // Destroy the old adapter, but keep the text & selections
    let text;
    let selections;
    if (this.adapter) {
      selections = this.adapter.listSelections();
      text = this.adapter.getText();
      this.adapter.destroy();
    }

    /** @type {GenericAdapter} */
    this.adapter = adapter;
    this.adapter.attach();
    this.adapter.setKeymap(this.keymap);
    this.adapter.setToolbar(this.toolbar);
    this.adapter.on("paste", e => this.handlePaste(e));
    this.adapter.on("drop", e => this.handleDrop(e));
    this.adapter.on("action", e => this.handleAction(e));

    if (text) this.adapter.setText(text);
    if (selections) this.adapter.setSelection(...selections);
  }

  /**
   * Build the toolbar
   */
  buildToolbar() {
    this.addToolbarButton({
      name: "bold",
      action: { type: "emphasis", level: 2 },
      keymap: "Mod-B"
    });
    this.addToolbarButton({
      name: "italic",
      action: { type: "emphasis", level: 1 },
      keymap: "Mod-I"
    });
    this.addToolbarButton({
      name: "h1",
      action: { type: "heading", level: 1 },
      children: [
        { name: "h2", action: { level: 2 } },
        { name: "h3", action: { level: 3 } },
        { name: "h4", action: { level: 4 } }
      ]
    });
    this.addToolbarButton({
      name: "+quote",
      action: { type: "blockquote", level: 1 },
      keymap: "Mod-'",
      children: [
        {
          name: "-quote",
          action: { level: -1 },
          keymap: "Mod-Alt-'"
        }
      ]
    });
    this.addToolbarButton({ name: "code", action: { type: "code" } });
    this.addToolbarButton({
      name: "link",
      action: { type: "link" },
      keymap: "Mod-K"
    });
  }

  /**
   * @typedef Heading
   * @type Object
   * @property {number} level - The level of heading
   * @property {string} text - The text of the heading
   */

  /**
   * Get the heading level and text for a given text
   * @param {string} text - The text to parse
   * @return {Heading} The parsed heading
   * @example
   * Editor.getHeading("## test");
   * { level: 2, text: "test" }
   */
  static getHeading(text: string): Heading {
    const match = /^(#{0,6})(.*)$/.exec(text);
    return { level: match[1].length, text: match[2].trim() };
  }

  /**
   * Return the text representation of a Heading
   * @param {Heading} heading
   * @return {string} The text representation of the heading
   * @example
   * Editor.setHeading({ level: 3, text: "Lorem ipsum"});
   * "### Lorem ipsum"
   */
  static setHeading({ level, text }: Heading): string {
    return `${"#".repeat(level)} ${text}`.replace(/^ /, "");
  }

  /**
   * @typedef Blockquote
   * @type Object
   * @property {number} level - The level of blockquote
   * @property {string} text - The text of the blockquote
   */

  /**
   * Get the quotation level and text for a given text
   * @param {string} text - The text to parse
   * @return {Blockquote} The parsed blockquote
   * @example
   * Editor.getBlockquote("> > > nested");
   * { level: 3, text: "nested" }
   */
  static getBlockquote(text: string): Blockquote {
    const match = /^((> )*)(.*)$/.exec(text);
    return { level: match[1].length / 2, text: match[3] };
  }

  /**
   * Return the text representation of a Blockquote
   * @param {Blockquote} blockquote
   * @return {string} The text representation of the blockquote
   * @example
   * Editor.setBlockquote({ level: 1, text: "quote" });
   * "> quote"
   */
  static setBlockquote({ level, text }: Blockquote): string {
    return `${"> ".repeat(level)}${text}`;
  }

  /**
   * @typedef Emphasis
   * @type Object
   * @property {number} level - The level of emphasis
   * @property {string} text - The text of the emphasis
   * @property {string} type - The type of the emphasis (* or _)
   */

  /**
   * Get the emphasis level, text and type for a given text
   * @param {string} text - The text to parse
   * @return {Emphasis} The parsed emphasis
   * @example
   * Editor.getEmphasis("__bold__");
   * { level: 2, text: "bold", type: "_" }
   */
  static getEmphasis(text: string): Emphasis {
    const start = text.charAt(0);
    if (start !== "*" && start !== "_") return { type: "*", level: 0, text };
    for (let i = 3; i > 0; i -= 1) {
      const match = text.match(
        new RegExp(`^\\${start}{${i}}(.*)\\${start}{${i}}`)
      );
      if (match) {
        return { type: start, level: i, text: match[1] };
      }
    }

    throw new Error("error while parsing emphasis"); // This should not happen
  }

  /**
   * Return the text representation of an Emphasis
   * @param {Emphasis} emphasis
   * @return {string} The text representation of the emphasis
   * @example
   * Editor.setEmphasis({ text: "italic", level: 1, type: "*" });
   * "*italic*"
   */
  static setEmphasis({ text, level, type }: Emphasis): string {
    return type.repeat(level) + text + type.repeat(level);
  }

  /**
   * @typedef ListItem
   * @type Object
   * @property {string} text - The text of the list item
   * @property {string} type - 'ordered' or 'unordered'
   * @property {string} [bullet] - `*` or `-`
   * @property {number} [number] - The number of the ordered list
   */

  /**
   * Return the list type, level and text for a given text
   * @param {string} text - The text to parse
   * @return {ListItem}
   */
  static getListItem(text: string): ListItem {
    const match = /^(\*|-|[0-9]+\.) (.*)$/.exec(text);
    if (match) {
      if (match[1] === "-" || match[1] === "*") {
        return {
          type: "unordered",
          bullet: match[1],
          text: match[2]
        };
      }

      return {
        type: "ordered",
        text: match[2],
        number: parseInt(match[1], 10)
      };
    }

    return {
      type: "none",
      text
    };
  }

  /**
   * Return the text representation of a ListItem
   * @param {ListItem} item
   * @return {string}
   */
  static setListItem(item: ListItem): string {
    if (item.type === "none") {
      return item.text;
    }

    const prefix = item.type === "ordered" ? `${item.number}.` : item.bullet;
    return `${prefix} ${item.text}`;
  }

  /**
   * @typedef IndentedText
   * @type Object
   * @property {number} level - The level of indentation
   * @property {string} text - The indented text
   */

  /**
   * Get the indentation level and text for a given text
   * @param {string} text - The text to parse
   * @return {IndentedText} The parsed IndentedText
   * @example
   * Editor.getBlockquote("   code");
   * { level: 3, text: "code" }
   */
  static getIndentedText(text) {
    const match = /^( *)([^ ](.*))?$/.exec(text);
    return { level: match[1].length, text: match[2] || "" };
  }

  /**
   * Return the text representation of a IndentedText
   * @param {IndentedText} indentedText
   * @return {string}
   * @example
   * Editor.setIndentedText({ level: 2, text: "code" });
   * "  code"
   */
  static setIndentedText({ level, text }) {
    return `${" ".repeat(level)}${text}`;
  }

  /**
   * Extract an array of range for the given lines (each line are separate ranges)
   * @param {Range[]} [selections=this.adapter.listSelections()] - The selection to extract
   * @param {boolean} [fullLine=false] - If true, each selection will be expanded to the full line
   * @return {Range[]} All the extracted ranges
   * @see Editor#mapRanges
   * @example
   * // Wraps the selected text with ~
   * let ranges = editor.extractLines();
   * editor.mapRanges(text => `~${text}~`, ranges);
   */
  extractLines(
    _selections?: Array<Range>,
    fullLine?: boolean = false
  ): Array<Range> {
    const selections = _selections || this.adapter.listSelections();
    let ranges: Array<Range> = [];
    // Extracting lines from selections
    if (fullLine) {
      const lines = new Set();
      selections.forEach(({ start, end }) => {
        for (let i = start.line; i <= end.line; i += 1) {
          lines.add(i);
        }
      });

      ranges = Array.from(lines).map(
        line =>
          new Range(
            new Pos({ line, ch: 0 }),
            new Pos({ line, ch: this.adapter.getLine(line).length })
          )
      );
    } else {
      const lines = new Map();
      selections.forEach(({ start, end }) => {
        for (let i = start.line; i <= end.line; i += 1) {
          const curr = lines.get(i) || [];
          const v = [
            i === start.line ? start.ch : 0,
            i === end.line ? end.ch : this.adapter.getLine(i).length
          ];
          lines.set(i, [...curr, v]);
        }
      });

      ranges = Array.from(lines)
        .map(([line, lineRanges]) =>
          lineRanges.map(
            ([start, end]) =>
              new Range(
                new Pos({ line, ch: start }),
                new Pos({ line, ch: end })
              )
          )
        )
        .reduce((a, b) => a.concat(b));
    }

    return ranges;
  }

  /**
   * Expands the selection to the whole line
   * @param {Range[]} [selections=this.cm.doc.listSelections()] - The ranges to expand
   * @return {Range[]} The expanded selections
   */
  expandSelectionsToLines(_selections?: Array<Range>): Array<Range> {
    const selections = _selections || this.adapter.listSelections();
    return selections.map(range => {
      const { start, end } = range;
      start.ch = 0;
      end.ch = this.adapter.getLine(end.line).length;
      return new Range(start, end);
    });
  }

  /**
   * @callback rangeMap
   * @param {string} text - The input text
   * @param {Range} range - The range of the text
   * @param {number} index - The index of the current range
   * @return {(string|object)} The transformed text
   */

  /**
   * Transform the text in each range using mapFunc
   * @param {rangeMap} mapFunc
   * @param {Range[]} ranges
   * @see Editor#extractLines
   */
  mapRanges(mapFunc: RangeMap, _ranges: Array<Range>) {
    const ranges = _ranges;
    const newSelections = ranges.map((range, index) => {
      const rangeText = this.adapter.getRange(range);

      const result = mapFunc(rangeText, range, index);
      let resultText;
      const resultSelection: [number, number] =
        typeof result === "string" ? [0, 0] : result.selection;

      if (typeof result === "string") {
        resultText = result;
      } else {
        resultText = result.text;
      }

      ranges.slice(index + 1).forEach((range2, i) => {
        ranges[index + 1 + i] = new Range(
          Editor.adjustPosForChange(range2.start, {
            from: range.start,
            to: range.end,
            text: resultText.split("\n")
          }),
          Editor.adjustPosForChange(range2.end, {
            from: range.start,
            to: range.end,
            text: resultText.split("\n")
          })
        );
      });

      this.adapter.replaceRange(resultText, range);
      const s1 = resultText.slice(0, resultSelection[0]).split("\n");
      const s2 = resultText
        .slice(0, resultText.length - resultSelection[1])
        .split("\n");
      return new Range(
        new Pos({
          line: range.start.line - 1 + s1.length,
          ch: (s1.length > 1 ? 0 : range.start.ch) + s1[s1.length - 1].length
        }),
        new Pos({
          line: range.start.line - 1 + s2.length,
          ch: (s2.length > 1 ? 0 : range.start.ch) + s2[s2.length - 1].length
        })
      );
    });
    this.adapter.setSelection(...newSelections);
    return newSelections;
  }

  static changeEnd(change) {
    if (!change.text) return change.to;
    return new Pos({
      line: change.from.line + change.text.length - 1,
      ch:
        change.text[change.text.length - 1].length +
        (change.text.length === 1 ? change.from.ch : 0)
    });
  }

  /**
   * Offset a Pos after a change
   * @param {Pos} pos - Position to adjsut
   * @param {object} change - Change to be done
   * @param {Pos} change.from - Start of the change
   * @param {Pos} change.to - End of the change
   * @param {string} change.text - New text for the change
   */
  static adjustPosForChange(pos, { from, to, text }) {
    if (Pos.compare(pos, from) < 0) return pos;
    if (Pos.compare(pos, to) <= 0) return Editor.changeEnd({ from, to, text });

    let ch = pos.ch;
    if (pos.line === to.line)
      ch += Editor.changeEnd({ from, to, text }).ch - to.ch;
    return new Pos({
      line: pos.line + text.length - (to.line - from.line) - 1,
      ch
    });
  }

  /**
   * @typedef Prefix
   * @type Object
   * @property {string} prefix - The prefix of the text
   * @property {string} text - The text itself
   */

  /**
   * Get the prefix and text for given text and level
   * @param {string} text - Text to parse
   * @param {string} level - Level of the block to extract ; can be `cite` or `heading`
   * @return {Prefix}
   */
  static getPrefixForText(_text, level) {
    let prefix = "";
    let text = _text;

    if (level === "cite" || level === "heading") {
      const quote = Editor.getBlockquote(text);
      text = quote.text;
      quote.text = "";
      prefix += Editor.setBlockquote(quote);
    }

    if (level === "heading") {
      const indentedText = Editor.getIndentedText(text);
      text = indentedText.text;
      indentedText.text = "";
      prefix += Editor.setIndentedText(indentedText);

      const listItem = Editor.getListItem(text);
      text = listItem.text;
      listItem.text = "";
      prefix += Editor.setListItem(listItem);

      const heading = Editor.getHeading(text);
      text = heading.text;
      heading.text = "";
      prefix += Editor.setHeading(heading);
    }

    return { text, prefix };
  }

  /**
   * Execute a given action
   * @param {object} action
   * @param {string} action.type
   * @param {} action.level
   * @example
   * editor.execute({ type: "heading", level: 5 });
   */
  handleAction(action: RawAction) {
    if (this.locked) return;
    if (action.type === "emphasis") {
      const level = action.level;
      const ranges = this.extractLines(this.adapter.listSelections());
      this.mapRanges(text => {
        const { prefix, text: unprefixedText } = Editor.getPrefixForText(
          text,
          "heading"
        );
        const emph = Editor.getEmphasis(unprefixedText);
        if (emph.level === 3 || emph.level === level) emph.level -= level;
        else emph.level += level;

        if (emph.text === "") {
          return {
            text: prefix + "*".repeat(emph.level * 2),
            selection: [prefix.length + emph.level, emph.level]
          };
        }

        return {
          text: prefix + Editor.setEmphasis(emph),
          selection: [prefix.length, 0]
        };
      }, ranges);
    } else if (action.type === "heading") {
      const level = action.level;
      const ranges = this.extractLines(this.adapter.listSelections(), true);
      this.mapRanges(text => {
        const { prefix, text: unprefixedText } = Editor.getPrefixForText(
          text,
          "cite"
        );
        const heading = Editor.getHeading(unprefixedText);
        if (heading.level === level)
          heading.level = 0; // Toggle heading if same level
        else heading.level = level;
        if (heading.text === "") {
          return {
            text: `${prefix}${"#".repeat(heading.level)} `,
            selection: [prefix.length + heading.level + 1, 0]
          };
        }
        return {
          text: prefix + Editor.setHeading(heading),
          selection: [prefix.length, 0]
        };
      }, ranges);
    } else if (action.type === "blockquote") {
      const level = action.level;
      const ranges = this.extractLines(this.adapter.listSelections(), true);
      this.mapRanges(text => {
        const quote = Editor.getBlockquote(text);
        quote.level = Math.max(0, quote.level + level);
        if (quote.text === "") {
          return {
            text: "> ".repeat(quote.level),
            selection: [quote.level * 2, 0]
          };
        }

        return Editor.setBlockquote(quote);
      }, ranges);
    } else if (action.type === "code") {
      const ranges = this.expandSelectionsToLines();
      this.mapRanges(text => {
        let returnValue;
        if (text.trim() === "") {
          returnValue = {
            text: "```\n\n```",
            selection: [4, 4]
          };
        } else {
          returnValue = {
            text: `\`\`\`language\n${text}\n\`\`\``,
            selection: [3, text.length + 5]
          };
        }
        return returnValue;
      }, ranges);
    } else if (action.type === "link") {
      const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
      const ranges = this.extractLines(this.adapter.listSelections());
      this.mapRanges(text => {
        let returnValue;
        if (text === "" || text.match(urlRegex)) {
          returnValue = {
            text: `[](${text})`,
            selection: [1, 3 + text.length]
          };
        } else {
          returnValue = {
            text: `[${text}]()`,
            selection: [text.length + 3, 1]
          };
        }
        return returnValue;
      }, ranges);
    }

    this.adapter.focus();
  }

  /**
   * Called when the enter key is pressed
   * Does things like continue a list or a blockquote
   */
  handleEnter() {
    const selections = this.adapter.listSelections();
    // Do those weird stuff only when there is a single cursor (no selection)
    if (
      selections.length === 1 &&
      Pos.compare(selections[0].start, selections[0].end) === 0
    ) {
      const cursor = selections[0].start;
      const blockquote = Editor.getBlockquote(
        this.adapter.getLine(cursor.line)
      );
      const indentedText = Editor.getIndentedText(blockquote.text);
      const listItem = Editor.getListItem(indentedText.text);

      // Previous line information
      const prevBlockquote = Editor.getBlockquote(
        this.adapter.getLine(cursor.line - 1)
      );
      const prevIndentedText = Editor.getIndentedText(prevBlockquote.text);
      const prevListItem = Editor.getListItem(prevIndentedText.text);

      if (
        blockquote.level === 0 &&
        indentedText.level === 0 &&
        !listItem.type
      ) {
        // Nothing special on this line, let's act like a normal carriage return
        this.mapRanges(() => ({ text: "\n", selection: [1, 0] }), [
          new Range(cursor, cursor)
        ]);
      } else if (blockquote.text === "" && prevBlockquote.level > 0) {
        // The Blockquote on this line is empty, and the previous line has Blockquote
        // Let's remove this line's empty Blockquote
        this.mapRanges(
          () => ({ text: "\n", selection: [1, 0] }),
          this.expandSelectionsToLines([new Range(cursor, cursor)])
        );
      } else if (
        (indentedText.text === "" && prevIndentedText.level > 0) ||
        (listItem.text === "" && prevListItem.type !== null)
      ) {
        // This line has an empty list item OR an empty indented text
        // Let's only keep the Blockquote on this line and on the next
        blockquote.text = "";
        const quoteText = Editor.setBlockquote(blockquote);
        this.mapRanges(
          () => ({
            text: `${quoteText}\n${quoteText}`,
            selection: [1 + quoteText.length * 2, 0]
          }),
          this.expandSelectionsToLines([new Range(cursor, cursor)])
        );
      } else {
        // There is a non-empty ListItem OR non-empty Blockquote OR non-empty IndentedText
        // Let's keep those properties for the next line
        if (listItem.type === "ordered") listItem.number += 1;
        listItem.text = "";
        indentedText.text = Editor.setListItem(listItem);
        blockquote.text = Editor.setIndentedText(indentedText);
        const newText = Editor.setBlockquote(blockquote);
        this.mapRanges(
          () => ({ text: `\n${newText}`, selection: [newText.length + 1, 0] }),
          [new Range(cursor, cursor)]
        );
      }
    } else {
      this.mapRanges(() => ({ text: "\n", selection: [1, 0] }), selections);
    }
  }

  /**
   * Called when the `tab` key is pressed
   */
  handleTab(reverse: boolean = false) {
    const selections = this.adapter.listSelections();
    // Extract all the selections that are cursors (zero-width ranges)
    const cursors = selections
      .filter(({ start, end }) => Pos.compare(start, end) === 0)
      .map(({ start }) => start);
    const lines = this.extractLines(selections, true);
    // First, extract all the informations we can get from the line
    const linesData = lines.map(range => {
      const text = this.adapter.getRange(range);
      const blockquote = Editor.getBlockquote(text);
      const indentedText = Editor.getIndentedText(blockquote.text);
      const listItem = Editor.getListItem(indentedText.text);
      const cursor = cursors.find(
        pos =>
          Pos.compare(pos, range.start) >= 0 && Pos.compare(pos, range.end) <= 0
      );
      return {
        text,
        line: range.start.line,
        range,
        blockquote,
        indentedText,
        listItem,
        cursor
      };
    });

    if (
      (this.options.useTabToIndent === "partial" &&
        selections.length === 1 &&
        cursors.length === 1 &&
        !linesData[0].listItem.type) ||
      !this.options.useTabToIndent
    ) {
      return false;
    }

    let hasCursor = false; // Track if there was a new cursor position set
    linesData.forEach(
      ({ text, line, range, blockquote, indentedText, listItem, cursor }) => {
        if (cursor && selections.length === 1 && !listItem.type && !reverse) {
          // In case it was a tab without selection not on a list, do smart-indent on cursor
          const shift = 4 - cursor.ch % 4; // Smart-indent
          this.adapter.replaceRange(" ".repeat(shift), new Range(cursor));
          this.adapter.setSelection(
            new Range(new Pos({ line: cursor.line, ch: cursor.ch + shift }))
          );
          hasCursor = true;
        } else {
          // The indentation to add. Negative if reverse
          const indentAdd = reverse ? -4 : 4;
          // Indent the text, but never under 0
          const newIndentedText = {
            ...indentedText,
            level: Math.max(indentedText.level + indentAdd, 0) // Shift indentation
          };

          let newListType = listItem.type;
          let newListNumber = 1;
          let newListBullet = "-";

          // Lets check on the previous lines if we already have a list item with the same indent
          // so we can use its type, and eventually its number
          let parentMetYet = false;
          for (let i = line - 1; i >= 0; i -= 1) {
            const prevBlockquote = Editor.getBlockquote(
              this.adapter.getLine(i)
            );
            const prevIndentedText = Editor.getIndentedText(
              prevBlockquote.text
            );
            const prevListItem = Editor.getListItem(prevIndentedText.text);

            if (prevListItem.type === null) break;
            else if (
              prevIndentedText.level === newIndentedText.level &&
              prevBlockquote.level === blockquote.level
            ) {
              // We are outside the list
              // We found a list item that matches the indent ; let's copy his type
              newListType = prevListItem.type;
              if (prevListItem.type === "unordered")
                newListBullet = prevListItem.bullet;
              if (!parentMetYet && prevListItem.type === "ordered")
                newListNumber = Math.max(1, prevListItem.number + 1);
              break;
            } else if (prevIndentedText.level < newIndentedText.level) {
              parentMetYet = true;
            }
          }

          // Rebuild the line based on the modifications
          newIndentedText.text = Editor.setListItem(
            newListType === "ordered"
              ? {
                  type: "ordered",
                  number: newListNumber,
                  text: listItem.text
                }
              : {
                  type: "unordered",
                  bullet: newListBullet,
                  text: listItem.text
                }
          );
          const newBlockquote = {
            ...blockquote,
            text: Editor.setIndentedText(newIndentedText)
          };
          const newText = Editor.setBlockquote(newBlockquote);
          this.adapter.replaceRange(newText, range);

          // If the list item is empty, set the cursor position at the end of the list item
          if (listItem.text === "" && cursor && selections.length === 1) {
            this.adapter.setSelection(
              new Range(
                new Pos({
                  line: cursor.line,
                  ch: cursor.ch + (newText.length - text.length)
                })
              )
            );
            hasCursor = true;
          }
        }
      }
    );

    if (!hasCursor) {
      // No cursor position were set, let's select every affected lines
      this.adapter.setSelection(...this.expandSelectionsToLines(selections));
    }

    return true;
  }

  /**
   * Called when the user pastes something
   * @param {Event} event
   */
  handlePaste(event: any) {
    if (this.locked) return;
    const files = Array.from(event.clipboardData.items)
      .filter(item => item.type.match(/^image\//))
      .map(item => item.getAsFile());
    if (files.length) {
      this.uploadImages(files);
      event.preventDefault();
    }
  }

  /**
   * Called when the user drop some files
   * @param {Event} event
   */
  handleDrop(event: DragEvent) {
    if (this.locked || !event.dataTransfer) return;
    const files = Array.from(event.dataTransfer.files).filter(item =>
      item.type.match(/^image\//)
    );
    if (files.length) {
      this.uploadImages(files);
      event.preventDefault();
    }
  }

  /**
   * Upload images and insert a link
   * @param {Blob[]} files - Images to upload
   */
  uploadImages(files: Array<File | Blob>) {
    const selections = this.adapter.listSelections();
    const uploadingChanges = files.map((file: File | Blob, index) => {
      let text = "";
      const filename = file instanceof File ? file.name : "";
      if (selections[index]) {
        const title: string =
          this.adapter.getRange(selections[index]) || filename;
        text = `![${title}](Uploading...)`;
      } else {
        const title = filename;
        text = ` ![${title}](Uploading...)`;
        selections.push(
          new Range(
            selections[selections.length - 1].end,
            selections[selections.length - 1].end
          )
        );
      }

      return {
        text,
        selection: [text.length - 13, 1]
      };
    });

    const imageLinkSelections = this.mapRanges(
      (text, range, index) => uploadingChanges[index],
      selections
    );
    this.adapter.lock();
    this.locked = true;

    Promise.all(
      files.map(
        file =>
          this.options
            .upload(file)
            .then(url => url, error => `error while uploading ${error}`) // Silently catch errors
      )
    ).then(uploadURLs => {
      this.adapter.unlock();
      this.locked = false;
      this.mapRanges(
        (text, range, index) => uploadURLs[index],
        imageLinkSelections
      );
      this.adapter.focus();
    });
  }

  /**
   * Add a button to the toolbar
   * @param {object} opts
   * @param {string} opts.name - The name of the button (if empty, no button will be added)
   * @param {object|function} opts.action - The action of the button
   * @param {string} opts.keymap - A keymap to bind for this action
   * @param {object[]} opts.children - An array of sub-buttons
   * @param {Map} toolbar=this.toolbar - The toolbar where to add the buttons
   * @example
   * editor.addToolbarButton({ name: "bold", action: { type: "emphasis", level: 2 },
   *                           keymap: "Mod-B" });
   */
  addToolbarButton(
    { name, action, keymap, children }: EditorAction,
    _toolbar?: Toolbar
  ) {
    const toolbar = _toolbar || this.toolbar;
    const key = (keymap || "").replace("Mod", isOSX ? "Cmd" : "Ctrl");
    if (name) {
      const tbItem = {
        action,
        alt: key.replace("Cmd", "\u2318").replace("-", "+"),
        children: new Map()
      };

      if (children) {
        children.forEach(child =>
          this.addToolbarButton(
            {
              name: child.name,
              action: Object.assign({}, action, child.action)
            },
            tbItem.children
          )
        );
      }

      toolbar.set(name, tbItem);
    }

    if (key) {
      if (this.keymap.has(key)) throw new Error(`${key} is already registered`);
      this.keymap.set(key, action);
    }
  }
}

module.exports = Editor;

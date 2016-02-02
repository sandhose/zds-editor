require("codemirror/mode/gfm/gfm");
require("codemirror/addon/mode/loadmode");
let codemirror = require("codemirror");

class Editor {
  constructor(textarea, options) {
    if(!textarea) throw new Error("No textarea provided");
    this.options = {
      mode: {
        name: "gfm",
        gitHubSpice: false
      },
      extraKeys: {},
      tabMode: "indent",
      lineWrapping: true
    };

    this.buildToolbar();
    this.cm = codemirror.fromTextArea(textarea, this.options);

    // Append the toolbar
    let wrapper = this.cm.getWrapperElement();
    wrapper.parentNode.insertBefore(this.toolbar, wrapper);
  }

  buildToolbar() {
    this.toolbar = document.createElement("div");

    this.addToolbarButton({ name: "bold", type: "emphasis", level: 2, keymaps: ["Cmd-B", "Ctrl-B"] });
    this.addToolbarButton({ name: "italic", type: "emphasis", level: 1, keymaps: ["Cmd-I", "Ctrl-I"] });
    this.addToolbarButton({ name: "h1", type: "heading", level: 1 });
    this.addToolbarButton({ name: "h2", type: "heading", level: 2 });
    this.addToolbarButton({ name: "h3", type: "heading", level: 3 });
    this.addToolbarButton({ name: "h4", type: "heading", level: 4 });
    this.addToolbarButton({ name: "h5", type: "heading", level: 5 });
    this.addToolbarButton({ name: "h6", type: "heading", level: 6 });
    this.addToolbarButton({ name: "+quote", type: "blockquote", level: 1, keymaps: ["Cmd-'", "Ctrl-'"] });
    this.addToolbarButton({ name: "-quote", type: "blockquote", level: -1, keymaps: ["Cmd-Alt-'", "Ctrl-Alt-'"] });
  }

  getHeading(text) {
    let match = text.match(/^(#{0,6})(.*)$/);
    return { level: match[1].length, text: match[2].trim() };
  }

  setHeading({ level, text }) {
    return ("#".repeat(level) + " " + text).replace(/^ /, "");
  }

  getBlockquote(text) {
    let match = text.match(/^((> )*)(.*)$/);
    return { level: match[1].length / 2, text: match[3] };
  }

  setBlockquote({ level, text }) {
    return "> ".repeat(level) + text;
  }

  getEmphasis(text) {
    let start = text.charAt(0), match;
    if(start !== "*" && start !== "_") return { type: "*", level: 0, text };
    for(let i = 3; i > 0; i--) {
      match = text.match(new RegExp(`^\\${start}{${i}}(.*)\\${start}{${i}}`));
      if(match) {
        return { type: start, level: i, text: match[1] };
      }
    }
  }

  setEmphasis({ text, level, type }) {
    return type.repeat(level) + text + type.repeat(level);
  }

  orderPositions(positions) {
    return positions.sort((a, b) => {
      return a.line == b.line ? a.ch >= b.ch : a.line >= b.line
    });
  }

  extractLines(selections, fullLine = false) {
    if(!selections) selections = this.cm.doc.listSelections();

    // Extracting lines from selections
    let lines = fullLine ? new Set() : new Map();
    selections.forEach(sel => {
      let [start, end] = this.orderPositions([sel.anchor, sel.head]);
      for(let i = start.line; i <= end.line; i++) {
        if(fullLine) {
          lines.add(i);
        } else {
          if(!lines.has(i)) lines.set(i, []);
          lines.get(i).push([
            i == start.line ? start.ch : 0,
            i == end.line ? end.ch : this.cm.doc.getLine(i).length
          ]);
        }
      }
    });

    // Building ranges
    let ranges = [];
    if(fullLine) {
      ranges = Array.from(lines).map(l => {
        return { anchor: { line: l, ch: 0 }, head: { line: l, ch: this.cm.doc.getLine(l).length } };
      });
    } else {
      ranges = Array.from(lines).map(([line, lineRanges]) => {
        return lineRanges.map(([start, end]) => {
          return { anchor: { line, ch: start }, head: { line, ch: end } };
        });
      }).reduce((a, b) => a.concat(b));
    }

    return ranges;
  }

  mapRanges(mapFunc, ranges) {
    let newSelections = ranges.map(({ anchor, head }) => {
      let rangeText = this.cm.doc.getRange(anchor, head);

      let result = mapFunc(rangeText, { anchor, head });
      let resultText, resultSelection;

      if(typeof result === "string") {
        resultText = result;
      } else {
        resultText = result.text;
      }

      if(result.selection) {
        resultSelection = result.selection;
      } else {
        resultSelection = [0, resultText.length];
      }

      this.cm.doc.replaceRange(resultText, anchor, head);
      return {
        anchor: { line: anchor.line, ch: anchor.ch + resultSelection[0] },
        head: { line: anchor.line, ch: anchor.ch + resultSelection[1] }
      };
    });
    this.cm.doc.setSelections(newSelections);
  }

  handleAction({ type, level }) {
    if(type === "emphasis") {
      let ranges = this.extractLines(this.cm.doc.listSelections());
      this.mapRanges(text => {
        if(text === "") {
          return { text: "*".repeat(level * 2), selection: [level, level] };
        }

        let { type: emphType, level: emphLevel, text: innerText } = this.getEmphasis(text);
        if((emphLevel >> (level - 1)) % 2 === 1) emphLevel -= level;
        else emphLevel += level;
        return this.setEmphasis({ text: innerText, level: emphLevel, type: emphType });
      }, ranges);
    }
    else if(type === "heading") {
      let ranges = this.extractLines(this.cm.doc.listSelections(), true);
      this.mapRanges(text => {
        let { level: headingLevel, text: headingText } = this.getHeading(text);
        if(headingLevel === level) level = 0; // Toggle heading if same level
        if(headingText === "") {
          return { text: "#".repeat(level) + " ", selection: [level + 1, level + 1] };
        }
        return this.setHeading({ level, text: headingText });
      }, ranges);
    }
    else if(type === "blockquote") {
      let ranges = this.extractLines(this.cm.doc.listSelections(), true);
      this.mapRanges(text => {
        let { level: quoteLevel, text: quoteText } = this.getBlockquote(text);
        quoteLevel = Math.max(0, quoteLevel + level);
        if(quoteText === "") {
          return { text: "> ".repeat(quoteLevel), selection: [quoteLevel * 2, quoteLevel * 2] };
        }

        return this.setBlockquote({ level: quoteLevel, text: quoteText });
      }, ranges);
    }

    this.cm.focus();
  }

  addToolbarButton({ name, type, level, keymaps }) {
    if(name) {
      let button = document.createElement("button");
      button.innerHTML = name;
      button.addEventListener("click", e => this.handleAction({ type, level }));
      this.toolbar.appendChild(button);
    }

    if(keymaps) {
      keymaps.forEach(key => {
        if(this.options.extraKeys[key]) throw new Error(key + " is already registered");

        this.options.extraKeys[key] = () => this.handleAction({ type, level });
      });
    }
  }
}

module.exports = Editor;

new Editor(document.getElementById("editor"));

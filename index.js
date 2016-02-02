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
      lineWrapping: true,
      modeURL: "/mode/%N/%N.js"
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

  handleAction({ type, level }) {
    if(type === "emphasis") {
      let selections = this.cm.doc.listSelections().map(sel =>  {
        let selectionText = this.cm.doc.getRange(sel.anchor, sel.head);
        let { type: emphType, level: emphLevel, text: innerText } = this.getEmphasis(selectionText);
        if((emphLevel >> (level - 1)) % 2 === 1) emphLevel -= level;
        else emphLevel += level;
        return this.setEmphasis({ text: innerText, level: emphLevel, type: emphType });
      });
      this.cm.doc.replaceSelections(selections, "around");
    }
    else if(type === "heading") {
      let selections = this.cm.doc.listSelections();
      let newSelections = [];
      selections.forEach(sel => {
        let cursorLine = sel.anchor.line,
            lineText = this.cm.doc.getLine(cursorLine),
            { level: headingLevel, text: headingText } = this.getHeading(lineText);
        if(headingLevel === level) level = 0; // Toggle heading if same level
        this.cm.doc.replaceRange(this.setHeading({ level, text: headingText }), { line: cursorLine, ch: 0 }, { line: cursorLine, ch: Infinity });
        newSelections.push({
          anchor: { line: cursorLine, ch: level !== 0 && level + 1 },
          head: { line: cursorLine, ch: Infinity }
        });
      });
      this.cm.doc.setSelections(newSelections);
      this.cm.focus();
    }
    else if(type === "blockquote") {
      let lines = new Set();
      this.cm.doc.listSelections().forEach(sel => {
        let min = Math.min(sel.anchor.line, sel.head.line), max = Math.max(sel.anchor.line, sel.head.line);
        for(let i = min; i <= max; i++) {
          lines.add(i);
        }
      });

      lines.forEach(line => {
        let { level: quoteLevel, text: quoteText } = this.getBlockquote(this.cm.getLine(line));
        this.cm.doc.replaceRange(this.setBlockquote({ level: Math.max(0, quoteLevel + level), text: quoteText }), { line, ch: 0 }, { line, ch: Infinity });
      });

      let firstLine = Array.from(lines).reduce((a, b) => Math.min(a, b));
      let lastLine = Array.from(lines).reduce((a, b) => Math.max(a, b));
      this.cm.doc.setSelection({ line: firstLine, ch: 0 }, { line: lastLine, ch: this.cm.doc.getLine(lastLine).length });
    }
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

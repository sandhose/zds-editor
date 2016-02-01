require("codemirror/mode/gfm/gfm");
require("codemirror/addon/mode/loadmode");
let codemirror = require("codemirror");

class Editor {
  constructor(textarea, options) {
    if(!textarea) throw new Error("No textarea provided");
    this.cm = codemirror.fromTextArea(textarea, {
      mode: {
        name: "gfm",
        gitHubSpice: false
      },
      tabMode: "indent",
      lineWrapping: true,
      modeURL: "/mode/%N/%N.js"
    });

    this.toolbar = document.createElement("div");
    document.body.appendChild(this.toolbar);
    this.buildToolbar();
  }

  buildToolbar() {
    this.addToolbarButton({ name: "bold", type: "surround", level: 2 });
    this.addToolbarButton({ name: "italic", type: "surround", level: 1 });
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

  addToolbarButton({ name, type, level }) {
    let button = document.createElement("button");
    button.innerHTML = name;
    button.addEventListener("click", e => {
      let selections = this.cm.doc.getSelections().map(sel =>  {
        let { type: emphType, level: emphLevel, text: innerText } = this.getEmphasis(sel);
        if((emphLevel >> (level - 1)) % 2 === 1) emphLevel -= level;
        else emphLevel += level;
        return this.setEmphasis({ text: innerText, level: emphLevel, type: emphType });
      });
      this.cm.doc.replaceSelections(selections, "around");
    });
    this.toolbar.appendChild(button);
  }
}

module.exports = Editor;

new Editor(document.getElementById("editor"));

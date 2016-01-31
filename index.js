let codemirror = require("codemirror");

class Editor {
  constructor(textarea, options) {
    if(!textarea) throw new Error("No textarea provided");
    this.cm = codemirror.fromTextArea(textarea, {
      mode: "markdown",
      tabMode: "indent",
      lineWrapping: true,
      theme: "neo"
    });

    this.toolbar = document.createElement("div");
    document.body.appendChild(this.toolbar);
    this.buildToolbar();
  }

  buildToolbar() {
    this.addToolbarButton({ name: "bold", type: "surround", level: 3 });
  }

  addToolbarButton({ name, type, level }) {
    let button = document.createElement("button");
    button.innerHTML = name;
    button.addEventListener("click", e => {
      let selections = this.cm.doc.getSelections().map(sel =>  {
        return "*".repeat(level) + sel + "*".repeat(level)
      });
      this.cm.doc.replaceSelections(selections, "around");
    });
    this.toolbar.appendChild(button);
  }
}

module.exports = Editor;

new Editor(document.getElementById("editor"));

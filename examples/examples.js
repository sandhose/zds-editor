var options = { useTabToIndent: [true, 'partial', false] };
var optionsNode = document.getElementById('options');
var node, select, tmp;
for (var i in options) {
  node = document.createElement('div');
  select = document.createElement('select');
  for (var j in options[i]) {
    tmp = document.createElement('option');
    tmp.innerHTML = options[i][j].toString();
    tmp.value = j;
    if (editor.options[i] === options[i][j]) {
      tmp.selected = true;
    }

    select.appendChild(tmp);
  }
  node.innerHTML = i.toString() + ': ';
  node.appendChild(select);
  optionsNode.appendChild(node);
  node.addEventListener('change', function() {
    editor.options[i] = options[i][select.options[select.selectedIndex].value];
  });
}

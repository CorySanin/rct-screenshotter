(function () {
    const NOPOINTEREVENTSCLASS = 'children-pointer-events-none';
    let fileInput = document.getElementById('parkfile');
    let fileButton = document.getElementById('filebutton');
    let dropZone = document.getElementById('dropzone');

    fileInput.style.display = 'none';
    fileButton.style.display = 'initial';

    fileButton.addEventListener('click', function () {
        fileInput.click();
    });

    fileInput.addEventListener('change', updateFileButtonText);

    document.body.addEventListener('drop', function (ev) {
        ev.preventDefault();
        const fileList = ev.dataTransfer.files;
        fileInput.files = fileList;

        document.body.classList.remove(NOPOINTEREVENTSCLASS);
        dropZone.style.display = 'none';

        updateFileButtonText();
    });

    document.body.addEventListener('dragover', (event) => {
        event.preventDefault();
        document.body.classList.add(NOPOINTEREVENTSCLASS);
        dropZone.style.display = 'block';
    });

    document.body.addEventListener('dragleave', (event) => {
        document.body.classList.remove(NOPOINTEREVENTSCLASS);
        dropZone.style.display = 'none';
    });

    function updateFileButtonText() {
        removeChildren(fileButton);
        fileButton.appendChild(document.createTextNode(traverseOrDefault(fileInput, ['files', 0, 'name'], 'Browse for file...')));
    }

    function traverseOrDefault(node, path, orDefault) {
        if (path.length === 0) {
            return node;
        }
        let val = node[path.shift()];
        return (val && traverseOrDefault(val, path, orDefault)) || orDefault;
    }

    function removeChildren(element) {
        while (element.firstChild) {
            element.removeChild(element.lastChild);
        }
    }

    updateFileButtonText();
})();
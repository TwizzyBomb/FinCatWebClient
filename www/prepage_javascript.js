document.addEventListener('DOMContentLoaded', function() {
    const fileDrop = document.getElementById('file-drop');
    const textBox = document.getElementById('text-section');

    fileDrop.addEventListener('dragover', function(e) {
        e.preventDefault();
        fileDrop.classList.add('dragover');
    });

    fileDrop.addEventListener('dragleave', function(e) {
        e.preventDefault();
        fileDrop.classList.remove('dragover');
    });

    fileDrop.addEventListener('drop', function(e) {
        e.preventDefault();
        fileDrop.classList.remove('dragover');

        const files = e.dataTransfer.files;
        handleFiles(files);
    });

    fileDrop.addEventListener('click', function() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.multiple = true;
        fileInput.addEventListener('change', function(e) {
            const files = e.target.files;
            handleFiles(files);
        });
        fileInput.click();
    });

    function handleFiles(files) {
        if (files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                var fileName = files[i].name;
                console.log('Selected file:', fileName);

                // You can perform further operations with the selected files here
                textBox.innerText = fileName;


            }
        }
    }
});
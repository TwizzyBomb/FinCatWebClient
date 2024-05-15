async function waitForInputAndEnter(){
    return new Promise((resolve) => {
        // Set up event listener for input event on the text box
        document.getElementById('input-box').addEventListener('keydown', function(event){
            // Check if Enter key was pressed
            if (event.key === 'Enter') {
                // Resolve the Promise with the entered value
                resolve(event.target.value);
            }
        })
    })
}

// Chat GPT ftw!
const reviewButton = document.getElementById("review-button")
    reviewButton.addEventListener("click", function() {
    var fileInput = document.createElement("input");
    fileInput.type = "file"; // this and the above are what actually create the file chooser!
    fileInput.accept = ".csv"; // Set the accepted file types if needed

    fileInput.addEventListener("change", function() {
        var file = this.files[0];
        const reader = new FileReader();

        reader.onload = async function(event) {
            const csvData = event.target.result;
            const rows = csvData.split('\n'); // Split by new line to get rows
            let jsonString = "";
            let childCatName = "";

            // Process each row
            for(index = 0; index<=rows.length; index++) {
                const columns= rows[index].split(','); // Split by comma to get columns
                console.log('Row ' + (index + 1) + ':', columns);
                // ask user
                document.getElementById("input-box").value = "";
                document.getElementById("prompt-box").innerText = "How would you like to categorize:" + columns[4];

                // create charge
                let chargeName = await waitForInputAndEnter();
                if (chargeName.includes(":")) {
                    // child category
                    let pos = chargeName.indexOf(":");
                    childCatName = chargeName.substring(pos + 1, chargeName.length);
                }
                const charge = {
                    transactionDate: columns[0].replace(/"/g, ""),
                    postingDate: "",
                    description: columns[4].replace(/"/g, ""),
                    amount: columns[1].replace(/"/g, ""),
                    category: (childCatName == "") ? chargeName : childCatName,
                    total: columns[1].replace(/"/g, "")
                };

                // send charge over
                let xhr = new XMLHttpRequest();
                xhr.open("POST", "http://localhost:8080/api/add");
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.setRequestHeader('Raw-Category-Name', chargeName);
                xhr.onload = function() {
                  if (xhr.status === 200) {
                      console.log("charge posted successfully.");
                      console.log(xhr.responseText);
                  } else {
                      console.error("charge post failed.");
                  }
                };

                // serialize the charge to JSON
                try {
                   jsonString  = JSON.stringify(charge);
                } catch (error) {
                    console.error('!Invalid JSON string:', error);
                }
                xhr.send(jsonString);
//                let parsedJson = JSON.parse(xhr.responseText)
//                console.log(parsedJson);

            }
        };
        reader.onerror = function(e) {
        console.error('Error reading file:', e.target.error);
        };

        // Read the file as text
        reader.readAsText(file);

        //log
        console.log("filename changed:", file.name);
    });
    fileInput.click();

});

const breakdownBtn = document.getElementById("breakdown-button");
breakdownBtn.addEventListener("click", function() {
    var responseData = "";
    var bigTotal = 0.0;

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "http://localhost:8080/api/breakdown", false);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onload = function() {
        if (xhr.status === 200) {
          responseData = xhr.responseText;
          console.log(responseData);
        } else {
          console.error("Get breakdown failed");
        }
    };
    xhr.send();

    // post response - might go in the onload
    const parsedJson = JSON.parse(responseData);

    // loop through the keys of the object
    for (let key in parsedJson) {
    // check if the value corresponding to the key is an object
      if (typeof parsedJson[key] === 'object') {
        console.log(`Category: ${key}`);

        // Loop through the keys of the inner object
        for (let parentCatKey in parsedJson[key]){
          // parsedJson[key] = breakdown list so the inner key is loan, food, etc.
          console.log(`parentCatKey: ${parentCatKey}`);
          for (let childCatKey in parsedJson[key][parentCatKey]){
            // loop through child cats
            console.log(`childCatKey: ${childCatKey} childCatValue: ${parsedJson[key][parentCatKey][childCatKey]}`);

          }
        }
      } else {
        // top level total
        bigTotal = parsedJson[key];
        console.log(`${key}: ${parsedJson[key]}`);
      }
    }

//    let total = parsedJson.total;
//    var keys = Object.keys(parsedJson.breakdownList);
//    var parentMap = parsedJson.breakdownList;

//    for (let [outerKey, innerMap] of parsedJson.entries()) {
//      for (let [innerKey, innerValue] of innerMap.entries()){
//        console.log("Outer key: ${outerKey}, Inner key: ${innerKey}, Inner value: ${innerValue}")
//      }
//    }
//    keys.forEach(innerMap => {
//      Object.keys(innerMap).forEach(innerKey => {
//        console.log("Inner key: ${innerKey}, Inner value: ${innerMap[innerKey]}");
//      });
//    });


});
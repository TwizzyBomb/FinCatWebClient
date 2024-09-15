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
	
	const sankeyData = {
		nodes: [],
		links: []
	};
	
	const nodeMap = new Map();
	
	function addNode(name) {
		if (!nodeMap.has(name)) {
			nodeMap.set(name, nodeMap.size);
			sankeyData.nodes.push({ name });
		}
		return nodeMap.get(name);
	}
	
	extractKeys(parsedJson).forEach(({ parent, child }) => {
		const source = addNode(parent);
		const target = addNode(child);
		sankeyData.links.push({
			source,
			target,
			value: 1 // modify based and actual financial data
		});
	});
	
	
	console.log(sankeyData);
	
    // START ( d3 - sankey specific ) START
      // Set up SVG dimensions
      const width = 800;
      const height = 800;

      // Create a scale for the colors
      const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

      // Define a color scale
      const color = d3.scaleOrdinal(d3.schemeCategory10);

      // Create SVG element
      const svg = d3.select("#sankey-container").append("svg")
        .attr("width", width)
        .attr("height", height);

      // Create Sankey layout
      const sankey = d3.sankey()
        .nodeWidth(15)
        .nodePadding(10)
        .extent([[1, 1], [width - 1, height - 6]]);

      // Process data
      const { nodes, links } = sankey(sankeyData);

      // Draw links
      svg.append("g")
        .selectAll(".link")
        .data(links)
        .enter().append("path")
          .attr("class", "link")
          .attr("d", d3.sankeyLinkHorizontal())
          .style("stroke-width", d => Math.max(1, d.width))
          .style("stroke-opacity", 0.2)
          .style("fill", "none")
          .style("stroke", d => color(d.source.id));

      // Draw nodes
      svg.append("g")
        .selectAll(".node")
        .data(nodes)
        .style('fill', d => color(d.id))
        .enter().append("rect")
          .attr("class", "node")
          .attr("x", d => d.x0)
          .attr("y", d => d.y0)
          .attr("height", d => d.y1 - d.y0)
          .attr("width", d => d.x1 - d.x0)
        .append("title")
          .text(d => `${d.id}\n${d.value}`);

      // Add node labels
      svg.append("g")
        .selectAll(".node-label")
        .data(nodes)
        .enter().append("text")
          .attr("class", "node-label")
          .attr("x", d => d.x0 - 6)
          .attr("y", d => (d.y1 + d.y0) / 2)
          .attr("dy", "0.35em")
          .attr("text-anchor", "end")
          .text(d => d.id);
    // END ( d3 - sankey specific ) END
});

// function to extract parent and child keys
function extractKeys(data) {
	let result = [];
	
	function recurse(obj, parentKey) {
		if (typeof obj === 'object') {
			for (const key in obj) {
				if (typeof obj[key] === 'object') {
					result.push({parent: parentKey, child: key});
					recurse(obj[key], key); // recursive call for nested objects
				}
			}
		}
	}
	
	if (data && data.charges && data.charges.breakdownList) {
		recurse(data.charges.breakdownList, "charges")
	}
	
	return result;
}



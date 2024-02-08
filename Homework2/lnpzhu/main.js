// Define a helper function to convert string numbers to actual numbers
function convertToNumeric(d) {
    d.Price = +d.Price;
    d.Rank = +d.Rank;
    return d;
}


function drawBarChart(originData, data) {
    // Clear any existing content in the SVG
    var svgContainer = d3.select("#bar-chart-svg");
    svgContainer.selectAll("*").remove();

    // Dynamically determine the width and height based on the container's current size
    var svgWidth = svgContainer.node().getBoundingClientRect().width;
    var svgHeight = svgContainer.node().getBoundingClientRect().height;

    var margin = { top: 20, right: 20, bottom: 150, left: 60 },
        width = svgWidth - margin.left - margin.right,
        height = svgHeight - margin.top - margin.bottom;

    // Continue with the rest of the function as before, using dynamic width and height
    var sortedData = data.sort(function (a, b) {
        return d3.descending(a.count, b.count);
    });

    // Set up the scales
    var xScale = d3.scaleBand()
        .rangeRound([0, width])
        .padding(0.08)
        .domain(sortedData.map(function (d) { return d.brand; }));

    var yScale = d3.scaleLinear()
        .rangeRound([height, 0])
        .domain([0, d3.max(sortedData, function (d) { return d.count; })]);

    // Select the SVG element by its ID and set its dimensions
    var svg = d3.select("#bar-chart-svg")
        .attr("viewBox", `0 0 ${svgWidth} ${height + margin.top + margin.bottom + 20}`)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top + 30})`);

    svg.selectAll(".bar")
        .data(sortedData)
        .enter().append("rect")
        .attr("class", "bar")
        .on("click", function (d) {
            // Filter data based on the clicked category and pass it to the pie chart
            var clickedCategoryData = originData.filter(function (p) {
                return p.Brand === d.brand;
            });
            drawPieChart(clickedCategoryData);
        })
        .attr("x", d => xScale(d.brand) + 3.0)
        .attr("width", xScale.bandwidth())
        .attr("y", height)
        .attr("height", 0)
        .attr("fill", "steelblue")
        .transition()
        .duration(2000)
        .attr("y", d => yScale(d.count))
        .attr("height", d => height - yScale(d.count));

    // Add the X Axis
    var xAxis = svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(-3.5, ${height})`)
        .call(d3.axisBottom(xScale));

    // Rotate the labels and adjust their position to align with bars
    xAxis.selectAll("text")
        .attr("transform", "rotate(-65)")
        .attr("text-anchor", "end")
        .attr("dx", "-0.1em")
        .attr("dy", "0.1em")
        .style("font-size", "8.5px");

    // Adjust the position of X axis label ("Brand")
    svg.append("text")
        .attr("transform", `translate(${width / 2 + 70}, ${height + margin.bottom - 30})`)
        .style("text-anchor", "middle")
        .style("font-weight", "bold")
        .text("Brands");

    // Add the Y Axis
    svg.append("g")
        .attr("class", "y-axis")
        .attr("transform", "translate(-3,0)") // This moves the y-axis 5 units to the left
        .call(d3.axisLeft(yScale));

    // Y Axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left + 10)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-weight", "bold")
        .text("Number of Products");

    // Title for the bar chart
    svg.append("text")
        .attr("x", (width / 2))
        .attr("y", margin.top)
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .style("text-decoration", "underline")
        .text("Product Count by Brand for rank >= 3.5 (click on the bars)");

    // Filter the data for SHISEIDO products with a price of 100 and above
    var filteredData = originData.filter(function (d) {
        return d.Brand === "SHISEIDO";
    });

    drawPieChart(filteredData);
}

// Function to create the pie chart
function drawPieChart(data) {
    // Clear any existing content in the SVG
    var svgContainer = d3.select("#pie-chart-svg");
    svgContainer.selectAll("*").remove();

    // Dynamically determine the width and height
    var svgWidth = svgContainer.node().getBoundingClientRect().width;
    var svgHeight = svgContainer.node().getBoundingClientRect().height;

    var margin = { top: 20, right: 20, bottom: 20, left: 20 },
        width = svgWidth - margin.left - margin.right - 0,
        height = svgHeight - margin.top - margin.bottom - 0,
        radius = Math.min(width, height) / 2;

    // Set up the color scale
    var color = d3.scaleOrdinal(d3.schemeCategory10);

    // Compute the position of each group on the pie
    var pie = d3.pie()
        .sort(null)
        .value(function (d) { return d.value; });

    var arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

    // Append the svg object to the div
    var svg = svgContainer
        .attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`)
        .append("g")
        .attr("transform", "translate(" + width / 2.8 + "," + height / 1.9 + ")");

    // Compute the position of each group on the pie
    var pieData = d3.nest()
        .key(function (d) { return d.Label; })
        .rollup(function (v) { return v.length; })
        .entries(data);

    // Build the pie chart
    var g = svg.selectAll(".arc")
        .data(pie(pieData))
        .enter().append("g")
        .attr("class", "arc");

    g.append("path")
        .attr("d", arc)
        .style("fill", function (d) { return color(d.data.key); })
        .on("click", function (d) {
            d3.select("#parallel-coordinates-svg").selectAll("*").remove();
            // Filter data based on the clicked category and pass it to the parallel coordinate chart
            var clickedCategoryData = data.filter(function (p) {
                return p.Label === d.data.key;
            });
            var parallelData = prepareParallelData(clickedCategoryData);
            drawParallelCoordinateChart(parallelData);
        });;

    // Updated text labels to include the count of elements in each category
    g.append("text")
        .attr("transform", function (d) { return "translate(" + arc.centroid(d) + ")"; })
        .attr("dy", ".35em")
        .text(function (d) { return d.data.value; }) // Include count in label
        .style("text-anchor", "middle");

    var legend = svg.selectAll(".legend")
        .data(color.domain())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function (d, i) { return "translate(" + (-35 - 85) + "," + (i * 20 - radius + height / 1.5) + ")"; });

    legend.append("rect")
        .attr("x", width / 1.7 - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);

    legend.append("text")
        .attr("x", width / 2 + 30)
        .attr("y", 9)
        .attr("dy", "0.5em")
        .style("text-anchor", "end")
        .text(function (d) { return d; });

    svg.append("text")
        .attr("x", 0)
        .attr("y", height / 2 + 26)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("text-decoration", "underline")
        .style("font-weight", "bold")
        .text(data[0].Brand + " Products Quantity by Category");

    // Default to showing the largest category if no segment is clicked
    var largestCategory = pieData.reduce((prev, current) => (prev.value > current.value) ? prev : current).key;
    var dataForLargestCategory = data.filter(d => d.Label === largestCategory);
    var parallelData = prepareParallelData(dataForLargestCategory);
    drawParallelCoordinateChart(parallelData);
}

function prepareParallelData(data) {
    // Define normalization function (min-max scaling to 0-5 range)
    function normalize(value, min, max) {
        return ((value - min) / (max - min)) * 5;
    }

    // Find min and max for Price and Rank
    const priceExtent = d3.extent(data, d => d.Price);
    const rankExtent = d3.extent(data, d => d.Rank);

    // Normalize data
    return data.map(d => ({
        Label: d.Label,
        Brand: d.Brand,
        Name: d.Name,
        Price: normalize(d.Price, priceExtent[0], priceExtent[1]),
        Rank: normalize(d.Rank, rankExtent[0], rankExtent[1]),
        SkinTypeSum: parseInt(d.Combination) + parseInt(d.Dry) + parseInt(d.Normal) + parseInt(d.Oily) + parseInt(d.Sensitive)
    }));
}

function drawParallelCoordinateChart(data) {
    // Clear existing SVG content
    var svgContainer = d3.select("#parallel-coordinates-svg");
    svgContainer.selectAll("*").remove();

    // Dynamically determine dimensions
    var svgWidth = svgContainer.node().getBoundingClientRect().width;
    var svgHeight = svgContainer.node().getBoundingClientRect().height - 40;

    var margin = { top: 20, right: 50, bottom: 10, left: -150 },
        width = svgWidth - margin.left - margin.right,
        height = svgHeight - margin.top - margin.bottom;

    var svg = svgContainer
        .attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Define scales for each dimension
    var x = d3.scalePoint().range([0, width]).padding(1).domain(["Price", "Rank", "SkinTypeSum"]);
    var y = {};
    ["Price", "Rank", "SkinTypeSum"].forEach(function (d) {
        y[d] = d3.scaleLinear().domain(d3.extent(data, function (p) { return +p[d]; })).range([height, 0]);
    });

    // Function to draw the lines
    function path(d) {
        return d3.line()(["Price", "Rank", "SkinTypeSum"].map(function (p) { return [x(p), y[p](d[p])]; }));
    }

    // Unique color scale
    var color = d3.scaleOrdinal(d3.schemeCategory10);

    // Draw the lines
    var lines = svg.selectAll(".line")
        .data(data)
        .enter().append("path")
        .attr("class", "line")
        .attr("d", path)
        .style("fill", "none")
        .style("stroke", function (d, i) { return color(i); }) // Unique color for each line
        .style("stroke-width", "1px");

    // Add axes
    ["Price", "Rank", "SkinTypeSum"].forEach(function (d) {
        svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(" + x(d) + ")")
            .call(d3.axisLeft(y[d]));
        svg.append("text")
            .style("text-anchor", "middle")
            .attr("y", height + margin.bottom + 15)
            .attr("x", x(d))
            .text(d);
    });

    // Calculate label spacing
    var labelSpacing = height / data.length;

    // Add labels with the same color as lines
    svg.selectAll(".label")
        .data(data)
        .enter().append("text")
        .attr("class", "label")
        .attr("x", width + -200) // Adjust X-position to align within the right margin
        .attr("y", function (d, i) { return i * labelSpacing; }) // Regular interval based on index
        .text(function (d) { return d.Name; })
        .style("fill", function (d, i) { return color(i); })
        .style("font-size", "8px"); // Adjust font size as needed


    lines.on("mouseover", function (event, d, i) {
        // Dim other lines
        d3.selectAll(".line").style("opacity", 0.1);

        // Highlight hovered line
        d3.select(this).style("stroke-width", "3px").style("opacity", 1);

        // Highlight corresponding label
        svg.selectAll(".label")
            .style("opacity", 0.1) // Dim all labels
            // Filter on event.Name to highlight the corresponding label
            .filter(function (e) { return e.Name === event.Name; })
            .style("opacity", 1) // Highlight the corresponding label
            .style("font-weight", "bold");
    })
        .on("mouseout", function (d) {
            // Reset line style
            d3.selectAll(".line").style("opacity", 1).style("stroke-width", "1px");

            // Reset label opacity
            svg.selectAll(".label").style("opacity", 1).style("font-weight", "normal");
        });

    // Add a title
    var titleText1 = 'Cosmetic Products Parallel Coordinate Chart of Brand';
    var titleText2 = data[0].Brand + ' Category ' + data[0].Label;

    // Append the text element for the title
    var title = svg.append('text')
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left - 3)
        .attr("x", 0 - (height / 2))
        .style("text-anchor", "middle")
        .style('font-size', '12px')
        .style("font-weight", "bold")
        .style('text-decoration', 'underline');

    // Append the first line of the title
    title.append('tspan')
        .attr('x', 0 - (height / 2)) // Align the tspan
        .attr('dy', '1em') // Position the tspan
        .text(titleText1);

    // Append the second line of the title
    title.append('tspan')
        .attr('x', 0 - (height / 2)) // Align the tspan to match the first line
        .attr('dy', '1em') // Move the tspan to a new line
        .text(titleText2);

}


function createBarChartData(data) {
    var brandCounts = d3.nest()
        .key(function (d) { return d.Brand; })
        .rollup(function (v) { return v.length; })
        .entries(data)
        .map(function (group) {
            return {
                brand: group.key,
                count: group.value
            };
        });
    return brandCounts;
}

function updateScale() {
    var fullWidth = window.innerWidth;
    var fullHeight = window.innerHeight;

    var svgWidth = fullWidth / 3;
    var svgHeight = fullHeight;

    var margin = { top: 20, right: 20, bottom: 40, left: 40 };
    var width = svgWidth - margin.left - margin.right;
    var height = svgHeight - margin.top - margin.bottom;

    // Update or append the 'g' element for bar chart
    var gBarChart = d3.select("#bar-chart-svg").select("g");
    if (gBarChart.empty()) {
        d3.select("#bar-chart-svg")
            .attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    } else {
        d3.select("#bar-chart-svg")
            .attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`);
        gBarChart.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    }

    // Update or append the 'g' element for pie chart
    var gPieChart = d3.select("#pie-chart-svg").select("g");
    if (gPieChart.empty()) {
        d3.select("#pie-chart-svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight)
            .append("g")
            .attr("transform", "translate(" + svgWidth / 2 + "," + svgHeight / 2 + ")");
    } else {
        d3.select("#pie-chart-svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight);
        gPieChart.attr("transform", "translate(" + svgWidth / 2 + "," + svgHeight / 2 + ")");
    }

    // Update or append the 'g' element for parallel coordinates chart
    var gParallelCoordinates = d3.select("#parallel-coordinates-svg").select("g");
    if (gParallelCoordinates.empty()) {
        d3.select("#parallel-coordinates-svg")
            .attr("width", svgWidth + margin.left + margin.right)
            .attr("height", svgHeight + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
    } else {
        d3.select("#parallel-coordinates-svg")
            .attr("width", svgWidth + margin.left + margin.right)
            .attr("height", svgHeight + margin.top + margin.bottom);
        gParallelCoordinates.attr("transform", `translate(${margin.left},${margin.top})`);
    }
}


// Load the data once and then create each chart
d3.csv("cosmetics.csv", convertToNumeric).then(function (data) {
    filteredData = data.filter(function (d) {
        return d.Rank >= 3.5;
    });
    var barChartData = createBarChartData(data);
    drawBarChart(filteredData, barChartData);
    window.addEventListener('resize', function () {
        drawBarChart(filteredData, barChartData);
    });
});


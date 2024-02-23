var colorScheme = [
  '#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f',
  '#ff7f00', '#cab2d6', '#6a3d9a', '#ffff99', '#b15928'
];

var colors = {
  barColor: colorScheme[0],
  selectedBarColor: colorScheme[4],
  greyBarColor: '#cccccc',
  highlightBarColor: colorScheme[2],
};
// Define a helper function to convert string numbers to actual numbers
function convertToNumeric(d) {
  d.Price = +d.Price;
  d.Rank = +d.Rank;
  return d;
}


function drawScatterChart(data) {
  data = data.filter(function (d) {
    return d.Rank >= 3;
  });
  let scatterLeft = 60, scatterTop = 10;
  var svgContainer = d3.select('#scatter-chart-svg');
  var svgWidth = svgContainer.node().getBoundingClientRect().width;
  var svgHeight = svgContainer.node().getBoundingClientRect().height;
  let scatterMargin = { top: 50, right: 60, bottom: 25, left: 50 },
    scatterWidth = svgWidth - scatterMargin.left - scatterMargin.right,
    scatterHeight = svgHeight - scatterMargin.top - scatterMargin.bottom;
  const svg = d3.select('#scatter-chart-svg')

  const g1 =
    svg.append('g')
      .attr(
        'width', scatterWidth + scatterMargin.left + scatterMargin.right)
      .attr(
        'height',
        scatterHeight + scatterMargin.top + scatterMargin.bottom)
      .attr('transform', `translate(${scatterLeft}, ${scatterTop})`)

  // X label
  g1.append('text')
    .attr('x', scatterWidth / 2)
    .attr('y', scatterHeight + 50)
    .attr('font-size', '20px')
    .attr('text-anchor', 'middle')
    .text('Cosmetic Product Rank (3.0 - 5.0)')


  // Y label
  g1.append('text')
    .attr('x', -(scatterHeight / 2))
    .attr('y', -40)
    .attr('font-size', '20px')
    .attr('text-anchor', 'middle')
    .attr('transform', 'rotate(-90)')
    .text('Cosmetic Product Price $ 0 - $ 400')

  // X ticks
  const x1 = d3.scaleLinear().domain([3, d3.max(data, d => d.Rank)]).range([
    0, scatterWidth
  ])

  const xAxisCall = d3.axisBottom(x1).ticks(7)
  g1.append('g')
    .attr('transform', `translate(0, ${scatterHeight})`)
    .call(xAxisCall)
    .selectAll('text')

  // Y ticks
  const y1 = d3.scaleLinear().domain([0, d3.max(data, d => d.Price)]).range([
    scatterHeight, 0
  ])

  const yAxisCall = d3.axisLeft(y1).ticks(13)
  g1.append('g').call(yAxisCall)

  var circleG = g1.append('g');

  // Add selected field to the data
  data.forEach(function (d) {
    d.selected = false;
  });

  // data for brushed data
  var brand_q = data.reduce(
    (s, { Brand }) => (s[Brand] = (s[Brand] || 0) + 1, s), {});
  var brand_data = Object.keys(brand_q).map((key) => ({ Brand: key, count: 0 }));
  function brushed(event) {
    var extent = event.selection;
    for (let i = 0; i < brand_data.length; i++) brand_data[i].count = 0;

    circles.classed('selected', function (d) {
      selected = x1(d.Rank) >= extent[0][0] && x1(d.Rank) <= extent[1][0] &&
        y1(d.Price) >= extent[0][1] && y1(d.Price) <= extent[1][1];
      for (let i = 0; i < 30; i++) {
        if (selected && (d.Brand.localeCompare(Object.keys(brand_q)[i]) === 0))
          brand_data[i].count++;
      }
      if (selected) {
        d.selected = true;
        // Fill the selected circles with a different color
        d3.select(this).attr('fill', colors['selectedBarColor']);
      }
      else {
        d.selected = false;
        // Reset the color of the unselected circles
        d3.select(this).attr('fill', colors['barColor']);
      }

      return selected;
    });
  }
  function endbrushed() {
    // Filter the data based on the brushed data
    var brushedData = data.filter(function (d) {
      return d.selected === true;
    });
    brushedData = brushedData.length === 0 ? data : brushedData;
    drawBarChart(brushedData, createBarChartData(brushedData));
  }
  // brush
  var brush = d3.brush()
    .extent([[0, 0], [scatterWidth, scatterHeight]])
    .on('start', brushed)
    .on('brush', brushed)
    .on('end', endbrushed);
  circleG.call(brush);


  var rects = circleG.selectAll('circle').data(data)
  var circles = rects.enter()
    .append('circle')
    .attr(
      'cx',
      function (d) {
        return x1(d.Rank);
      })
    .attr(
      'cy',
      function (d) {
        return y1(d.Price);
      })
    .attr('r', 3)
    .attr('fill', colors['barColor'])
    .attr('opacity', '0.8')
    .attr('stroke', 'none');

  circles
    .on('mousemove',
      (event) => {
        d3.select('#tooltip')
          .style('left', (event.pageX + 15) + 'px')
          .style('top', (event.pageY + 15) + 'px')
      })
    .on('mouseleave', () => {
      d3.select('#tooltip').style('opacity', 0);
    });
}


function drawBarChart(originData, data) {
  // Clear any existing content in the SVG
  var svgContainer = d3.select('#bar-chart-svg');
  svgContainer.selectAll('*').remove();

  // Dynamically determine the width and height based on the container's
  // current size
  var svgWidth = svgContainer.node().getBoundingClientRect().width;
  var svgHeight = svgContainer.node().getBoundingClientRect().height;
  const visibleBars = 20;
  let currentIndex = 0;

  var margin = { top: 20, right: 20, bottom: 150, left: 60 },
    width = svgWidth - margin.left - margin.right,
    height = svgHeight - margin.top - margin.bottom;

  // Continue with the rest of the function as before, using dynamic width
  // and height
  var sortedData = data.sort(function (a, b) {
    return d3.descending(a.count, b.count);
  });


  // Set up the scales
  var xScale = d3.scaleBand().rangeRound([0, width]).padding(0.08);

  var visibleBrands = sortedData.slice(0, 10).map(d => d.brand);
  xScale.domain(visibleBrands);

  var yScale = d3.scaleLinear().rangeRound([height, 0]).domain([
    0,
    d3.max(
      sortedData,
      function (d) {
        return d.count;
      })
  ]);

  // Select the SVG element by its ID and set its dimensions
  var svg =
    d3.select('#bar-chart-svg')
      .attr(
        'viewBox',
        `0 0 ${svgWidth} ${height + margin.top + margin.bottom + 15}`)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top + 30})`);

  var selectedBar = null;
  var colorScale =
    d3.scaleOrdinal(d3.schemeCategory10).domain(sortedData.map(d => d.brand));

  var bars = svg.selectAll('.bar')
    .data(sortedData)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', d => xScale(d.brand) + 3.0)
    .attr('width', xScale.bandwidth())
    .attr('y', height)
    .attr('height', 0)
    .attr('fill', colors['barColor']);
  bars.attr('y', d => yScale(d.count))
    .attr('height', d => height - yScale(d.count))
    .attr('fill', colors['barColor']);
  bars.on('mouseover',
    function () {
      // Highlight the hovered bar in blue
      d3.select(this).attr('fill', colors['highlightBarColor']);
      // Grey out all other bars
      svg.selectAll('.bar')
        .filter(function () {
          return this !== d3.select(this).node();
        })
        .attr('fill', 'lightgrey');
    })
    .on('mouseout',
      function () {
        // Reset all bars to blue if none is selected or to the default
        // state
        let fill = selectedBar ? 'lightgrey' : colors['barColor'];
        svg.selectAll('.bar').transition().duration(50).attr(
          'fill', function () {
            return selectedBar && this === selectedBar ?
              colors['selectedBarColor'] :
              fill;
          });
      })
    .on('click', function (e, d) {
      // This assumes you have a way to uniquely identify bars, e.g., by
      // 'd.brand'
      if (selectedBar === this) {
        selectedBar = null;  // Deselect if the same bar is clicked
        svg.selectAll('.bar').transition().duration(500).attr(
          'fill', colors['barColor']);  // Reset all bars to blue
      } else {
        selectedBar = this;  // Update selected bar
        d3.select(this).transition().duration(500).attr(
          'fill', colors['selectedBarColor']);  // Highlight the clicked
        // bar in orange
        svg.selectAll('.bar')
          .filter(function () {
            return this !== selectedBar;
          })
          .transition()
          .duration(500)
          .attr('fill', 'lightgrey');  // Grey out others
        // Filter data for the pie chart based on the clicked bar's data
        var clickedCategoryData = originData.filter(function (p) {
          return p.Brand === d.brand;
        });
        drawPieChart(clickedCategoryData);
      }
    });


  // Add the X Axis
  var xAxis = svg.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(-3.5, ${height})`)
    .call(d3.axisBottom(xScale));
  updateChart(currentIndex);

  // Rotate the labels and adjust their position to align with bars
  xAxis.selectAll('text')
    .attr('transform', 'rotate(-65)')
    .attr('text-anchor', 'end')
    .attr('dx', '-0.8em')
    .attr('dy', '0.1em')
    .style('font-size', '8.5px');

  // Adjust the position of X axis label ("Brand")
  svg.append('text')
    .attr(
      'transform',
      `translate(${width / 2 + 70}, ${height + margin.bottom - 30})`)
    .style('text-anchor', 'middle')
    .style('font-weight', 'bold')
    .text('Brands');

  // Add the Y Axis
  svg.append('g')
    .attr('class', 'y-axis')
    .attr(
      'transform',
      'translate(-3,0)')  // This moves the y-axis 5 units to the left
    .call(d3.axisLeft(yScale));

  // Y Axis label
  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 0 - margin.left + 10)
    .attr('x', 0 - (height / 2))
    .attr('dy', '1em')
    .style('text-anchor', 'middle')
    .style('font-weight', 'bold')
    .text('Number of Products');

  // Title for the bar chart
  svg.append('text')
    .attr('x', (width / 2))
    .attr('y', margin.top)
    .attr('text-anchor', 'middle')
    .style('font-size', '20px')
    .style('text-decoration', 'underline')
    .text('Product Count by Brand for rank >= 3.0');

  // Filter the data for SHISEIDO products with a price of 100 and above
  var filteredData = originData.filter(function (d) {
    return d.Brand === 'SHISEIDO';
  });
  function updateChart(startIndex) {
    const visibleData = sortedData.slice(startIndex, startIndex + visibleBars);
    xScale.domain(visibleData.map(d => d.brand));

    xAxis.call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-65)');
    const bars = svg.selectAll('.bar').data(visibleData, d => d.brand);

    bars.enter()
      .append('rect')
      .attr('class', 'bar')
      .merge(bars)
      .attr('x', d => xScale(d.brand))
      .attr('y', d => yScale(d.count))
      .attr('width', xScale.bandwidth())
      .attr('height', d => height - yScale(d.count))
      .attr('fill', colors['barColor']);
    bars.on('mouseover',
      function () {
        // Highlight the hovered bar in blue
        d3.select(this).attr('fill', colors['highlightBarColor']);
        // Grey out all other bars
        svg.selectAll('.bar')
          .filter(function () {
            return this !== d3.select(this).node();
          })
          .attr('fill', 'lightgrey');
      })
      .on('mouseout',
        function () {
          // Reset all bars to blue if none is selected or to the
          // default state
          let fill = selectedBar ? 'lightgrey' : colors['barColor'];
          svg.selectAll('.bar').transition().duration(50).attr(
            'fill', function () {
              return selectedBar && this === selectedBar ?
                colors['selectedBarColor'] :
                fill;
            });
        })
      .on('click', function (e, d) {
        // This assumes you have a way to uniquely identify bars, e.g., by
        // 'd.brand'
        if (selectedBar === this) {
          selectedBar = null;  // Deselect if the same bar is clicked
          svg.selectAll('.bar').transition().duration(500).attr(
            'fill', colors['barColor']);  // Reset all bars to blue
        } else {
          selectedBar = this;  // Update selected bar
          d3.select(this).transition().duration(500).attr(
            'fill', colors['selectedBarColor']);  // Highlight the clicked
          // bar in orange
          svg.selectAll('.bar')
            .filter(function () {
              return this !== selectedBar;
            })
            .transition()
            .duration(500)
            .attr('fill', 'lightgrey');  // Grey out others
          // Filter data for the pie chart based on the clicked bar's data
          var clickedCategoryData = originData.filter(function (p) {
            return p.Brand === d.brand;
          });
          drawPieChart(clickedCategoryData);
        }
      });
    bars.exit().remove();
  }

  let lastDragX;
  const drag =
    d3.drag()
      .on('start',
        event => {
          lastDragX = event.x;
        })
      .on('drag', event => {
        console.log(event);
        const dx = event.x - lastDragX;
        if (Math.abs(dx) >=
          xScale.bandwidth() / 2) {  // Adjust sensitivity here
          const shift = dx > 0 ? -1 : 1;
          currentIndex = Math.max(
            0,
            Math.min(
              sortedData.length - visibleBars, currentIndex + shift));
          updateChart(currentIndex);
          lastDragX = event.x;
        }
      });

  svg.call(drag);

  console.log(filteredData);
  drawPieChart(filteredData);
}

// Function to create the pie chart
function drawPieChart(data) {
  // Clear any existing content in the SVG
  var svgContainer = d3.select('#pie-chart-svg');
  svgContainer.selectAll('*').remove();
  console.log(data);

  // Dynamically determine the width and height
  var svgWidth = svgContainer.node().getBoundingClientRect().width;
  var svgHeight = svgContainer.node().getBoundingClientRect().height;

  var margin = { top: 20, right: 20, bottom: 20, left: 20 },
    width = svgWidth - margin.left - margin.right - 0,
    height = svgHeight - margin.top - margin.bottom - 0,
    radius = Math.min(width, height) / 2;

  // Set up the color scale
  var color = d3.scaleOrdinal(colorScheme);

  // Compute the position of each group on the pie
  var pie = d3.pie().sort(null).value(function (d) {
    return d.value;
  });

  var arc = d3.arc().innerRadius(0).outerRadius(radius);

  // Append the svg object to the div
  var svg = svgContainer.attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`)
    .append('g')
    .attr(
      'transform',
      'translate(' + width / 2.8 + ',' + height / 1.9 + ')');

  // Compute the position of each group on the pie
  const pieData = Array.from(
    d3.rollup(data, v => v.length, d => d.Label),
    ([Label, count]) => ({ Label: Label, value: count }));
  console.log(pieData);

  var selectedArc = null;
  // Build the pie chart
  var g = svg.selectAll('.arc')
    .data(pie(pieData))
    .enter()
    .append('g')
    .attr('class', 'arc');

  var pathes = g.append('path').attr('d', arc).style('fill', function (d) {
    return color(d.data.Label);
  });
  pathes
    .transition()    // Start transition immediately after appending the
    // path
    .duration(1000)  // Duration of transition in milliseconds
    .attrTween('d', function (d) {
      var interpolate = d3.interpolate(
        { startAngle: 0, endAngle: 0 }, d);  // Interpolate from 0 angle
      return function (t) {
        return arc(interpolate(t));  // Use the arc generator
      };
    });
  pathes
    .on('click',
      function (e, d) {
        if (selectedArc === this) {
          // If the same arc is clicked again, reset all
          selectedArc = null;
          svg.selectAll('path').style('opacity', 1);
        } else {
          // Highlight the clicked arc and dim others
          selectedArc = this;
          svg.selectAll('path').style('opacity', 0.3);  // Dim all arcs
          d3.select(this).style(
            'opacity', 1);  // Highlight the selected arc
        }
        d3.select('#parallel-coordinates-svg').selectAll('*').remove();
        // Filter data based on the clicked category and pass it to the
        // parallel coordinate chart
        var clickedCategoryData = data.filter(function (p) {
          return p.Label === d.data.Label;
        });
        var parallelData = prepareParallelData(clickedCategoryData);
        drawParallelCoordinateChart(parallelData);
      })
    .on('mouseover',
      function (e, d) {
        d3.select(this).style(
          'fill', d3.rgb(color(d.data.Label)).darker(0.7));
      })
    .on('mouseout', function (e, d) {
      d3.select(this).style('fill', color(d.data.Label));
    });

  // Updated text labels to include the count of elements in each category
  g.append('text')
    .attr(
      'transform',
      function (d) {
        return 'translate(' + arc.centroid(d) + ')';
      })
    .attr('dy', '.35em')
    .text(function (d) {
      return d.data.value;
    })  // Include count in label
    .style('text-anchor', 'middle');

  var legend = svg.selectAll('.legend')
    .data(color.domain())
    .enter()
    .append('g')
    .attr('class', 'legend')
    .attr('transform', function (d, i) {
      return 'translate(' + (-5 - 85) + ',' +
        (i * 20 - radius + height / 1.9) + ')';
    });

  legend.append('rect')
    .attr('x', width / 1.7 - 18)
    .attr('width', 18)
    .attr('height', 18)
    .style('fill', color);

  legend.append('text')
    .attr('x', width / 2 + 30)
    .attr('y', 9)
    .attr('dy', '0.5em')
    .style('text-anchor', 'end')
    .text(function (d) {
      return d;
    });

  console.log('pieData', data);
  svg.append('text')
    .attr('x', 0)
    .attr('y', height / 2 + 25)
    .attr('text-anchor', 'middle')
    .style('font-size', '18px')
    .style('text-decoration', 'underline')
    .style('font-weight', 'bold')
    .text(data[0].Brand + ' Products Quantity by Category');

  // Default to showing the largest category if no segment is clicked
  var largestCategory =
    pieData
      .reduce(
        (prev, current) => (prev.value > current.value) ? prev : current)
      .Label;
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
  return data.map(
    d => ({
      Label: d.Label,
      Brand: d.Brand,
      Name: d.Name,
      Price: normalize(d.Price, priceExtent[0], priceExtent[1]),
      Rank: normalize(d.Rank, rankExtent[0], rankExtent[1]),
      SkinTypeSum: parseInt(d.Combination) + parseInt(d.Dry) +
        parseInt(d.Normal) + parseInt(d.Oily) + parseInt(d.Sensitive)
    }));
}

function drawParallelCoordinateChart(data) {
  // Clear existing SVG content
  var svgContainer = d3.select('#parallel-coordinates-svg');
  svgContainer.selectAll('*').remove();

  // Dynamically determine dimensions
  var svgWidth = svgContainer.node().getBoundingClientRect().width;
  var svgHeight = svgContainer.node().getBoundingClientRect().height - 40;

  var margin = { top: 20, right: 50, bottom: 10, left: -150 },
    width = svgWidth - margin.left - margin.right,
    height = svgHeight - margin.top - margin.bottom;

  var svg = svgContainer.attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  // Define scales for each dimension
  var x = d3.scalePoint().range([0, width]).padding(1).domain([
    'Price', 'Rank', 'SkinTypeSum'
  ]);
  var y = {};
  ['Price', 'Rank', 'SkinTypeSum'].forEach(function (d) {
    y[d] = d3.scaleLinear()
      .domain(d3.extent(
        data,
        function (p) {
          return +p[d];
        }))
      .range([height, 0]);
  });

  // Function to draw the lines
  function path(d) {
    return d3.line()(['Price', 'Rank', 'SkinTypeSum'].map(function (p) {
      return [x(p), y[p](d[p])];
    }));
  }

  // Unique color scale
  var color = d3.scaleOrdinal(colorScheme);

  // Draw the lines
  var lines = svg.selectAll('.line')
    .data(data)
    .enter()
    .append('path')
    .attr('class', 'line')
    .attr('d', path)
    .style('fill', 'none')
    .style(
      'stroke',
      function (d, i) {
        return color(i);
      })  // Unique color for each line
    .style('stroke-width', '1px');

  // Add axes
  ['Price', 'Rank', 'SkinTypeSum'].forEach(function (d) {
    svg.append('g')
      .attr('class', 'axis')
      .attr('transform', 'translate(' + x(d) + ')')
      .call(d3.axisLeft(y[d]));
    svg.append('text')
      .style('text-anchor', 'middle')
      .attr('y', height + margin.bottom + 15)
      .attr('x', x(d))
      .text(d);
  });

  // Calculate label spacing
  var labelSpacing = height / data.length;

  // Add labels with the same color as lines
  svg.selectAll('.label')
    .data(data)
    .enter()
    .append('text')
    .attr('class', 'label')
    .attr(
      'x',
      width + -200)
    .attr(
      'y',
      function (d, i) {
        return i * labelSpacing;
      })
    .text(function (d) {
      return d.Name;
    })
    .style(
      'fill',
      function (d, i) {
        return d3.color(color(i)).darker().toString();
      })
    .style('font-size', '8px');


  lines
    .on('mouseover',
      function (event, d, i) {
        // Dim other lines
        d3.selectAll('.line').style('opacity', 0.1);

        // Highlight hovered line
        d3.select(this).style('stroke-width', '3px').style('opacity', 1);

        // Highlight corresponding label
        svg.selectAll(".label")
          .style("opacity", 0.1) // Dim all labels
          // Filter on event.Name to highlight the corresponding label
          .filter(function (e) { return e.Name === d.Name; })
          .style("opacity", 1) // Highlight the corresponding label
          .style("font-weight", "bold");
      })
    .on('mouseout', function (d) {
      // Reset line style
      d3.selectAll('.line').style('opacity', 1).style('stroke-width', '1px');

      // Reset label opacity
      svg.selectAll('.label')
        .style('opacity', 1)
        .style('font-weight', 'normal');
    });

  console.log(data)
  // Add a title
  var titleText1 = 'Cosmetic Products Parallel Coordinate Chart of Brand';
  var titleText2 = data[0].Brand + ' Category ' + data[0].Label;

  // Append the text element for the title
  var title = svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 0 - margin.left - 3)
    .attr('x', 0 - (height / 2))
    .style('text-anchor', 'middle')
    .style('font-size', '12px')
    .style('font-weight', 'bold')
    .style('text-decoration', 'underline');

  // Append the first line of the title
  title.append('tspan')
    .attr('x', 0 - (height / 2))  // Align the tspan
    .attr('dy', '1em')            // Position the tspan
    .text(titleText1);

  // Append the second line of the title
  title.append('tspan')
    .attr('x', 0 - (height / 2))  // Align the tspan to match the first line
    .attr('dy', '1em')            // Move the tspan to a new line
    .text(titleText2);
}


function createBarChartData(data) {
  // Group data by brand
  const grouped = d3.group(data, d => d.Brand);

  // Map grouped data to desired format
  const brandCounts = Array.from(
    grouped, ([brand, values]) => ({ brand: brand, count: values.length }));

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
  var gBarChart = d3.select('#bar-chart-svg').select('g');
  if (gBarChart.empty()) {
    d3.select('#bar-chart-svg')
      .attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
  } else {
    d3.select('#bar-chart-svg').attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
    gBarChart.attr(
      'transform', 'translate(' + margin.left + ',' + margin.top + ')');
  }

  // Update or append the 'g' element for pie chart
  var gPieChart = d3.select('#pie-chart-svg').select('g');
  if (gPieChart.empty()) {
    d3.select('#pie-chart-svg')
      .attr('width', svgWidth)
      .attr('height', svgHeight)
      .append('g')
      .attr(
        'transform',
        'translate(' + svgWidth / 2 + ',' + svgHeight / 2 + ')');
  } else {
    d3.select('#pie-chart-svg')
      .attr('width', svgWidth)
      .attr('height', svgHeight);
    gPieChart.attr(
      'transform', 'translate(' + svgWidth / 2 + ',' + svgHeight / 2 + ')');
  }

  // Update or append the 'g' element for parallel coordinates chart
  var gParallelCoordinates = d3.select('#parallel-coordinates-svg').select('g');
  if (gParallelCoordinates.empty()) {
    d3.select('#parallel-coordinates-svg')
      .attr('width', svgWidth + margin.left + margin.right)
      .attr('height', svgHeight + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
  } else {
    d3.select('#parallel-coordinates-svg')
      .attr('width', svgWidth + margin.left + margin.right)
      .attr('height', svgHeight + margin.top + margin.bottom);
    gParallelCoordinates.attr(
      'transform', `translate(${margin.left},${margin.top})`);
  }
}


// Load the data once and then create each chart
d3.csv('cosmetics.csv', convertToNumeric).then(function (data) {
  drawScatterChart(data);
  filteredData = data.filter(function (d) {
    return d.Rank >= 3.5;
  });
  var barChartData = createBarChartData(data);
  drawBarChart(filteredData, barChartData);
  window.addEventListener('resize', function () {
    drawBarChart(filteredData, barChartData);
  });
});

// Get references to inputs
const runFileInput = document.getElementById('run_file');
const caliFileInput = document.getElementById('cali_file');
const pauseInput = document.getElementById('pause');
const averagingInput = document.getElementById('averaging');
const runId = document.getElementById('runid');
const graphicalAn = document.getElementById('graphical');
const numericalAn = document.getElementById('numerical');
const frontPotInput = document.getElementById('frontPot');
const rearPotInput = document.getElementById('rearPot');
const frontPotValInput = document.getElementById('frontPotVal');
const rearPotValInput = document.getElementById('rearPotVal');
const logScaleInput = document.getElementById('log_scale');
const ShockTravelInput = document.getElementById('ShockTravel');
const rearTravelInput = document.getElementById('rearTravel');
const frontTravelInput = document.getElementById('frontTravel');

// Get the current value as a number
const rearPotVal = Number(rearPotValInput.value);
const frontPotVal = Number(frontPotValInput.value);
const rearPotLen = Number(rearPotInput.value);
const frontPotLen = Number(frontPotInput.value);
const ShockTravel = Number(ShockTravelInput.value)
const rearTravel = Number(rearTravelInput.value)
const frontTravel = Number(frontTravelInput.value)

// Function to parse CSV file
function parseCSV(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const csvText = event.target.result;

                // Detect the separator dynamically (e.g., comma, semicolon, tab)
                const firstLine = csvText.split('\n')[0];
                const separator = firstLine.includes(',') ? ',' : firstLine.includes(';') ? ';' : '\t';

                // Split the CSV into lines
                const lines = csvText.split('\n').filter(line => line.trim() !== '');

                // Split the first line by the separator to get headers
                const headers = lines[0].split(separator).map(h => h.trim());

                // Parse data rows
                const data = lines.slice(1).map(line => {
                    const values = line.split(separator).map(value => {
                        // Replace commas in numbers with dots and try to convert to number
                        const cleanValue = value.replace(',', '.');
                        const numValue = parseFloat(cleanValue);
                        return isNaN(numValue) ? cleanValue.trim() : numValue;
                    });
                    return values;
                });

                // Create an object with headers as keys
                const dataObject = {};
                headers.forEach((header, index) => {
                    dataObject[header] = data.map(row => row[index]);
                });

                resolve({
                    headers: headers,
                    data: data,
                    dataObject: dataObject
                });
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => reject(error);

        reader.readAsText(file);
    });
}

// function to derivate ie. to compute the speed
function computeDerivative(values, time) {
    const derivatives = [];
    const croppedTime = [];

    for (let i = 0; i < values.length - 1; i++) {
        const deltaValue = values[i + 1] - values[i];
        const deltaTime = time[i + 1] - time[i];
        
        derivatives.push(deltaValue / deltaTime);
        croppedTime.push(time[i]); // Use the initial time point for each interval
    }

    return { derivatives, croppedTime };
}

function averaging(t, X, T = 1, align = 'center') {
    // Ensure T is not too large for the time array
    if (T > t[t.length - 1] / 2) {
        throw new Error('Cannot average over a period this long!');
    }

    let tm = [];
    let Xm = [];
    
    const dt = t.length * T / t[t.length - 1];
    let n = 0;
    
    while ((n + 1) * T <= t[t.length - 1]) {
        const a = Math.round(n * dt);
        const b = Math.round((n + 1) * dt);
        
        // Adjust the time based on the alignment option
        if (align === 'left') {
            tm.push(n * T);
        } else if (align === 'right') {
            tm.push((n + 1) * T);
        } else {
            tm.push((n + 0.5) * T); // center alignment
        }

        // Calculate the mean of the segment
        const segment = X.slice(a, b);
        const mean = segment.reduce((acc, value) => acc + value, 0) / segment.length;
        Xm.push(mean);

        n++;
    }

    return { tm, Xm };
}


// Function to update the first plot
async function updateRawPlot(Rear, Front, Time) {
    try {
        // Update lineRe and lineFr with new data
        await Plotly.restyle('plots_container', { x: [Time], y: [Rear] }, [0]);
        await Plotly.restyle('plots_container', { x: [Time], y: [Front] }, [1]);

        // Adjust axes to fit the new data
        await Plotly.relayout('plots_container', {
            'xaxis.range': [Math.min(...Time), Math.max(...Time)],
            'yaxis.range': [Math.min(...Rear, ...Front), Math.max(...Rear, ...Front)]
        });
    } catch (error) {
        console.error('Error updating the raw plot:', error);
    }
}

// Function to update the position plots
async function updatePositionPlots(Rear, Front) {
    try {
        await Plotly.restyle('plots_container', { x: [Rear] }, [2]);
        await Plotly.restyle('plots_container', { x: [Front] }, [3]);
        await Plotly.relayout('plots_container', {
            'xaxis2.range': [Math.min(...Rear, ...Front), Math.max(...Rear, ...Front)],
        });
        await Plotly.restyle('plots_container', {
            x: [Rear],
            y: [Front],
            mode: 'markers',
            marker: {
                size: 2, // Adjust as needed
                color: 'rgba(151, 227, 194, 0.5)', // Add transparency for clarity
            },
        }, [4]);
        await Plotly.relayout('plots_container', {
            'xaxis6.range': [0, rearTravel],
            'yaxis6.range': [0, frontTravel],
        });
    } catch (error) {
        console.error('Error updating position plot:', error);
    }
}

// Function to update the delta plot
async function updateDeltaPlot(Rear, Front, Time) {
    const Delta = Front.map((value, index) => value - Rear[index]);

    try {
        await Plotly.restyle('plots_container', { x: [Time],y: [Delta] }, [5]);
        await Plotly.relayout('plots_container', {
            'xaxis4.range': [Math.min(...Time), Math.max(...Time)],
            'yaxis4.range': [Math.min(...Delta), Math.max(...Delta)],
        });
        await Plotly.restyle('plots_container', { x: [Delta] }, [9]);
        await Plotly.relayout('plots_container', {
            'xaxis7.range': [Math.min(...Delta), Math.max(...Delta)],
        });
    } catch (error) {
        console.error('Error updating Delta plots:', error);
    }
}

// Function to update the speed histogram plot
async function updateSpeedPlot(Rear, Front, Time) {
    // Compute derivatives for Front and Rear
    const { derivatives: dFront, croppedTime: croppedTimeFront } = computeDerivative(Front, Time);
    const { derivatives: dRear, croppedTime: croppedTimeRear } = computeDerivative(Rear, Time);

    console.log('Derivative of Front:', dFront);
    console.log('Cropped Time for Front:', croppedTimeFront);

    console.log('Derivative of Rear:', dRear);
    console.log('Cropped Time for Rear:', croppedTimeRear);

    try {
        await Plotly.restyle('plots_container', { x: [dRear] }, [6]);
        await Plotly.restyle('plots_container', { x: [dFront] }, [7]);
        await Plotly.relayout('plots_container', {
            'xaxis5.range': [Math.min(...dRear, ...dFront), Math.max(...dRear, ...dFront)],
        });
        await Plotly.restyle('plots_container', {
            x: [dRear],
            y: [dFront],
            mode: 'markers',
            marker: {
                size: 2, // Adjust as needed
                color: 'rgba(151, 227, 194, 0.5)', // Add transparency for clarity
            },
        }, [8]);
        await Plotly.relayout('plots_container', {
            'xaxis6.range': [-4000, 4000],
            'yaxis6.range': [-4000, 4000],
        });
    } catch (error) {
        console.error('Error updating second plot:', error);
    }
}

// Function to update the acceleration plots
async function updateAccelPlot(accelerationX, accelerationY, accelerationZ, Time) {
    const accelNorm = accelerationX.map((value, index) => Math.pow(Math.pow(value, 2) + Math.pow(accelerationY[index], 2) + Math.pow(accelerationZ[index], 2), 1/2) - 10);
    
    try {
        await Plotly.restyle('plots_container', { x: [Time], y: [accelNorm] }, [10]);
        await Plotly.relayout('plots_container', {
            'xaxis8.range': [Math.min(...Time), Math.max(...Time)],
            'yaxis8.range': [0, Math.max(...accelNorm)]
        });
    } catch (error) {
        console.error('Error updating second plot:', error);
    }
}

// Function to update all the plots
async function updateSubplot() {
    if (runFileInput.files.length === 0 || caliFileInput.files.length === 0) {
        console.error('Both files need to be selected.');
        return;
    }

    try {
        const run = runFileInput.files[0];
        const cali = caliFileInput.files[0];

        // Parse both files
        const [parsed_run, parsed_cali] = await Promise.all([
            parseCSV(run),
            parseCSV(cali)
        ]);

        const Time = parsed_run.dataObject['Time (ms)'];
        const Pot1 = parsed_run.dataObject['Potentiometer 0 (mm)'];
        const Pot2 = parsed_run.dataObject['Potentiometer 1 (mm)'];
        const accelerationX = parsed_run.dataObject['Acceleration X (m/s^2)'];
        const accelerationY = parsed_run.dataObject['Acceleration Y (m/s^2)'];
        const accelerationZ = parsed_run.dataObject['Acceleration Z (m/s^2)'];

        const CaliPot1 = parsed_cali.dataObject['Potentiometer 0 (mm)'];
        const CaliPot2 = parsed_cali.dataObject['Potentiometer 1 (mm)'];

        // calculs
        const Ar = Pot1.map(value => (rearPotVal - value)*rearPotLen/rearPotVal);
        const Av = Pot2.map(value => (frontPotVal - value)*frontPotLen/frontPotVal);
        const zero_Ar = Math.min(...Ar);
        const zero_Av = Math.min(...Av);
        const Front = Av.map(value => (value - zero_Av));
        const rearPotActTravel = (Math.max(...CaliPot1) - Math.min(...CaliPot1))*rearPotLen/rearPotVal
        const Rear = Ar.map(value => (value - zero_Ar)*rearTravel/rearPotActTravel);

        if (!Time || !Pot1 || !Pot2) {
            console.error('Data extraction failed. Check CSV headers.');
            return;
        }

        // Update plot functions
        await updateRawPlot(Rear, Front, Time);
        await updatePositionPlots(Rear, Front);
        await updateDeltaPlot(Rear, Front, Time);
        await updateSpeedPlot(Rear, Front, Time);
        await updateAccelPlot(accelerationX, accelerationY, accelerationZ, Time);

        console.log('Plots updated successfully.');
    } catch (error) {
        console.error('Error updating plot:', error);
    }
}

// Add event listeners to both file inputs
runFileInput.addEventListener('change', updateSubplot);
caliFileInput.addEventListener('change', updateSubplot);

// Plotting
var lineRe = {
    x: [1, 2, 3],
    y: [4, 5, 6],
    xaxis: 'x1',
    yaxis: 'y1',
    type: 'scatter',
    name: 'Rear',
    marker: {
        color: 'rgba(255, 99, 71, 0.7)',
        size: 3
    },
    line: {
        color: 'rgba(255, 99, 71, 0.7)',
        opacity: 0.5,
        width: 1
    }
  };

var lineFr = {
    x: [1, 2, 3],
    y: [3, 2, 8],
    xaxis: 'x1',
    yaxis: 'y1',
    type: 'scatter',
    name: 'Front',
    marker: {
        color: 'rgba(54, 162, 235, 0.7)',
        size: 3
    },
    line: {
        color: 'rgba(54, 162, 235, 0.7)',
        opacity: 0.5,
        width: 1
    }
  };

var histogramRe = {
    x: [1, 2, 3, 2, 2], // Placeholder
    type: 'histogram',
    marker: { color: 'rgba(255, 99, 71, 0.7)' },
    name: 'Rear',
    xaxis: 'x2',
    yaxis: 'y2',
};

var histogramFr = {
    x: [1, 2, 3, 3, 1], // Placeholder
    type: 'histogram',
    marker: { color: 'rgba(54, 162, 235, 0.7)' },
    name: 'Front',
    xaxis: 'x2',
    yaxis: 'y2',
};

var cloudPosition = {
    x: [1, 3, 2, ],
    y: [4, 5, 6],
    xaxis: 'x3',
    yaxis: 'y3',
    type: 'scatter',
    marker: {
        color: 'rgba(151, 227, 194, 0.7)',
        size: 10,
    },
    line: {
        opacity: 0,
        width: 0
    }
    };

var lineDelta = {
    x: [1, 2, 3],
    y: [4, 5, 6],
    marker: {color: 'rgba(151, 227, 194, 0.7'},
    xaxis: 'x4',
    yaxis: 'y4',
    type: 'scatter'
    };

var histogramReSpeed = {
    x: [1, 2, 3],
    xaxis: 'x5',
    yaxis: 'y5',
    type: 'histogram',
    marker: { color: 'rgba(255, 99, 71, 0.7)' },
    name: 'Rear',
    };

var histogramFrSpeed = {
    x: [1, 2, 3],
    xaxis: 'x5',
    yaxis: 'y5',
    type: 'histogram',
    marker: { color: 'rgba(54, 162, 235, 0.7)' },
    name: 'Front',
    };

var cloudSpeed = {
    x: [1, 3, 1.5, 2.5],
    y: [4, 5, 6, 4.5],
    xaxis: 'x6',
    yaxis: 'y6',
    type: 'scatter',
    marker: {
        color: 'rgba(151, 227, 194, 0.7)',
        size: 10,
    },
    line: {
        opacity: 0,
        width: 0
    }
    };

var histogramDelta = {
    xaxis: 'x7',
    yaxis: 'y7',
    x: [1, 2, 3, 3, 1], // Placeholder
    type: 'histogram',
    marker: {color: 'rgba(151, 227, 194, 0.7'},
    name: 'Delta',
    };

var lineAccel = {
    x: [1, 2, 3],
    y: [4, 5, 6],
    xaxis: 'x8',
    yaxis: 'y8',
    type: 'scatter',
    marker: {color: 'rgba(195, 177, 225, 0.7)'}
    };

var data = [lineRe, lineFr, histogramRe, histogramFr, cloudPosition, lineDelta, histogramReSpeed, histogramFrSpeed, cloudSpeed, histogramDelta, lineAccel];

var layout = {
    grid: {rows: 3, columns: 4, pattern: 'independent'},

    xaxis: { domain: [0, 0.46], anchor: 'x1'},  // Spans the first two columns
    yaxis: { domain: [0.70, 1], anchor: 'y1'},   // First row

    xaxis2: { domain: [0.50, 0.73], anchor: 'x2'}, // Third column
    yaxis2: { domain: [0.70, 1], anchor: 'y2'},  // Second row

    xaxis3: { domain: [0.77, 1], anchor: 'x3'}, // Second row, first column
    yaxis3: { domain: [0.70, 1], anchor: 'y3'},

    xaxis4: { domain: [0, 0.46], anchor: 'x4'}, // Second row, second column
    yaxis4: { domain: [0.35, 0.65], anchor: 'y4'},

    xaxis5: { domain: [0.50, 0.73], anchor: 'x5'},
    yaxis5: { domain: [0.35, 0.65], anchor: 'y5'},

    xaxis6: { domain: [0.77, 1], anchor: 'x6'}, // Second row, third column
    yaxis6: { domain: [0.35, 0.65], anchor: 'y6'},

    xaxis7: { domain: [0, 0.46], anchor: 'x7'}, // Second row, third column
    yaxis7: { domain: [0, 0.30], anchor: 'y7'},

    xaxis8: { domain: [0.50, 1], anchor: 'x8'}, // Second row, third column
    yaxis8: { domain: [0, 0.30], anchor: 'y8'},
    
    margin: { t: 20, b: 20, l: 20, r: 20 },

    showlegend: false
    };

var scissorsIcon = {
    'width': 500,
    'height': 600,
    'path': 'M224 512c35.32 0 63.97-28.65 63.97-64H160.03c0 35.35 28.65 64 63.97 64zm215.39-149.71c-19.32-20.76-55.47-51.99-55.47-154.29 0-77.7-54.48-139.9-127.94-155.16V32c0-17.67-14.32-32-31.98-32s-31.98 14.33-31.98 32v20.84C118.56 68.1 64.08 130.3 64.08 208c0 102.3-36.15 133.53-55.47 154.29-6 6.45-8.66 14.16-8.61 21.71.11 16.4 12.98 32 32.1 32h383.8c19.12 0 32-15.6 32.1-32 .05-7.55-2.61-15.27-8.61-21.71z'
 };

var config = {
    responsive: true,
    toImageButtonOptions: {
        format: 'svg', // one of png, svg, jpeg, webp
        filename: 'Hexa Trail - run plot',
        height: 720,
        width: 1280,
        scale: 1, // Multiply title/legend/axis/canvas sizes by this factor
        margin: { t: 25, b: 25, l: 25, r: 25 },
    },
    displayModeBar: true,
    modeBarButtonsToRemove: ['select2d', 'lasso2d', 'pan2d', 'zoomIn2d', 'zoomOut2d'],
    modeBarButtonsToAdd: [
        {name: 'time segment',
        icon: scissorsIcon,
        click: function(gd) { // faire la fonction qui selectionne qu'une partie du run
            var newColor = colors[Math.floor(3 * Math.random())]
        Plotly.restyle(gd, 'line.color', newColor)}}],
    displaylogo: false,
    doubleClickDelay: 1000,
}

Plotly.newPlot('plots_container', data, layout);


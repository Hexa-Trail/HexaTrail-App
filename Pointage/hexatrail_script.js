/* #region Geometry computing */
    /* #region global variables */
    //Test
let useLinearKinematics = false;
let kinematicsFile = null;
let pivotPoints = [];
let currentPivotIndex = 0;
let isCapturingPivots = false;
let userUploadedGeometry = false;
let currentGeometryImage = null;
// NOUVELLES VARIABLES a AJOUTER
let pxToMmRatio = 1.0; // Ratio pour convertir pixels en millimetres
let pivotPointsMm = []; // Stockera les pivots convertis en mm
// FIN DES NOUVELLES VARIABLES
const canvas = document.getElementById("geometry_canvas");
const instruction = document.getElementById("geometry-instruction");
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");
/* #endregion */



/**
 * Calcule la distance euclidienne entre deux points en pixels.
 * @param {object} p1 - Premier point { x, y }
 * @param {object} p2 - Second point { x, y }
 * @returns {number} La distance en pixels.
 */
function getPixelDistance(p1, p2) {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Convertit tous les pivots (pivotPoints) de pixels en millimetres.
 * Utilise 'Crank axle' comme origine (0,0) et inverse l'axe Y.
 * Stocke le resultat dans 'pivotPointsMm'.
 */
function convertPivotsToMm() {
    // 1. Trouver le point d'origine (le pedalier)
    const originPx = pivotPoints.find(p => p.label === "Crank axle");
    
    if (!originPx) {
        alert("Error: 'Crank axle' pivot not found. Cannot set coordinate origin.");
        return;
    }

    if (pxToMmRatio === 1.0 || isNaN(pxToMmRatio)) {
        alert("Error: Pixel-to-MM ratio is invalid. Cannot convert coordinates.");
        return;
    }

    // 2. Convertir toutes les coordonnees
    pivotPointsMm = pivotPoints.map(point => {
        // Calculer la difference en pixels par rapport a l'origine
        const deltaX_px = point.x - originPx.x;
        
        // L'axe Y du canvas est inverse (0 est en haut)
        // Nous le remettons dans le sens cartesien standard (0 est en bas)
        const deltaY_px = originPx.y - point.y; 

        // Appliquer le ratio pour convertir en mm
        return {
            label: point.label,
            x: deltaX_px / pxToMmRatio,
            y: deltaY_px / pxToMmRatio
        };
    });

    console.log("Converted MM Coordinates (Origin = Crank):", pivotPointsMm);
    alert("Geometry successfully captured and converted to millimeters!");
    
    // etape suivante (manquante) :
    // C'est ici que vous enverriez 'pivotPointsMm' 
    // a votre moteur de calcul cinematique.
}

/* #endregion */
    /* #region Pivot types */
const MonopivotLabels = [
    "Rear axle", "Front axle", "Crank axle", "Frame/shock eye",
    "Rear triangle/shock eye", "Frame/rear triangle pivot"
];
const FourBarsMonopivot1Labels = [
    "Rear axle", "Front axle", "Crank axle", "Wheelstay/Frame pivot", "Wheelstay/Seatstay pivot",
    "Seatstay/Rocker pivot", "Rocker/Frame pivot", "Rocker/Shock eye", "Frame/Shock eye"
];
const FourBarsMonopivot2Labels = [
    "Rear axle", "Front axle", "Crank axle", "Wheelstay/Frame pivot", "Wheelstay/Rocker pivot",
    "Seatstay/Rocker pivot", "Seatstay/Frame pivot", "Rocker/Shock eye", "Frame/Shock eye"
];
const FlexstayLabels = [
    "Rear axle", "Front axle", "Crank axle", "Wheelstay/Frame pivot", "Wheelstay/Rocker pivot",
    "Rocker/Frame pivot", "Rocker/Shock eye", "Frame/Shock eye"
];
const SplitpivotLabels = [
    "Rear axle", "Front axle", "Crank axle", "Wheelstay/Frame pivot", "Wheelstay/Rocker pivot",
    "Rocker/Frame pivot", "Rocker/Shock eye", "Frame/Shock eye"
];
const HorstLink4Labels = [
    "Rear axle", "Front axle", "Crank axle", "Chainstay/Frame pivot", "Chainstay/Seatstay pivot",
    "Seatstay/Rocker pivot", "Rocker/Frame pivot", "Rocker/Shock eye", "Frame/Shock eye"
];
const HorstLink4FloatingLabels = [
    "Rear axle", "Front axle", "Crank axle", "Chainstay/Frame pivot", "Chainstay/Seatstay pivot",
    "Seatstay/Rocker pivot", "Rocker/Frame pivot", "Rocker/Shock eye", "Chainstay/Shock eye"
];
const HorstLink6Labels = [
    "Rear axle", "Front axle", "Crank axle", "Chainstay/Frame pivot", "Chainstay/Seatstay pivot",
    "Seatstay/Rocker pivot", "Rocker/Rocker-Bar pivot", "Rocker-Bar/Shock eye", "Chainstay-Bar/Shock eye",
    "Frame/Shock eye"
];
const SeatstayLinkLabels = [
    "Rear axle", "Front axle", "Crank axle", "Chainstay/Frame pivot", "Chainstay/Seatstay pivot",
    "Seatstay/Rocker pivot", "Rocker/Frame pivot", "Seatstay/Shock eye", "Frame/Shock eye"
];
const DWLinkvppLabels = [
    "Rear axle", "Front axle", "Crank axle", "Short link/Frame pivot", "Short link/Rear triangle pivot", 
    "Rear triangle/Rocker pivot", "Rocker/Frame pivot", "Rocker/Shock eye", "Frame/Shock eye"
];
const DWLinkvppFloatingLabels = [
    "Rear axle", "Front axle", "Crank axle", "Short link/Frame pivot", "Short link/Rear triangle pivot", 
    "Rear triangle/Rocker pivot", "Rocker/Frame pivot", "Rocker/Shock eye", "Short link/Shock eye"
];
const FourBarsBBRockerLabels = [
    "Rear axle", "Front axle", "Crank axle", "Rocker/Frame pivot", "Rocker/Rear triangle pivot",
    "Rear triangle/Frame-bar pivot", "Frame/Frame-link pivot", "Rocker/Shock eye", "Frame/Shock eye"
];
const SixBarsDWLinkLabels = [
    "Rear axle", "Front axle", "Crank axle", "Lower Rocker/Frame pivot", "Lower Rocker/Chainstay pivot",
    "Chainstay/Seatstay pivot", "Seatstay/Upper Rocker pivot", "Upper Rocker/Frame pivot", "Upper Rocker Bar pivot",
    "Lower Rocker Bar pivot", "(any) Rocker/Shock eye", "Frame/Shock eye"
];
const DoubleShortLinkLabels = [
    "Rear axle", "Front axle", "Crank axle", "Lower Link/Frame pivot", "Lower Link/Rear Triangle pivot",
    "Upper Link/Frame pivot", "Upper Link/Rear Triangle pivot", "Rear Triangle/Rocker pivot",
    "Rocker/Frame pivot", "Rocker/Shock eye", "Frame/Shock eye"
];
const DoubleShortLinkPivotLabels = [
    "Rear axle", "Front axle", "Crank axle", "Lower Link/Frame pivot", "Lower Link/Chainstay pivot",
    "Upper Link/Frame pivot", "Upper Link/Chainstay pivot", "Chainstay/Seatstay pivot", "Seatstay/Rocker pivot",
    "Rocker/Frame pivot", "Rocker/Shock eye", "Frame/Shock eye"
];

const pivotLabelsMap = {
    Monopivot: MonopivotLabels,
    FourBarsMonopivot1: FourBarsMonopivot1Labels,
    FourBarsMonopivot2: FourBarsMonopivot2Labels,
    Flexstay: FlexstayLabels,
    Splitpivot: SplitpivotLabels,
    HorstLink4: HorstLink4Labels,
    HorstLink4Floating: HorstLink4FloatingLabels,
    HorstLink6: HorstLink6Labels,
    SeatstayLink: SeatstayLinkLabels,
    DWLinkvpp: DWLinkvppLabels,
    DWLinkvppFloating: DWLinkvppFloatingLabels,
    FourBarsBBRocker: FourBarsBBRockerLabels,
    SixBarsDWLink: SixBarsDWLinkLabels,
    DoubleShortLink: DoubleShortLinkLabels,
    DoubleShortLinkPivot: DoubleShortLinkPivotLabels,
};
/* #endregion */

    /* #region Pup up buttons */
// Attach click event listeners to all tab buttons
tabButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
        switchTab(event);
    });
});

document.getElementById("linear-kinematics").addEventListener("click", () => {
    useLinearKinematics = true;
    kinematicsFile = null;
    closePopup();
    removeGeometryTab();
});

document.getElementById("load-geometry").addEventListener("click", () => {
    const tempInput = document.createElement("input");
    tempInput.type = "file";
    tempInput.accept = ".csv,.txt,.kin";
    tempInput.style.display = "none";
    document.body.appendChild(tempInput);

    tempInput.addEventListener("change", (event) => {
        kinematicsFile = event.target.files[0];
        useLinearKinematics = false;
        closePopup();
        document.body.removeChild(tempInput);
        removeGeometryTab();
    }, { once: true });

    tempInput.click();
});

document.getElementById("compute-geometry").addEventListener("click", () => {
    const geometryTabButton = document.querySelector('button[data-tab="tab2"]');
    geometryTabButton.click();
    closePopup();
});

// REMPLACEZ VOTRE BLOC "length-submit" EXISTANT PAR CELUI-CI
document.getElementById("length-submit").addEventListener("click", () => {
    const type = document.getElementById("length-type").value;
    const value = parseFloat(document.getElementById("length-value").value);

    if (isNaN(value) || value <= 0) {
        alert("Please enter a valid positive number.");
        return;
    }

    // --- DEBUT DE LA LOGIQUE DE CALCUL DU RATIO ---

    // Ce 'map' fait le lien entre la valeur du dropdown et les labels des pivots.
    // !!! VOUS DEVEZ ADAPTER LES CLeS ("wheelbase", "shock-length", etc.)
    // pour qu'elles correspondent EXACTEMENT aux 'value' de vos <option> HTML.
    const referenceLengthMap = {
        "wheelbase": ["Rear axle", "Front axle"],
        "shock-length-monopivot": ["Frame/shock eye", "Rear triangle/shock eye"],
        "shock-length-4bar": ["Frame/Shock eye", "Rocker/Shock eye"],
        "chainstay": ["Crank axle", "Rear axle"]
        // Ajoutez d'autres types de reference ici si necessaire
    };

    const pointLabels = referenceLengthMap[type];
    if (!pointLabels) {
        alert(`Error: Reference type "${type}" is not recognized in the script.`);
        return;
    }

    // Retrouver les points en pixels captures
    const p1 = pivotPoints.find(p => p.label === pointLabels[0]);
    const p2 = pivotPoints.find(p => p.label === pointLabels[1]);

    if (!p1 || !p2) {
        alert(`Error: Could not find required pivots "${pointLabels[0]}" or "${pointLabels[1]}" in the captured data.`);
        return;
    }

    // 1. CALCULER LE RATIO
    const distanceInPixels = getPixelDistance(p1, p2);
    
    // On stocke le ratio globalement
    pxToMmRatio = distanceInPixels / value; 

    if (isNaN(pxToMmRatio) || pxToMmRatio <= 0) {
        alert("Error calculating pixel ratio. Check your values.");
        pxToMmRatio = 1.0; // Reinitialiser
        return;
    }

    console.log(`Reference: ${type} = ${value} mm`);
    console.log(`Pixel distance: ${distanceInPixels.toFixed(2)} px`);
    console.log(`Calculated Ratio: ${pxToMmRatio.toFixed(4)} px/mm`);

    document.getElementById("length-popup").style.display = "none";

    // 2. LANCER LA CONVERSION DES PIVOTS (Point 2)
    convertPivotsToMm();
    
    // --- FIN DE LA NOUVELLE LOGIQUE ---
});


//document.getElementById("length-submit").addEventListener("click", () => {
//    const type = document.getElementById("length-type").value;
//    const value = parseFloat(document.getElementById("length-value").value);
//
//    if (isNaN(value) || value <= 0) {
//        alert("Please enter a valid positive number.");
//        return;
//    }
//
//    document.getElementById("length-popup").style.display = "none";
//
//    console.log("Captured Pivots:", pivotPoints);
//    console.log(`Reference: ${type} = ${value} mm`);

    // a suivre : calcul des ratios pixel/mm
//});

function closePopup() {
    document.getElementById("kinematics-popup").style.display = "none";
}

// Geometry ref length popup
function showReferenceLengthPopup() {
    document.getElementById("length-popup").style.display = "flex";
}
/* #endregion */

    /* #region menu & sidebar */
document.getElementById("settings_icon").addEventListener("click", () => {
    const menu = document.getElementById("menu");
    menu.classList.toggle("open");
});

// reset kinematics in menu
document.getElementById("reset-kinematics-btn").addEventListener("click", () => {
    location.reload();
});

// sliding sidebar and expand mainscreen
document.getElementById("menu_icon").addEventListener("click", () => {
    const sidebar = document.querySelector(".sidebar");
    const mainscreen = document.querySelector(".mainscreen");
    const plotsContainer = document.getElementById("plots_container");

    // Toggle sidebar visibility
    sidebar.classList.toggle("closed");
    mainscreen.classList.toggle("expanded");

    // Completely redraw the plot after layout changes
    setTimeout(() => {
        // First, delete the existing plot
        Plotly.purge(plotsContainer);

        // Recreate the plot with the original data and layout
        Plotly.newPlot('plots_container', data, layout, config);
    }, 10); // Match transition duration in CSS
});

function removeGeometryTab() {
    // Supprime le bouton d’onglet
    const tabBtn = document.querySelector('button[data-tab="tab2"]');
    if (tabBtn) tabBtn.remove();

    // Supprime aussi le contenu de l’onglet
    const tabContent = document.getElementById("tab2");
    if (tabContent) tabContent.remove();

    // Simule un clic sur le bouton "Run input" pour revenir a l'onglet principal
    document.querySelector('button[data-tab="tab1"]').click();
}

// Function to handle tab switching
function switchTab(event) {
    // Get the clicked tab button
    const clickedButton = event.target;
    const targetTab = clickedButton.dataset.tab;

    // Remove active class from all buttons and contents
    tabButtons.forEach((button) => button.classList.remove("active"));
    tabContents.forEach((content) => content.classList.remove("active"));

    // Add active class to the clicked button and corresponding content
    clickedButton.classList.add("active");
    document.getElementById(targetTab).classList.add("active");

    // Handle geometry tab: Show canvas and hide plots
    const plotsContainer = document.getElementById("plots_container");
    const geometryCanvas = document.getElementById("geometry_canvas");

  if (targetTab === "tab2") {
        plotsContainer.style.display = "none";
        geometryCanvas.style.display = "block";
        
        // AJOUTEZ CETTE LIGNE :
        // Elle force le redessin de l'image en utilisant la
        // taille correcte du canevas (maintenant qu'il est visible).
        resizeAndDrawGeometryImage(); 

    } else {
        geometryCanvas.style.display = "none";
        plotsContainer.style.display = "block";
    }

    // Gerer l'affichage de l'instruction pendant la capture
    const instructionDiv = document.getElementById("geometry-instruction");

    if (targetTab === "tab2" && isCapturingPivots) {
        instructionDiv.textContent = `Click on: ${pivotLabels[currentPivotIndex]}`;
    } else {
        instructionDiv.textContent = "";
    }
}

/* #endregion */

    /* #region Geometry Image management */
// Geometry exemple image
document.getElementById("geometry_image").addEventListener("change", () => {
    userUploadedGeometry = true;
});

// Mettre a jour a chaque changement de type de pivot
document.querySelector('select[name="pivottype"]').addEventListener("change", updateGeometryExample);

// initialisation de l'exemple
window.addEventListener("load", () => {
    loadImageToCanvas("geometry_image", "geometry_canvas");
    // Initialiser le canevas avec l'exemple du pivot par defaut (monopivot)
    updateGeometryExample();
});

// CLICK CANVAS POUR ACQUISITION DE PIVOT
canvas.addEventListener("click", (e) => {
    if (!isCapturingPivots || currentPivotIndex >= pivotLabels.length) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    pivotPoints.push({ label: pivotLabels[currentPivotIndex], x, y });
    drawRedPoint(x, y);

    currentPivotIndex++;
    const instruction = document.getElementById("geometry-instruction");

    if (currentPivotIndex < pivotLabels.length) {
        instruction.textContent = `Click on: ${pivotLabels[currentPivotIndex]}`;
    } else {
        instruction.textContent = "";
        isCapturingPivots = false;

        // Reactiver l'onglet "Run input"
        const runTabBtn = document.querySelector('button[data-tab="tab1"]');
        runTabBtn.disabled = false;
        runTabBtn.style.opacity = "1";
        runTabBtn.style.pointerEvents = "auto";

        showReferenceLengthPopup();
    }
});

// LANCEMENT DE LA CAPTURE — APReS L’IMAGE
function startPivotSelection() {
    pivotPoints = [];
    currentPivotIndex = 0;
    isCapturingPivots = true;

    const runTabBtn = document.querySelector('button[data-tab="tab1"]');
    runTabBtn.disabled = true;
    runTabBtn.style.opacity = "0.5";
    runTabBtn.style.pointerEvents = "none";

    const instruction = document.getElementById("geometry-instruction");
    if (document.getElementById("tab2").classList.contains("active")) {
        instruction.textContent = `Click on: ${pivotLabels[currentPivotIndex]}`;
    } else {
        instruction.textContent = "";
    }
}

// DESSIN D’UN POINT ROUGE
function drawRedPoint(x, y) {
    const canvas = document.getElementById("geometry_canvas");
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fillStyle = "red";
    ctx.fill();
}

// Initialisation du canevas
function loadImageToCanvas(fileInputId, canvasId) {
    const fileInput = document.getElementById(fileInputId);
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext("2d");

    fileInput.addEventListener("change", (event) => {
        const file = event.target.files[0];

        if (!file) return;

        const img = new Image();

        img.onload = () => {
            currentGeometryImage = img;
            resizeAndDrawGeometryImage();
            if (!useLinearKinematics && !kinematicsFile) {
                startPivotSelection();
            }
        };        
        
        // Chargez l'image selectionnee
        img.src = URL.createObjectURL(file);
    });
}

function resizeAndDrawGeometryImage() {
    if (!currentGeometryImage) return;

    const canvas = document.getElementById("geometry_canvas");
    const ctx = canvas.getContext("2d");

    // Met a jour la taille du canvas en fonction de son style CSS (responsive)
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const img = currentGeometryImage;
    const imgRatio = img.width / img.height;
    const canvasRatio = canvas.width / canvas.height;

    let drawWidth, drawHeight;

    if (imgRatio > canvasRatio) {
        // Image plus large que haute → limiter largeur
        drawWidth = canvas.width;
        drawHeight = canvas.width / imgRatio;
    } else {
        // Image plus haute que large → limiter hauteur
        drawHeight = canvas.height;
        drawWidth = canvas.height * imgRatio;
    }

    const offsetX = (canvas.width - drawWidth) / 2;
    const offsetY = (canvas.height - drawHeight) / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
}

// Fonction de mise a jour de l’image exemple
function updateGeometryExample() {
    if (userUploadedGeometry || useLinearKinematics) return;

    if (userUploadedGeometry) return; // ne pas ecraser l'image utilisateur

    const canvas = document.getElementById("geometry_canvas");
    const ctx = canvas.getContext("2d");
    const pivotType = document.querySelector('select[name="pivottype"]').value;
    pivotLabels = pivotLabelsMap[pivotType] || [];

    // Correspondances simples avec les noms de fichiers
    const pivotMap = {
        "Monopivot": "illu geo - monopivot.png",
        "FourBarsMonopivot1": "illu geo - 4 Bars Monopivot Type 1.png",
        "FourBarsMonopivot2": "illu geo - 4 Bars Monopivot Type 2.png",
        "Flexstay": "illu geo - Flex Stay.png",
        "Splitpivot": "illu geo - split pivot.png",
        "HorstLink4": "illu geo - Horst-Link.png",
        "HorstLink4Floating": "illu geo - Horst-Link Floating shock.png",
        "HorstLink6": "illu geo - 6 Bars Horst-Link.png",
        "SeatstayLink": "illu geo - Seatstay Link.png",
        "DWLinkvpp": "illu geo - DW-Link (VPP).png",
        "DWLinkvppFloating": "illu geo - DW-Link (VPP) floating shock.png",
        "FourBarsBBRocker": "illu geo - 4 Bars BB Rocker (VPP).png",
        "SixBarsDWLink": "illu geo - 6 Bars DW-link.png",
        "DoubleShortLink": "illu geo - Double Short Link.png",
        "DoubleShortLinkPivot": "illu geo - Double Short Link Wheelstay pivot.png",
        "Newkine": "illu geo - exemple pending.png"
    };

    const fileName = pivotMap[pivotType] || "illu geo - exemple pending.png";
    const imagePath = `./assets/geometry exemples/${fileName}`;

    const img = new Image();
    img.onload = () => {
        // Redimensionnement et affichage sur le canevas
        const container = canvas.parentElement;
        const maxWidth = container.clientWidth;
        const maxHeight = container.clientHeight;

        const imgRatio = img.width / img.height;
        let newWidth = maxWidth;
        let newHeight = maxHeight;

        if (newWidth / imgRatio > maxHeight) {
            newWidth = maxHeight * imgRatio;
        } else {
            newHeight = newWidth / imgRatio;
        }

        canvas.width = newWidth;
        canvas.height = newHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        currentGeometryImage = img;
    };
    img.src = imagePath;
}

window.addEventListener("resize", () => {
    resizeAndDrawGeometryImage();
});
/* #endregion */

    /* #region Simulate double menu icon click on page load -> make page responsive for some reason */
window.addEventListener('load', () => {
    document.getElementById("menu_icon").click();
});
window.addEventListener('load', () => {
    document.getElementById("menu_icon").click();
});
/* #endregion */

/* #endregion */

/* #region Run computation */
    /* #region Getting variables to plot */
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
const Speed_hist_limInput = document.getElementById('Speed_hist_lim');
const pause_tolInput = document.getElementById('pause_tol');
const regenerateButton = document.getElementById('regenerate-btn');

// Get the current value as a number
const rearPotVal = Number(rearPotValInput.value);
const frontPotVal = Number(frontPotValInput.value);
const rearPotLen = Number(rearPotInput.value);
const frontPotLen = Number(frontPotInput.value);
const ShockTravel = Number(ShockTravelInput.value);
const rearTravel = Number(rearTravelInput.value);
const frontTravel = Number(frontTravelInput.value);
const Speed_hist_lim = Number(Speed_hist_limInput.value);
const pause_tol = Number(pause_tolInput.value);

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
/* #endregion */

    /* #region computation functions */
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

// function to average over a window some list
function averaging(t, X, T = 1, align = 'center') {
    // Verifier que T est valide
    if (T > t[t.length - 1] / 2) {
        throw new Error('Cannot average over a period this long!');
    }

    let Tm = [];
    let AvgAccel = [];
    
    const dt = t.length * T / t[t.length - 1];
    let n = 0;
    
    // Appliquer le moyennage glissant
    while ((n + 1) * T <= t[t.length - 1]) {
        const a = Math.round(n * dt);
        const b = Math.round((n + 1) * dt);
        
        // Ajuster le temps en fonction de l'alignement
        if (align === 'left') {
            Tm.push(n * T);
        } else if (align === 'right') {
            Tm.push((n + 1) * T);
        } else {
            Tm.push((n + 0.5) * T); // alignement central
        }

        // Moyenne de l'acceleration dans la fenetre
        const segment = X.slice(a, b);
        const mean = segment.reduce((acc, value) => acc + value, 0) / segment.length;
        AvgAccel.push(mean);

        n++;
    }

    // Retourner les valeurs de moyennage
    return { Tm, AvgAccel };
}

// function do find the index of the closest value in an ordered list
function findIndex(val, list) {
    /**
     * In : list (liste ordonnee), val (valeur numerique)
     * Out : Indice de la valeur la plus proche de `val` dans `list`
     */
    let n = list.length;
    let i = 0;

    while (val > list[i] && i < n - 1) {
        i++;
    }

    if (Math.abs(val - list[i - 1]) < Math.abs(val - list[i])) {
        return i - 1;
    }
    return i;
}

// function do find the inactive time frames
function detectPauses(tm, Accm, Tmoyennage, tol = 1.6) {
    /**
     * In : tm (temps moyennes), Accm (norme moyennee), Tmoyennage (periode de moyennage), tol (seuil de detection)
     * Out : Liste des plages de pauses sous forme [debut1, fin1, debut2, fin2, ..., debutN, finN]
     */
    const Fmoyennage = Tmoyennage * tm.length / tm[tm.length - 1];
    const pauses = [];
    let k = -1; // Indice d'entree dans une plage de pause

    for (let i = 0; i < Accm.length; i++) {
        if (Math.abs(Accm[i]) < tol && k === -1) {
            k = i; // Debut d'une plage de pause
        }
        if (Math.abs(Accm[i]) > tol && k !== -1) {
            if (i > k + Fmoyennage) {
                pauses.push(k, i); // Ajouter la plage si elle n'est pas trop courte
            }
            k = -1; // Fin de la plage
        }
        if (k !== -1 && i === Accm.length - 1) {
            pauses.push(k, i); // Ajouter la derniere plage si necessaire
        }
    }

    // Convertir les indices en temps et arrondir a 0.1 pres
    return pauses.map(index => parseFloat(tm[index].toFixed(1)));
}

// function to cut the inactive time frames
function cutPauses(pauses, t, X, isTime = false) {
    /**
     * In : pauses (plages de pauses), t (liste temps), X (liste des mesures)
     * Out : Liste Y, version tronquee des pauses de X
     */
    t = [...t]; // Travailler sur une copie pour eviter les effets de bord
    let indices = pauses.map(p => findIndex(p, t));
    X = [...X]; // Copie de la liste des mesures
    let Y = [];
    let n = Math.floor(indices.length / 2);
    let i = 0;

    for (let k = 0; k < n; k++) {
        let j = indices[2 * k];
        Y = Y.concat(X.slice(i, j)); // Ajouter les donnees hors pause
        i = indices[2 * k + 1];
    }

    Y = Y.concat(X.slice(i)); // Ajouter la fin de la liste hors pause

    // Si on coupe la liste temps, la rendre lineaire
    if (isTime) {
        const totalDuration = t[t.length - 1]; // Duree totale du temps d'origine
        const newTimeStep = totalDuration / (t.length - 1); // Nouveau pas de temps lineaire
        Y = Array.from({ length: Y.length }, (_, idx) => idx * newTimeStep); // Nouvelle liste temps lineaire
    }

    return Y;
}
/* #endregion */

    /* #region plot update functions */
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
                color: 'rgba(10, 89, 160, 0.7)', //'rgba(151, 227, 194, 0.5)', // Add transparency for clarity
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
    // Calculer Delta et arrondir a l'entier le plus proche
    const Delta = Front.map((value, index) => Math.round(value - Rear[index]));

    // Calculer les bins et frequences
    const uniqueValues = [...new Set(Delta)].sort((a, b) => a - b); // Valeurs uniques triees
    const frequencies = uniqueValues.map(val => Delta.filter(x => x === val).length);

    // Convertir les frequences en pourcentage
    const totalPoints = Delta.length;
    const percentages = frequencies.map(freq => (freq / totalPoints * 100).toFixed(3)); // Arrondi a 10^-3

    try {
        // plot 5: Courbe Delta
        await Plotly.restyle('plots_container', { x: [Time], y: [Delta] }, [5]);
        await Plotly.relayout('plots_container', {
            'xaxis4.range': [Math.min(...Time), Math.max(...Time)],
            'yaxis4.range': [Math.min(...Delta), Math.max(...Delta)],
        });

        // plot 9: Histogramme aligne sur les entiers
        await Plotly.restyle('plots_container', {
            x: [uniqueValues],
            y: [percentages],
            type: 'bar',
            marker: {
                color: 'rgb(10, 89, 160)',
            },
            width: 1.1, // Largeur fixee pour chaque barre
        }, [9]);
        await Plotly.relayout('plots_container', {
            'xaxis7.range': [Math.min(...uniqueValues) - 0.5, Math.max(...uniqueValues) + 0.5],
            'yaxis7.range': [0, 1.2*Math.max(...percentages)],
            //'yaxis7.title.text': 'Percentage (%)', // Ajouter un titre pour l'axe y
        });

        // Ajouter une barre jaune a x = 0
        const yellowBarTrace = {
            x: [0], // Position exacte sur l'axe x
            y: [1.2*Math.max(...percentages)], // Hauteur de la barre
            type: 'bar',
            marker: {
                color: '#ffd866',
                opacity: 1, // Plus opaque pour une meilleure visibilite
            },
            width: 0.6, // Largeur ajustee
            name: 'Balance Bar',
            xaxis: 'x7', // Lier explicitement a l'axe x du subplot
            yaxis: 'y7', // Lier explicitement a l'axe y du subplot
        };

        // Ajout de la trace et extension des limites des axes
        await Plotly.addTraces('plots_container', yellowBarTrace);

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
            'xaxis5.range': [-Speed_hist_lim, Speed_hist_lim], //[Math.min(...dRear, ...dFront), Math.max(...dRear, ...dFront)],
        });
        await Plotly.restyle('plots_container', {
            x: [dRear],
            y: [dFront],
            mode: 'markers',
            marker: {
                size: 2, // Adjust as needed
                color: 'rgba(10, 89, 160, 0.7)', //'rgba(151, 227, 194, 0.5)', //Add transparency for clarity
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
async function updateAccelPlot(Tm, AvgAccel) {
    try {
        await Plotly.restyle('plots_container', { x: [Tm], y: [AvgAccel] }, [10]);
        await Plotly.relayout('plots_container', {
            'xaxis8.range': [Math.min(...Tm), Math.max(...Tm)],
            'yaxis8.range': [0, Math.max(...AvgAccel)]
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

        const accelNorm = accelerationX.map((value, index) => Math.sqrt(Math.pow(value, 2) + Math.pow(accelerationY[index], 2) + Math.pow(accelerationZ[index], 2)) - 10);
        const Tmoyennage = parseFloat(document.getElementById('averaging').value);
        const { Tm, AvgAccel } = averaging(Time, accelNorm, Tmoyennage, 'center');

        if (!Time || !Pot1 || !Pot2) {
            console.error('Data extraction failed. Check CSV headers.');
            return;
        }

        // If the pauses should be cut
        if (pauseInput.checked) {
            console.log('Suppression des pauses activee.');

            const pauses = detectPauses(Tm, AvgAccel, Tmoyennage, pause_tol);
            console.log('Pauses detectees :', pauses);

            // Supprimer les pauses des donnees
            const RearFiltered = cutPauses(pauses, Time, Rear);
            const FrontFiltered = cutPauses(pauses, Time, Front);
            const TimeFiltered = cutPauses(pauses, Time, Time, true); // Nouvelle liste temps lineaire
            const AvgAccelFiltered = cutPauses(pauses, Tm, AvgAccel); // Couper aussi AvgAccel et Tm
            const TmFiltered = cutPauses(pauses, Tm, Tm, true);

            // Remplacer les listes originales par les versions filtrees
            Rear.length = 0;
            Rear.push(...RearFiltered);

            Front.length = 0;
            Front.push(...FrontFiltered);

            Time.length = 0;
            Time.push(...TimeFiltered);

            AvgAccel.length = 0;
            AvgAccel.push(...AvgAccelFiltered);

            Tm.length = 0;
            Tm.push(...TmFiltered);

            console.log('Donnees apres suppression des pauses :', { Rear, Front, Time, AvgAccel, Tm });
        }

        // Update plot functions
        await updateRawPlot(Rear, Front, Time);
        await updatePositionPlots(Rear, Front);
        await updateDeltaPlot(Rear, Front, Time);
        await updateSpeedPlot(Rear, Front, Time);
        await updateAccelPlot(Tm, AvgAccel);

        console.log('Plots updated successfully.');
    } catch (error) {
        console.error('Error updating plot:', error);
    }
}
/* #endregion */

// Add event listeners to both file inputs -> update plots
runFileInput.addEventListener('change', updateSubplot);
caliFileInput.addEventListener('change', updateSubplot);
regenerateButton.addEventListener('click', async () => {
    try {
        console.log('Regeneration initiated.');

        // Appeler la fonction pour mettre a jour les graphiques
        await updateSubplot();

        console.log('Graphs regenerated successfully.');
    } catch (error) {
        console.error('Error regenerating graphs:', error);
    }
});

    /* #region plotly variables */
/*
Colors :
Front : rgba(0, 152, 241, 0.7) (bleu clair)
Rear : rgba(20, 26, 78, 0.7) (bleu fonce)
Both : rgba(10, 89, 160, 0.7) (moyenne)
*/

// Plotting
var lineRe = {
    x: [1, 2, 3],
    y: [4, 5, 6],
    xaxis: 'x1',
    yaxis: 'y1',
    type: 'scatter',
    name: 'Rear',
    marker: {
        color: 'rgba(20, 26, 78, 0.7)', //'rgba(255, 99, 71, 0.7)',
        size: 3
    },
    line: {
        color: 'rgba(20, 26, 78, 0.7)', //'rgba(255, 99, 71, 0.7)',
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
        color: 'rgba(0, 152, 241, 0.7)',//'rgba(54, 162, 235, 0.7)',
        size: 3
    },
    line: {
        color: 'rgba(0, 152, 241, 0.7)',//'rgba(54, 162, 235, 0.7)',
        opacity: 0.5,
        width: 1
    }
  };

var histogramRe = {
    x: [1, 2, 3, 2, 2], // Placeholder
    type: 'histogram',
    marker: {color: 'rgba(20, 26, 78, 0.7)'}, //{ color: 'rgba(255, 99, 71, 0.7)' },
    name: 'Rear',
    xaxis: 'x2',
    yaxis: 'y2',
};

var histogramFr = {
    x: [1, 2, 3, 3, 1], // Placeholder
    type: 'histogram',
    marker: {color: 'rgba(0, 152, 241, 0.7)'}, //{ color: 'rgba(54, 162, 235, 0.7)' },
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
        color: 'rgba(10, 89, 160, 0.7)', //'rgba(151, 227, 194, 0.7)',
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
    marker: {color: 'rgb(10, 89, 160)'}, //{color: 'rgba(151, 227, 194, 0.7'},
    xaxis: 'x4',
    yaxis: 'y4',
    type: 'scatter',
    name: "Fr/Re delta",
    line : {
        width: 1,
    }
    };

var histogramReSpeed = {
    x: [1, 2, 3],
    xaxis: 'x5',
    yaxis: 'y5',
    type: 'histogram',
    marker: {color: 'rgba(20, 26, 78, 0.7)'}, //{ color: 'rgba(255, 99, 71, 0.7)' },
    name: 'Rear',
    };

var histogramFrSpeed = {
    x: [1, 2, 3],
    xaxis: 'x5',
    yaxis: 'y5',
    type: 'histogram',
    marker: {color: 'rgba(0, 152, 241, 0.7)'}, //{ color: 'rgba(54, 162, 235, 0.7)' },
    name: 'Front',
    };

var cloudSpeed = {
    x: [1, 3, 1.5, 2.5],
    y: [4, 5, 6, 4.5],
    xaxis: 'x6',
    yaxis: 'y6',
    type: 'scatter',
    marker: {
        color: 'rgba(10, 89, 160, 0.7)', //'rgba(151, 227, 194, 0.7)',
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
    x: [1, 2, 3, 3, 3, 1], // Placeholder
    type: 'histogram',
    marker: {color: 'rgb(10, 89, 160)'}, //{color: 'rgba(151, 227, 194, 0.7'},
    name: 'Fr/Re delta',
    };

var lineAccel = {
    x: [1, 2, 3],
    y: [4, 5, 6],
    xaxis: 'x8',
    yaxis: 'y8',
    type: 'scatter',
    name: "Acceleration",
    marker: {color: 'rgb(10, 89, 160)'}, //{color: 'rgba(195, 177, 225, 0.7)'}
    line : {
        width: 1,
    }
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

    showlegend: false,
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
/* #endregion */

Plotly.newPlot('plots_container', data, layout);

/* #region Geometry Export */

// Ajoute un ecouteur d'evenement au bouton que vous avez cree en HTML
document.getElementById("export-geometry-btn").addEventListener("click", () => {
    exportGeometryToTxt();
});

/**
 * Exporte les coordonnees des pivots (en mm) dans un fichier .txt
 */
function exportGeometryToTxt() {
    // 1. Verifier si les donnees (converties en mm) sont pretes
    if (pivotPointsMm.length === 0) {
        alert("No millimeter-converted geometry data to export. Please capture and convert the pivots first.");
        return;
    }

    // 2. Formater les donnees en une seule chaine de caracteres
    let fileContent = "Hexatrail Geometry Export\n";
    fileContent += `Timestamp: ${new Date().toISOString()}\n`;
    fileContent += "Units: millimeters (mm)\n";
    fileContent += "Origin: Crank axle (0,0)\n";
    fileContent += "----------------------------------\n\n";

    // Ajoute chaque point au fichier
    pivotPointsMm.forEach(point => {
        // Format: Label: X=123.45, Y=67.89
        fileContent += `${point.label}: X=${point.x.toFixed(3)}, Y=${point.y.toFixed(3)}\n`;
    });

    // 3. Creer un "Blob" (un objet fichier) avec le contenu
    const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });

    // 4. Creer un lien de telechargement temporaire
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.href = url;
    link.download = "hexatrail_geometry.txt"; // Le nom du fichier qui sera telecharge
    document.body.appendChild(link); // Requis pour que cela fonctionne sur Firefox

    // 5. Simuler un clic sur le lien pour demarrer le telechargement
    link.click();

    // 6. Nettoyer en supprimant le lien temporaire
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/* #endregion */


/* #endregion */

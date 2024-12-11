// sliding menu
document.getElementById("settings_icon").addEventListener("click", () => {
    const menu = document.getElementById("menu");
    menu.classList.toggle("open");
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

// Simulate double menu icon click on page load -> make page responsive for some reason
window.addEventListener('load', () => {
    document.getElementById("menu_icon").click();
});
window.addEventListener('load', () => {
    document.getElementById("menu_icon").click();
});
// sidebar tabs
// Select all tab buttons and content sections
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

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
    } else {
        geometryCanvas.style.display = "none";
        plotsContainer.style.display = "block";
    }
}


// Attach click event listeners to all tab buttons
tabButtons.forEach((button) => {
    button.addEventListener("click", switchTab);
});

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
            // Obtenez les dimensions du conteneur principal
            const container = canvas.parentElement;
            const maxWidth = container.clientWidth;
            const maxHeight = container.clientHeight;

            // Calculez les dimensions redimensionnées en conservant le ratio
            const imgRatio = img.width / img.height;
            let newWidth = maxWidth;
            let newHeight = maxHeight;

            if (newWidth / imgRatio > maxHeight) {
                newWidth = maxHeight * imgRatio;
            } else {
                newHeight = newWidth / imgRatio;
            }

            // Ajustez la taille du canevas
            canvas.width = newWidth;
            canvas.height = newHeight;

            // Nettoyez et dessinez l'image redimensionnée
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, newWidth, newHeight);
        };

        // Chargez l'image sélectionnée
        img.src = URL.createObjectURL(file);
    });
}

window.addEventListener("load", () => {
    loadImageToCanvas("geometry_image", "geometry_canvas");
});

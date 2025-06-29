// script.js for DreamStyler

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Get references to HTML elements ---
    const dreamTextInput = document.getElementById('dreamText');
    const analyzeButton = document.getElementById('analyzeBtn');
    const genreResultText = document.getElementById('genreResult');
    const resultContainer = document.getElementById('resultContainer');
    const errorMessage = document.getElementById('errorMessage');

    // --- 2. Add an event listener to the "Analyze" button ---
    analyzeButton.addEventListener('click', analyzeDream);

    // --- Function to analyze the dream text ---
    function analyzeDream() {
        // --- Flowchart Logic: User enters dream text ---
        let dreamText = dreamTextInput.value.trim(); // Get user's input and trim whitespace
        let genre = ""; // Initialize the genre variable

        // --- Flowchart Logic: IF input is empty THEN show error message ---
        if (dreamText === "") {
            errorMessage.classList.remove('hidden'); // Show error message
            resultContainer.classList.add('hidden'); // Hide result container
            genreResultText.textContent = ""; // Clear previous result
            removeGenreClasses(resultContainer); // Remove any previous genre styling
            return; // Stop function execution if input is empty
        } else {
            errorMessage.classList.add('hidden'); // Hide error message if text is present
        }

        // --- Analyze the text for keywords & Check logical conditions ---
        // Convert dream text to lowercase for case-insensitive matching
        const lowerCaseDreamText = dreamText.toLowerCase();

        // --- Flowchart Logic: Determine appropriate film genre based on keywords ---
        // Each keyword match should change the genre shown (as per user interaction)
        if (lowerCaseDreamText.includes("run") || lowerCaseDreamText.includes("chase")) {
            genre = "Thriller";
        } else if (lowerCaseDreamText.includes("love") || lowerCaseDreamText.includes("romantic") || lowerCaseDreamText.includes("kiss")) {
            genre = "Romance";
        } else if (lowerCaseDreamText.includes("fly") || lowerCaseDreamText.includes("light") || lowerCaseDreamText.includes("magic")) {
            genre = "Fantasy";
        } else if (lowerCaseDreamText.includes("laugh") || lowerCaseDreamText.includes("funny") || lowerCaseDreamText.includes("weird")) {
            genre = "Comedy";
        } else {
            // Default genre if no specific keywords are found
            genre = "General Drama";
        }

        // --- Flowchart Logic: Display result to user ---
        displayResult(genre);
    }

    // --- Function to display the genre and apply visual feedback ---
    function displayResult(genre) {
        // Ensure result container is visible
        resultContainer.classList.remove('hidden');

        // Update the text content
        genreResultText.textContent = genre;

        // Apply visual feedback (colors) based on the genre
        removeGenreClasses(resultContainer); // Remove any existing genre classes first
        switch (genre) {
            case "Thriller":
                resultContainer.classList.add('genre-thriller');
                break;
            case "Romance":
                resultContainer.classList.add('genre-romance');
                break;
            case "Fantasy":
                resultContainer.classList.add('genre-fantasy');
                break;
            case "Comedy":
                resultContainer.classList.add('genre-comedy');
                break;
            default:
                // For "General Drama" or any other unlisted genre
                resultContainer.classList.add('genre-default');
                break;
        }

        // Scroll to the result to make it more noticeable on smaller screens
        resultContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // --- Helper function to remove all genre-specific background classes ---
    function removeGenreClasses(element) {
        element.classList.remove('genre-thriller', 'genre-romance', 'genre-fantasy', 'genre-comedy', 'genre-default');
    }
});

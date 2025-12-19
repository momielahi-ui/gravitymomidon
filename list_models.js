
const apiKey = "AIzaSyAofeJZZ4q9h3Q9M6rWo2q2y6CutBQP19Y";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

async function listModels() {
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => console.log(m.name));
        } else {
            console.log("No models found", data);
        }
    } catch (e) {
        console.error(e);
    }
}

listModels();

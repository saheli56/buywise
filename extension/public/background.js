chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "analyzeProduct") {
        fetch("http://localhost:8000/api/v1/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request.payload)
        })
        .then(response => response.json())
        .then(data => sendResponse({ success: true, data: data }))
        .catch(error => sendResponse({ success: false, error: error.toString() }));
        
        return true;
    }
});

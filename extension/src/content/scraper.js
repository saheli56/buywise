function extractGenericProductData() {
    let title = document.title.split('-')[0].split('|')[0].trim();
    let ingredientsText = "";

    const h1 = document.querySelector('h1');
    if (h1) title = h1.innerText.trim();

    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scripts) {
        try {
            const json = JSON.parse(script.innerText);
            if (json['@type'] === 'Product' || (Array.isArray(json) && json.some(item => item['@type'] === 'Product'))) {
                const productData = Array.isArray(json) ? json.find(item => item['@type'] === 'Product') : json;
                if (productData.name) title = productData.name;
                if (productData.description) ingredientsText += " " + productData.description;
            }
        } catch (e) {}
    }

    const allTextNodes = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    let foundIngredients = false;
    while (node = allTextNodes.nextNode()) {
        const text = node.nodeValue.trim().toLowerCase();
        if (text.includes('ingredients') && text.length < 30) {
            foundIngredients = true;
            let nextText = "";
            let sibling = node.parentNode.nextSibling;
            for(let i=0; i<5 && sibling; i++) {
                nextText += sibling.textContent + " ";
                sibling = sibling.nextSibling;
            }
            ingredientsText += " " + nextText;
        } else if (foundIngredients && text.length > 20) {
            ingredientsText += " " + node.nodeValue;
            foundIngredients = false; 
        }
    }

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle && ogTitle.content) title = ogTitle.content;

    return {
        url: window.location.href,
        title: title || "Unknown Product",
        ingredients_text: ingredientsText.trim().substring(0, 1500),
        nutrition_text: "",
        category: "General"
    };
}

async function analyzeProduct() {
    const productData = extractGenericProductData();
    if (!productData.title || productData.title === "Unknown Product") return;

    chrome.storage.local.get(['userProfile'], async function(result) {
        const userProfile = result.userProfile || { allergies: [], diets: [], goals: [] };
        if (userProfile.allergies.length === 0 && userProfile.diets.length === 0) return;

        try {
            const response = await fetch("http://localhost:8000/api/v1/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ product: productData, user_profile: userProfile })
            });
            const analysis = await response.json();
            injectPremiumUI(analysis);
        } catch (e) {}
    });
}

function injectPremiumUI(analysis) {
    if (document.getElementById('buywise-premium-overlay')) return;
    if (analysis.safety_state === "Compatible" || analysis.safety_state === "Cannot Verify") return;

    const overlay = document.createElement('div');
    overlay.id = 'buywise-premium-overlay';
    
    let themeColor = analysis.safety_state === "High Risk" ? "#ef4444" : "#f59e0b";
    let bgColor = analysis.safety_state === "High Risk" ? "rgba(254, 226, 226, 0.95)" : "rgba(254, 243, 199, 0.95)";
    let icon = analysis.safety_state === "High Risk" 
        ? `<svg style="width:24px;height:24px;color:#ef4444;" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`
        : `<svg style="width:24px;height:24px;color:#f59e0b;" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;

    overlay.style.cssText = `
        position: fixed; top: 24px; right: 24px; z-index: 2147483647;
        background: ${bgColor}; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        border: 1px solid ${themeColor}40; border-radius: 16px; width: 360px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        padding: 20px; box-sizing: border-box; transform: translateX(120%);
        transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    `;

    let html = `
        <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <div style="background: white; padding: 6px; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: flex;">
                    ${icon}
                </div>
                <h2 style="margin: 0; font-size: 16px; font-weight: 600; color: #111827; letter-spacing: -0.01em;">${analysis.safety_state} Detected</h2>
            </div>
            <button id="buywise-close-btn" style="background: none; border: none; cursor: pointer; color: #6b7280; padding: 4px; display: flex; align-items: center; justify-content: center; border-radius: 6px; transition: background 0.2s;">
                <svg style="width:16px;height:16px;" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
        </div>
        <p style="margin: 0 0 16px 0; font-size: 14px; color: #374151; line-height: 1.5;">${analysis.analysis_summary}</p>
    `;

    if (analysis.recommendations && analysis.recommendations.length > 0) {
        html += `<div style="background: white; border-radius: 12px; padding: 16px; border: 1px solid rgba(0,0,0,0.05);">`;
        html += `<h3 style="margin: 0 0 12px 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280;">Safer Alternatives</h3>`;
        html += `<div style="display: flex; flex-direction: column; gap: 12px;">`;
        analysis.recommendations.forEach(rec => {
            html += `
                <a href="${rec.url}" target="_blank" style="text-decoration: none; display: block; group; transition: opacity 0.2s;">
                    <div style="font-size: 14px; font-weight: 500; color: #111827; line-height: 1.4;">${rec.title}</div>
                    <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">${rec.reason}</div>
                </a>
            `;
        });
        html += `</div></div>`;
    }
    
    overlay.innerHTML = html;
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
        overlay.style.transform = 'translateX(0)';
    });

    const closeBtn = document.getElementById('buywise-close-btn');
    closeBtn.addEventListener('mouseover', () => closeBtn.style.background = 'rgba(0,0,0,0.05)');
    closeBtn.addEventListener('mouseout', () => closeBtn.style.background = 'none');
    closeBtn.addEventListener('click', () => {
        overlay.style.transform = 'translateX(120%)';
        setTimeout(() => overlay.remove(), 500);
    });
}

setTimeout(analyzeProduct, 2500);

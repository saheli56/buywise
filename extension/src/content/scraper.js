function scrapeAmazonProduct() {
  const titleEl = document.getElementById("productTitle");
  const title = titleEl ? titleEl.innerText.trim() : "";

  const ingredientsEl = document.getElementById("important-information");
  let ingredients_text = "";
  if (ingredientsEl) {
      const content = ingredientsEl.innerText;
      const match = content.match(/Ingredients\s*[:\n]+([\s\S]*?)(Directions|Legal Disclaimer|$)/i);
      if (match && match[1]) {
          ingredients_text = match[1].trim();
      }
  }

  const nutrition_text = ""; 

  return {
    url: window.location.href,
    title,
    ingredients_text,
    nutrition_text,
    category: "Snack"
  };
}

async function analyzeProduct() {
  const productData = scrapeAmazonProduct();
  
  if (!productData.title) return;

  chrome.storage.local.get(['userProfile'], async function(result) {
    const userProfile = result.userProfile || { allergies: ["dairy"], diets: [], goals: [] };

    try {
        const response = await fetch("http://localhost:8000/api/v1/analyze", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                product: productData,
                user_profile: userProfile
            })
        });
        
        const analysis = await response.json();
        injectUI(analysis);
    } catch (e) {
        console.error("Buywise Analysis failed", e);
    }
  });
}

function injectUI(analysis) {
  if (document.getElementById('buywise-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'buywise-overlay';
  
  let color = "green";
  if (analysis.safety_state === "High Risk") color = "red";
  else if (analysis.safety_state === "Caution") color = "orange";
  else if (analysis.safety_state === "Cannot Verify") color = "gray";

  overlay.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 10000;
    background: white; border: 4px solid ${color}; padding: 20px;
    border-radius: 8px; width: 350px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-family: Arial, sans-serif;
  `;

  let html = `<h2 style="margin-top:0; color: ${color}; font-size: 20px;">${analysis.safety_state}</h2>`;
  html += `<p style="font-size: 14px; color: #333;">${analysis.analysis_summary}</p>`;

  if (analysis.recommendations && analysis.recommendations.length > 0) {
      html += `<h3 style="font-size: 16px; margin-top: 15px;">Safer Alternatives:</h3><ul style="padding-left: 20px; font-size: 13px;">`;
      analysis.recommendations.forEach(rec => {
          html += `<li style="margin-bottom: 8px;"><a href="${rec.url}" target="_blank" style="color: #007185; text-decoration: none; font-weight: bold;">${rec.title}</a><br/><span style="color: #555;">${rec.reason}</span></li>`;
      });
      html += `</ul>`;
  }
  
  html += `<button id="buywise-close-btn" style="margin-top: 10px; padding: 5px 10px; background: #eee; border: 1px solid #ccc; cursor: pointer;">Dismiss</button>`;
  overlay.innerHTML = html;
  
  document.body.appendChild(overlay);

  document.getElementById('buywise-close-btn').addEventListener('click', () => {
      overlay.remove();
  });
}

setTimeout(analyzeProduct, 2000);

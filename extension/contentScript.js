let currentSelection = null;
let currentTooltip = null;

document.addEventListener('mouseup', handleSelection);

function handleSelection() {
  const selection = window.getSelection();
  if (!selection.toString().trim()) return;

  // Clear previous tooltip
  if (currentTooltip) {
    document.body.removeChild(currentTooltip);
    currentTooltip = null;
  }

  // Show loading indicator
  showLoadingTooltip(selection);

  // Send to background for analysis
  chrome.runtime.sendMessage(
    { action: 'analyzeText', text: selection.toString() },
    (response) => {
      // Remove loading
      if (currentTooltip) {
        document.body.removeChild(currentTooltip);
      }
      
      if (response.error) {
        showErrorTooltip(response.error, selection);
      } else {
        showAnalysisTooltip(response, selection);
      }
    }
  );
}

function showLoadingTooltip(selection) {
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  currentTooltip = document.createElement('div');
  currentTooltip.className = 'toxicity-tooltip loading';
  currentTooltip.innerHTML = '<div class="spinner"></div>';
  
  positionTooltip(currentTooltip, rect);
  document.body.appendChild(currentTooltip);
}

function showAnalysisTooltip(data, selection) {
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  currentTooltip = document.createElement('div');
  currentTooltip.className = `toxicity-tooltip ${data.is_toxic ? 'toxic' : 'clean'}`;
  
  let html = `<div class="toxicity-header">`;
  html += data.is_toxic ? '🚨 Toxic Content' : '✅ Clean Content';
  html += `</div>`;
  
  if (data.is_toxic) {
    html += `<div class="toxicity-types">`;
    for (const [label, info] of Object.entries(data.toxic_types)) {
      if (info.present) {
        html += `
          <div class="toxicity-type">
            <span>${label.replace('_', ' ')}:</span>
            <span class="probability">${Math.round(info.probability * 100)}%</span>
            <div class="probability-bar" style="width: ${info.probability * 100}%"></div>
          </div>
        `;
      }
    }
    html += `</div>`;
  }
  
  currentTooltip.innerHTML = html;
  positionTooltip(currentTooltip, rect);
  document.body.appendChild(currentTooltip);
}

function showErrorTooltip(error, selection) {
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  currentTooltip = document.createElement('div');
  currentTooltip.className = 'toxicity-tooltip error';
  currentTooltip.textContent = `Error: ${error}`;
  
  positionTooltip(currentTooltip, rect);
  document.body.appendChild(currentTooltip);
}

function positionTooltip(tooltip, rect) {
  tooltip.style.position = 'absolute';
  tooltip.style.left = `${rect.left + window.scrollX}px`;
  tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
  tooltip.style.zIndex = '999999';
}
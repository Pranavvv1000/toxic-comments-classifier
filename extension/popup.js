document.addEventListener('DOMContentLoaded', function() {
    const analyzeBtn = document.getElementById('analyze-btn');
    const commentInput = document.getElementById('comment-input');
    const resultContainer = document.getElementById('result-container');
    const toxicityStatus = document.getElementById('toxicity-status');
    const toxicityBreakdown = document.getElementById('toxicity-breakdown');
    const toxicityTypes = document.getElementById('toxicity-types');
    const mostSevere = document.getElementById('most-severe');
    const severeType = document.getElementById('severe-type');
    const errorContainer = document.getElementById('error-container');
    const loading = document.getElementById('loading');
  
    analyzeBtn.addEventListener('click', analyzeText);
  
    function analyzeText() {
      const comment = commentInput.value.trim();
      
      if (!comment) {
        showError("Please enter some text to analyze");
        return;
      }
      
      // Show loading, hide other elements
      loading.classList.remove('hidden');
      resultContainer.classList.add('hidden');
      errorContainer.classList.add('hidden');
      
      // Call the Flask backend
      fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment: comment }),
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        if (data.error) {
          throw new Error(data.error);
        }
        displayResults(data);
      })
      .catch(error => {
        showError(error.message);
      })
      .finally(() => {
        loading.classList.add('hidden');
      });
    }
  
    function displayResults(data) {
      // Display toxicity status
      if (data.is_toxic) {
        toxicityStatus.textContent = "🚨 This text is TOXIC";
        toxicityStatus.className = "toxic";
      } else {
        toxicityStatus.textContent = "✅ This text is CLEAN";
        toxicityStatus.className = "clean";
      }
      
      // Display toxicity breakdown if toxic
      toxicityTypes.innerHTML = '';
      if (data.is_toxic) {
        toxicityBreakdown.classList.remove('hidden');
        for (const [label, info] of Object.entries(data.toxic_types)) {
          if (info.present) {
            const li = document.createElement('li');
            li.textContent = `${label.toUpperCase()} (${(info.probability * 100).toFixed(2)}% confidence)`;
            toxicityTypes.appendChild(li);
          }
        }
      } else {
        toxicityBreakdown.classList.add('hidden');
      }
      
      // Display most severe type if toxic
      if (data.is_toxic) {
        mostSevere.classList.remove('hidden');
        severeType.textContent = `${data.most_severe_type.label.toUpperCase()} (${(data.most_severe_type.probability * 100).toFixed(2)}%)`;
      } else {
        mostSevere.classList.add('hidden');
      }
      
      resultContainer.classList.remove('hidden');
    }
  
    function showError(message) {
      errorContainer.textContent = message;
      errorContainer.classList.remove('hidden');
    }
  });
from flask import Flask, config, request, jsonify
from flask_cors import CORS
from transformers import BertTokenizer, TFBertForSequenceClassification
import tensorflow as tf
import numpy as np
import logging

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure logging
# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load model and tokenizer
try:
    logger.info("Loading model and tokenizer...")
    
    # Load model from directory (not the .h5 file directly)
    model = TFBertForSequenceClassification.from_pretrained(
        'D:/toxic-comment/backend/bert_toxicity_model',
        local_files_only=True
    )
    
    # Load tokenizer from directory
    tokenizer = BertTokenizer.from_pretrained(
        'D:/toxic-comment/backend/bert_toxicity_tokenizer',
        local_files_only=True
    )
    
    logger.info("Model and tokenizer loaded successfully")
except Exception as e:
    logger.error(f"Error loading model: {str(e)}")
    raise

# Toxicity labels
TOXICITY_LABELS = [
    'toxic',
    'severe_toxic',
    'obscene',
    'threat',
    'insult',
    'identity_hate'
]

TOXICITY_THRESHOLD = 0.5

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        comment = data.get('comment', '')
        
        if not comment:
            return jsonify({'error': 'No comment provided'}), 400
        
        # Tokenize the input comment
        inputs = tokenizer(
            comment,
            max_length=128,
            truncation=True,
            padding='max_length',
            return_tensors='tf'
        )
        
        # Make prediction
        outputs = model(inputs)
        probs = tf.sigmoid(outputs.logits).numpy()[0]
        
        # Determine which labels are present
        is_toxic = any(p > TOXICITY_THRESHOLD for p in probs)
        toxic_types = {
            label: {
                'present': bool(prob > TOXICITY_THRESHOLD),
                'probability': float(prob)
            }
            for label, prob in zip(TOXICITY_LABELS, probs)
        }
        
        # Get the most severe toxicity type
        max_prob_index = np.argmax(probs)
        most_severe_type = TOXICITY_LABELS[max_prob_index]
        most_severe_prob = float(probs[max_prob_index])
        
        response = {
            'is_toxic': is_toxic,
            'toxic_types': toxic_types,
            'most_severe_type': {
                'label': most_severe_type,
                'probability': most_severe_prob
            },
            'raw_probs': {label: float(prob) for label, prob in zip(TOXICITY_LABELS, probs)}
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
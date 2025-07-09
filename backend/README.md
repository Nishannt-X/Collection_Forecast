
# Payment Prediction ML Backend

This Flask backend serves your trained ML model for payment predictions.

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Place Your Model Files**:
   Copy these files to the `backend/` directory:
   - `payment_prediction_model.pkl` (your pickle file)
   - `payment_prediction_model.h5` (your Keras model file)

3. **Run the Server**:
   ```bash
   python app.py
   ```

The server will start on `http://localhost:5000`

## API Endpoints

- `GET /health` - Health check
- `POST /load-model` - Load the ML model
- `POST /predict` - Make payment prediction
- `GET /customer-risk/<customer_name>` - Get customer risk assessment
- `POST /forecast` - Generate payment forecast for multiple invoices

## Model Files Structure

Your pickle file should contain:
- `sequence_scaler`: Scaler for sequence features
- `static_scaler`: Scaler for static features
- `sequence_features`: List of sequence feature names
- `static_features`: List of static feature names
- Other metadata

Your h5 file should be the trained Keras model.

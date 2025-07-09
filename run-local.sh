
#!/bin/bash

echo "🚀 Starting Payment Prediction App in Local Mode"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found!"
    echo "Please create .env.local with your Supabase credentials"
    exit 1
fi

echo "✅ Environment file found"

# Check if ML model files exist
if [ ! -f "backend/payment_prediction_model.pkl" ] || [ ! -f "backend/payment_prediction_model.h5" ]; then
    echo "⚠️  ML model files not found in backend/ directory"
    echo "Please copy your .pkl and .h5 files to the backend/ folder"
fi

echo ""
echo "📋 To start the application:"
echo "1. Frontend: npm run dev"
echo "2. Backend: cd backend && python app.py"
echo ""
echo "🌐 URLs:"
echo "- Frontend: http://localhost:8080"
echo "- Backend: http://localhost:5000"

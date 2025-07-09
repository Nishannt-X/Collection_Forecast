Collection Forecasting System

This project is a full-stack Accounts Receivable Forecasting System designed to help businesses predict their daily incoming payments based on historical payment behavior. It leverages machine learning to generate accurate cash inflow forecasts and provides a user-friendly dashboard for visualization.

Key Features

Forecasts receivables on a daily basis.
Uses a hybrid LSTM + Feedforward Neural Network model for high accuracy.
Cleanly separated frontend and backend architecture.
Supabase integration for secure authentication and database management.
Lightweight and responsive UI with real-time display of forecasts.
Technologies Used

Frontend
Vite – Fast build tool for modern web development.
React – UI library for building reusable components.
TypeScript – Adds static typing to JavaScript.
Tailwind CSS – Utility-first CSS framework.
shadcn/ui – Customizable UI components for React.

Backend
Flask – Python web framework used to serve the ML model as a REST API.
Supabase – Backend-as-a-service for managing authentication and database.

Machine Learning
LSTM (Long Short-Term Memory) – Recurrent neural network for modeling time-series payment behavior.
Feedforward Neural Network – Learns static features and complements LSTM output.
Hybrid Model Architecture – Integrates both sequence-based and static inputs for robust forecasting.


How to Run the Project Locally

1. Clone the Repository
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
2. Run the Backend (Flask API)
Important: Open the backend/ folder in a separate IDE (preferably PyCharm) and run it first.

cd backend

# (Optional) Create and activate virtual environment
python -m venv venv
source venv/bin/activate      # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the Flask API server
python app.py
This will start the backend server at http://localhost:5000.

3. Run the Frontend
Open the main project directory (outside the backend folder) in your preferred IDE (e.g., VS Code).

# Install dependencies
npm install

# Start the development server
npm run dev
This will launch the frontend on http://localhost:5173, which communicates with the Flask backend for predictions.



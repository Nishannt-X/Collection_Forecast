
# Local Development Setup

## Supabase Connection Setup

### Step 1: Create Environment File
Create a `.env.local` file in your project root with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://vuwfllutcznyygbxkegu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1d2ZsbHV0Y3pueXlnYnhrZWd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNDIyNTUsImV4cCI6MjA2NDYxODI1NX0.uBFyJwIf6V_50XiOhMkkFDu6ArZKHhc1PkOXMokF-Qw
```

### Step 2: Update Supabase Client
The client will automatically use environment variables when available.

### Step 3: ML Model Files
1. Copy your `payment_prediction_model.pkl` file to `backend/` directory
2. Copy your `payment_prediction_model.h5` file to `backend/` directory
3. Files will be automatically loaded when you start the Flask backend

### Step 4: Start Development
1. **Frontend**: `npm run dev` (runs on http://localhost:8080)
2. **Backend**: `cd backend && python app.py` (runs on http://localhost:5000)

### Important Notes
- The `.env.local` file is already in `.gitignore` so your credentials won't be committed
- Your ML model files will be automatically detected and loaded by Flask
- Make sure both frontend and backend are running for full functionality

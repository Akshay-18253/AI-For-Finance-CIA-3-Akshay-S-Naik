# Local Setup & Installation Guide
## AI-Powered Fraud Detection System

This guide provides step-by-step instructions to configure, run, and test the platform on **Windows**, **macOS**, and **Linux**.

---

## 1. Prerequisites

Ensure you have the following installed on your system:
- **Python**: Version 3.11, 3.12, 3.13, or 3.14 (64-bit)
- **Node.js**: Version 18.x or newer (Tested on Node.js v24.21.0)
- **npm**: Version 9.x or newer (Tested on npm 11.19.0)
- **Git**: Version 2.25+

---

## 2. Repository Setup

```bash
# Clone the repository
git clone <YOUR-GITHUB-REPO-URL>
cd "AI for Finance"
```

---

## 3. Backend Setup (FastAPI & ML Engine)

### Step 3.1: Navigate to the Backend Directory
```bash
cd backend
```

### Step 3.2: Create and Activate Virtual Environment

**On Windows (PowerShell):**
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```
*(If script execution is disabled in PowerShell, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` first).*

**On macOS / Linux (bash/zsh):**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### Step 3.3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 3.4: Configure Environment Variables
Copy the example environment file:
```bash
# Windows:
copy .env.example .env

# macOS / Linux:
cp .env.example .env
```

Contents of `.env`:
```ini
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
DATABASE_URL=sqlite:///./fraud_detection.db
MODEL_PATH=artifacts/fraud_model.joblib
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### Step 3.5: Train Model & Seed Demonstration Database

```bash
# Generate the 30k transaction training dataset:
python dataset/generate_dataset.py

# Train the Random Forest + Isolation Forest models:
python -m app.ml.training

# Populate SQLite database with 180 realistic demonstration transactions:
python -m app.database_seeder
```

### Step 3.6: Start the Backend API Server
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Base: `http://localhost:8000/api`
- Interactive Swagger UI: `http://localhost:8000/docs`

---

## 4. Frontend Setup (React 19 + Vite 8)

Open a **separate terminal window**:

### Step 4.1: Navigate to Frontend Directory
```bash
cd frontend
```

### Step 4.2: Install NPM Dependencies
```bash
npm install
```

### Step 4.3: Start the Vite Development Server
```bash
npm run dev
```

The frontend will start and be accessible at:
👉 **`http://localhost:5173`**

The Vite development server is pre-configured with a reverse proxy routing all `/api/*` calls directly to `http://localhost:8000`.

---

## 5. Verification & Testing

### Running the Backend Automated Test Suite
With the backend virtual environment active:
```bash
cd backend
python -m pytest tests/test_api.py -v
```

Expected output:
```
tests/test_api.py::test_predict_fraud_low_risk PASSED                    [ 11%]
tests/test_api.py::test_predict_fraud_high_risk PASSED                   [ 22%]
tests/test_api.py::test_dashboard_summary PASSED                         [ 33%]
tests/test_api.py::test_create_and_fetch_transaction PASSED              [ 44%]
tests/test_api.py::test_list_transactions PASSED                         [ 55%]
tests/test_api.py::test_alerts_and_status_update PASSED                  [ 66%]
tests/test_api.py::test_analytics PASSED                                 [ 77%]
tests/test_api.py::test_model_metrics PASSED                             [ 88%]
tests/test_api.py::test_model_info PASSED                                [100%]

============================== 9 passed in ~7s ==============================
```

### Running Frontend Production Build Verification
```bash
cd frontend
npm run build
```
Build files will be created in `frontend/dist/`.

---

## 6. Common Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| `pip install scikit-learn` fails | Missing C/C++ compiler or incompatible Python version | Use pre-built wheels: `pip install --only-binary :all: scikit-learn pandas scipy` |
| `ps1 cannot be loaded because running scripts is disabled` | Windows PowerShell execution policy | Run: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` |
| `CORS Error` in browser | Backend is rejecting frontend origin | Check `CORS_ORIGINS` in `backend/.env` includes `http://localhost:5173` |
| `Model file not found` | Training script was not executed | Run `python -m app.ml.training` from the `backend/` directory |

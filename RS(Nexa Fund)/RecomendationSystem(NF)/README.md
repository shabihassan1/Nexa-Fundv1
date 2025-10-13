# ML Recommendation System

A machine learning-based recommendation system for matching donors to campaigns, using TF-IDF embeddings and Non-negative Matrix Factorization (NMF), with a FastAPI web API for easy integration and testing.

---

## 🚀 Features
- **ML-based recommendations** using Non-negative Matrix Factorization (NMF)
- **TF-IDF embeddings:** Text features using TF-IDF + numeric features
- **REST API** with FastAPI (ready for frontend or backend integration)
- **Endpoints** for recommendations, similar users, donors, campaigns, and system status
- **Interactive API docs** at `/docs`
- **Easy to test** with included scripts

---

## 🧠 How It Works (Core Logic)
1. **Data Loading**: Reads donor and campaign data from CSV files (`donors.csv`, `campaigns.csv`).
2. **Feature Engineering**: Creates hybrid embeddings for donors and campaigns using TF-IDF vectorization of text fields + numeric fields (with padding for dimension alignment).
3. **Interaction Matrix**: Computes similarity between every donor and campaign to build a user-item matrix.
4. **Matrix Factorization (NMF)**: Learns hidden patterns in donor-campaign interactions.
5. **Recommendations**: Predicts and ranks campaigns for each donor based on learned patterns.
6. **Similar Users**: Finds donors with similar preferences using latent factors.

---

## 📦 Project Structure
```
.
├── fastapi_app.py         # FastAPI server with all endpoints (uses TF-IDF embeddings)
├── run_server.py          # Script to launch the FastAPI server
├── test_fastapi.py        # Script to test all API endpoints
├── ml_recommender_tfidf.py     # ML recommender with TF-IDF embeddings
├── embed_utils_tfidf.py   # TF-IDF embedding utilities
├── donors.csv             # Donor data
├── campaigns.csv          # Campaign data
...
```

---

## ⚡ Quickstart

### 1. **Install dependencies**
```bash
pip install -r requirements.txt
```

### 2. **Run the FastAPI server (TF-IDF Embeddings)**
```bash
python run_server.py
```
- The server will start at [http://localhost:8000](http://localhost:8000)
- Interactive docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. **Test the API**
```bash
python test_fastapi.py
```
- This will test all endpoints and print results to the console.

---

## 🧪 **Run the TF-IDF Recommender (Standalone)**

To test the TF-IDF-based recommender logic:
```bash
python ml_recommender_tfidf.py
```
- This will print recommendations for the first donor using TF-IDF embeddings.

---

## 🗃️ Data Format

### donors.csv
| Column           | Type    | Description                       |
|------------------|---------|-----------------------------------|
| id               | string  | Unique donor ID                   |
| walletAddress    | string  | Donor wallet address              |
| email            | string  | Donor email (optional)            |
| password         | string  | Donor password (optional)         |
| name             | string  | Donor name                        |
| bio              | string  | Donor bio                         |
| isVerified       | bool    | Whether donor is verified         |
| role             | string  | User role                         |
| status           | string  | User status                       |
| createdAt        | string  | Creation datetime (ISO 8601)      |
| updatedAt        | string  | Last update datetime (ISO 8601)   |

### campaigns.csv
| Column             | Type    | Description                       |
|--------------------|---------|-----------------------------------|
| id                 | string  | Unique campaign ID                |
| title              | string  | Campaign title                    |
| description        | string  | Campaign description              |
| story              | string  | Campaign story (optional)         |
| additionalMedia    | string  | JSON string for media (optional)  |
| imageUrl           | string  | Image URL (optional)              |
| targetAmount       | float   | Target fundraising amount         |
| currentAmount      | float   | Current amount raised             |
| escrowAmount       | float   | Amount held in escrow             |
| releasedAmount     | float   | Amount released to creator        |
| category           | string  | Campaign category                 |
| status             | string  | Campaign status                   |
| riskScore          | float   | Risk score (optional)             |
| isFraudulent       | bool    | Whether campaign is fraudulent    |
| requiresMilestones | bool    | Whether milestones are required   |
| startDate          | string  | Start datetime (ISO 8601)         |
| endDate            | string  | End datetime (ISO 8601)           |
| createdAt          | string  | Creation datetime (ISO 8601)      |
| updatedAt          | string  | Last update datetime (ISO 8601)   |

---

## 🌐 Example API Usage

**Get recommendations for a donor (Python):**
```python
import requests
response = requests.post("http://localhost:8000/recommendations", json={
    "donor_id": "u001",
    "top_k": 5
})
print(response.json())
```

**Get similar donors:**
```python
response = requests.post("http://localhost:8000/similar-donors", json={
    "donor_id": "u001",
    "n_neighbors": 2
})
print(response.json())
```

---

## 📝 Endpoints
- `GET /` - API info
- `GET /status` - System status
- `GET /donors` - List all donors
- `GET /campaigns` - List all campaigns
- `POST /recommendations` - Get campaign recommendations for a donor
- `POST /similar-donors` - Find similar donors
- `GET /test` - Test endpoint with sample data

---

## 🧩 How to Integrate
- Call the API endpoints from your web app (React, Vue, Angular, etc.) or backend.
- See `/docs` for request/response formats and try out endpoints interactively.

---

## 📚 Notes
- The system uses only the provided CSV files for data. To use with a real database, export your data to CSV with the same columns.
- The ML model is retrained on server startup.
- For production, deploy the FastAPI server and update your frontend/backend to use the deployed API URL.

---

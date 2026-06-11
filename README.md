# DataWise - AI Data Analyst

DataWise is a full-stack SaaS application that allows users to upload CSV files and ask plain English questions about their data. It uses Claude Haiku to parse the data and generate rich charts (via Recharts), insights, and answers.

## Tech Stack
- **Frontend**: Vite, React, TailwindCSS, React Router, Recharts
- **Backend**: Node.js, Express, MySQL (mysql2)
- **Auth**: Google OAuth 2.0 + JWT
- **Payments**: Stripe Checkout and Webhooks
- **AI**: Anthropic API (Claude 3 Haiku)
- **Deployment**: Docker & Docker Compose

## 30-Minute Setup Instructions

### 1. Environment Variables
In the `backend` folder, copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in the following keys:
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: Get these from the [Google Cloud Console](https://console.cloud.google.com/). Ensure the callback URL is set to `http://localhost:4000/api/auth/google/callback`.
- `ANTHROPIC_API_KEY`: Get this from the [Anthropic Console](https://console.anthropic.com/).
- `STRIPE_SECRET_KEY` & `STRIPE_WEBHOOK_SECRET`: Get these from the [Stripe Dashboard](https://dashboard.stripe.com/).
- `STRIPE_PRO_PRICE_ID`: Create a recurring product in Stripe and use its Price ID (e.g., `price_...`).

### 2. Run with Docker Compose
Ensure Docker Desktop is running, then simply run:
```bash
docker-compose up --build
```
This will start:
- MySQL database on port `3306`
- Node.js backend on port `4000` (auto-runs migrations on startup)
- Vite React frontend on port `5173`

### 3. Usage
1. Open [http://localhost:5173](http://localhost:5173) in your browser.
2. Log in with Google.
3. Upload a CSV file and ask a question.
4. If you hit the 3 query limit, test the Stripe upgrade flow (use Stripe test cards).

Enjoy your AI Data Analyst!

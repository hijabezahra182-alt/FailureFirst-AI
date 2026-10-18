# FailureFirst AI

AI-powered venture validation and decision-support platform.

## Problem
Early-stage founders often make decisions with limited resources and untested assumptions.

## Solution
FailureFirst AI uses Google Gemini to analyze venture ideas and provide structured guidance on risks, assumptions, experiments, and next steps.

## Features
- Venture analysis and AI-generated viability score
- Potential risks and failure scenarios
- Validation experiments
- Practical next steps and recommendations
- Analysis tailored to user-provided venture context

## Tech Stack
- React and Vite
- Python and FastAPI
- Google Gemini API
- Pydantic

## AI Methodology
The backend sends venture details to a Gemini model with structured instructions and validates the response before returning it to the frontend. The viability score is an AI-generated estimate, not a statistically validated probability of success.

## Local Setup
1. Install Python and Node.js.
2. Create a backend .env file containing GEMINI_API_KEY=your_api_key_here.
3. Install the Python dependencies required by app.py.
4. Start the backend on port 8002.
5. In the frontend directory, run:
   npm install
   npm run dev

## Security
Never commit .env, API keys, or private credentials. Configure deployment environment variables securely.

## Limitations
AI output can be inaccurate. Market claims should be independently verified. The tool does not guarantee business success.

## Screenshots
Add screenshots of the working application before submission.

## Project Contribution
Project creator: Hijab Zahra. Document only the work and contributions actually completed.

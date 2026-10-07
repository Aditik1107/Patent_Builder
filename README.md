# VIT Patent Draft Generator

A web application that generates a formal patent draft document (.docx) in the exact format required by Vishwakarma Institute of Technology (VIT), Pune. It uses the Anthropic Messages API to transform student input (problem statement and solution) into formal patent language.

## Prerequisites
- Node.js 18+
- A Google Gemini API Key (`GEMINI_API_KEY`)

## Local Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file based on `.env.example` (or set environment variables):
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-1.5-flash
   ALLOWED_EMAIL_DOMAIN=vit.edu
   RATE_LIMIT_PER_HOUR=6
   ACCESS_CODE=optional_secret_code
   PORT=3000
   ```
3. Run the server:
   ```bash
   npm start
   ```
   Navigate to `http://localhost:3000`

### Mock Mode
To test the pipeline without consuming Anthropic API credits:
```bash
MOCK=1 node test.js
```
This will generate a sample `test.docx` in your system's temp directory.

## Deployment (Render, Railway, Fly.io)
This app is ready for zero-config deployment on platforms like Render:
1. Push this repository to GitHub.
2. In Render, create a new **Web Service** and connect the repository.
3. Build command: `npm install`
4. Start command: `node server.js`
5. **Environment Variables**: Add your `ANTHROPIC_API_KEY`, `ACCESS_CODE`, etc. **Never commit the API key to the repository.**

## Security & API Key Rotation
- **No Database**: Student inputs are processed in-memory and discarded. Nothing is logged.
- **Client Safety**: The API key is used strictly server-side and is never exposed to the browser.
- **Cost Protection**: Set `RATE_LIMIT_PER_HOUR` to prevent spam, and configure `ACCESS_CODE` to restrict access to a small group of students.
- **Key Rotation**: To rotate the key, generate a new one in the Anthropic Console, update the environment variable in your hosting provider, restart the server, and delete the old key.

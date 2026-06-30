# Ad-to-Landing Page Mismatch Detector

A full-stack web application that analyzes the mismatch between ad copy (text or screenshots) and landing page experience using AI.

## Features

- Analyze ad copy and landing page alignment across 6 dimensions:
  - Persona targeting
  - Offer consistency
  - Product framing
  - Proof elements
  - Objection handling
  - Above-the-fold continuity
- Accept ad copy as text or image screenshots (with OCR)
- Cluster multiple ads by marketing angle
- Provides actionable recommendations to improve alignment
- Modern React.js frontend with Bootstrap styling
- Node.js/Express backend with OpenRouter API integration

## Tech Stack

### Backend
- Node.js with Express
- OpenRouter API (using Claude 3 Haiku model)
- Tesseract.js for OCR
- Axios for HTTP requests
- Cheerio for HTML parsing
- Multer for file uploads
- Sharp for image processing

### Frontend
- CORS for handling
- Cors

### Frontend
- React
- React 18
- React Bootstrap
- Axios for API calls
- CSS3 for styling

## Installation

### Prerequisites
- Node.js (v16+)
- npm or yarn
- Tesseract OCR installed on your system (for local OCR processing)
  - Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki
  - macOS: `brew install tesseract`
  - Linux: `sudo apt-get install tesseract-ocr`

### Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd ad-mismatch-tool
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

4. Set up environment variables:
   - Create a `.env` file in the `backend` directory
   - Add your OpenRouter API key:
     ```
     OPENAI_API_KEY=your_api_key_here
     ```
   - Optional: Change the port (default is 5000):
     ```
     PORT=5000
     ```

## Usage

### Development Mode

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```
   The server will run on `http://localhost:5000`

2. Start the frontend development server:
   ```bash
   cd ../frontend
   npm start
   ```
   The app will open in your browser at `http://localhost:3000`

### Production Mode

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Start the production server:
   ```bash
   cd ../backend
   npm start
   ```
   The app will be served from `http://localhost:5000`

## API Endpoints

### GET `/health`
Health check endpoint.

### POST `/api/analyze`
Analyze ad-to-landing page mismatch.

**Request:**
- `url`: Landing page URL (required)
- `adCopy`: Ad copy text (optional if providing images)
- `adImages`: Array of image files (optional if providing adCopy)

**Response:**
```json
{
  "success": true,
  "data": {
    "adTexts": ["Extracted ad text 1", "..."],
    "landingPageText": "Preview of extracted landing page text...",
    "analysis": {
      "overall_match_score": 75,
      "dimensions": {
        "persona": {
          "score": 80,
          "notes": "...",
          "missing_elements": [...]
        },
        // ... other dimensions
      },
      "clusters": [
        {
          "cluster_label": "price-focused",
          "ad_indices": [0, 2],
          "suggested_page_sections": [...]
        }
      ],
      "actionable_recommendations": [
        "Specific recommendation 1",
        "Specific recommendation 2"
      ]
    }
  }
}
```

## How It Works

1. **Input Processing**: Accepts ad copy as text or processes uploaded screenshots using OCR (Tesseract.js)
2. **Content Extraction**: Fetches the landing page URL and extracts text content (focusing on above-the-fold)
3. **AI Analysis**: Uses the OpenRouter API (Claude 3 Haiku) to analyze mismatches across 6 key dimensions
4. **Results Generation**: Returns a structured JSON report with scores, detailed analysis, and actionable recommendations

## Dimensions Analyzed

1. **Persona**: Does the ad speak to a specific audience that the page does not reflect?
2. **Offer**: Is the core offer (discount, free trial, etc.) consistent?
3. **Product Framing**: How is the product described (benefits vs features)?
4. **Proof**: Does the page provide the proof points (testimonials, data, guarantees) hinted in the ad?
5. **Objections**: Does the ad raise objections that the page fails to address?
6. **Above-the-fold Continuity**: Does the immediate visible section of the page match the ad's headline, visual, and CTA?

## Project Structure

```
ad-mismatch-tool/
├── backend/
│   ├── server.js          # Express server with API routes
│   ├── package.json       # Backend dependencies
│   └── .env               # Environment variables (not in repo)
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.js         # Main React component
│   │   ├── index.js       # Entry point
│   │   └── index.css      # Styles
│   ├── package.json       # Frontend dependencies
│   └── README.md          # Frontend-specific instructions
└── README.md              # This file
```

## Customization

### Changing the AI Model
In `backend/server.js`, modify the model in the `analyzeMismatch` function:
```javascript
// To use a different model via OpenRouter:
// const completion = await openai.chat.completions.create({
//   model: "your-preferred-model",  // e.g., "openai/gpt-4", "anthropic/claude-3-sonnet"
//   // ...
// });
```

### Adjusting Analysis Parameters
Modify the prompt in `analyzeMismatch` function to change:
- Analysis dimensions
- Scoring criteria
- Output format

## Limitations

- OCR accuracy depends on image quality and text clarity
- Landing page extraction may miss dynamic content loaded via JavaScript
- Analysis is based on the initial HTML response (no JavaScript execution)
- API rate limits depend on your OpenRouter subscription

## Troubleshooting

1. **OCR not working**: Ensure Tesseract is properly installed and in your PATH
2. **API errors**: Check your OpenRouter API key and credits
3. **CORS issues**: Ensure the backend CORS configuration matches your frontend origin
4. **Port conflicts**: Change the PORT in `.env` if 5000 is already in use

## License

MIT

## Acknowledgements

- OpenRouter for providing access to various LLMs
- Tesseract.js for OCR capabilities
- React Bootstrap for UI components
- Express.js team for the backend framework
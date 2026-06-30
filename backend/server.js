const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const OpenAI = require('openai');
const axios = require('axios');
const cheerio = require('cheerio');
const multer = require('multer');
const { TesseractWorker } = require('tesseract.js');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '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',
  baseURL: 'https://openrouter.ai/api/v1',
});

// Helper function to extract text from image using Tesseract
async function extractTextFromImage(buffer) {
  try {
    // Optimize image for OCR
    const optimizedImage = await sharp(buffer)
      .resize({ width: 2000 })
      .grayscale()
      .threshold()
      .toBuffer();

    const worker = await TesseractWorker();
    worker.loadLanguage('eng');
    worker.initialize('eng');
    
    const { data: { text } } = await worker.recognize(optimizedImage);
    await worker.terminate();
    
    return text.trim();
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Failed to extract text from image');
  }
}

// Helper function to fetch and extract text from URL
async function fetchAndExtractTextFromUrl(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    
    // Remove unwanted elements
    $('script, style, nav, footer, header, noscript, iframe, svg').remove();
    
    // Try to get main content
    let text = $('main, article, [role="main"]').text().trim();
    
    // If no main content, get body text
    if (!text || text.length < 100) {
      text = $('body').text().trim();
    }
    
    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    // Limit to first 2000 characters for approx. above-the-fold content
    return text.substring(0, 2000);
  } catch (error) {
    console.error('URL Fetch Error:', error);
    throw new Error('Failed to fetch or parse the URL');
  }
}

// Main analysis function
async function analyzeMismatch(adTexts, landingPageText) {
  try {
    // Build prompt for LLM
    const adsSection = adTexts.map((ad, index) => `Ad ${index + 1}:\n${ad}`).join('\n\n');
    
    const prompt = `
You are an expert conversion copywriter and landing page strategist.
Given the following ad copy(s) and the landing page excerpt (approx above-the-fold),
identify mismatches between ad promise and page experience.

Consider these dimensions:
1. Persona: Does the ad speak to a specific audience that the page does not reflect?
2. Offer: Is the core offer (discount, free trial, etc.) consistent?
3. Product Framing: How is the product described (benefits vs features)?
4. Proof: Does the page provide the proof points (testimonials, data, guarantees) hinted in the ad?
5. Objections: Does the ad raise objections that the page fails to address?
6. Above-the-fold Continuity: Does the immediate visible section of the page match the ad's headline, visual, and CTA?

Ad Copy(s):
${adsSection}

Landing Page Excerpt (above-the-fold approx):
${landingPageText}

Please output a structured JSON report with the following keys:
- "overall_match_score": integer 0-100 (higher = better alignment)
- "dimensions": object with keys "persona", "offer", "product_framing", "proof", "objections", "above_the_fold_continuity"
    each dimension containing:
        - "score": 0-100
        - "notes": brief explanation of gaps
        - "missing_elements": list of strings (what the page lacks that ad promises)
- "clusters": if multiple ads, group them by angle (e.g., "price-focused", "benefit-focused", "trust-focused")
    each cluster containing:
        - "cluster_label": string
        - "ad_indices": list of zero-based indices belonging to cluster
        - "suggested_page_sections": list of recommended sections/modules to add to landing page for this cluster
- "actionable_recommendations": list of concrete suggestions to improve alignment

Only output valid JSON.
`;

    // Call OpenRouter API
    const completion = await openai.chat.completions.create({
      model: "anthropic/claude-3-haiku",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 2000,
    });

    const content = completion.choices[0].message.content.trim();
    
    // Parse JSON response
    let result;
    try {
      // Handle potential markdown wrapping
      if (content.startsWith('```')) {
        const jsonPart = content.split('```')[1];
        if (jsonPart.startsWith('json')) {
          result = JSON.parse(jsonPart.substring(4));
        } else {
          result = JSON.parse(jsonPart);
        }
      } else {
        result = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.log('Raw content:', content);
      throw new Error('Failed to parse LLM response as JSON');
    }
    
    // Validate and ensure all required fields exist
    if (!result.overall_match_score) result.overall_match_score = 0;
    if (!result.dimensions) result.dimensions = {};
    if (!result.clusters) result.clusters = [];
    if (!result.actionable_recommendations) result.actionable_recommendations = [];
    
    // Ensure all dimensions are present
    const requiredDimensions = ['persona', 'offer', 'product_framing', 'proof', 'objections', 'above_the_fold_continuity'];
    requiredDimensions.forEach(dim => {
      if (!result.dimensions[dim]) {
        result.dimensions[dim] = {
          score: 0,
          notes: `Analysis not provided for ${dim}`,
          missing_elements: []
        };
      }
    });
    
    return result;
  } catch (error) {
    console.error('Analysis Error:', error);
    throw error;
  }
}

// API Routes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/analyze', upload.array('adImages', 5), async (req, res) => {
  try {
    const { adCopy, url } = req.body;
    const adImages = req.files || [];
    
    // Validate inputs
    if (!adCopy && (!adImages || adImages.length === 0)) {
      return res.status(400).json({ error: 'Either adCopy or adImages must be provided' });
    }
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    // Collect ad texts
    let adTexts = [];
    if (adCopy && adCopy.trim()) {
      adTexts.push(adCopy.trim());
    }
    
    // Process images
    for (const image of adImages) {
      try {
        const text = await extractTextFromImage(image.buffer);
        if (text.trim()) {
          adTexts.push(text.trim());
        }
      } catch (imgError) {
        console.warn(`Failed to process image ${image.originalname}:`, imgError.message);
        // Continue with other images
      }
    }
    
    // Ensure we have at least one ad text
    if (adTexts.length === 0) {
      return res.status(400).json({ error: 'No valid ad text could be extracted from provided inputs' });
    }
    
    // Fetch landing page text
    const landingPageText = await fetchAndExtractTextFromUrl(url);
    
    // Perform analysis
    const analysisResult = await analyzeMismatch(adTexts, landingPageText);
    
    // Return results
    res.json({
      success: true,
      data: {
        adTexts: adTexts,
        landingPageText: landingPageText.substring(0, 200) + '...', // Preview
        analysis: analysisResult
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
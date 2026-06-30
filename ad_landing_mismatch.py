#!/usr/bin/env python3
"""
Ad-to-Landing Page Mismatch Detector
Takes ad copy (text or screenshot) and landing page URL,
outputs a mismatch report across persona, offer, product framing, proof, objections,
and above-the-fold continuity.
Optionally clusters multiple ads by angle and suggests tailored landing page sections.
"""

import os
import sys
import json
import argparse
import requests
from bs4 import BeautifulSoup
from PIL import Image
import pytesseract
import openai
from typing import List, Dict, Any, Union

# Configure OpenRouter API key from environment
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    sys.exit("Error: OPENAI_API_KEY environment variable not set.")

# Initialize OpenRouter client
client = openai.OpenAI(
    api_key=api_key,
    base_url="https://openrouter.ai/api/v1"
)


def extract_text_from_image(image_path: str) -> str:
    """Run OCR on an image file to extract text."""
    try:
        img = Image.open(image_path)
        text = pytesseract.image_to_string(img)
        return text.strip()
    except Exception as e:
        print(f"Warning: OCR failed for {image_path}: {e}")
        return ""


def fetch_and_extract_text_from_url(url: str, max_chars: int = 2000) -> str:
    """Fetch landing page and extract visible text (focus on above-the-fold)."""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        resp = requests.get(url, headers=headers, timeout=10)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        # Remove scripts, styles, nav, footer, etc.
        for tag in soup(["script", "style", "nav", "footer", "header", "noscript"]):
            tag.decompose()

        # Get main content: try to find <main> or <article> or body
        main = soup.find("main") or soup.find("article") or soup.body
        if main:
            text = main.get_text(separator=" ", strip=True)
        else:
            text = soup.get_text(separator=" ", strip=True)

        # Limit to first max_chars for above-the-fold approximation
        return text[:max_chars]
    except Exception as e:
        print(f"Error fetching landing page {url}: {e}")
        return ""


def build_prompt(ad_texts: List[str], landing_text: str) -> str:
    """Construct prompt for LLM to analyze mismatches."""
    ads_section = "\n\n".join([f"Ad {i+1}:\n{ad}" for i, ad in enumerate(ad_texts)])
    prompt = f"""
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
{ads_section}

Landing Page Excerpt (above-the-fold approx):
{landing_text}

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
"""
    return prompt


def call_llm(prompt: str) -> Dict[str, Any]:
    """Call OpenRouter API with a text prompt."""
    try:
        response = client.chat.completions.create(
            model="anthropic/claude-3-haiku",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=2000,
        )
        content = response.choices[0].message.content.strip()
        # Attempt to parse JSON
        # Sometimes model may wrap in markdown triple backticks
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        return json.loads(content)
    except Exception as e:
        # Handle Unicode encoding issues in error message
        error_msg = str(e).encode('ascii', 'replace').decode('ascii')
        print(f"LLM call failed: {error_msg}")
        # Return a fallback structure
        return {
            "overall_match_score": 0,
            "dimensions": {},
            "clusters": [],
            "actionable_recommendations": ["LLM processing failed; check inputs and API key."]
        }


def main():
    parser = argparse.ArgumentParser(description="Ad-to-Landing Page Mismatch Detector")
    parser.add_argument("--ad-copy", nargs="+", help="Ad copy text (can repeat for multiple ads)")
    parser.add_argument("--ad-image", nargs="+", help="Path to ad screenshot image(s)")
    parser.add_argument("--url", required=True, help="Landing page URL")
    args = parser.parse_args()

    # Collect ad texts
    ad_texts = []
    if args.ad_copy:
        ad_texts.extend(args.ad_copy)
    if args.ad_image:
        for img_path in args.ad_image:
            if not os.path.isfile(img_path):
                print(f"Warning: Image file not found: {img_path}")
                continue
            ocr_text = extract_text_from_image(img_path)
            if ocr_text:
                ad_texts.append(ocr_text)
            else:
                print(f"Warning: No text extracted from {img_path}")

    if not ad_texts:
        sys.exit("Error: No ad copy provided (via --ad-copy or --ad-image).")

    landing_text = fetch_and_extract_text_from_url(args.url)
    if not landing_text:
        print("Warning: Landing page text empty; proceeding with ad-only analysis.")

    prompt = build_prompt(ad_texts, landing_text)
    report = call_llm(prompt)

    # Pretty print report
    print("\n=== Ad-to-Landing Page Mismatch Report ===\n")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
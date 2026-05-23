import pandas as pd
import json
import time
import requests
import os
from google import genai
from dotenv import load_dotenv
from google.genai import types
from openai import OpenAI

load_dotenv()
api_key = os.getenv('OPENROUTER_API_KEY')

# --- CONFIGURATION ---
client = OpenAI(
  base_url="https://openrouter.ai/api/v1",
  api_key=api_key,
)

CSV_PATH = 'docs/data/emdat_clean.csv'
OUTPUT_DIR = 'docs/data/context' # New folder for our individual files!

def main():
    # Create the output directory if it doesn't exist
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    print("Loading EM-DAT dataset...")
    df = pd.read_csv(CSV_PATH, engine='python')
    
    # Group data by Country and Year
    grouped = df.groupby(['iso', 'country', 'year'])
    
    for (iso, country, year), group in grouped:
        country_file = os.path.join(OUTPUT_DIR, f"{iso}.json")
        
        # Load existing data for this country (so we can pause and resume!)
        if os.path.exists(country_file):
            with open(country_file, 'r') as f:
                country_data = json.load(f)
        else:
            country_data = {}
            
        # Skip if we already generated this specific year
        if str(year) in country_data:
            continue
            
        # Summarize the data for the LLM
        total_deaths = group['deaths'].sum()
        total_damage = group['damage_usd_thousands'].sum()
        disaster_types = ", ".join(group['type'].unique())
        
        prompt = f"""
        You are a curator for a Natural Disasters Museum. 
        In {year}, {country} experienced the following natural disasters: {disaster_types}.
        Total recorded deaths: {total_deaths}.
        Total estimated damage: ${total_damage} thousand USD.
        Get real information of the important events that happened.
        
        Write a JSON response with two keys:
        1. "tagline": A short, poetic, 5-to-8 word summary of the year.
        2. "narrative": A solemn, historical, 3-sentence description of the impact.
        
        Output strictly valid JSON.
        """
        
        print(f"Generating context for {iso} ({country}) in {year}...")
        
        try:
            # Ask the LLM
            response = client.chat.completions.create(
                model="deepseek/deepseek-v4-flash:free",
                response_format={"type": "json_object"},
                messages=[{"role": "user", "content": prompt}]
                )

           # Extract just the raw text the AI wrote
            raw_ai_text = response.choices[0].message.content
            
            # Turn the AI's string into a proper Python dictionary
            data = json.loads(raw_ai_text)
            
            # Add the new year to this country's dictionary
            country_data[str(year)] = data
            
            # Save the specific country file immediately
            with open(country_file, 'w') as f:
                json.dump(country_data, f, indent=2)
                
            print(f"  ✅ Saved to {iso}.json")
            
        except Exception as e:
            print(f"  ❌ Failed on {country} {year}: {e}")
            
        # Respecting the 5 RPM rate limit (1 request every 12 seconds minimum)
        print("  ⏳ Waiting 15 seconds to avoid rate limits...")
        time.sleep(15)
        
    print("\n🎉 All country contexts generated successfully!")

if __name__ == "__main__":
    main()
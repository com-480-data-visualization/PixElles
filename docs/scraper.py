import pandas as pd
import requests
import os
import time
import urllib.parse

# --- CONFIGURATION ---
CSV_PATH = 'docs/data/emdat_clean.csv'  
OUTPUT_DIR = 'docs/images/archive'      
USER_AGENT = 'DisasterMuseumBot/2.0 (luna.raithle@epfl.ch)'

def get_wikidata_image(iso, year):
    """
    Sends a SPARQL query to Wikidata to find a natural disaster matching 
    the exact ISO-3 country code and year, returning its official image.
    """
    url = 'https://query.wikidata.org/sparql'
    
    # The SPARQL Query
    # 1. Finds the country by ISO-3 (P298)
    # 2. Finds events located in that country (P17)
    # 3. Filters events that happened in the specific year (P585 or P580)
    # 4. Ensures the event is a subclass of "natural disaster" (Q8065)
    # 5. Grabs the official image (P18)
    query = f"""
    SELECT ?disaster ?disasterLabel ?image WHERE {{
      ?country wdt:P298 "{iso}" .
      ?disaster wdt:P17 ?country .
      ?disaster wdt:P585|wdt:P580 ?date .
      FILTER(YEAR(?date) = {year})
      ?disaster wdt:P31/wdt:P279* wd:Q8065 .
      ?disaster wdt:P18 ?image .
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
    }} LIMIT 1
    """
    
    headers = {
        'User-Agent': USER_AGENT,
        'Accept': 'application/sparql-results+json'
    }
    
    try:
        response = requests.get(url, params={'query': query}, headers=headers)
        data = response.json()
        
        results = data.get('results', {}).get('bindings', [])
        if results:
            # Extract the raw image URL
            raw_img_url = results[0]['image']['value']
            
            # Wikidata returns the MASSIVE original file (sometimes 20MB+).
            # We append '?width=1000' to force Wikimedia to serve a fast, web-ready thumbnail.
            thumb_url = f"{raw_img_url}?width=1000"
            event_name = results[0]['disasterLabel']['value']
            
            return thumb_url, event_name
            
    except Exception as e:
        print(f"  [!] Error querying Wikidata for {iso} {year}: {e}")
        
    return None, None

def main():
    print("Loading EM-DAT dataset...")
    # Bypassing the Numpy bug by using the python engine
    df = pd.read_csv(CSV_PATH, engine='python')
    
    # Sort to prioritize the deadliest/most damaging events for the year
    if 'deaths' in df.columns:
        df = df.sort_values(by=['iso', 'year', 'deaths'], ascending=[True, True, False])
    
    unique_events = df.drop_duplicates(subset=['iso', 'year'])
    
    print(f"Found {len(unique_events)} unique country-year combinations.")
    print("Starting semantic download process...\n")
    
    for index, row in unique_events.iterrows():
        iso = row['iso']
        year = int(row['year'])
        
        country_dir = os.path.join(OUTPUT_DIR, iso)
        os.makedirs(country_dir, exist_ok=True)
        
        file_path = os.path.join(country_dir, f"{year}.jpg")
        
        if os.path.exists(file_path):
            print(f"⏭️  Skipping {iso} {year} - Image already exists.")
            continue
            
        print(f"🔍 Searching Wikidata for: {iso} in {year}...")
        
        img_url, event_name = get_wikidata_image(iso, year)
        
        if img_url:
            print(f"   📸 Found: {event_name}")
            try:
                # Download the image
                img_data = requests.get(img_url, headers={"User-Agent": USER_AGENT}).content
                with open(file_path, 'wb') as handler:
                    handler.write(img_data)
                print(f"   ✅ Saved to {file_path}")
            except Exception as e:
                print(f"   ❌ Failed to download image: {e}")
        else:
            print(f"   ⚠️ No structured image found in Wikidata.")
            
        # Respect Wikidata's servers (1 second pause)
        time.sleep(1)
        
    print("\n🎉 Semantic scraping complete!")

if __name__ == "__main__":
    main()
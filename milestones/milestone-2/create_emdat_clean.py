#!/usr/bin/env python3
"""
Create emdat_clean.csv from raw EM-DAT Excel file
This script processes the raw data and creates the format expected by the website.
"""

import pandas as pd
from pathlib import Path

DATA_DIR = Path('docs/data')
INPUT_FILE = DATA_DIR / 'public_emdat_incl_hist_2026-03-17.xlsx'
OUTPUT_FILE = DATA_DIR / 'emdat_clean.csv'

SHEET_NAME = 'EM-DAT Data'
YEAR_START = 1975
YEAR_END = 2025

print(f'Reading: {INPUT_FILE}')

df_full = pd.read_excel(INPUT_FILE, sheet_name=SHEET_NAME)
print(f'Loaded {len(df_full):,} total records from Excel')

df = df_full[
    (df_full['Start Year'].between(YEAR_START, YEAR_END, inclusive='both')) &
    (df_full['Disaster Group'] == 'Natural')
].copy()

print(f'Filtered to {YEAR_START}-{YEAR_END}, Natural disasters: {len(df):,} records')

df_clean = df[[
    'Start Year', 'ISO', 'Country', 'Region', 'Subregion',
    'Disaster Type', 'Disaster Subtype', 'Event Name',
    'Total Deaths', 'Total Affected',
    'Total Damage, Adjusted (\'000 US$)',
    'Latitude', 'Longitude'
]].copy()

df_clean.columns = [
    'year', 'iso', 'country', 'region', 'subregion',
    'type', 'type_detail', 'name',
    'deaths', 'affected', 'damage_usd_thousands',
    'lat', 'lon'
]

type_mapping = {
    'Flood': 'flood',
    'Storm': 'storm',
    'Drought': 'drought',
    'Wildfire': 'wildfire',
    'Earthquake': 'earthquake',
    'Volcanic activity': 'volcano',
    'Landslide': 'landslide',
    'Extreme temperature': 'drought',  
    'Mass movement (dry)': 'landslide', 
    'Glacial lake outburst': 'flood',  
    'Fog': 'storm', 
}

df_clean['type'] = df_clean['type'].map(type_mapping)

# Remove rows with unmapped disaster types
before_filter = len(df_clean)
df_clean = df_clean[df_clean['type'].notna()]
print(f'Removed {before_filter - len(df_clean)} records with unmapped disaster types')

# Fill NaN values
df_clean['name'] = df_clean['name'].fillna('Unnamed Event')
df_clean['type_detail'] = df_clean['type_detail'].fillna('')
df_clean['deaths'] = df_clean['deaths'].fillna(0)
df_clean['affected'] = df_clean['affected'].fillna(0)
df_clean['damage_usd_thousands'] = df_clean['damage_usd_thousands'].fillna(0)

df_clean.to_csv(OUTPUT_FILE, index=False)

print(f'\n Saved: {OUTPUT_FILE}')
print(f' Records: {len(df_clean):,}')
print(f' Year range: {int(df_clean["year"].min())}-{int(df_clean["year"].max())}')
print(f' Countries: {df_clean["iso"].nunique()}')

print('\nDisaster type distribution:')
type_counts = df_clean['type'].value_counts()
for dtype, count in type_counts.items():
    print(f'  {dtype}: {count:,} ({count/len(df_clean)*100:.1f}%)')

print('\n Done! The website can now load the data from emdat_clean.csv')

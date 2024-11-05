import pandas as pd
import argparse

# Set up argument parser
parser = argparse.ArgumentParser(description='Process some CSV file.')
parser.add_argument('filename', type=str, help='The path to the CSV file')

# Parse the arguments
args = parser.parse_args()

# Read the CSV file
df = pd.read_json(args.filename)

df["source"] = "lecourrier.ch"
df["html"] = None
df["membership"] = None
df["language"] = "fr"
df["published_date"] = df["date"]
df["modified_date"] = df["date"]
df.drop(columns=["date"], inplace=True)

df.to_csv(f"{args.filename.replace('.json', '')}_processed.csv", index=False)
print(True)

import os
import streamlit as st

ASSETS_PATH = "./data/assets"

def get_content():
    pass






# App
st.title('MediawatCH App')

# Select media source
source_options = [d for d in os.listdir(ASSETS_PATH) if os.path.isdir(os.path.join(ASSETS_PATH, d))]
topic_options = ["israel-hamas war", "ukraine"]

# Select events to analyze
# TO DO: store 19h30 data by date
# TO DO: function to analyze all events selected from "topic"
source = st.selectbox("Select Source", source_options)

events = [f for f in os.listdir(os.path.join(ASSETS_PATH, source, "transcripts")) if os.path.isfile(os.path.join(ASSETS_PATH, source, "transcripts", f))]
event = st.selectbox("Select File", events)

topic = st.selectbox("Select Topic", topic_options)

# Display video section
st.write("### Video Clip")
video_file = open(f'data/assets/{source}/video/{event.replace(".txt", ".mp4")}', 'rb')
st.video(video_file)

# Display transcript section
st.write("### Transcript")
with open(os.path.join(ASSETS_PATH, source, "transcripts", event), 'r') as transcript_file:
    transcript_text = transcript_file.read()
    st.text(transcript_text)



# 1. concat all m4s segments to create video
# 2. for selected topic, button to analyze figures of speech
# 3. timestamps for each figure of speech
# 4. transcript when figure of speech occurs and highlight text
# 4.1 face detection to place text
# 5. VLM for posture/gesture/face emotion analysis
# 6. Voice ton analysis
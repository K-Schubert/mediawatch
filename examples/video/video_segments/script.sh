#!/bin/bash

# Loop from 1 to 107
for i in {1..107}
do
  ffmpeg -i "video/subtitle_segments/seg-$i-f6.vtt" "video/subtitle_segments/seg-$i-f6.srt" -nostdin

  # Input paths for video, audio, and subtitles
  video_input="concat:video/init-f3-v1.mp4|video/video_segments/seg-$i-f3-v1.m4s"
  audio_input="concat:video/init-f1-a1.mp4|video/audio_segments/seg-$i-f1-a1.m4s"
  subtitle_input="video/subtitle_segments/seg-$i-f6.srt"

  # Use ffmpeg to create separate video with audio and subtitles
  ffmpeg -i "$video_input" -i "$audio_input" -vf "subtitles=$subtitle_input" \
    -c:a copy -map 0:v -map 1:a \
    "video/clips/output_segment${i}_with_audio_and_burned_subs.mp4" -nostdin

  # Optionally print progress
  echo "Created output_segment${i}_with_audio_and_subs.mp4"
done

#!/usr/bin/env bash
# Café Cherki episode assembly. Run inside the Higgsfield sandbox with background:true.
# Inputs in the working dir:
#   edl.txt      rows: <file> <start_s> <dur_s> <kind>   kind = clip | sfx
#   sfx<N>.mp3   replacement audio for row N when kind = sfx (1-based row number)
#   ident.mp4    the locked Café Cherki ident with bumper sting
#   sub.txt      optional UTF-8 subline drawn over the ident tail (e.g. "Season 1 | Episode 2")
#   overlay.png  1080x1920 transparent DripMap overlay
# Output: final.mp4
set -euo pipefail
W=1080; H=1920; FPS=30
IDENT_DUR=${IDENT_DUR:-2.2}
FONT=${FONT:-/usr/share/fonts/truetype/higgsfield/Montserrat-ExtraBold.ttf}
rm -f seg_*.mp4 concat.txt
n=0
while read -r file start dur kind; do
  [ -z "${file:-}" ] && continue
  n=$((n+1))
  seg=$(printf 'seg_%02d.mp4' "$n")
  vf="scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},fps=${FPS},setsar=1,fade=t=in:st=0:d=0.06,fade=t=out:st=$(awk -v d="$dur" 'BEGIN{print d-0.08}'):d=0.08"
  af="loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=in:st=0:d=0.06,afade=t=out:st=$(awk -v d="$dur" 'BEGIN{print d-0.08}'):d=0.08"
  if [ "$kind" = "sfx" ]; then
    ffmpeg -nostdin -y -v error -ss "$start" -t "$dur" -i "$file" -i "sfx${n}.mp3" \
      -map 0:v -map 1:a -t "$dur" -vf "$vf" -af "$af" \
      -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 "$seg"
  else
    ffmpeg -nostdin -y -v error -ss "$start" -t "$dur" -i "$file" \
      -vf "$vf" -af "$af" \
      -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 "$seg"
  fi
  echo "file '$seg'" >> concat.txt
  echo "seg $n $file $start $dur $kind"
done < edl.txt

# ident tail (with optional subline)
if [ -s sub.txt ]; then
  ffmpeg -nostdin -y -v error -t "$IDENT_DUR" -i ident.mp4 \
    -vf "scale=${W}:${H},fps=${FPS},setsar=1,drawtext=fontfile=${FONT}:textfile=sub.txt:fontsize=44:fontcolor=white:x=(w-text_w)/2:y=h*0.62" \
    -af "loudnorm=I=-14:TP=-1.5:LRA=11" -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 seg_ident.mp4
else
  ffmpeg -nostdin -y -v error -t "$IDENT_DUR" -i ident.mp4 \
    -vf "scale=${W}:${H},fps=${FPS},setsar=1" -af "loudnorm=I=-14:TP=-1.5:LRA=11" \
    -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 seg_ident.mp4
fi
echo "file 'seg_ident.mp4'" >> concat.txt

ffmpeg -nostdin -y -v error -f concat -safe 0 -i concat.txt -c copy joined.mp4
ffmpeg -nostdin -y -v error -i joined.mp4 -i overlay.png \
  -filter_complex "[0:v][1:v]overlay=0:0:format=auto" \
  -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -c:a copy -movflags +faststart final.mp4
echo "clips $n"; ffprobe -v error -show_entries format=duration,size -of default=nw=1 final.mp4
echo "=== OK ==="

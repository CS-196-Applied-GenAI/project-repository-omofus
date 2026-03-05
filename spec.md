# Project Specification: ColorHunt (Working Title)

## 1. Executive Summary
ColorHunt is a mobile application designed to encourage outdoor exploration and mindfulness. Every day, all users receive a single, universal RGB color target. Users must find a matching color in their real-world environment and capture it using the in-app camera. A "webbing" algorithm calculates a score based on color accuracy and object size.

---

## 2. Core Game Loop
1.  **Daily Target:** A single, randomly generated RGB value is issued to all users. 
2.  **Reset Logic:** The target resets at **00:00 (Midnight) in the user’s local timezone**.
3.  **The Hunt:** Users explore their surroundings to find a matching color.
4.  **Capture:** * Must use the **in-app camera interface** (no gallery uploads).
    * Users have a maximum of **6 attempts** per day to submit a find.
5.  **Scoring & Validation:** * The app calculates a score based on the "webbing" algorithm.
    * There is a **minimum score threshold** required to post.
    * Users see their score and a "webbed area" overlay before deciding to post.
6.  **Posting:** Users add an optional caption and the find is pinned to their profile and the Discovery Feed.

---

## 3. Technical Specifications

### A. The "Webbing" Scoring Algorithm
The scoring is dynamic and based on two primary factors:
1.  **Color Proximity:** The algorithm identifies the pixel closest to the target RGB value.
2.  **Region Growing (Webbing):** From that starting pixel, the algorithm "webs out" to adjacent pixels. A pixel is included in the "web" if its color value is within a strict tolerance of the target.
3.  **Final Score Calculation:** The score is a product of:
    * The average color accuracy of the "web" vs. the target RGB.
    * The total surface area (pixel count) of the "web."

### B. Location & Privacy
* **No precise GPS coordinates** are shared with other users.
* The app maps the capture location to a **general neighborhood name** (e.g., "The Bronx" or "Riverdale") for the post metadata.

---

## 4. Social & Competitive Features

### A. Discovery Feed
* A public stream of "finds" for the current daily color.
* **Metadata displayed:** Score, Time of Capture, Neighborhood, and Caption.
* **Interactions:** Users can "Like" or react with "Emojis." **No commenting** is permitted to maintain a positive environment.

### B. Leaderboards
* **Global & Regional:** Users can view rankings by Globe or by Country.
* **Ranking Types:** All-time high scores, "High Movers" (trending players), and current "Daily Streaks."

### C. User Profiles
* Acts as a personal gallery (Instagram-style grid) of all past "finds."
* Each post displays the original photo, the target color for that day, the score, and the neighborhood.

---

## 5. Future Considerations (V2)
* **Anti-Cheat:** Implementation of AI/sensor-based checks to prevent photographing digital screens or printed swatches.
* **Advanced Moderation:** Community flagging system for inappropriate or non-compliant content.
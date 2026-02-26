# Backend Development Blueprint: ColorHunt

## 1. Technical Stack & Architecture
* **Runtime:** Node.js + TypeScript
* **Database:** PostgreSQL (Core data: Users, Finds, Scores)
* **Caching:** Redis (To track daily attempts and "High Mover" stats)
* **Image Processing:** `Sharp` (Resizing/Buffer handling)
* **Storage:** S3-compatible object storage (Image hosting)
* **Geocoding:** OpenStreetMap/Photon API (Reverse geocoding)

---

## 2. Phase-by-Phase Implementation Plan

### Phase 1: The "Daily Pulse" (Universal Color Logic)
**Goal:** Establish the source of truth for the universal color target.

* **Step 1.1: Database Schema:** Initialize PostgreSQL with `users`, `daily_colors` (date, r, g, b), and `finds` tables.
* **Step 1.2: Global Target Service:** Create a service that generates a cryptographically random RGB value for each date.
* **Step 1.3: Timezone-Aware API (`GET /target`):**
    * Accept `timezone_offset` from the client.
    * Logic: Return the RGB for the date currently active in the user's local time.
    * *Testing:* Unit test with offsets for UTC+12 (New Zealand) and UTC-8 (California) to ensure they see the correct day's color.

### Phase 2: The "Webbing" Engine (Core IP)
**Goal:** Build the scoring algorithm that detects objects.

* **Step 2.1: Image Pre-processing:** Use `Sharp` to downsample high-res uploads to a consistent 500x500px buffer to ensure processing speed.
* **Step 2.2: Color Distance Utility:** Implement a weighted Euclidean distance function to compare RGB values.
* **Step 2.3: Recursive Flood-Fill:**
    1.  Scan the image for the pixel with the minimum distance to the target.
    2.  Implement a "Region Growing" algorithm to find all connected pixels within a 15% color tolerance.
    3.  *Testing:* Validate with a test image containing a 50px red square vs. a 100px red square.
* **Step 2.4: Scoring Algorithm:** Calculate points: $Score = (\text{Pixel Count}) \times (1 - \text{Avg Distance})$.

### Phase 3: The "Attempt" System (Game Logic)
**Goal:** Enforce the 6-attempt limit and privacy-safe submissions.

* **Step 3.1: Attempt Middleware:** Create a Redis-based counter that increments on every analysis request. Block requests if `count > 6` for that user/date.
* **Step 3.2: Neighborhood Geo-Fencing:** * Integrate a reverse-geocoding API.
    * Store the "Neighborhood" or "Locality" string. **Immediately discard** exact Latitude/Longitude coordinates.
* **Step 3.3: Submission API (`POST /find`):**
    * Verify the score meets the minimum threshold.
    * Finalize the upload to S3 and save the metadata to the `finds` table.

### Phase 4: Social & Competitive Discovery
**Goal:** Build the feed and the ranking systems.

* **Step 4.1: Discovery Feed API:** Build a paginated endpoint `GET /feed` that returns posts for the current daily color.
* **Step 4.2: Global/Regional Leaderboards:** * Implement an aggregation query to rank users by total score and current streak.
    * Filter by `country_code` for regional rankings.
* **Step 4.3: Interaction Endpoints:** Create `POST /react` to allow emoji/like toggles. 
    * *Safety:* Prevent self-liking and ensure one reaction per user per post.

---

## 3. Implementation Checklist Summary
- [ ] Daily RGB Generator (Deterministic)
- [ ] Timezone-offset Logic
- [ ] Pixel Webbing Algorithm (Recursive)
- [ ] Score calculation formula
- [ ] 6-Attempt daily counter (Redis)
- [ ] Reverse Geocoding (Neighborhood string only)
- [ ] Paginated Feed API
- [ ] Global/Country Leaderboards
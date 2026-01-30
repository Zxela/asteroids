---
id: "002"
title: "Download and place audio files in assets directory"
status: pending
depends_on: ["001"]
test_file: null
no_test_reason: "user action - manually downloading files from provided URLs"
---

# 002: Download Audio Files

## Objective

Download the sourced synthwave tracks and place them in the correct location with proper filenames to replace the placeholder audio files.

## Acceptance Criteria

- [ ] Download menu track from provided URL
- [ ] Download gameplay track from provided URL
- [ ] Download boss track from provided URL
- [ ] Rename files to match expected names:
  - `menu.mp3`
  - `background.mp3`
  - `boss.mp3`
- [ ] Place files in `public/assets/audio/`
- [ ] Verify files are not corrupted (can play in audio player)

## Technical Notes

**Target location:**
```
public/assets/audio/
├── menu.mp3        # Replaces placeholder
├── background.mp3  # Replaces placeholder
└── boss.mp3        # Replaces placeholder
```

**File naming is critical** - the audioConfig.ts expects these exact paths:
- `/assets/audio/menu.mp3`
- `/assets/audio/background.mp3`
- `/assets/audio/boss.mp3`

## User Instructions

1. Open each download URL from task 001
2. Download the MP3 file
3. Rename to the target filename
4. Move to `public/assets/audio/` directory
5. Verify with any audio player that files play correctly

## Verification

- All three files exist in `public/assets/audio/`
- Files are valid MP3s (not corrupted downloads)
- File sizes are reasonable (<3MB each)

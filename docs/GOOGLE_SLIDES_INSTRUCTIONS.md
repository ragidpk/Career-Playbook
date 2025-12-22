# Career Playbook - Google Slides Pitch Deck

## Quick Setup (5 minutes)

### Step 1: Create New Presentation
1. Go to [slides.google.com](https://slides.google.com)
2. Click **+ Blank** to create a new presentation
3. Name it "Career Playbook - Investor Pitch Deck"

### Step 2: Open Apps Script
1. Click **Extensions** in the menu bar
2. Select **Apps Script**
3. A new tab will open with the script editor

### Step 3: Add the Script
1. Delete any existing code in the editor (usually `function myFunction() {}`)
2. Open the file `create-pitch-deck.gs` from your docs folder
3. Copy the ENTIRE contents of the file
4. Paste it into the Apps Script editor
5. Press **Ctrl+S** (or Cmd+S on Mac) to save
6. Name the project "Pitch Deck Generator" when prompted

### Step 4: Run the Script
1. Click the **Run** button (play icon) at the top
2. Select `createPitchDeck` from the dropdown if prompted
3. Click **Review Permissions** when the authorization dialog appears
4. Select your Google account
5. Click **Advanced** > **Go to Pitch Deck Generator (unsafe)**
6. Click **Allow**

### Step 5: View Your Presentation
1. Switch back to your Google Slides tab
2. The presentation should now have 15 slides populated!
3. Refresh the page if slides don't appear immediately

---

## What Gets Created

| Slide | Content |
|-------|---------|
| 1 | Title slide with logo, tagline, contact |
| 2 | The Problem - statistics and pain points |
| 3 | The Solution - 6 key features |
| 4 | Product Demo - 6 screenshot placeholders |
| 5 | How It Works - 5-step journey |
| 6 | Market Opportunity - TAM/SAM/SOM |
| 7 | Business Model - pricing tiers, unit economics |
| 8 | Traction - milestones achieved |
| 9 | Competitive Landscape - 2x2 matrix |
| 10 | Go-to-Market Strategy - 3 phases |
| 11 | Technology & AI - tech stack, features |
| 12 | The Team - founder, hiring plan |
| 13 | Financial Projections - 5-year revenue |
| 14 | The Ask - $500K seed round |
| 15 | Vision & Close - contact info |

---

## After Running the Script

### Add Screenshots
1. Go to careerplaybook.app
2. Take screenshots of each feature (see SCREENSHOT_GUIDE.md)
3. On Slide 4, click on each placeholder and replace with actual screenshots

### Add Your Logo
1. Create or get your Career Playbook logo (PNG/SVG)
2. On Slide 1, delete the text "CAREER PLAYBOOK"
3. Insert > Image > Upload from computer
4. Position and resize as needed

### Fine-tune Design
- Adjust font sizes if text is cut off
- Add transitions: Slide > Transition
- Change theme: Slide > Change theme (optional)

### Export Options
1. **PDF**: File > Download > PDF Document
2. **PowerPoint**: File > Download > Microsoft PowerPoint
3. **Share Link**: File > Share > Get link

---

## Troubleshooting

### "TypeError: Cannot read properties of undefined"
- Make sure you created a **new blank presentation** first
- The script needs an existing presentation to modify

### Script doesn't run
- Make sure you saved the script (Ctrl+S)
- Try refreshing the Apps Script page

### Authorization fails
- Click "Advanced" to see the "Go to..." link
- This is normal for custom scripts that haven't been verified

### Slides look different than expected
- The script creates basic layouts - customize colors/fonts as needed
- Some shapes may need manual adjustment for your screen size

---

## Alternative: Manual Creation

If the script doesn't work, use the content from `INVESTOR_PITCH_DECK.md` to create slides manually:

1. Create 15 slides in Google Slides
2. Copy content from each SLIDE section in the markdown
3. Use the color palette from PITCH_DECK_CONVERSION.md
4. Add screenshots from careerplaybook.app

---

## Files Reference

| File | Purpose |
|------|---------|
| `create-pitch-deck.gs` | Google Apps Script (copy into Apps Script) |
| `INVESTOR_PITCH_DECK.md` | Full pitch deck content |
| `EXECUTIVE_SUMMARY.md` | One-page summary |
| `SCREENSHOT_GUIDE.md` | Screenshot and recording guide |
| `PITCH_DECK_CONVERSION.md` | Design guidelines |

---

*Last Updated: December 2024*

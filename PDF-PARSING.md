# PDF Parsing Documentation

## Current Implementation (v12)

### **Two-Tier Extraction Strategy**

The resume analysis feature uses a two-tier PDF text extraction approach:

#### **Tier 1: pdf-parse Library** (Primary)
- **Library:** `pdf-parse@1.1.1` via esm.sh
- **Reliability:** High for standard text-based PDFs
- **Accuracy:** Maintains text order and structure
- **Limitations:** May fail on complex, encrypted, or scanned PDFs

#### **Tier 2: Regex Fallback** (Secondary)
- **Method:** Pattern matching on PDF binary structure
- **Triggers:** When pdf-parse fails or extracts <100 characters
- **Reliability:** Low - fragile and may miss/misorder text
- **Use Case:** Emergency fallback only

---

## What Works ✅

### **Supported PDF Types:**
- ✅ Standard text-based PDFs (most modern resume PDFs)
- ✅ PDFs created from Word/Google Docs
- ✅ Multi-page documents
- ✅ Mixed fonts and formatting
- ✅ PDFs with selectable text

### **Extraction Features:**
- ✅ Preserves text order
- ✅ Handles multi-page resumes
- ✅ Extracts all text content
- ✅ Automatic fallback on failure
- ✅ Clear error messages

---

## What Doesn't Work ❌

### **Unsupported PDF Types:**
- ❌ **Scanned PDFs** (images of documents) - No OCR capability
- ❌ **Encrypted/password-protected PDFs**
- ❌ **Complex layouts** with heavy graphics
- ❌ **PDFs with embedded fonts** that can't be decoded
- ❌ **Form-based PDFs** (AcroForms)

### **Unsupported File Formats:**
- ❌ **DOCX** - Word documents (PRD requirement not yet implemented)
- ❌ **TXT** - Plain text files
- ❌ **RTF** - Rich Text Format
- ❌ **Images** (PNG, JPG, etc.)

---

## Error Handling

### **User-Facing Error Messages:**

1. **Insufficient Text Extracted:**
   ```
   "Unable to extract text from PDF. This may be a scanned image or
    encrypted PDF. Please try a different file with selectable text."
   ```

2. **Extraction Failed:**
   ```
   "Failed to read PDF content. This may be a complex, scanned, or
    encrypted PDF. Please try a different file."
   ```

### **Server-Side Logging:**
- Full error details logged to Supabase Functions logs
- Extraction method used (pdf-parse vs fallback)
- Text length extracted
- PDF page count

---

## Recommendations for Users

### **Best Practices:**
1. ✅ Use PDFs exported from Word/Google Docs
2. ✅ Ensure text is selectable (not scanned)
3. ✅ Keep file size under 10MB
4. ✅ Remove password protection before upload

### **If Upload Fails:**
1. Try exporting your resume as a new PDF
2. Check if text is selectable (try copying text from the PDF)
3. Use a simple template without complex graphics
4. Consider converting DOCX → PDF using Google Docs

---

## Future Improvements

### **Planned Enhancements:**
- [ ] DOCX support (PRD requirement)
- [ ] OCR for scanned PDFs (Tesseract.js or Cloud Vision API)
- [ ] Better complex layout handling
- [ ] RTF file support
- [ ] WASM-based PDF parser for better Deno compatibility

### **Alternative Solutions:**
- **Option 1:** External PDF parsing service (PDF.co, Docparser)
- **Option 2:** WASM-based parser compiled for Deno
- **Option 3:** Proxy parsing through separate Node.js service
- **Option 4:** Client-side parsing before upload

---

## Technical Details

### **Current Flow:**
```
1. User uploads PDF → Supabase Storage
2. Edge Function downloads PDF as ArrayBuffer
3. Convert to Buffer for pdf-parse
4. Parse with pdf-parse library
5. If fails or <100 chars → Try regex fallback
6. If still fails → Return clear error message
7. If succeeds → Send to OpenAI for analysis
```

### **Dependencies:**
- `pdf-parse@1.1.1` - Primary parser (via esm.sh)
- Native Deno `TextDecoder` - Fallback parsing
- `Buffer` API - ArrayBuffer ↔ Buffer conversion

### **Performance:**
- Average extraction time: 1-3 seconds
- Max file size: 10MB
- Timeout: 60 seconds (Supabase Edge Function limit)

---

## Known Issues

### **v11 (Previous Version):**
- ❌ Used ad-hoc regex parsing only
- ❌ Fragile and unreliable
- ❌ Could silently miss text
- ❌ No proper error handling

### **v12 (Current Version):**
- ✅ Proper pdf-parse library
- ✅ Fallback for edge cases
- ✅ Clear error messages
- ⚠️ Fallback still fragile (documented limitation)

---

## Testing Recommendations

### **Test Cases:**
1. ✅ Simple 1-page resume (Google Docs PDF)
2. ✅ Multi-page resume (2-3 pages)
3. ✅ Resume with tables/columns
4. ❌ Scanned resume (expected to fail - test error message)
5. ❌ Encrypted PDF (expected to fail - test error message)

### **Validation:**
- Check extracted text length > 100 characters
- Verify text order is correct
- Confirm no garbled characters
- Ensure all content is captured

---

## Support & Troubleshooting

### **For Users:**
If resume analysis fails:
1. Check file is PDF (not DOCX)
2. Ensure text is selectable
3. Try exporting as new PDF
4. Contact support with error message

### **For Developers:**
Check Supabase Functions logs for:
- Extraction method used
- Text length extracted
- Full error stack trace
- PDF metadata (page count, etc.)

---

**Last Updated:** 2025-12-09
**Version:** 12
**Status:** Production

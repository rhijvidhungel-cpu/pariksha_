from fastapi import APIRouter, UploadFile, File, HTTPException, status
import pypdf
import io

# 1. Instantiate the APIRouter instance
router = APIRouter()

# 2. Set the sub-path endpoint (combines with prefix="/api/admin" in main.py)
@router.post("/upload-routine")
async def upload_routine(routine: UploadFile = File(...)):
    # Validate that the incoming file is actually a PDF
    if routine.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are allowed!"
        )
        
    try:
        # Read the file streams into bytes
        pdf_bytes = await routine.read()
        
        # Stream bytes into the PyPDF memory buffer
        # strict=False stops the parser from crashing on minor formatting anomalies
        pdf_file = io.BytesIO(pdf_bytes)
        reader = pypdf.PdfReader(pdf_file, strict=False)
        
        # Extract text from each page sequentially
        extracted_text = ""
        for page in reader.pages:
            text = page.extract_text()
            if text:
                extracted_text += text + "\n"
                
        # Log to Render's live console logs so you can inspect strings
        print("--- Extracted Routine Text ---")
        print(extracted_text)
        print("------------------------------")
        
        return {
            "message": "Routine uploaded and text parsed successfully!",
            "textLength": len(extracted_text)
        }
        
    except Exception as e:
        print(f"Routine processing error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error during parsing: {str(e)}"
        )
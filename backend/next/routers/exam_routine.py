from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
import pypdf
import io

# Define the correct prefix to perfectly match your Next.js API requests
router = APIRouter(prefix="/api/routines", tags=["Exam Routines"])

@router.post("/bulk")
async def upload_routine(
    file: UploadFile = File(...),              # Changed name from 'routine' to 'file' to match frontend FormData
    batch: str = Form(...)                     # Captures the 'batch' dropdown payload (e.g., "CE-2024")
):
    # 1. Enforce strict PDF file extensions
    if not file.filename.lower().endswith('.pdf') and file.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="UPLOADER REJECTION: Only official PDF files are allowed!"
        )
        
    try:
        # 2. Extract binary streams straight into memory
        pdf_bytes = await file.read()
        pdf_file = io.BytesIO(pdf_bytes)
        reader = pypdf.PdfReader(pdf_file, strict=False)
        
        extracted_text = ""
        for page in reader.pages:
            text = page.extract_text()
            if text:
                extracted_text += text + "\n"
                
        print(f"--- Extracted Routine Text for Batch: {batch} ---")
        print(extracted_text)
        print("-------------------------------------------------")
        
        # 3. TODO: Parse 'extracted_text' lines into programmatic DB rows
        # Since PDFs extract tabular data as plain space-separated text lines, 
        # you will eventually write a small regex pattern or parsing engine here 
        # to push entries like (Date, Time, Subject Code, Subject Name) into your database.

        return {
            "message": f"Exam PDF routine for batch [{batch}] parsed into tabular view successfully!",
            "textLength": len(extracted_text)
        }
        
    except Exception as e:
        print(f"Routine processing error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error during parsing processing: {str(e)}"
        )
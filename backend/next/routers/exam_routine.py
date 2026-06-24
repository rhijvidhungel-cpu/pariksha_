from fastapi import APIRouter, UploadFile, File, HTTPException, status
import pypdf
import io

# Use your existing router instance (e.g., router = APIRouter()) 
# or use 'app' if everything is directly inside main.py
@router.post("/api/admin/upload-routine")
async def upload_routine(routine: UploadFile = File(...)):
    # 1. Validate that the incoming file is actually a PDF
    if routine.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are allowed!"
        )
        
    try:
        # 2. Read the file streams into bytes
        pdf_bytes = await routine.read()
        
        # 3. Stream bytes into the PyPDF memory buffer
        pdf_file = io.BytesIO(pdf_bytes)
        reader = pypdf.PdfReader(pdf_file)
        
        # 4. Extract text from each page sequentially
        extracted_text = ""
        for page in reader.pages:
            text = page.extract_text()
            if text:
                extracted_text += text + "\n"
                
        # 5. Log to Render's live console logs so you can inspect the structural strings
        print("--- Extracted Routine Text ---")
        print(extracted_text)
        print("------------------------------")
        
        # TODO: Add your custom parsing loops here to structure 'extracted_text'
        # and execute database mutations (e.g., db.routines.insert_one() or session.add())
        
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
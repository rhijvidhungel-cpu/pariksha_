from fastapi import APIRouter, UploadFile, File, HTTPException, status
import pypdf
import io

router = APIRouter()

@router.post("/upload-routine")
async def upload_routine(routine: UploadFile = File(...)):
    if routine.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are allowed!"
        )
    try:
        pdf_bytes = await routine.read()
        pdf_file = io.BytesIO(pdf_bytes)
        reader = pypdf.PdfReader(pdf_file, strict=False)
        
        extracted_text = ""
        for page in reader.pages:
            text = page.extract_text()
            if text:
                extracted_text += text + "\n"
                
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
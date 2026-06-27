from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
import pypdf
import io
import re

# Define the router with the prefix to match your Next.js API requests
router = APIRouter(prefix="/api/routines", tags=["Exam Routines"])

# In-memory store (Replace with your Neon/SQLAlchemy database calls later)
# Structure: { "CE-2024": [{"date": "...", "subject": "...", "code": "..."}, ...] }
routine_storage = {}

@router.get("/")
async def get_routines(batch: str):
    """Fetches the routine for a specific batch."""
    return routine_storage.get(batch, [])

@router.post("/bulk")
async def upload_routine(
    file: UploadFile = File(...),
    batch: str = Form(...)
):
    # 1. Enforce PDF validation
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="UPLOADER REJECTION: Only official PDF files are allowed!"
        )
        
    try:
        # 2. Extract PDF content
        pdf_bytes = await file.read()
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        
        extracted_rows = []
        
        # 3. Simple Parsing Engine
        # This regex looks for lines that might contain subject codes (e.g., COMP-202)
        # Adjust the pattern based on your PDF's specific internal text structure
        for page in reader.pages:
            text = page.extract_text()
            if text:
                lines = text.split('\n')
                for line in lines:
                    # Example logic: If a line contains a common code format (e.g., XXX-000)
                    if re.search(r'[A-Z]{3,4}-\d{3}', line):
                        # This is a placeholder for your actual splitting logic
                        # You would extract the Date, Subject, and Code here
                        extracted_rows.append({
                            "date": "Parsed Date",  # Extract using regex
                            "subject": line.split()[0], # Simplify logic
                            "code": re.search(r'[A-Z]{3,4}-\d{3}', line).group()
                        })
        
        # 4. Save to 'database'
        routine_storage[batch] = extracted_rows
        
        return {
            "message": f"Exam PDF routine for batch [{batch}] parsed successfully!",
            "count": len(extracted_rows)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )
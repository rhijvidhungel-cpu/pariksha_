## Implementation Plan

### 1. Update `app/forgot-admin-password/page.tsx`
   - Change from form to contact card (admin email, phone, location)
   - Add PIN-based reset option

### 2. Update `app/forgot-password/page.tsx`
   - Change to contact-admin info page for students/teachers
   - Show admin email, phone, office location

### 3. Update `app/change-password/page.tsx`
   - Add PIN creation/change section for admin role
   - Admin can set/reset their PIN

### 4. Update `app/dashboards/admindashboard/layout.tsx`
   - Add "Change PIN" button in sidebar

### 5. Update `backend/next/loginapi.py`
   - Add `/admin/set-pin` endpoint
   - Add `/admin/reset-with-pin` endpoint  
   - Add PIN verification logic
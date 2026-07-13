# Authentication Flow Changes - Todo

- [ ] Analyze existing codebase
- [ ] Add backend endpoint: `/admin/verify-reset-pin` (validate PIN without resetting)
- [ ] Add backend endpoint: `/admin/reset-password-with-username` (reset password with new password)
- [ ] Redesign `/app/forgot-password/page.tsx`:
  - [ ] Default to student contact view
  - [ ] Add "Forgot for Admin?" link at top of student view
  - [ ] Redesign admin flow as two-step: PIN verification → password reset
- [ ] Update `/components/loginForm.js` if needed
- [ ] Verify all flows work together
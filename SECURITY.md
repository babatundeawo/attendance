# Security

The Attendance Register holds student records, so security reports are taken seriously.

## Reporting a vulnerability

Please do not open a public issue. Use GitHub's private reporting instead:
**Security tab > Report a vulnerability** on this repository. Include what you found and how to reproduce it.

## How access is controlled

- Sign-in is handled by Firebase Authentication. There is no public sign-up; the administrator creates accounts.
- Database rules (see [`firestore.rules`](firestore.rules)) deny everything by default and allow only listed staff.
- No passwords or private keys are stored in this repository.

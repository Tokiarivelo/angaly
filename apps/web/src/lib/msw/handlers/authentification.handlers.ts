import { HttpResponse, http } from 'msw';

/** Real endpoint (POST /api/auth/forgot-password) — see docs/features/auth.md. */
const API_BASE_URL = 'http://localhost:3003/api';

export const authentificationHandlers = [
  http.post(`${API_BASE_URL}/auth/forgot-password`, () =>
    HttpResponse.json({
      success: true,
      data: { message: 'If an account exists for this email, a reset link has been sent.' },
    }),
  ),
];

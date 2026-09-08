import { HttpResponse, http } from 'msw';

/** Default `GET /categories` fallback — tests needing specific categories use `server.use()`. */
const API_BASE_URL = 'http://localhost:3003/api';

export const categoriesHandlers = [
  http.get(`${API_BASE_URL}/categories`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        { id: 'cat-default-1', slug: 'robes-de-mariee', name: 'Robes de mariée', kind: 'CREATION' },
        { id: 'cat-default-2', slug: 'costumes-homme', name: 'Costumes homme', kind: 'CREATION' },
      ],
    });
  }),
];

export type LibraryBook = {
  id: string;
  title: string;
  pdfUrl: string;
};

export const BHAGVAD_GEETA_BOOK: LibraryBook = {
  id: 'bhagvad-geeta',
  title: 'Bhagvad Geeta',
  pdfUrl:
    'https://firebasestorage.googleapis.com/v0/b/sanatan-lok.firebasestorage.app/o/279.pdf?alt=media&token=410da0d2-bddf-4a43-8c58-ffa27b2bae74',
};

export const LIBRARY_BOOKS: Record<string, LibraryBook> = {
  [BHAGVAD_GEETA_BOOK.id]: BHAGVAD_GEETA_BOOK,
};

export const BHAGVAD_GEETA_READER_HREF = `/pdf-book-reader?bookId=${BHAGVAD_GEETA_BOOK.id}` as const;

export const getLibraryBook = (bookId?: string) => {
  if (!bookId) {
    return undefined;
  }

  return LIBRARY_BOOKS[bookId];
};

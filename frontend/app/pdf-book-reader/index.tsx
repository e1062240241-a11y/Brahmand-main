import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import PdfBookReaderScreen from '../../src/features/pdf-book-reader/PdfBookReaderScreen';
import { BHAGVAD_GEETA_BOOK, getLibraryBook } from '../../src/features/pdf-book-reader/books';

const normalizeParam = (value?: string | string[]) => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

const getDefaultTitle = (bookId?: string) => {
  if (bookId === 'bhagvad-geeta') {
    return 'Bhagvad Geeta';
  }

  return 'Brahmand Library Reader';
};

export default function PdfBookReaderRoute() {
  const params = useLocalSearchParams<{
    bookId?: string | string[];
    title?: string | string[];
  }>();

  const bookId = normalizeParam(params.bookId) || BHAGVAD_GEETA_BOOK.id;
  const book = getLibraryBook(bookId) || BHAGVAD_GEETA_BOOK;
  const title = normalizeParam(params.title) || book.title;

  return <PdfBookReaderScreen bookId={bookId} title={title} pdfUrl={book.pdfUrl} />;
}

import { Platform } from 'react-native';
import PdfBookReaderScreenNative from './PdfBookReaderScreen.native';
import PdfBookReaderScreenWeb from './PdfBookReaderScreen.web';

const PdfBookReaderScreen = Platform.OS === 'web'
  ? PdfBookReaderScreenWeb
  : PdfBookReaderScreenNative;

export default PdfBookReaderScreen;

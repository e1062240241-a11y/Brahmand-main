import { formatDateIST } from '../../../src/utils/dateUtils';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../../src/store/authStore';
import withObservables from '@nozbe/with-observables';
import { database } from '../../../src/database';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { chariotBase64 } from '../../../src/constants/chariotBase64';

function CertificateDetailScreen({ observedCertificates = [] }: { observedCertificates?: any[] }) {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const user = useAuthStore((state) => state.user);
  
  // Find current certificate or use fallback
  const certificate = observedCertificates.find((c) => c.id === id) || {
    id: 'dummy',
    bookName: 'BHAGAVAD GITA',
    completionDays: 12,
    date: new Date().toISOString()
  };

  const userName = user?.name || 'Arjun Sharma';
  const bookName = certificate.bookName || certificate.book_name || 'BHAGAVAD GITA';
  const formattedDate = formatDateIST(certificate.date || new Date().toISOString());

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/passport/timeline' as any);
    }
  };

  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'download' && data.base64) {
        const base64Data = data.base64.split(';base64,').pop();
        const fileUri = `${FileSystem.documentDirectory}${data.filename || 'certificate.pdf'}`;
        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        } else {
          Alert.alert('Download', 'Sharing/Saving is not available on this device.');
        }
      } else if (data.type === 'share' && data.text) {
        await Share.share({
          message: data.text,
        });
      } else if (data.type === 'error') {
        Alert.alert('Error', data.message || 'Failed to generate certificate.');
      }
    } catch (error) {
      console.log('WebView Message Error:', error);
    }
  };

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>Brahmand | Divine Certificate with Lord Krishna</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      background: radial-gradient(circle at 50% 50%, #0f0c1b 0%, #05040a 100%);
      background-size: cover;
      font-family: 'Georgia', 'Times New Roman', serif;
      padding: 40px 20px;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .certificate-bg-image {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
      object-fit: cover;
      pointer-events: none;
    }

    /* Applied during PDF capture to disable animations and restore visibility */
    body.pdf-capture .certificate-card,
    body.pdf-capture .certificate-inner {
      animation: none !important;
      opacity: 1 !important;
      transform: none !important;
      transition: none !important;
    }

    /*
      html2canvas does NOT support background-clip:text + color:transparent.
      All gradient text would be completely invisible in the PDF (white page).
      These overrides swap gradient text to solid gold during capture only.
    */
    body.pdf-capture .brahmand-title,
    body.pdf-capture .cert-heading,
    body.pdf-capture .user-name,
    body.pdf-capture .book-name,
    body.pdf-capture .app-name {
      background: none !important;
      -webkit-background-clip: unset !important;
      background-clip: unset !important;
      color: #daa520 !important;
      text-shadow: none !important;
    }
    body.pdf-capture .brahmand-title {
      color: #b8860b !important;
    }
    body.pdf-capture .cert-subheading {
      text-shadow: none !important;
    }

    .certificate-container {
      max-width: 1100px;
      width: 100%;
      margin: 0 auto;
      position: relative;
      z-index: 2;
    }

    /* Loading State */
    .state-card {
      background: rgba(255,255,245,0.96);
      backdrop-filter: blur(10px);
      border-radius: 30px;
      padding: 60px 40px;
      text-align: center;
      box-shadow: 0 30px 60px rgba(0,0,0,0.4);
    }

    .premium-spinner {
      width: 70px;
      height: 70px;
      margin: 0 auto 25px;
      position: relative;
    }

    .premium-spinner::before {
      content: '🕉';
      position: absolute;
      font-size: 50px;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #b8860b;
      animation: pulse 1.5s infinite;
    }

    .premium-spinner::after {
      content: '';
      position: absolute;
      top: -10px;
      left: -10px;
      right: -10px;
      bottom: -10px;
      border: 3px solid rgba(184, 134, 11, 0.3);
      border-top: 3px solid #ffd700;
      border-radius: 50%;
      animation: spin 1s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
      50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Main Certificate with Visible Krishna Image */
    .certificate-card {
      background: transparent;
      animation: certificateReveal 0.8s cubic-bezier(0.4, 0, 0.2, 1);
      transition: transform 0.3s ease;
    }

    .certificate-card:hover {
      transform: translateY(-5px);
    }

    @keyframes certificateReveal {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    /* Certificate with Visible Krishna Background Image */
    .certificate-inner {
      background: transparent;
      border-radius: 24px;
      padding: 3rem 3rem 3.5rem;
      position: relative;
      transition: all 0.4s ease;
      overflow: hidden;
    }


    .krishna-divine-art {
      display: none;
    }

    /* Gold Foil Shine Effect */
    .shine-effect {
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,215,0,0.15), transparent);
      animation: goldShine 8s infinite;
      pointer-events: none;
      z-index: 1;
    }

    @keyframes goldShine {
      0% { left: -100%; }
      20% { left: 100%; }
      100% { left: 100%; }
    }

    /* All content above background */
    .certificate-content {
      position: relative;
      z-index: 2;
    }



    /* Divine Symbols */
    .flute-decoration {
      position: absolute;
      top: 30px;
      left: 30px;
      font-size: 45px;
      color: #daa520;
      opacity: 0.35;
      z-index: 1;
      filter: drop-shadow(0 0 5px gold);
    }

    .peacock-decoration {
      position: absolute;
      top: 30px;
      right: 30px;
      font-size: 50px;
      color: #daa520;
      opacity: 0.35;
      z-index: 1;
    }

    /* Brand Header */
    .brand-header {
      text-align: center;
      border-bottom: 3px double #daa520;
      padding-bottom: 25px;
      margin-bottom: 30px;
      position: relative;
    }

    .brahmand-title {
      font-size: 2.6rem;
      font-weight: 900;
      letter-spacing: 12px;
      background: linear-gradient(135deg, #b8860b, #ffd700, #daa520, #b8860b);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      text-shadow: 3px 3px 6px rgba(0,0,0,0.2);
      font-family: 'Times New Roman', serif;
      display: inline-block;
    }

    .brahmand-title::before, .brahmand-title::after {
      content: '✨';
      font-size: 30px;
      opacity: 0.8;
    }

    .brahmand-title::before { margin-right: 15px; }
    .brahmand-title::after { margin-left: 15px; }

    .tagline {
      font-size: 0.9rem;
      letter-spacing: 2px;
      color: #e8c97a;
      margin-top: 8px;
      font-weight: 400;
      font-style: italic;
    }

    /* Certificate Title */
    .certificate-title-section {
      text-align: center;
      margin: 25px 0;
    }

    .cert-heading {
      font-size: 1.8rem;
      font-weight: 700;
      letter-spacing: 8px;
      background: linear-gradient(135deg, #b8860b, #ffd700, #daa520, #b8860b);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      font-family: 'Times New Roman', serif;
      display: inline-block;
    }

    .cert-subheading {
      font-size: 1.3rem;
      font-weight: 600;
      letter-spacing: 6px;
      color: #ffd700;
      margin-top: 8px;
      text-shadow: 0 0 8px rgba(255, 215, 0, 0.4);
    }

    .ornament {
      font-size: 1.8rem;
      color: #ffd700;
      margin: 12px 0;
      letter-spacing: 12px;
      text-shadow: 0 0 5px rgba(255,215,0,0.5);
    }

    /* User Name */
    .user-wrapper {
      text-align: center;
      margin: 30px 0;
    }

    .user-name {
      font-size: 2.4rem;
      font-weight: 700;
      font-style: italic;
      background: linear-gradient(135deg, #daa520, #ffd700, #b8860b);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      font-family: 'Georgia', 'Times New Roman', serif;
      padding: 10px 20px;
      display: inline-block;
      position: relative;
      border-bottom: 2px solid #daa520;
    }

    /* Book Name */
    .book-name {
      text-align: center;
      font-size: 2.5rem;
      font-weight: 800;
      background: linear-gradient(135deg, #daa520, #ffd700, #b8860b);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      text-transform: uppercase;
      margin: 20px 0;
    }

    /* Wisdom Message */
    .wisdom-message {
      text-align: center;
      font-size: 0.95rem;
      line-height: 1.7;
      color: #e8d9b0;
      font-style: italic;
      max-width: 85%;
      margin: 20px auto;
    }

    /* Date Box */
    .date-row {
      display: flex;
      justify-content: flex-start;
      margin-top: 25px;
    }

    .date-box {
      background: linear-gradient(135deg, #fff5e6, #fef0e0);
      padding: 12px 30px;
      border-left: 5px solid #ffd700;
      border-radius: 0 15px 15px 0;
      box-shadow: 0 5px 15px rgba(0,0,0,0.05);
    }

    .date-label {
      font-size: 0.7rem;
      letter-spacing: 3px;
      color: #daa520;
      text-transform: uppercase;
      font-weight: 600;
    }

    .date-value {
      font-size: 1.2rem;
      font-weight: 700;
      color: #2c1810;
    }

    /* Signature */
    .app-signature {
      text-align: right;
      margin: 30px 0 35px;
    }

    .app-name {
      font-size: 1.8rem;
      font-weight: 900;
      letter-spacing: 6px;
      background: linear-gradient(135deg, #b8860b, #ffd700);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }

    .app-label {
      font-size: 0.75rem;
      letter-spacing: 4px;
      color: #b8860b;
      margin-top: 5px;
    }

    /* Shloka Section */
    .shloka-section {
      background: rgba(250,243,224,0.85);
      backdrop-filter: blur(5px);
      padding: 25px 30px;
      margin: 30px 0 25px;
      border-left: 5px solid #ffd700;
      border-right: 5px solid #ffd700;
      text-align: center;
      border-radius: 20px;
      position: relative;
    }

    .shloka-section::before {
      content: '❝';
      position: absolute;
      top: -15px;
      left: 20px;
      font-size: 40px;
      color: #daa520;
      opacity: 0.4;
    }

    .shloka-section::after {
      content: '❞';
      position: absolute;
      bottom: -15px;
      right: 20px;
      font-size: 40px;
      color: #daa520;
      opacity: 0.4;
    }

    .sanskrit-text {
      font-size: 1rem;
      font-weight: 700;
      color: #8B0000;
      line-height: 1.8;
    }

    .sanskrit-ref {
      font-size: 0.8rem;
      color: #daa520;
      margin-top: 12px;
      font-style: italic;
      font-weight: 600;
    }

    /* Footer */
    .certificate-footer {
      text-align: center;
      margin-top: 25px;
      padding-top: 20px;
      border-top: 2px solid #ffd700;
      font-size: 0.8rem;
      letter-spacing: 4px;
      background: linear-gradient(135deg, #daa520, #ffd700);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      font-weight: 700;
    }

    /* Buttons */
    .action-buttons {
      display: flex;
      justify-content: center;
      gap: 25px;
      margin-top: 45px;
      flex-wrap: wrap;
    }

    .btn-ace {
      padding: 16px 38px;
      border-radius: 50px;
      font-weight: 800;
      font-size: 1rem;
      border: none;
      cursor: pointer;
      transition: all 0.4s;
      display: inline-flex;
      align-items: center;
      gap: 12px;
      background: linear-gradient(135deg, #2c1810, #4a3728);
      color: #ffd700;
      position: relative;
      overflow: hidden;
    }

    .btn-ace::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,215,0,0.3), transparent);
      transition: left 0.5s;
    }

    .btn-ace:hover::before {
      left: 100%;
    }

    .btn-ace:hover {
      transform: translateY(-5px);
      background: linear-gradient(135deg, #b8860b, #daa520);
      color: #2c1810;
    }

    .btn-share {
      background: transparent;
      border: 2px solid #daa520;
      color: #daa520;
    }

    .btn-share:hover {
      background: #daa520;
      color: #2c1810;
    }

    @media (max-width: 768px) {
      .certificate-inner { padding: 1.5rem; }
      .brahmand-title { font-size: 1.5rem; letter-spacing: 5px; }
      .user-name { font-size: 1.8rem; padding: 10px 25px; }
      .book-name { font-size: 1.4rem; }
      .flute-decoration, .peacock-decoration { display: none; }
    }
  </style>
</head>
<body>
<div class="certificate-container" id="appRoot"></div>

<script>
  let state = {
    loading: false,
    certificateAvailable: true,
    profile: { fullName: ${JSON.stringify(userName)}, memberSince: "2023" },
    book: { title: ${JSON.stringify(bookName)}, author: "" },
    currentDate: ${JSON.stringify(formattedDate)}
  };

  /**
   * Preloads all <img> elements and computed background-image resources inside container.
   * Resolves when all assets are loaded, or rejects if any fail.
   */
  function preloadAllAssets(container) {
    var promises = [];

    // 1. Gather all <img> elements
    var imgs = Array.from(container.querySelectorAll('img'));
    imgs.forEach(function(img) {
      promises.push(new Promise(function(resolve, reject) {
        if (img.complete && img.naturalWidth > 0) {
          resolve();
          return;
        }
        var onLoad = function() { cleanup(); resolve(); };
        var onError = function() { cleanup(); reject(new Error('Image failed to load: ' + img.src)); };
        function cleanup() {
          img.removeEventListener('load', onLoad);
          img.removeEventListener('error', onError);
        }
        img.addEventListener('load', onLoad);
        img.addEventListener('error', onError);
        if (img.src && !img.complete) {
          var src = img.src;
          img.src = '';
          img.src = src;
        }
      }));
    });

    // 2. Gather computed CSS background images
    var allElements = Array.from(container.querySelectorAll('*'));
    allElements.push(container);
    allElements.forEach(function(el) {
      var bg = window.getComputedStyle(el).backgroundImage;
      if (bg && bg !== 'none') {
        var match = bg.match(/url\(['"]?([^'"]+)['"]?\)/);
        if (match && match[1]) {
          var src = match[1];
          if (src.indexOf('data:') !== 0) {
            promises.push(new Promise(function(resolve, reject) {
              var testImg = new Image();
              testImg.onload = function() { resolve(); };
              testImg.onerror = function() { reject(new Error('Background image failed to load: ' + src)); };
              testImg.src = src;
            }));
          }
        }
      }
    });

    return Promise.allSettled(promises).then(function(results) {
      var failed = results
        .filter(function(r) { return r.status === 'rejected'; })
        .map(function(r) { return r.reason.message; });
      if (failed.length > 0) {
        throw new Error('Asset load failures: ' + failed.join(', '));
      }
    });
  }

  /**
   * Scans canvas pixels to determine if it is blank or nearly blank.
   * Returns true if less than 100 pixels differ from white or transparent.
   */
  function isCanvasBlank(canvas) {
    var ctx = canvas.getContext('2d');
    if (!ctx) return true;

    var w = canvas.width;
    var h = canvas.height;
    if (w === 0 || h === 0) return true;

    var imgData = ctx.getImageData(0, 0, w, h);
    var data = imgData.data;
    var nonBgCount = 0;

    for (var i = 0; i < data.length; i += 4) {
      var r = data[i];
      var g = data[i+1];
      var b = data[i+2];
      var a = data[i+3];

      // A pixel is non-background if it's not transparent and not pure white (with tolerance)
      if (a > 10 && !(r > 250 && g > 250 && b > 250)) {
        nonBgCount++;
        if (nonBgCount > 100) {
          return false; // Canvas has actual content
        }
      }
    }
    return true; // Canvas is blank or nearly blank
  }

  async function downloadPDF() {
    var jsPDFConstructor = window.jsPDF || (window.jspdf && window.jspdf.jsPDF);
    if (typeof html2canvas === 'undefined' || !jsPDFConstructor) {
      var msg = 'PDF libraries not loaded. Please check your internet connection and try again.';
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: msg }));
      } else {
        alert(msg);
      }
      return;
    }

    const element = document.getElementById('certificateForDownload');
    if (!element) return;

    // Verify container is visible and has dimensions before proceeding
    var startWidth = element.offsetWidth;
    var startHeight = element.offsetHeight;
    if (startWidth === 0 || startHeight === 0) {
      var sizeMsg = 'Aborting PDF generation: Target container has zero dimensions (' + startWidth + 'x' + startHeight + ')';
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: sizeMsg }));
      } else {
        alert(sizeMsg);
      }
      return;
    }

    const downloadBtn = document.querySelector('.btn-ace:not(.btn-share)');
    if (downloadBtn) downloadBtn.disabled = true;

    const actionBtns = document.querySelector('.action-buttons');
    const filename = \`Brahmand_Certificate_\${state.profile?.fullName || 'Reader'}.pdf\`;

    // Apply capture styling
    document.body.classList.add('pdf-capture');
    if (actionBtns) actionBtns.style.display = 'none';

    try {
      // 1. Wait for at least one animation frame after class application to guarantee style re-calculation
      await new Promise(function(resolve) {
        requestAnimationFrame(function() {
          requestAnimationFrame(resolve);
        });
      });

      // 2. Wait for fonts to fully load
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      // 3. Wait for all images/background images to load
      await preloadAllAssets(element);

      // Verify dimensions again
      var runWidth = element.offsetWidth;
      var runHeight = element.offsetHeight;
      if (runWidth === 0 || runHeight === 0) {
        throw new Error('Target container became zero size during preparation (' + runWidth + 'x' + runHeight + ')');
      }

      // 4. Run html2canvas directly
      const scale = Math.max(2, window.devicePixelRatio || 2);
      const canvas = await html2canvas(element, {
        scale: scale,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 15000,
        removeContainer: true
      });

      // 5. Blank check
      if (isCanvasBlank(canvas)) {
        var imgs = Array.from(element.querySelectorAll('img'));
        var imgStatus = imgs.map(function(img) {
          return (img.src ? img.src.substring(0, 40) : 'none') + ': ' + (img.complete ? 'complete' : 'pending');
        }).join(', ');

        var errorDetails = 'Canvas blank: Size ' + runWidth + 'x' + runHeight + 
                           ', Canvas size: ' + canvas.width + 'x' + canvas.height + 
                           ', Fonts: ' + (document.fonts ? document.fonts.status : 'unknown') + 
                           ', Images: [' + imgStatus + ']';
        throw new Error(errorDetails);
      }

      // 6. Construct PDF using jsPDF directly with dynamic page size matching canvas aspect ratio
      var jsPDFConstructor = window.jsPDF || (window.jspdf && window.jspdf.jsPDF);
      if (!jsPDFConstructor) {
        throw new Error("jsPDF library not found");
      }

      var pdf = new jsPDFConstructor({
        orientation: runWidth > runHeight ? 'l' : 'p',
        unit: 'pt',
        format: [runWidth, runHeight]
      });

      var imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', 0, 0, runWidth, runHeight);

      // 7. Deliver PDF
      if (window.ReactNativeWebView) {
        var pdfBase64 = pdf.output('datauristring');
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'download',
          base64: pdfBase64,
          filename: filename
        }));
      } else {
        pdf.save(filename);
      }

    } catch (err) {
      var errMsg = 'Download failed: ' + (err && err.message ? err.message : String(err));
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: errMsg }));
      } else {
        alert(errMsg);
      }

    } finally {
      // Guaranteed cleanup
      document.body.classList.remove('pdf-capture');
      if (actionBtns) actionBtns.style.display = '';
      if (downloadBtn) downloadBtn.disabled = false;
    }
  }

  async function shareCertificate() {
    const text = \`🏆✨ BRAHMAND DIVINE CERTIFICATE - LORD KRISHNA'S BLESSINGS ✨🏆\\n\\n"Hare Krishna! 🙏"\\n\\nThis sacred certificate is awarded to \${state.profile?.fullName} for completing "\${state.book?.title}"\\n\\n"यदा यदा हि धर्मस्य ग्लानिर्भवति भारत । अभ्युत्थानमधर्मस्य तदात्मानं सृजाम्यहम् ॥"\\n— Bhagavad Gita 4.7\\n\\n📅 Date: \${state.currentDate}\\n\\nMay Lord Krishna's divine wisdom illuminate your path! 🕉️🎵🦚\\n\\n#Brahmand #BhagavadGita #LordKrishna #DivineCertificate\`;
    
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'share',
        text: text
      }));
    } else if (navigator.share) {
      try {
        await navigator.share({ title: 'My Divine Brahmand Certificate', text });
      } catch(e) {
        fallbackShare(text);
      }
    } else {
      fallbackShare(text);
    }
  }

  function fallbackShare(text) {
    navigator.clipboard.writeText(text);
    alert('✨ Divine Certificate copied! Hare Krishna! 🙏✨');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
      if (m === '&') return '&amp;';
      if (m === '<') return '&lt;';
      if (m === '>') return '&gt;';
      return m;
    });
  }

  function render() {
    const appRoot = document.getElementById('appRoot');
    appRoot.innerHTML = \`
      <div class="certificate-card" id="certificateForDownload">
        <div class="certificate-inner">
          <img src="${chariotBase64}" class="certificate-bg-image" alt="background" />
          
          <div class="certificate-content">
            <div class="brand-header">
              <div class="brahmand-title">BRAHMAND</div>
              <div class="tagline">The Daily Sanatan Community</div>
            </div>
            
            <div class="certificate-title-section">
              <div class="cert-heading">CERTIFICATE</div>
              <div class="cert-subheading">OF COMPLETION</div>
            </div>
            
            <div style="text-align:center; font-size:0.85rem; letter-spacing:2px; color:#e8d9b0; margin: 12px 0;">THIS IS TO CERTIFY THAT</div>
            
            <div class="user-wrapper">
              <div class="user-name">\${escapeHtml(state.profile.fullName)}</div>
            </div>
            
            <div style="text-align:center; font-size:0.85rem; letter-spacing:2px; color:#e8d9b0; margin: 12px 0;">HAS SUCCESSFULLY COMPLETED READING</div>
            
            <div class="book-name">\${escapeHtml(state.book.title.toUpperCase())}</div>
            
            <div class="wisdom-message">
              You have taken a profound step on the path of<br>wisdom, self-realization and dharma.
            </div>
          </div>
        </div>
      </div>
      
      <div class="action-buttons">
        <button class="btn-ace" onclick="window.downloadPDF()"><i class="fas fa-download"></i> Download Divine Certificate</button>
        <button class="btn-ace btn-share" onclick="window.shareCertificate()"><i class="fas fa-share-alt"></i> Share Divine Blessings</button>
      </div>
    \`;
  }

  window.downloadPDF = downloadPDF;
  window.shareCertificate = shareCertificate;
  render();
</script>
</body>
</html>
  `;

  return (
    <LinearGradient
      colors={['#FF8D57', '#EA9B76', '#FFEEE5']}
      locations={[0, 0.0913, 0.25]}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Certificates</Text>
          <View style={{ width: 40 }} />
        </View>

        {Platform.OS === 'web' ? (
          <iframe
            srcDoc={htmlContent}
            style={styles.webFrame}
            title="Divine Certificate"
          />
        ) : (
          <WebView
            originWhitelist={['*']}
            source={{ html: htmlContent }}
            style={styles.webView}
            onMessage={handleMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowFileAccess={true}
            allowUniversalAccessFromFileURLs={Platform.OS === 'android'}
            mixedContentMode={Platform.OS === 'android' ? 'always' : undefined}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  webView: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  webFrame: {
    flex: 1,
    borderWidth: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#0a0a1a',
  },
});

const enhance = withObservables([], () => ({
  observedCertificates: database.get('passport_certificates').query().observe(),
}));

export default enhance(CertificateDetailScreen);

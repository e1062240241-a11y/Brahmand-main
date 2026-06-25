import { formatDateIST } from '../../../src/utils/dateUtils';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../../src/store/authStore';
import withObservables from '@nozbe/with-observables';
import { database } from '../../../src/database';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { chariotBase64 } from './chariotBase64';

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
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      background: radial-gradient(circle at 20% 30%, #0a0a1a 0%, #1a1525 50%, #0d0d1a 100%);
      font-family: 'Georgia', 'Times New Roman', serif;
      padding: 40px 20px;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
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
      background: linear-gradient(145deg, rgba(255,253,245,0.92) 0%, rgba(254,248,232,0.92) 50%, rgba(255,246,224,0.92) 100%);
      border-radius: 24px;
      padding: 3rem 3rem 3.5rem;
      position: relative;
      box-shadow: 
        0 35px 65px rgba(0,0,0,0.4),
        0 0 0 2px rgba(255,248,231,0.9),
        0 0 0 6px #b8860b,
        0 0 0 8px #ffd700,
        inset 0 0 30px rgba(255,215,0,0.2);
      transition: all 0.4s ease;
      overflow: hidden;
    }

    /* VISIBLE KRISHNA BACKGROUND IMAGE - Using uploaded Gitamritam background */
    .certificate-inner::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: url('${chariotBase64}');
      background-size: cover;
      background-position: center 85%;
      background-repeat: no-repeat;
      opacity: 0.45;
      pointer-events: none;
      z-index: 0;
      border-radius: 24px;
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

    /* Premium Corner Embellishments */
    .premium-corner {
      position: absolute;
      width: 100px;
      height: 100px;
      z-index: 5;
    }

    .corner-tl {
      top: 20px;
      left: 20px;
      background: radial-gradient(circle at 0 0, #ffd700, transparent 70%);
      border-top-left-radius: 50px;
    }

    .corner-tr {
      top: 20px;
      right: 20px;
      background: radial-gradient(circle at 100% 0, #ffd700, transparent 70%);
      border-top-right-radius: 50px;
    }

    .corner-bl {
      bottom: 20px;
      left: 20px;
      background: radial-gradient(circle at 0 100%, #ffd700, transparent 70%);
      border-bottom-left-radius: 50px;
    }

    .corner-br {
      bottom: 20px;
      right: 20px;
      background: radial-gradient(circle at 100% 100%, #ffd700, transparent 70%);
      border-bottom-right-radius: 50px;
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
      font-size: 3.8rem;
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
      letter-spacing: 5px;
      background: linear-gradient(135deg, #daa520, #ffd700);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      margin-top: 10px;
      font-weight: 600;
    }

    /* Certificate Title */
    .certificate-title-section {
      text-align: center;
      margin: 25px 0;
    }

    .cert-heading {
      font-size: 2.2rem;
      font-weight: 700;
      letter-spacing: 8px;
      color: #2c1810;
      font-family: 'Times New Roman', serif;
    }

    .cert-subheading {
      font-size: 1.6rem;
      font-weight: 600;
      letter-spacing: 6px;
      color: #b8860b;
      margin-top: 8px;
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
      font-size: 3rem;
      font-weight: 800;
      background: linear-gradient(135deg, #8B0000, #c41e3a, #ff6b6b);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      font-family: 'Times New Roman', serif;
      padding: 15px 50px;
      display: inline-block;
      position: relative;
    }

    .user-name::before, .user-name::after {
      content: '✦';
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      font-size: 25px;
      color: #daa520;
    }

    .user-name::before { left: 5px; }
    .user-name::after { right: 5px; }

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
      font-size: 1rem;
      line-height: 1.9;
      color: #3e2a1f;
      font-style: italic;
      max-width: 85%;
      margin: 35px auto;
      background: rgba(255,250,240,0.7);
      padding: 20px;
      border-radius: 20px;
      backdrop-filter: blur(5px);
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
      .brahmand-title { font-size: 2rem; letter-spacing: 5px; }
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

  function downloadPDF() {
    const element = document.getElementById('certificateForDownload');
    if (!element) return;
    const filename = \`Brahmand_Krishna_Certificate_\${state.profile?.fullName || 'Reader'}.pdf\`;
    
    const opt = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 3, useCORS: true, backgroundColor: '#fefaf0' },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
    };

    if (window.ReactNativeWebView) {
      html2pdf().from(element).set(opt).outputPdf('datauristring').then(function(pdfBase64) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'download',
          base64: pdfBase64,
          filename: filename
        }));
      }).catch(function(err) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'error',
          message: err.toString()
        }));
      });
    } else {
      html2pdf().from(element).set(opt).save();
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
          <div class="shine-effect"></div>
          <div class="premium-corner corner-tl"></div>
          <div class="premium-corner corner-tr"></div>
          <div class="premium-corner corner-bl"></div>
          <div class="premium-corner corner-br"></div>
          
          <div class="flute-decoration">🎵🦚🎵</div>
          <div class="peacock-decoration">🦚✨🦚</div>
          
          <div class="certificate-content">
            <div class="brand-header">
              <div class="brahmand-title">BRAHMAND</div>
              <div class="tagline">EXPLORE. EXPERIENCE. EVOLVE.</div>
            </div>
            
            <div class="certificate-title-section">
              <div class="cert-heading">CERTIFICATE</div>
              <div class="cert-subheading">OF COMPLETION</div>
              <div class="ornament">⬟ ◇ ◆ ◇ ⬟</div>
            </div>
            
            <div style="text-align:center; font-size:0.9rem; letter-spacing:2px; color:#8B6914;">THIS IS TO CERTIFY THAT</div>
            
            <div class="user-wrapper">
              <div class="user-name">\${escapeHtml(state.profile.fullName)}</div>
            </div>
            
            <div style="text-align:center; font-size:0.95rem; color:#4a3728;">HAS SUCCESSFULLY COMPLETED READING</div>
            
            <div class="book-name">\${escapeHtml(state.book.title.toUpperCase())}</div>
            
            <div class="wisdom-message">
              🕉 You have taken a profound step on the path of wisdom,<br>
              self-realization and dharma.<br>
              <strong>May Lord Krishna's divine teachings illuminate your life always.</strong> 🕉
            </div>
            
            <div class="date-row">
              <div class="date-box">
                <div class="date-label">DATE</div>
                <div class="date-value">\${state.currentDate}</div>
              </div>
            </div>
            
            <div class="app-signature">
              <div class="app-name">BRAHMAND</div>
              <div class="app-label">APP</div>
            </div>
            
            <div class="shloka-section">
              <div class="sanskrit-text">
                " यदा यदा हि धर्मस्य<br>
                ग्लानिर्भवति भारत ।<br>
                अभ्युत्थानमधर्मस्य<br>
                तदात्मानं सृजाम्यहम् ॥ "
              </div>
              <div class="sanskrit-ref">— Bhagavad Gita 4.7 (Lord Krishna)</div>
            </div>
            
            <div class="certificate-footer">
              KEEP EXPLORING. KEEP EVOLVING. | हरे कृष्णा 🙏
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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
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
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: '#0a0a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1525',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffd700',
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

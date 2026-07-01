import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [isAtBottom, setIsAtBottom] = useState(false);

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 50;
    const atBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    setIsAtBottom(atBottom);
  };

  const handleScrollButtonPress = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['#FC8F5B', '#FDC7AD', '#FFFFFF']}
          locations={[0, 0.5052, 1]}
          style={styles.headerGradient}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.agreementLabel}>AGREEMENT</Text>
            <Text style={styles.headerTitle}>Terms of Service</Text>
          </View>
        </LinearGradient>
        <View style={styles.headerDivider} />
      </View>

      {/* Main Scrollable Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.mainTitle}>BRAHMAND TERMS OF SERVICE</Text>
        <Text style={styles.lastUpdatedText}>Effective Date: 15 June 2026</Text>
        
        <Text style={styles.paragraph}>
          Welcome to Brahmand (“Platform”, “App”, “we”, “our”, or “us”).{'\n\n'}
          These Terms govern your access to and use of the Brahmand mobile application, website, communities, messaging services, vendor listings, AI features, digital services, and all related products available through brahmand.app.{'\n\n'}
          By creating an account, signing in, or using Brahmand, you agree to these Terms of Service. If you do not agree, you must not use the Platform.
        </Text>

        <Text style={styles.sectionTitle}>1. Eligibility</Text>
        <Text style={styles.paragraph}>
          You must be at least 18 years old or have permission from a parent or legal guardian.{'\n\n'}
          You agree to comply with all applicable laws while using Brahmand.
        </Text>

        <Text style={styles.sectionTitle}>2. User Accounts</Text>
        <Text style={styles.paragraph}>
          You agree to:{'\n\n'}
          • Provide accurate and complete information.{'\n'}
          • Keep your account information updated.{'\n'}
          • Maintain the confidentiality of your account credentials.{'\n'}
          • Be responsible for all activities performed using your account.{'\n\n'}
          Brahmand may suspend, restrict, or permanently terminate accounts that violate these Terms.
        </Text>

        <Text style={styles.sectionTitle}>3. Community Standards</Text>
        <Text style={styles.paragraph}>
          Brahmand is committed to maintaining a respectful, safe, and positive community.{'\n\n'}
          Users must NOT post, upload, transmit, or promote any content that includes:{'\n\n'}
          • Hate speech{'\n'}
          • Religious hatred or incitement of violence{'\n'}
          • Harassment or bullying{'\n'}
          • Threats or intimidation{'\n'}
          • Abusive behaviour{'\n'}
          • Violence or graphic violence{'\n'}
          • Sexually explicit or pornographic material{'\n'}
          • Child sexual abuse or exploitation material{'\n'}
          • Illegal activities{'\n'}
          • Terrorism or extremist content{'\n'}
          • Fraud or scams{'\n'}
          • Spam{'\n'}
          • Malware or malicious software{'\n'}
          • False impersonation{'\n'}
          • Copyright infringement{'\n'}
          • Any content prohibited by applicable law
        </Text>

        <Text style={styles.subSectionTitle}>ZERO-TOLERANCE POLICY</Text>
        <Text style={styles.paragraph}>
          Brahmand maintains a strict zero-tolerance policy toward objectionable content and abusive users.{'\n\n'}
          Content that violates these Terms may be removed immediately without notice.{'\n\n'}
          Users who repeatedly or seriously violate these Terms may have their accounts suspended or permanently terminated.
        </Text>

        <Text style={styles.sectionTitle}>4. User Generated Content</Text>
        <Text style={styles.paragraph}>
          Users retain ownership of the content they create.{'\n\n'}
          By posting content on Brahmand, you grant Brahmand a worldwide, non-exclusive, royalty-free license to:{'\n\n'}
          • Store{'\n'}
          • Display{'\n'}
          • Reproduce{'\n'}
          • Distribute{'\n'}
          • Promote{'\n'}
          • Moderate{'\n\n'}
          your content solely for operating and improving the Platform.{'\n\n'}
          You remain solely responsible for any content you publish.
        </Text>

        <Text style={styles.sectionTitle}>5. Reporting Objectionable Content</Text>
        <Text style={styles.paragraph}>
          Brahmand provides users with the ability to report:{'\n\n'}
          • Posts{'\n'}
          • Comments{'\n'}
          • Profiles{'\n'}
          • Messages{'\n'}
          • Communities{'\n'}
          • Other user-generated content{'\n\n'}
          Users should report any content they reasonably believe violates these Terms or Community Standards.{'\n\n'}
          False or malicious reporting may itself constitute a violation of these Terms.
        </Text>

        <Text style={styles.sectionTitle}>6. Content Moderation</Text>
        <Text style={styles.paragraph}>
          Brahmand uses a combination of:{'\n\n'}
          • Automated moderation systems{'\n'}
          • AI-assisted safety tools{'\n'}
          • Human moderators{'\n'}
          • Community reports{'\n\n'}
          to identify objectionable content.{'\n\n'}
          Reported content may be:{'\n\n'}
          • Removed{'\n'}
          • Hidden{'\n'}
          • Restricted{'\n'}
          • Investigated{'\n\n'}
          Where appropriate, Brahmand aims to review reported content as quickly as reasonably possible and generally within 24 hours.{'\n\n'}
          Brahmand reserves the right to suspend or permanently terminate accounts responsible for objectionable content.
        </Text>

        <Text style={styles.sectionTitle}>7. Blocking Users</Text>
        <Text style={styles.paragraph}>
          Users may block other users at any time.{'\n\n'}
          When blocked, a user may no longer be able to:{'\n\n'}
          • Send direct messages{'\n'}
          • Interact with the blocking user's content{'\n'}
          • Contact the blocking user through Platform features{'\n\n'}
          Blocking is intended to improve user safety and prevent unwanted interactions.
        </Text>

        <Text style={styles.sectionTitle}>8. Communities</Text>
        <Text style={styles.paragraph}>
          Brahmand provides:{'\n\n'}
          • Local Communities{'\n'}
          • Regional Communities{'\n'}
          • Cultural Communities{'\n'}
          • Private Groups{'\n'}
          • Volunteer Groups{'\n'}
          • Spiritual Communities{'\n\n'}
          Brahmand does not guarantee:{'\n\n'}
          • Accuracy of member information{'\n'}
          • Conduct of community members{'\n'}
          • Safety of offline interactions{'\n'}
          • Outcomes of community activities{'\n\n'}
          Users participate entirely at their own risk.
        </Text>

        <Text style={styles.sectionTitle}>9. Private Messaging</Text>
        <Text style={styles.paragraph}>
          Private messaging exists solely for lawful communication.{'\n\n'}
          Users must not use messaging features for:{'\n\n'}
          • Harassment{'\n'}
          • Abuse{'\n'}
          • Spam{'\n'}
          • Fraud{'\n'}
          • Threats{'\n'}
          • Illegal activity{'\n\n'}
          Brahmand may use automated safety systems and moderation tools to detect abuse and maintain platform safety.
        </Text>

        <Text style={styles.sectionTitle}>10. SOS Feature Disclaimer</Text>
        <Text style={styles.paragraph}>
          The SOS feature is intended only to help connect nearby volunteers and community members.{'\n\n'}
          Brahmand is NOT:{'\n\n'}
          • Police{'\n'}
          • Ambulance Services{'\n'}
          • Fire Services{'\n'}
          • Hospitals{'\n'}
          • Government Authorities{'\n\n'}
          Brahmand does not guarantee:{'\n\n'}
          • Emergency response{'\n'}
          • Assistance{'\n'}
          • Rescue{'\n'}
          • Volunteer availability{'\n'}
          • Response times{'\n\n'}
          In emergencies, users should immediately contact official emergency services.
        </Text>

        <Text style={styles.sectionTitle}>11. Vendor Listings</Text>
        <Text style={styles.paragraph}>
          Vendor profiles, KYC badges, ratings, reviews, or verification status do not constitute endorsement.{'\n\n'}
          Users are solely responsible for any interaction, agreement, purchase, payment, or transaction with vendors.{'\n\n'}
          Brahmand is not a party to transactions between users and vendors.
        </Text>

        <Text style={styles.sectionTitle}>12. Vendor Verification</Text>
        <Text style={styles.paragraph}>
          Brahmand may request identification documents for verification purposes.{'\n\n'}
          Verification does not guarantee:{'\n\n'}
          • Quality of service{'\n'}
          • Reliability{'\n'}
          • Honesty{'\n'}
          • Future conduct{'\n'}
          • Legitimacy of claims{'\n\n'}
          Verification may be revoked at any time.
        </Text>

        <Text style={styles.sectionTitle}>13. Religious, Spiritual & Astrology Content</Text>
        <Text style={styles.paragraph}>
          Brahmand may provide:{'\n\n'}
          • Panchang{'\n'}
          • Astrology{'\n'}
          • Festivals{'\n'}
          • Rituals{'\n'}
          • Spiritual guidance{'\n'}
          • Religious teachings{'\n\n'}
          Such information is provided solely for educational, informational, cultural, and spiritual purposes.{'\n\n'}
          No prediction, outcome, or spiritual result is guaranteed.
        </Text>

        <Text style={styles.sectionTitle}>14. Artificial Intelligence</Text>
        <Text style={styles.paragraph}>
          Certain Platform features may use Artificial Intelligence.{'\n\n'}
          AI-generated information:{'\n\n'}
          • May contain inaccuracies{'\n'}
          • Is informational only{'\n'}
          • Does not constitute professional advice{'\n\n'}
          Users remain responsible for their own decisions.
        </Text>

        <Text style={styles.sectionTitle}>15. Brahmand Passport</Text>
        <Text style={styles.paragraph}>
          The Brahmand Passport may include:{'\n\n'}
          • Volunteer activities{'\n'}
          • Achievements{'\n'}
          • Community participation{'\n'}
          • Milestones{'\n'}
          • Service history{'\n\n'}
          Brahmand determines what information is displayed within the Passport.
        </Text>

        <Text style={styles.sectionTitle}>16. Intellectual Property</Text>
        <Text style={styles.paragraph}>
          All software, branding, logos, graphics, artwork, trademarks, databases, and proprietary materials belong to Brahmand or its licensors.{'\n\n'}
          Users may not:{'\n\n'}
          • Copy{'\n'}
          • Reproduce{'\n'}
          • Reverse engineer{'\n'}
          • Modify{'\n'}
          • Distribute{'\n'}
          • Commercially exploit{'\n\n'}
          any portion of the Platform without written permission.
        </Text>

        <Text style={styles.sectionTitle}>17. Copyright Complaints</Text>
        <Text style={styles.paragraph}>
          Users must upload only content they have legal rights to use.{'\n\n'}
          Content alleged to infringe intellectual property rights may be removed without notice.{'\n\n'}
          Repeated infringement may result in permanent account termination.
        </Text>

        <Text style={styles.sectionTitle}>18. Suspension & Termination</Text>
        <Text style={styles.paragraph}>
          Brahmand may suspend, restrict, disable, or permanently terminate accounts for:{'\n\n'}
          • Violating these Terms{'\n'}
          • Abusive behaviour{'\n'}
          • Objectionable content{'\n'}
          • Fraud{'\n'}
          • Illegal activity{'\n'}
          • Security concerns{'\n'}
          • Repeated reports of misconduct
        </Text>

        <Text style={styles.sectionTitle}>19. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          To the maximum extent permitted by law, Brahmand shall not be liable for:{'\n\n'}
          • User conduct{'\n'}
          • Community interactions{'\n'}
          • Vendor transactions{'\n'}
          • User-generated content{'\n'}
          • Financial losses{'\n'}
          • Business losses{'\n'}
          • Personal injury arising from interactions between users{'\n'}
          • Indirect or consequential damages{'\n\n'}
          Use of the Platform is entirely at your own risk.
        </Text>

        <Text style={styles.sectionTitle}>20. Indemnification</Text>
        <Text style={styles.paragraph}>
          You agree to indemnify and hold harmless Brahmand, its owners, employees, moderators, volunteers, contractors, affiliates, and administrators from claims arising from:{'\n\n'}
          • Your use of the Platform{'\n'}
          • Your content{'\n'}
          • Your conduct{'\n'}
          • Your violation of these Terms{'\n'}
          • Your violation of applicable law
        </Text>

        <Text style={styles.sectionTitle}>21. Privacy</Text>
        <Text style={styles.paragraph}>
          Your use of Brahmand is governed by the Privacy Policy.{'\n\n'}
          By using the Platform, you consent to the collection, processing, and storage of information described therein.
        </Text>

        <Text style={styles.sectionTitle}>22. Changes to Terms</Text>
        <Text style={styles.paragraph}>
          Brahmand may update these Terms at any time.{'\n\n'}
          Continued use of the Platform constitutes acceptance of the revised Terms.
        </Text>

        <Text style={styles.sectionTitle}>23. Governing Law</Text>
        <Text style={styles.paragraph}>
          These Terms are governed by the laws of India.{'\n\n'}
          Any disputes arising from these Terms or use of the Platform shall be subject to the exclusive jurisdiction of the competent courts in India.
        </Text>

        <Text style={styles.sectionTitle}>24. Contact Information</Text>
        <Text style={styles.paragraph}>
          Brahmand{'\n\n'}
          Email: brahmandteam@gmail.com{'\n\n'}
          Website: brahmand.app{'\n\n'}
          For support, moderation requests, copyright claims, safety concerns, legal inquiries, or policy questions, please contact us using the details above.
        </Text>

        <Text style={styles.sectionTitle}>25. Platform Operator</Text>
        <Text style={styles.paragraph}>
          The Brahmand Platform is currently operated by its owner(s) and authorised administrators.{'\n\n'}
          If ownership or operation is transferred to a legal entity in the future, these Terms shall automatically apply to the successor operator.{'\n\n'}
          END OF TERMS OF SERVICE
        </Text>

        <View style={styles.textDivider} />

        <Text style={styles.mainTitle}>BRAHMAND PRIVACY POLICY</Text>
        
        <Text style={styles.paragraph}>
          Welcome to Brahmand (“Platform”, “App”, “we”, “our”, or “us”).{'\n\n'}
          This Privacy Policy explains how Brahmand collects, uses, stores, processes, and protects your information when you access or use the Brahmand platform, website, mobile application, and related services.{'\n\n'}
          By using Brahmand, you agree to the collection and use of information as described in this Privacy Policy.
        </Text>

        <Text style={styles.sectionTitle}>1. Information We Collect</Text>
        
        <Text style={styles.subSectionTitle}>A. Account Information</Text>
        <Text style={styles.paragraph}>
          When you create an account, we may collect:{'\n'}
          • Name{'\n'}
          • Mobile number{'\n'}
          • Profile photo{'\n'}
          • Language preference{'\n'}
          • Community selections{'\n'}
          • User ID{'\n'}
          • Username
        </Text>

        <Text style={styles.subSectionTitle}>B. Location Information</Text>
        <Text style={styles.paragraph}>
          To provide community-based services, Brahmand may collect:{'\n'}
          • Selected city{'\n'}
          • Selected area{'\n'}
          • Home location information{'\n'}
          • Office location information{'\n'}
          • GPS-based location (with permission){'\n\n'}
          Location information helps connect users with relevant local communities and services.
        </Text>

        <Text style={styles.subSectionTitle}>C. Optional Profile Information</Text>
        <Text style={styles.paragraph}>
          You may choose to provide:{'\n'}
          • Date of birth{'\n'}
          • Time of birth{'\n'}
          • Place of birth{'\n'}
          • Biography{'\n'}
          • Social information{'\n'}
          • Interests{'\n\n'}
          Providing this information is generally optional unless required for specific features.
        </Text>

        <Text style={styles.subSectionTitle}>D. Community Activity</Text>
        <Text style={styles.paragraph}>
          We may collect information regarding:{'\n'}
          • Community participation{'\n'}
          • Posts{'\n'}
          • Comments{'\n'}
          • Reactions{'\n'}
          • Group memberships{'\n'}
          • Community contributions{'\n'}
          • Volunteer activities
        </Text>

        <Text style={styles.subSectionTitle}>E. Messaging Information</Text>
        <Text style={styles.paragraph}>
          When using private messaging features, we may collect:{'\n'}
          • Message metadata{'\n'}
          • Delivery information{'\n'}
          • Communication records{'\n'}
          • User reports related to messages{'\n\n'}
          Brahmand may use automated systems to detect spam, fraud, abuse, or violations of platform rules.
        </Text>

        <Text style={styles.subSectionTitle}>F. SOS Requests</Text>
        <Text style={styles.paragraph}>
          When you use the SOS feature, we may collect:{'\n'}
          • Request details{'\n'}
          • Time of request{'\n'}
          • Location information{'\n'}
          • Responses from volunteers{'\n'}
          • Related communication records
        </Text>

        <Text style={styles.subSectionTitle}>G. Vendor Information</Text>
        <Text style={styles.paragraph}>
          Vendors may provide:{'\n'}
          • Business information{'\n'}
          • Contact details{'\n'}
          • Service information{'\n'}
          • Business descriptions{'\n'}
          • Verification information{'\n'}
          • KYC documents
        </Text>

        <Text style={styles.subSectionTitle}>H. KYC Information</Text>
        <Text style={styles.paragraph}>
          For certain verification processes, Brahmand may collect:{'\n'}
          • Government-issued identification documents{'\n'}
          • Address proof{'\n'}
          • Business registration documents{'\n'}
          • Verification photographs{'\n'}
          • Supporting documents
        </Text>

        <Text style={styles.subSectionTitle}>I. Device Information</Text>
        <Text style={styles.paragraph}>
          We may automatically collect:{'\n'}
          • Device type{'\n'}
          • Operating system{'\n'}
          • Browser information{'\n'}
          • IP address{'\n'}
          • App version{'\n'}
          • Device identifiers{'\n'}
          • Log data
        </Text>

        <Text style={styles.sectionTitle}>2. How We Use Information</Text>
        <Text style={styles.paragraph}>
          We may use information to:{'\n'}
          • Create and manage accounts{'\n'}
          • Provide Platform features{'\n'}
          • Connect users to communities{'\n'}
          • Enable messaging services{'\n'}
          • Facilitate SOS requests{'\n'}
          • Verify vendors{'\n'}
          • Prevent fraud and abuse{'\n'}
          • Improve platform performance{'\n'}
          • Provide customer support{'\n'}
          • Personalize user experiences{'\n'}
          • Maintain security{'\n'}
          • Comply with legal obligations
        </Text>

        <Text style={styles.sectionTitle}>3. Brahmand Passport</Text>
        <Text style={styles.paragraph}>
          Brahmand may create and maintain a digital profile known as the Brahmand Passport.{'\n\n'}
          The Passport may contain:{'\n'}
          • Community activity{'\n'}
          • Volunteer participation{'\n'}
          • Service contributions{'\n'}
          • Platform achievements{'\n'}
          • Community milestones{'\n'}
          • Other participation records{'\n\n'}
          This information may be displayed within the Platform.
        </Text>

        <Text style={styles.sectionTitle}>4. AI Features</Text>
        <Text style={styles.paragraph}>
          Certain features may utilize artificial intelligence.{'\n\n'}
          Information submitted to AI-powered features may be processed to:{'\n'}
          • Generate responses{'\n'}
          • Improve service quality{'\n'}
          • Enhance user experience{'\n'}
          • Maintain platform functionality{'\n\n'}
          Users should avoid submitting highly sensitive information unless necessary.
        </Text>

        <Text style={styles.sectionTitle}>5. Sharing of Information</Text>
        <Text style={styles.paragraph}>
          Brahmand does not sell personal information.{'\n\n'}
          Information may be shared:{'\n'}
          • With service providers supporting the Platform{'\n'}
          • With verification partners{'\n'}
          • With vendors when required for requested services{'\n'}
          • With law enforcement when legally required{'\n'}
          • To protect users, communities, or platform security
        </Text>

        <Text style={styles.sectionTitle}>6. Community Visibility</Text>
        <Text style={styles.paragraph}>
          Certain information may be visible to other users, including:{'\n'}
          • Name{'\n'}
          • Profile photo{'\n'}
          • Community membership{'\n'}
          • Public posts{'\n'}
          • Public comments{'\n'}
          • Volunteer badges{'\n'}
          • Community badges{'\n\n'}
          Users are responsible for information they choose to make public.
        </Text>

        <Text style={styles.sectionTitle}>7. Vendor Verification</Text>
        <Text style={styles.paragraph}>
          Vendor KYC information may be used for:{'\n'}
          • Identity verification{'\n'}
          • Business verification{'\n'}
          • Fraud prevention{'\n'}
          • Trust and safety measures{'\n'}
          • Compliance purposes{'\n\n'}
          Brahmand may retain verification records as reasonably necessary.
        </Text>

        <Text style={styles.sectionTitle}>8. Data Security</Text>
        <Text style={styles.paragraph}>
          Brahmand uses reasonable administrative, technical, and organizational measures to protect information.{'\n\n'}
          However, no method of transmission or storage can be guaranteed to be completely secure.{'\n\n'}
          Users acknowledge this risk.
        </Text>

        <Text style={styles.sectionTitle}>9. Data Retention</Text>
        <Text style={styles.paragraph}>
          Brahmand may retain information:{'\n'}
          • While accounts remain active{'\n'}
          • As required for legal compliance{'\n'}
          • For fraud prevention{'\n'}
          • For security purposes{'\n'}
          • For operational needs{'\n\n'}
          Retention periods may vary depending on the nature of the information.
        </Text>

        <Text style={styles.sectionTitle}>10. Account Deletion</Text>
        <Text style={styles.paragraph}>
          Users may request account deletion.{'\n\n'}
          Upon deletion request:{'\n'}
          • Certain information may be removed from active systems.{'\n'}
          • Some records may be retained where legally required or necessary for fraud prevention, dispute resolution, security, or compliance.
        </Text>

        <Text style={styles.sectionTitle}>11. Children’s Privacy</Text>
        <Text style={styles.paragraph}>
          Brahmand is not intended for children under the age permitted by applicable law without parental or guardian involvement.{'\n\n'}
          If we become aware of unauthorized collection of information from children, appropriate steps may be taken to remove such information.
        </Text>

        <Text style={styles.sectionTitle}>12. Third-Party Services</Text>
        <Text style={styles.paragraph}>
          Brahmand may utilize third-party services including:{'\n'}
          • OTP providers{'\n'}
          • Cloud hosting providers{'\n'}
          • Analytics providers{'\n'}
          • Payment providers{'\n'}
          • Verification services{'\n\n'}
          Such providers may process information in accordance with their own policies and applicable laws.
        </Text>

        <Text style={styles.sectionTitle}>13. International Access</Text>
        <Text style={styles.paragraph}>
          Users accessing Brahmand from outside India acknowledge that information may be processed and stored in jurisdictions where Brahmand or its service providers operate.
        </Text>

        <Text style={styles.sectionTitle}>14. Changes to This Privacy Policy</Text>
        <Text style={styles.paragraph}>
          Brahmand may update this Privacy Policy periodically.{'\n\n'}
          Updated versions become effective upon publication.{'\n\n'}
          Continued use of the Platform constitutes acceptance of the updated Privacy Policy.
        </Text>

        <Text style={styles.sectionTitle}>15. Contact Information</Text>
        <Text style={styles.paragraph}>
          For privacy-related questions, requests, or concerns, please contact:{'\n\n'}
          Brahmand{'\n'}
          Email: brahmandteam@gmail.com{'\n'}
          Website: brahmand.app
        </Text>

        <Text style={styles.sectionTitle}>16. Consent</Text>
        <Text style={styles.paragraph}>
          By creating an account, accessing, or using Brahmand, you consent to the collection, use, storage, processing, and disclosure of information as described in this Privacy Policy.{'\n\n'}
          END OF PRIVACY POLICY
        </Text>

        <TouchableOpacity style={styles.acceptButton} onPress={() => router.back()}>
          <Text style={styles.acceptButtonText}>Accept & Continue</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Floating Footer */}
      {!isAtBottom && (
        <View style={styles.footerContainer}>
          <LinearGradient
            colors={['rgba(0, 0, 0, 0)', '#000000']}
            style={styles.footerGradient}
          >
            <TouchableOpacity style={styles.scrollButton} onPress={handleScrollButtonPress}>
              <Text style={styles.scrollButtonText}>Scroll to Bottom</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
    zIndex: 10,
  },
  headerGradient: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: Platform.OS === 'ios' ? 40 : 15,
    zIndex: 15,
    padding: 8,
  },
  headerTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  agreementLabel: {
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    fontSize: 12,
    fontWeight: '400',
    color: '#000000',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 2,
  },
  headerTitle: {
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 2,
  },

  headerDivider: {
    height: 1,
    backgroundColor: '#D9D9D9',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  contentContainer: {
    paddingTop: 154,
    paddingBottom: 120,
    paddingHorizontal: 38,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  lastUpdatedText: {
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 24,
    marginBottom: 12,
    lineHeight: 28,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  paragraph: {
    color: '#FFF',
    fontFamily: 'SF Pro',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 24,
    marginBottom: 16,
  },
  textDivider: {
    height: 1,
    backgroundColor: '#333333',
    marginVertical: 40,
  },
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 106,
    zIndex: 10,
  },
  footerGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  scrollButton: {
    paddingTop: 17,
    paddingBottom: 18,
    paddingLeft: 102,
    paddingRight: 102,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#FF7B00',
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollButtonText: {
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  acceptButton: {
    alignSelf: 'stretch',
    height: 56,
    borderRadius: 50,
    backgroundColor: '#FF7B00',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
    shadowColor: 'rgba(160, 65, 0, 0.20)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 8,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
});

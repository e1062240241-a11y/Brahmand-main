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
        
        <Text style={styles.paragraph}>
          Welcome to Brahmand (“Platform”, “App”, “we”, “our”, or “us”).{'\n\n'}
          These Terms of Service govern your access to and use of the Brahmand platform, including the mobile application, website, services, features, content, communities, messaging systems, vendor services, and related offerings available through brahmand.app.{'\n\n'}
          By creating an account, accessing, or using Brahmand, you agree to be bound by these Terms of Service. If you do not agree, please do not use the Platform.
        </Text>

        <Text style={styles.sectionTitle}>1. Eligibility</Text>
        <Text style={styles.paragraph}>
          You must be at least 18 years of age, or have the consent of a parent or legal guardian, to use the Platform.{'\n\n'}
          You are responsible for ensuring that your use of Brahmand complies with all applicable laws and regulations.
        </Text>

        <Text style={styles.sectionTitle}>2. User Accounts</Text>
        <Text style={styles.paragraph}>
          You agree to:{'\n'}
          • Provide accurate and complete information.{'\n'}
          • Keep your account information updated.{'\n'}
          • Maintain the security of your account.{'\n'}
          • Be responsible for all activities conducted through your account.{'\n\n'}
          Brahmand may suspend, restrict, or terminate accounts that violate these Terms.
        </Text>

        <Text style={styles.sectionTitle}>3. Community Standards</Text>
        <Text style={styles.paragraph}>
          Users must not:{'\n'}
          • Post unlawful content.{'\n'}
          • Harass, threaten, intimidate, or abuse others.{'\n'}
          • Spread harmful misinformation knowingly.{'\n'}
          • Upload malicious software or harmful code.{'\n'}
          • Impersonate another individual, organization, or entity.{'\n'}
          • Engage in fraud, scams, or deceptive practices.{'\n'}
          • Promote illegal activities.{'\n'}
          • Attempt to bypass platform security measures.{'\n\n'}
          Brahmand reserves the right to remove content and restrict accounts that violate these standards.
        </Text>

        <Text style={styles.sectionTitle}>4. User Generated Content</Text>
        <Text style={styles.paragraph}>
          Users retain ownership of content they create and upload.{'\n\n'}
          By posting content on Brahmand, you grant Brahmand a worldwide, non-exclusive, royalty-free license to store, display, distribute, reproduce, and promote such content within the Platform.{'\n\n'}
          You are solely responsible for any content you publish.
        </Text>

        <Text style={styles.sectionTitle}>5. Communities and User Groups</Text>
        <Text style={styles.paragraph}>
          Brahmand provides local communities, regional communities, cultural communities, private groups, and other community features.{'\n\n'}
          Brahmand does not guarantee:{'\n'}
          • Accuracy of user information.{'\n'}
          • Conduct of community members.{'\n'}
          • Safety of offline interactions.{'\n'}
          • Outcomes of community activities.{'\n\n'}
          Users participate at their own risk.
        </Text>

        <Text style={styles.sectionTitle}>6. Private Messaging</Text>
        <Text style={styles.paragraph}>
          Private messaging features are provided for communication purposes.{'\n\n'}
          Users must not use messaging features for:{'\n'}
          • Harassment{'\n'}
          • Spam{'\n'}
          • Fraud{'\n'}
          • Unlawful activity{'\n'}
          • Abuse of other users{'\n\n'}
          Brahmand may utilize automated systems and moderation tools to detect abuse and maintain platform safety.
        </Text>

        <Text style={styles.sectionTitle}>7. SOS Feature Disclaimer</Text>
        <Text style={styles.paragraph}>
          The SOS feature is a community assistance tool intended to help users seek support from nearby volunteers and community members.{'\n\n'}
          Brahmand is NOT:{'\n'}
          • Police{'\n'}
          • Ambulance services{'\n'}
          • Fire services{'\n'}
          • Hospitals{'\n'}
          • Emergency response agencies{'\n'}
          • Government authorities{'\n\n'}
          Brahmand does not guarantee:{'\n'}
          • Emergency response{'\n'}
          • Assistance{'\n'}
          • Rescue{'\n'}
          • Availability of volunteers{'\n'}
          • Response times{'\n'}
          • Outcomes{'\n\n'}
          In emergencies, users should immediately contact official emergency services.
        </Text>

        <Text style={styles.sectionTitle}>8. Vendor Listings and Marketplace Services</Text>
        <Text style={styles.paragraph}>
          Brahmand may display businesses, professionals, service providers, vendors, and community organizations.{'\n\n'}
          Vendor profiles, badges, KYC verification, ratings, or verification status do not constitute endorsement or guarantee.{'\n\n'}
          Users are solely responsible for any interaction, agreement, purchase, payment, or transaction with vendors.{'\n\n'}
          Brahmand is not a party to transactions between users and vendors.
        </Text>

        <Text style={styles.sectionTitle}>9. Vendor Verification and KYC</Text>
        <Text style={styles.paragraph}>
          Brahmand may collect identification documents and other information for vendor verification purposes.{'\n\n'}
          Verification does not guarantee:{'\n'}
          • Quality of service{'\n'}
          • Reliability{'\n'}
          • Honesty{'\n'}
          • Future conduct{'\n'}
          • Legitimacy of claims{'\n\n'}
          Brahmand reserves the right to approve, reject, suspend, or remove vendors at its discretion.
        </Text>

        <Text style={styles.sectionTitle}>10. Religious, Spiritual, Panchang and Astrology Content</Text>
        <Text style={styles.paragraph}>
          Brahmand may provide content related to:{'\n'}
          • Panchang{'\n'}
          • Astrology{'\n'}
          • Spiritual guidance{'\n'}
          • Religious teachings{'\n'}
          • Festivals{'\n'}
          • Rituals{'\n'}
          • Community traditions{'\n\n'}
          Such content is provided solely for informational, educational, cultural, and spiritual purposes.{'\n\n'}
          Brahmand does not guarantee accuracy, predictions, outcomes, or spiritual results.{'\n\n'}
          Users should exercise independent judgment.
        </Text>

        <Text style={styles.sectionTitle}>11. AI Features</Text>
        <Text style={styles.paragraph}>
          Certain features may utilize artificial intelligence.{'\n\n'}
          AI-generated content may contain inaccuracies or incomplete information.{'\n\n'}
          AI responses:{'\n'}
          • Are informational only.{'\n'}
          • Do not constitute professional advice.{'\n'}
          • Should not be relied upon exclusively for important decisions.{'\n\n'}
          Users remain responsible for their actions and decisions.
        </Text>

        <Text style={styles.sectionTitle}>12. Brahmand Passport</Text>
        <Text style={styles.paragraph}>
          Brahmand may maintain a digital profile known as the Brahmand Passport.{'\n\n'}
          The Passport may include:{'\n'}
          • Community participation{'\n'}
          • Volunteer activities{'\n'}
          • Achievements{'\n'}
          • Service records{'\n'}
          • Platform milestones{'\n'}
          • Other activity records{'\n\n'}
          Brahmand reserves the right to determine what information is displayed and maintained within the Passport system.
        </Text>

        <Text style={styles.sectionTitle}>13. Intellectual Property</Text>
        <Text style={styles.paragraph}>
          All Platform software, branding, designs, logos, trademarks, graphics, content, and proprietary materials are protected by applicable intellectual property laws.{'\n\n'}
          Users may not:{'\n'}
          • Copy{'\n'}
          • Reproduce{'\n'}
          • Distribute{'\n'}
          • Modify{'\n'}
          • Reverse engineer{'\n'}
          • Commercially exploit{'\n'}
          any portion of the Platform without permission.
        </Text>

        <Text style={styles.sectionTitle}>14. Copyright Complaints</Text>
        <Text style={styles.paragraph}>
          Users must only upload content they have the right to use.{'\n\n'}
          Brahmand may remove content that is alleged to infringe intellectual property rights.{'\n\n'}
          Repeated infringement may result in account suspension or termination.
        </Text>

        <Text style={styles.sectionTitle}>15. Suspension and Termination</Text>
        <Text style={styles.paragraph}>
          Brahmand may suspend, restrict, disable, or terminate access to the Platform at any time for:{'\n'}
          • Violations of these Terms{'\n'}
          • Fraudulent activity{'\n'}
          • Harmful conduct{'\n'}
          • Security concerns{'\n'}
          • Legal obligations
        </Text>

        <Text style={styles.sectionTitle}>16. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          To the maximum extent permitted by law, Brahmand shall not be liable for:{'\n'}
          • User conduct{'\n'}
          • User-generated content{'\n'}
          • Community interactions{'\n'}
          • Vendor transactions{'\n'}
          • Loss of data{'\n'}
          • Financial losses{'\n'}
          • Business losses{'\n'}
          • Personal injury arising from user interactions{'\n'}
          • Indirect or consequential damages{'\n\n'}
          Use of the Platform is at your own risk.
        </Text>

        <Text style={styles.sectionTitle}>17. Indemnification</Text>
        <Text style={styles.paragraph}>
          You agree to indemnify and hold harmless Brahmand, its operators, administrators, volunteers, contractors, and affiliates from any claims, damages, liabilities, losses, or expenses arising from:{'\n'}
          • Your use of the Platform{'\n'}
          • Your content{'\n'}
          • Your violation of these Terms{'\n'}
          • Your violation of applicable laws
        </Text>

        <Text style={styles.sectionTitle}>18. Privacy</Text>
        <Text style={styles.paragraph}>
          Your use of Brahmand is also governed by the Privacy Policy.{'\n\n'}
          By using the Platform, you consent to the collection, use, processing, and storage of information as described in the Privacy Policy.
        </Text>

        <Text style={styles.sectionTitle}>19. Changes to Terms</Text>
        <Text style={styles.paragraph}>
          Brahmand may update or modify these Terms at any time.{'\n\n'}
          Updated versions become effective upon publication.{'\n\n'}
          Continued use of the Platform constitutes acceptance of revised Terms.
        </Text>

        <Text style={styles.sectionTitle}>20. Governing Law</Text>
        <Text style={styles.paragraph}>
          These Terms shall be governed by the laws of India.{'\n\n'}
          Any disputes arising from these Terms or use of the Platform shall be subject to the jurisdiction of the competent courts in India.
        </Text>

        <Text style={styles.sectionTitle}>21. Contact Information</Text>
        <Text style={styles.paragraph}>
          For support, legal inquiries, policy questions, or requests related to these Terms, please contact:{'\n\n'}
          Brahmand{'\n'}
          Email: brahmandteam@gmail.com{'\n'}
          Website: brahmand.app
        </Text>

        <Text style={styles.sectionTitle}>22. Platform Operator Notice</Text>
        <Text style={styles.paragraph}>
          The Brahmand platform is currently operated by its owner(s) and authorized administrators.{'\n\n'}
          References to any future corporate entity, if established, shall automatically apply upon such entity assuming operation, ownership, management, or control of the Platform.{'\n\n'}
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

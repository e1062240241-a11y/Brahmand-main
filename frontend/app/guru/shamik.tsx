import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  Easing,
  StatusBar,
  Share,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '../../src/utils/i18n';
import UiverseNotifyButton from '../../src/components/UiverseNotifyButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Color Palette Theme Tokens
const LIGHT_THEME = {
  bgMistIvory: '#FFFBF5',
  bgSkyBlue: '#EEF6FA',
  bgSageMist: '#F3F8F2',
  primaryForest: '#51785A',
  secondarySky: '#6E8FA8',
  accentGold: '#C9A64A',
  mossGreen: '#7D9974',
  textCharcoal: '#2F3A42',
  cardIvory: 'rgba(255, 253, 248, 0.88)',
  borderGold: 'rgba(201, 166, 74, 0.35)',
};

interface Milestone {
  id: string;
  year: string;
  title: string;
  titleHi: string;
  subtitle: string;
  subtitleHi: string;
  story: string;
  storyHi: string;
  quote: string;
  quoteHi: string;
  icon: string;
}

const MILESTONES: Milestone[] = [
  {
    id: 'm1',
    year: '1985',
    title: 'Early Life & Sacred Roots',
    titleHi: 'बाल्यकाल और पवित्र प्रारंभिक वर्ष',
    subtitle: 'Vedic heritage in Devbhoomi foothills',
    subtitleHi: 'देवभूमि की पावन गोद में वेदों का बीजारोपण',
    story: 'Born into an illustrious Vedic lineage, Shamik Ji showed natural mastery over ancient Sanskrit chants and temple rituals from early childhood.',
    storyHi: 'प्राचीन संस्कृत विद्वानों के एक धर्मनिष्ठ ब्राह्मण परिवार में जन्मे स्वामी जी ने बाल्यावस्था से ही मंत्रों का सहज ज्ञान प्राप्त किया।',
    quote: 'Knowledge is not acquired; it is remembered when the soul awakens.',
    quoteHi: 'ज्ञान प्राप्त नहीं किया जाता; जब आत्मा जागती है तो यह स्मरण हो आता है।',
    icon: 'leaf-outline',
  },
  {
    id: 'm2',
    year: '1998',
    title: 'Spiritual Awakening in Kashi',
    titleHi: 'काशी में आध्यात्मिक जागृति',
    subtitle: 'Tapasya under Traditional Acharyas',
    subtitleHi: 'काशी के महान आचार्यों के सानिध्य में गुप्त साधना',
    story: 'Traveled to Kashi to undertake rigorous tapasya along the Ganga ghats, mastering Jyotish Shastra, Vedanga, and the Shiv Mahapuran.',
    storyHi: 'काशी पहुंचकर गंगा तट पर गहन तपस्या की। ज्योतिष शास्त्र, वेदांग और श्री शिवमहापुराण का गहन अध्ययन किया।',
    quote: 'In the silence of the Ganga ghats, Lord Shiva becomes the quietest teacher.',
    quoteHi: 'गंगा घाटों की शांति में, भगवान शिव स्वयं परम गुरु बन जाते हैं।',
    icon: 'sparkles-outline',
  },
  {
    id: 'm3',
    year: '2008',
    title: 'First National Saavan Katha',
    titleHi: 'प्रथम राष्ट्रीय सावन शिवकथा',
    subtitle: 'Connecting thousands to Shiva Tattva',
    subtitleHi: 'हजारों भक्तों को शिव तत्व से जोड़ना',
    story: 'Delivered his first major 30-day Saavan Katha series, touching thousands of hearts through soulful narration and melodious kirtan.',
    storyHi: 'अपना पहला भव्य 30-दिवसीय सावन कथा ज्ञान यज्ञ आयोजित किया, जिसने हजारों भक्तों के जीवन को भक्ति से भर दिया।',
    quote: 'Katha is a bridge between human pain and divine grace.',
    quoteHi: 'कथा केवल व्याख्यान नहीं है; यह मानव वेदना और दिव्य कृपा के बीच का सेतु है।',
    icon: 'book-outline',
  },
  {
    id: 'm4',
    year: '2016',
    title: 'Global Astrology Consultations',
    titleHi: 'वैश्विक वैदिक ज्योतिष मार्गदर्शन',
    subtitle: '100,000+ Horoscopes & Cosmic Solutions',
    subtitleHi: '1 लाख से अधिक कुंडलियों का सटीक अध्ययन एवं समाधान',
    story: 'Pioneered compassionate Jyotish consultations combining planetary mathematics with practical remedial mantras and Daan.',
    storyHi: 'वैदिक ज्योतिष को आधुनिक जन-जन तक पहुंचाया, जिसमें ग्रह नक्षत्रों की गणना के साथ सरल निवारण उपाय बताए जाते हैं।',
    quote: 'Planets show the weather of karma; devotion creates the shelter.',
    quoteHi: 'ग्रह केवल कर्म के मौसम का संकेत देते हैं; आपकी भक्ति ही सुरक्षा बनाती है।',
    icon: 'planet-outline',
  },
  {
    id: 'm5',
    year: '2026',
    title: 'Brahmand Mission & Youth Awakening',
    titleHi: 'ब्रह्मांड सनातन मिशन एवं युवा जागृति',
    subtitle: 'Uniting 10 Million Devotees Worldwide',
    subtitleHi: 'विश्वभर में 1 करोड़ सनातनियों को एक मंच पर लाना',
    story: 'Spearheading the global digital revolution for Sanatan Lok, establishing daily live jaap, festival guides, and accessible Vedic education for the youth.',
    storyHi: 'विश्वभर में सनातन लोक के डिजिटल क्रांति का नेतृत्व करते हुए दैनिक लाइव जाप और उत्सव मार्गदर्शन प्रदान कर रहे हैं।',
    quote: 'Sanatan is timeless. Technology is merely the canvas to share its light.',
    quoteHi: 'सनातन शाश्वत है। प्रौद्योगिकी तो केवल इसके प्रकाश को फैलाने का कैनवास है।',
    icon: 'globe-outline',
  },
];

const TEACHINGS = [
  {
    id: 't1',
    title: 'The Power of Daily Nama Jaap',
    titleHi: 'दैनिक नाम जाप की महिमा',
    content: 'Just as fresh mountain streams cleanse the earth, constant repetition of the divine name purifies the subtle channels of the heart.',
    contentHi: 'जिस प्रकार पर्वत से बहते झरने धरती को स्वच्छ करते हैं, उसी प्रकार नाम-जप हृदय को निर्मल करता है।',
    category: 'Mantra Vigyan',
    guruPick: true,
  },
  {
    id: 't2',
    title: 'Accepting Cosmic Karma',
    titleHi: 'कर्म और ग्रह शांति',
    content: 'Do not fear Saturn or Rahu. They are cosmic teachers reflecting your unburnt past. Devotion and selfless service transform obstacles into grace.',
    contentHi: 'शनि या राहु से डरने की आवश्यकता नहीं है। वे जीवन के शिक्षक हैं। भक्ति और निःस्वार्थ सेवा से हर बाधा कृपा बन जाती है।',
    category: 'Astrology Wisdom',
    guruPick: false,
  },
  {
    id: 't3',
    title: 'Living Shiv Tattva in Daily Work',
    titleHi: 'दैनिक जीवन में शिव तत्व',
    content: 'Shiva is the quiet space between your breaths. When you drop ego and perform duty with truth, Shiva manifests in your actions.',
    contentHi: 'शिव आपकी सांसों के बीच का मौन हैं। जब अहंकार छूटता है और सत्य के साथ कर्म होता है, शिव प्रकट होते हैं।',
    category: 'Shiv Puran',
    guruPick: false,
  },
];

const FEATURED_VIDEOS = [
  {
    id: 'v1',
    title: 'Saavan Shiv Katha 2026 — Day 1 Introduction',
    titleHi: 'सावन शिव कथा 2026 — प्रथम दिवस मंगलाचरण',
    category: 'Shiv Katha',
    duration: '1h 24m',
    views: '45K views',
    image: require('../../assets/images/panditji.webp'),
  },
  {
    id: 'v2',
    title: 'Overcoming Saturn (Shani) Rahu Period through Mantra',
    titleHi: 'शनि-राहु महादशा के सिद्ध वैदिक उपाय',
    category: 'Astrology Wisdom',
    duration: '42m',
    views: '89K views',
    image: require('../../assets/images/panditji.webp'),
  },
  {
    id: 'v3',
    title: 'How to Practice Brahma Muhurta Meditation',
    titleHi: 'ब्रह्म मुहूर्त ध्यान की सही विधि',
    category: 'Spiritual Guide',
    duration: '28m',
    views: '62K views',
    image: require('../../assets/images/upcoming_shiva.webp'),
  },
];

const DAILY_BLESSING = {
  sanskrit: 'ॐ नमः शिवाय । शुभं करोतु कल्याणमारोग्यं धनसंपदा ॥',
  english: '"May the serene light of Mahadev illuminate your heart today, dissolving all doubts and granting you courage."',
  hindi: '"महादेव का दिव्य प्रकाश आज आपके हृदय को आलोकित करे और सभी बाधाओं का नाश करे।"'
};

export default function AcharyaShamikHimalayanProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const isHindi = t('language') === 'hi';

  const cloudMoveAnim = useRef(new Animated.Value(0)).current;

  // Interactive States
  const [activeTab, setActiveTab] = useState<'journey' | 'teachings' | 'videos' | 'blessing'>('journey');
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>('m1');
  const [questionText, setQuestionText] = useState('');
  const [aiThinking, setAiThinking] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);

  // States for Interested & Notify Me
  const [isInterested, setIsInterested] = useState(false);
  const [isNotified, setIsNotified] = useState(false);

  // Target Date: August 13, 2026
  const TARGET_DATE = new Date('2026-08-13T00:00:00+05:30').getTime();

  const calculateTimeLeft = () => {
    const now = new Date().getTime();
    const difference = TARGET_DATE - now;

    if (difference > 0) {
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    // Drifting Mountain Mist/Clouds
    Animated.loop(
      Animated.timing(cloudMoveAnim, {
        toValue: 1,
        duration: 40000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Live countdown interval
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const translateClouds = cloudMoveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, SCREEN_WIDTH + 50],
  });

  const handleInterestedToggle = () => {
    const nextState = !isInterested;
    setIsInterested(nextState);
    Alert.alert(
      nextState
        ? (isHindi ? 'रुचि दर्ज की गई 🙏' : 'Interest Expressed 🙏')
        : (isHindi ? 'रुचि हटाई गई' : 'Interest Removed'),
      nextState
        ? (isHindi
            ? 'आपने आचार्य शमिक पाठक जी की श्री शिवमहापुराण कथा में अपनी रुचि दर्ज कराई है।'
            : 'You expressed interest in Acharya Shamik Ji’s upcoming Shri Shiv Mahapuran Katha.')
        : (isHindi ? 'आपकी प्राथमिकता अपडेट कर दी गई है।' : 'Preference updated.')
    );
  };

  const handleNotifyToggle = () => {
    const nextState = !isNotified;
    setIsNotified(nextState);
    Alert.alert(
      nextState
        ? (isHindi ? 'सूचनाएं चालू 🔔' : 'Notifications Enabled 🔔')
        : (isHindi ? 'सूचनाएं बंद' : 'Notifications Disabled'),
      nextState
        ? (isHindi
            ? 'जैसे ही आचार्य जी की कथा लाइव प्रारंभ होगी, आपको तुरंत नोटिफिकेशन भेजा जाएगा।'
            : 'You will receive instant alerts the moment Acharya Ji goes live for Shiv Katha.')
        : (isHindi ? 'अधिसूचना सेटिंग्स अपडेट हो गईं।' : 'Notification settings updated.')
    );
  };

  const handleAskGuru = () => {
    if (!questionText.trim()) return;
    setAiThinking(true);
    setAiAnswer(null);
    setTimeout(() => {
      setAiThinking(false);
      setAiAnswer(
        isHindi
          ? `आचार्य जी का संदेश: "${questionText.trim()}" के समाधान हेतु श्री शिवमहापुराण नियमित नमः शिवाय जाप का सुझाव देता है।`
          : `Acharya Ji’s insight: Regarding "${questionText.trim()}", the Shiv Mahapuran reminds us that sincere Nama Jaap restores clarity and peace.`
      );
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFBF5" />

      {/* Himalayan Sunrise Light Gradient Background */}
      <LinearGradient
        colors={[LIGHT_THEME.bgMistIvory, LIGHT_THEME.bgSkyBlue, LIGHT_THEME.bgSageMist]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Animated Drifting Soft Cloud Layer */}
      <Animated.View style={[styles.driftingCloud, { transform: [{ translateX: translateClouds }] }]}>
        <Ionicons name="cloud-outline" size={90} color="rgba(255, 255, 255, 0.45)" />
      </Animated.View>

      {/* Floating Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
        >
          <Ionicons name="arrow-back" size={24} color={LIGHT_THEME.primaryForest} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{isHindi ? 'आचार्य शमिक' : 'Acharya Shamik'}</Text>

        <TouchableOpacity
          style={[styles.headerInterestedBtn, isInterested && styles.headerInterestedBtnActive]}
          onPress={handleInterestedToggle}
        >
          <Ionicons
            name={isInterested ? 'heart' : 'heart-outline'}
            size={16}
            color={isInterested ? '#FFF' : LIGHT_THEME.primaryForest}
          />
          <Text style={[styles.headerInterestedText, isInterested && styles.headerInterestedTextActive]}>
            {isInterested ? (isHindi ? 'रुचि दर्ज' : 'Interested') : (isHindi ? 'रुचि दिखाएं' : 'I am Interested')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Platform.OS === 'android' ? 120 : 100 }}>
        {/* =========================================================================
            UNIFIED HERO SECTION (MERGED WITH SHIV KATHA & LIVE TIMER)
           ========================================================================= */}
        <View style={styles.heroSection}>
          <Text style={styles.heroName}>Acharya Shamik Pathak Ji</Text>
          <Text style={styles.heroSubtitle}>
            {isHindi
              ? 'आध्यात्मिक गुरु · ज्योतिषाचार्य · शिवकथा व्यास · सनातन शिक्षक'
              : 'Spiritual Guru · Astrologer · Storyteller · Sanatan Teacher'}
          </Text>

          {/* Integrated Shiv Katha Live Announcement & Timer Box */}
          <View style={styles.mergedKathaBox}>
            <View style={styles.liveBadgeRow}>
              <View style={styles.livePulseDot} />
              <Text style={styles.liveBadgeText}>
                {isHindi ? 'आगामी श्री शिवमहापुराण कथा 2026' : 'UPCOMING SHRI SHIV MAHAPURAN KATHA 2026'}
              </Text>
            </View>

            {/* Countdown Timer */}
            <View style={styles.timerRow}>
              <Text style={styles.timerLabel}>{isHindi ? 'लाइव प्रारंभ (13 अगस्त):' : 'Starts 13 Aug In:'}</Text>
              <View style={styles.timerBox}>
                <Text style={styles.timerNum}>{String(timeLeft.days).padStart(2, '0')}</Text>
                <Text style={styles.timerUnit}>d</Text>
              </View>
              <Text style={styles.timerColon}>:</Text>
              <View style={styles.timerBox}>
                <Text style={styles.timerNum}>{String(timeLeft.hours).padStart(2, '0')}</Text>
                <Text style={styles.timerUnit}>h</Text>
              </View>
              <Text style={styles.timerColon}>:</Text>
              <View style={styles.timerBox}>
                <Text style={styles.timerNum}>{String(timeLeft.minutes).padStart(2, '0')}</Text>
                <Text style={styles.timerUnit}>m</Text>
              </View>
              <Text style={styles.timerColon}>:</Text>
              <View style={styles.timerBox}>
                <Text style={styles.timerNum}>{String(timeLeft.seconds).padStart(2, '0')}</Text>
                <Text style={styles.timerUnit}>s</Text>
              </View>
            </View>
          </View>

          {/* Merged Action Buttons: Notify Me, I Am Interested, Watch Katha */}
          <View style={styles.heroCtaRow}>
            <UiverseNotifyButton
              isNotified={isNotified}
              onPress={handleNotifyToggle}
              label={isHindi ? 'Notify Me' : 'Notify Me'}
              notifiedLabel={isHindi ? 'Notified' : 'Notified'}
              size="small"
            />

            <TouchableOpacity
              style={[styles.primaryInterestedBtn, isInterested && styles.primaryInterestedBtnActive]}
              onPress={handleInterestedToggle}
            >
              <LinearGradient
                colors={
                  isInterested
                    ? ['#3D5C44', '#2C4431']
                    : [LIGHT_THEME.primaryForest, LIGHT_THEME.mossGreen]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryInterestedGradient}
              >
                <Ionicons name={isInterested ? 'checkmark-circle' : 'heart'} size={15} color="#FFF" />
                <Text style={styles.primaryInterestedText}>
                  {isInterested
                    ? (isHindi ? 'Interested' : 'Interested')
                    : (isHindi ? 'I am Interested' : 'I am Interested')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryCtaBtn}
              onPress={() => router.push('/library/katha')}
            >
              <Ionicons name="play-circle-outline" size={15} color={LIGHT_THEME.primaryForest} />
              <Text style={styles.secondaryCtaText}>{isHindi ? 'कथा देखें' : 'Watch'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* =========================================================================
            STATS & COUNTERS
           ========================================================================= */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>25+</Text>
            <Text style={styles.statLabel}>{isHindi ? 'वर्ष साधना' : 'Years Practice'}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>150+</Text>
            <Text style={styles.statLabel}>{isHindi ? 'शिवकथाएं' : 'Kathas Delivered'}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>100K+</Text>
            <Text style={styles.statLabel}>{isHindi ? 'मार्गदर्शित भक्त' : 'Devotees Guided'}</Text>
          </View>
        </View>

        {/* =========================================================================
            NAVIGATION CHIPS
           ========================================================================= */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabChip, activeTab === 'journey' && styles.tabChipActive]}
            onPress={() => setActiveTab('journey')}
          >
            <Ionicons name="compass-outline" size={15} color={activeTab === 'journey' ? '#FFF' : LIGHT_THEME.primaryForest} />
            <Text style={[styles.tabChipText, activeTab === 'journey' && styles.tabChipTextActive]}>
              {isHindi ? 'जीवन यात्रा' : 'Journey'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabChip, activeTab === 'teachings' && styles.tabChipActive]}
            onPress={() => setActiveTab('teachings')}
          >
            <Ionicons name="leaf-outline" size={15} color={activeTab === 'teachings' ? '#FFF' : LIGHT_THEME.primaryForest} />
            <Text style={[styles.tabChipText, activeTab === 'teachings' && styles.tabChipTextActive]}>
              {isHindi ? 'उपदेश' : 'Teachings'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabChip, activeTab === 'videos' && styles.tabChipActive]}
            onPress={() => setActiveTab('videos')}
          >
            <Ionicons name="videocam-outline" size={15} color={activeTab === 'videos' ? '#FFF' : LIGHT_THEME.primaryForest} />
            <Text style={[styles.tabChipText, activeTab === 'videos' && styles.tabChipTextActive]}>
              {isHindi ? 'कथा वीडियो' : 'Videos'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabChip, activeTab === 'blessing' && styles.tabChipActive]}
            onPress={() => setActiveTab('blessing')}
          >
            <Ionicons name="sunny-outline" size={15} color={activeTab === 'blessing' ? '#FFF' : LIGHT_THEME.primaryForest} />
            <Text style={[styles.tabChipText, activeTab === 'blessing' && styles.tabChipTextActive]}>
              {isHindi ? 'आशीर्वाद' : 'Blessing'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* =========================================================================
            TAB CONTENT 1: SACRED JOURNEY TIMELINE
           ========================================================================= */}
        {activeTab === 'journey' && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{isHindi ? 'जीवन यात्रा अध्याय' : 'Sacred Milestones'}</Text>
            <Text style={styles.sectionSub}>
              {isHindi
                ? 'बाल्यकाल से लेकर ब्रह्मांड मिशन तक की प्रेरणादायक कथा'
                : 'Interactive timeline through Acharya Ji’s life & teachings'}
            </Text>

            <View style={styles.timelineWrapper}>
              <View style={styles.timelineLine} />

              {MILESTONES.map((item) => {
                const isExpanded = expandedMilestone === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.88}
                    style={styles.timelineItem}
                    onPress={() => setExpandedMilestone(isExpanded ? null : item.id)}
                  >
                    <View style={[styles.timelineDot, isExpanded && styles.timelineDotActive]}>
                      <Ionicons
                        name={item.icon as any}
                        size={14}
                        color={isExpanded ? '#FFF' : LIGHT_THEME.primaryForest}
                      />
                    </View>

                    <View style={[styles.timelineCard, isExpanded && styles.timelineCardActive]}>
                      <View style={styles.timelineCardHeader}>
                        <Text style={styles.timelineYear}>{item.year}</Text>
                        <Ionicons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={16}
                          color={LIGHT_THEME.primaryForest}
                        />
                      </View>

                      <Text style={styles.timelineTitle}>{isHindi ? item.titleHi : item.title}</Text>
                      <Text style={styles.timelineSubtitle}>{isHindi ? item.subtitleHi : item.subtitle}</Text>

                      {isExpanded && (
                        <View style={styles.timelineDetails}>
                          <Text style={styles.timelineStory}>{isHindi ? item.storyHi : item.story}</Text>
                          <View style={styles.quoteCard}>
                            <Ionicons name="chatbox-ellipses-outline" size={14} color={LIGHT_THEME.accentGold} />
                            <Text style={styles.quoteText}>{isHindi ? item.quoteHi : item.quote}</Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* =========================================================================
            TAB CONTENT 2: TEACHINGS & WISDOM
           ========================================================================= */}
        {activeTab === 'teachings' && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{isHindi ? 'अमृत वचन एवं उपदेश' : 'Wisdom & Teachings'}</Text>
            <Text style={styles.sectionSub}>
              {isHindi ? 'दैनिक जीवन में आध्यात्मिक मार्गदर्शन' : 'Practical spiritual principles for daily life'}
            </Text>

            {TEACHINGS.map((item) => (
              <View key={item.id} style={styles.teachingGlassCard}>
                <View style={styles.teachingCardHeader}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{item.category}</Text>
                  </View>
                  {item.guruPick && (
                    <View style={styles.guruPickTag}>
                      <Ionicons name="star" size={10} color="#FFF" />
                      <Text style={styles.guruPickText}>{isHindi ? 'विशेष' : 'Guru Pick'}</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.teachingTitle}>{isHindi ? item.titleHi : item.title}</Text>
                <Text style={styles.teachingBody}>{isHindi ? item.contentHi : item.content}</Text>

                <TouchableOpacity
                  style={styles.shareTeachingBtn}
                  onPress={() => Share.share({ message: `${item.title}:\n${item.content}` })}
                >
                  <Ionicons name="share-social-outline" size={14} color={LIGHT_THEME.primaryForest} />
                  <Text style={styles.shareTeachingLabel}>{isHindi ? 'शेयर करें' : 'Share'}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* =========================================================================
            TAB CONTENT 3: FEATURED KATHA VIDEOS
           ========================================================================= */}
        {activeTab === 'videos' && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{isHindi ? 'प्रसिद्ध कथा सत्र' : 'Featured Video Sessions'}</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
              {FEATURED_VIDEOS.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.videoCard}
                  onPress={() => router.push('/library/katha')}
                >
                  <Image source={item.image} style={styles.videoThumb} resizeMode="cover" />
                  <View style={styles.videoOverlay}>
                    <View style={styles.playIconCircle}>
                      <Ionicons name="play" size={16} color="#FFF" />
                    </View>
                    <Text style={styles.videoDuration}>{item.duration}</Text>
                  </View>
                  <View style={styles.videoMeta}>
                    <Text style={styles.videoTitle} numberOfLines={2}>{isHindi ? item.titleHi : item.title}</Text>
                    <Text style={styles.videoSub}>{item.category} · {item.views}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* =========================================================================
            TAB CONTENT 4: DAILY BLESSING & PARCHMENT
           ========================================================================= */}
        {activeTab === 'blessing' && (
          <View style={styles.sectionContainer}>
            <View style={styles.blessingParchmentCard}>
              <Ionicons name="sunny" size={32} color={LIGHT_THEME.accentGold} style={{ alignSelf: 'center', marginBottom: 8 }} />
              <Text style={styles.blessingHeader}>{isHindi ? 'आज का दिव्य आशीर्वाद' : 'Today’s Divine Blessing'}</Text>
              <Text style={styles.blessingSanskrit}>{DAILY_BLESSING.sanskrit}</Text>
              <Text style={styles.blessingText}>
                {isHindi ? DAILY_BLESSING.hindi : DAILY_BLESSING.english}
              </Text>

              <TouchableOpacity
                style={styles.blessingShareBtn}
                onPress={() => Share.share({ message: `${DAILY_BLESSING.sanskrit}\n\n${DAILY_BLESSING.english}` })}
              >
                <Ionicons name="share-outline" size={16} color="#FFF" />
                <Text style={styles.blessingShareText}>{isHindi ? 'आशीर्वाद भेजें' : 'Share Blessing'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* =========================================================================
            ASK GURU INTERACTIVE SECTION
           ========================================================================= */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{isHindi ? 'पूछें आचार्य जी से' : 'Ask Acharya Shamik'}</Text>
          <Text style={styles.sectionSub}>
            {isHindi ? 'अपने संशय का उत्तर पाएं' : 'Ask spiritual queries and receive guidance'}
          </Text>

          <View style={styles.askCard}>
            <TextInput
              style={styles.askInput}
              placeholder={isHindi ? 'अपना प्रश्न यहां लिखें...' : 'Type your question here...'}
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              value={questionText}
              onChangeText={setQuestionText}
            />

            <TouchableOpacity style={styles.askSubmitBtn} onPress={handleAskGuru}>
              <Text style={styles.askSubmitText}>
                {aiThinking
                  ? (isHindi ? 'मंथन हो रहा है...' : 'Guidance forming...')
                  : (isHindi ? 'मार्गदर्शन प्राप्त करें' : 'Seek Guidance')}
              </Text>
            </TouchableOpacity>

            {aiAnswer && (
              <View style={styles.answerCard}>
                <Ionicons name="bulb-outline" size={18} color={LIGHT_THEME.primaryForest} style={{ marginBottom: 4 }} />
                <Text style={styles.answerText}>{aiAnswer}</Text>
              </View>
            )}
          </View>
        </View>

        {/* =========================================================================
            FOOTER CTA
           ========================================================================= */}
        <View style={styles.footerContainer}>
          <LinearGradient
            colors={[LIGHT_THEME.primaryForest, LIGHT_THEME.mossGreen]}
            style={styles.footerGradient}
          >
            <Ionicons name="heart-circle" size={40} color="#FFF" style={{ alignSelf: 'center', marginBottom: 8 }} />
            <Text style={styles.footerTitle}>{isHindi ? 'कथा सत्रों से जुड़ें' : 'Stay Connected With Kathas'}</Text>
            <Text style={styles.footerSub}>
              {isHindi
                ? 'आचार्य शमिक पाठक जी की श्री शिवमहापुराण कथा में अपनी रुचि दर्ज करें या नोटिफिकेशन पाएं।'
                : 'Get instant alerts and express interest in upcoming Saavan Shiv Katha discourses.'}
            </Text>

            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <UiverseNotifyButton
                isNotified={isNotified}
                onPress={handleNotifyToggle}
                label={isHindi ? 'Notify Me' : 'Notify Me'}
                notifiedLabel={isHindi ? 'Notified' : 'Notified'}
                size="small"
              />

              <TouchableOpacity style={[styles.footerBtn, { backgroundColor: '#FFFBF5' }]} onPress={handleInterestedToggle}>
                <Text style={[styles.footerBtnText, { color: LIGHT_THEME.accentGold }]}>
                  {isInterested
                    ? (isHindi ? 'रुचि दर्ज' : 'Interested')
                    : (isHindi ? 'I am Interested' : 'I am Interested')}
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF5',
  },
  driftingCloud: {
    position: 'absolute',
    top: 60,
    zIndex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    zIndex: 10,
  },
  headerBackBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(81, 120, 90, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#2F3A42',
    fontSize: 16,
    fontWeight: '800',
  },
  headerInterestedBtn: {
    backgroundColor: 'rgba(81, 120, 90, 0.1)',
    borderWidth: 1,
    borderColor: LIGHT_THEME.primaryForest,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerInterestedBtnActive: {
    backgroundColor: LIGHT_THEME.primaryForest,
  },
  headerInterestedText: {
    color: LIGHT_THEME.primaryForest,
    fontSize: 12,
    fontWeight: '800',
  },
  headerInterestedTextActive: {
    color: '#FFF',
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  heroName: {
    color: '#2F3A42',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4,
    textAlign: 'center',
  },
  heroSubtitle: {
    color: '#6E8FA8',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  mergedKathaBox: {
    width: '100%',
    backgroundColor: 'rgba(255, 249, 238, 0.95)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(201, 166, 74, 0.35)',
    marginBottom: 14,
    alignItems: 'center',
  },
  liveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D9534F',
  },
  liveBadgeText: {
    color: '#B8860B',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  timerLabel: {
    color: '#555',
    fontSize: 11,
    fontWeight: '700',
    marginRight: 2,
  },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: LIGHT_THEME.primaryForest,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  timerNum: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
  },
  timerUnit: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700',
    marginLeft: 1,
  },
  timerColon: {
    color: LIGHT_THEME.primaryForest,
    fontWeight: '900',
    fontSize: 13,
  },
  heroCtaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  notifyCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: LIGHT_THEME.primaryForest,
    backgroundColor: '#FFF',
    gap: 4,
  },
  notifyCtaBtnActive: {
    backgroundColor: LIGHT_THEME.primaryForest,
  },
  notifyCtaText: {
    color: LIGHT_THEME.primaryForest,
    fontSize: 12,
    fontWeight: '800',
  },
  notifyCtaTextActive: {
    color: '#FFF',
  },
  primaryInterestedBtn: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  primaryInterestedBtnActive: {
    opacity: 0.95,
  },
  primaryInterestedGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
  },
  primaryInterestedText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  secondaryCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: LIGHT_THEME.primaryForest,
    gap: 4,
  },
  secondaryCtaText: {
    color: LIGHT_THEME.primaryForest,
    fontSize: 12,
    fontWeight: '800',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 20,
    paddingVertical: 14,
    backgroundColor: 'rgba(255, 253, 248, 0.95)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(201, 166, 74, 0.25)',
  },
  statCard: {
    alignItems: 'center',
  },
  statNumber: {
    color: LIGHT_THEME.primaryForest,
    fontSize: 18,
    fontWeight: '900',
  },
  statLabel: {
    color: '#6E8FA8',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 12,
    gap: 6,
    marginBottom: 20,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(81, 120, 90, 0.25)',
    backgroundColor: '#FFF',
  },
  tabChipActive: {
    backgroundColor: LIGHT_THEME.primaryForest,
    borderColor: LIGHT_THEME.primaryForest,
  },
  tabChipText: {
    color: LIGHT_THEME.primaryForest,
    fontSize: 12,
    fontWeight: '700',
  },
  tabChipTextActive: {
    color: '#FFF',
    fontWeight: '800',
  },
  sectionContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#2F3A42',
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 2,
  },
  sectionSub: {
    color: '#6E8FA8',
    fontSize: 12,
    marginBottom: 14,
  },
  timelineWrapper: {
    position: 'relative',
    paddingLeft: 10,
  },
  timelineLine: {
    position: 'absolute',
    left: 18,
    top: 10,
    bottom: 20,
    width: 2,
    backgroundColor: 'rgba(81, 120, 90, 0.2)',
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: LIGHT_THEME.primaryForest,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
    zIndex: 2,
  },
  timelineDotActive: {
    backgroundColor: LIGHT_THEME.primaryForest,
  },
  timelineCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 253, 248, 0.95)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(201, 166, 74, 0.25)',
  },
  timelineCardActive: {
    borderColor: LIGHT_THEME.primaryForest,
    backgroundColor: '#FFF',
  },
  timelineCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  timelineYear: {
    color: LIGHT_THEME.accentGold,
    fontSize: 12,
    fontWeight: '900',
  },
  timelineTitle: {
    color: '#2F3A42',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  timelineSubtitle: {
    color: '#6E8FA8',
    fontSize: 11,
  },
  timelineDetails: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  timelineStory: {
    color: '#444',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  quoteCard: {
    backgroundColor: 'rgba(243, 248, 242, 0.8)',
    padding: 8,
    borderRadius: 8,
    borderLeftWidth: 2,
    borderLeftColor: LIGHT_THEME.accentGold,
  },
  quoteText: {
    color: LIGHT_THEME.primaryForest,
    fontSize: 11,
    fontStyle: 'italic',
  },
  teachingGlassCard: {
    backgroundColor: 'rgba(255, 253, 248, 0.92)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(201, 166, 74, 0.25)',
  },
  teachingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryBadge: {
    backgroundColor: 'rgba(81, 120, 90, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    color: LIGHT_THEME.primaryForest,
    fontSize: 10,
    fontWeight: '800',
  },
  guruPickTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIGHT_THEME.accentGold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  guruPickText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
  teachingTitle: {
    color: '#2F3A42',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  teachingBody: {
    color: '#555',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  shareTeachingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 4,
  },
  shareTeachingLabel: {
    color: LIGHT_THEME.primaryForest,
    fontSize: 11,
    fontWeight: '800',
  },
  videoCard: {
    width: 200,
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  videoThumb: {
    width: '100%',
    height: 110,
  },
  videoOverlay: {
    position: 'absolute',
    top: 35,
    left: 80,
    alignItems: 'center',
  },
  playIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(81, 120, 90, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoDuration: {
    position: 'absolute',
    bottom: -35,
    right: -70,
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: '#FFF',
    fontSize: 9,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  videoMeta: {
    padding: 8,
  },
  videoTitle: {
    color: '#2F3A42',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  videoSub: {
    color: '#777',
    fontSize: 10,
  },
  blessingParchmentCard: {
    backgroundColor: 'rgba(255, 253, 248, 0.95)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: LIGHT_THEME.accentGold,
  },
  blessingHeader: {
    color: LIGHT_THEME.accentGold,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  blessingSanskrit: {
    color: LIGHT_THEME.primaryForest,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  blessingText: {
    color: '#444',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  blessingShareBtn: {
    backgroundColor: LIGHT_THEME.primaryForest,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  blessingShareText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  askCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(81, 120, 90, 0.2)',
  },
  askInput: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 10,
    fontSize: 12,
    color: '#333',
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  askSubmitBtn: {
    backgroundColor: LIGHT_THEME.primaryForest,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  askSubmitText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  answerCard: {
    marginTop: 10,
    backgroundColor: 'rgba(243, 248, 242, 0.9)',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: LIGHT_THEME.primaryForest,
  },
  answerText: {
    color: '#2F3A42',
    fontSize: 12,
    lineHeight: 18,
  },
  footerContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  footerGradient: {
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
  },
  footerTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 4,
  },
  footerSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 12,
  },
  footerBtn: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  footerBtnText: {
    color: LIGHT_THEME.primaryForest,
    fontSize: 11,
    fontWeight: '900',
  },
});

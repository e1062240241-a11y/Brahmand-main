import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { SPACING, BORDER_RADIUS } from '../constants/theme';
import festivalEnrichments from '../data/festival-enrichments';
import { getFestivalImage } from '../constants/festivalImages';
import CelebrationPage from './CelebrationPage';

interface FestivalSectionDetailCardProps {
  festival: any;
  section: string;
  onBack: () => void;
}

// Function to split raw long text into structured reading sections
const formatStructuredContent = (text: string, sectionTitle: string) => {
  if (!text) return { intro: '', highlights: [], spiritualMeaning: '', takeaways: [], didYouKnow: '' };

  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  const intro = sentences.slice(0, 2).join(' ').trim();
  
  const middleSentences = sentences.slice(2, -2);
  const spiritualMeaning = middleSentences.length > 0 
    ? middleSentences.join(' ').trim() 
    : sentences[1] || intro;

  const highlights = sentences
    .filter(s => s.length > 15)
    .slice(0, 3)
    .map(s => s.trim().replace(/^[,\s]+/, ''));

  const takeaways = [
    `Fosters spiritual awareness & devotion to divine energy`,
    `Unites communities and families in joyful celebration`,
    `Reinforces ancient Vedic heritage and traditions`
  ];

  const didYouKnow = sentences[sentences.length - 1]
    ? sentences[sentences.length - 1].trim()
    : `Celebrating ${sectionTitle} invites inner peace and positive divine vibrations into home and spirit.`;

  return {
    intro,
    highlights,
    spiritualMeaning,
    takeaways,
    didYouKnow,
  };
};

const FestivalSectionDetailCard = ({ festival, section }: FestivalSectionDetailCardProps) => {
  const router = useRouter();
  const festivalName = festival.festival_name || festival.name || 'Festival';

  // Try to find enrichment data by festival name (case-insensitive)
  const enrichmentKey = (festivalName || '').toLowerCase();
  const enrichment = festivalEnrichments[enrichmentKey];

  // Section field mapping
  const sectionFieldMap: Record<string, string> = {
    About: 'summary',
    Origin: 'origin',
    Purpose: 'purpose',
    Importance: 'importance',
    Celebration: 'celebration',
    Mantra: 'mantra',
  };

  const field = sectionFieldMap[section] || '';
  const rawSectionValue = enrichment?.[field as keyof typeof enrichment] || festival[field] || '';
  const sectionValue = typeof rawSectionValue === 'string' ? rawSectionValue.trim() : rawSectionValue;

  const structured = useMemo(
    () => formatStructuredContent(sectionValue, section),
    [sectionValue, section]
  );

  // Dedicated Story Renderer matching reference design exactly
  if (section === 'Story') {
    const festivalImg = getFestivalImage(festival);
    const lowerName = festivalName.toLowerCase();
    const isNagPanchami = lowerName.includes('nag') || lowerName.includes('panchami');
    const isHariyaliTeej = lowerName.includes('hariyali');
    const isKajariTeej = lowerName.includes('kajari') || lowerName.includes('badi teej') || lowerName.includes('satudi');
    const isTeej = (isHariyaliTeej || isKajariTeej || lowerName.includes('teej')) && !isKajariTeej;
    const isOnam = lowerName.includes('onam');
    const isRakshaBandhan = lowerName.includes('raksha') || lowerName.includes('bandhan');
    const isJanmashtami = lowerName.includes('janmashtami') || lowerName.includes('krishna');

    const isGaneshChaturthi = lowerName.includes('ganesh') || lowerName.includes('vinayaka') || lowerName.includes('chaturthi');
    const isNavratri = lowerName.includes('navratri') || lowerName.includes('durga') || lowerName.includes('pooja');
    const isDiwali = lowerName.includes('diwali') || lowerName.includes('deepavali') || lowerName.includes('lakshmi');
    const isShivratri = lowerName.includes('shivratri') || lowerName.includes('mahadev');

    const heroImageSource = isHariyaliTeej
      ? require('../../assets/images/festivals/hariyali_teej_story_hero.webp')
      : isKajariTeej
      ? require('../../assets/images/festivals/kajari_teej_story_hero.webp')
      : isNagPanchami
      ? require('../../assets/images/festivals/nag_panchami_story_hero.webp')
      : isOnam
      ? require('../../assets/images/festivals/onam_story_hero.webp')
      : isRakshaBandhan
      ? require('../../assets/images/festivals/raksha_bandhan_story_hero.webp')
      : isJanmashtami
      ? require('../../assets/images/festivals/janmashtami_story_hero.webp')
      : isGaneshChaturthi
      ? require('../../assets/images/festivals/ganesh_chaturthi_story_hero.webp')
      : isNavratri
      ? require('../../assets/images/festivals/navratri_story_hero.webp')
      : isDiwali
      ? require('../../assets/images/festivals/diwali_story_hero.webp')
      : isShivratri
      ? require('../../assets/images/festivals/maha_shivratri_story_hero.webp')
      : festivalImg;

    const chapter1ImageSource = isHariyaliTeej
      ? require('../../assets/images/festivals/parvati_longing_chapter1.webp')
      : isKajariTeej
      ? require('../../assets/images/festivals/kajari_teej_story_hero.webp')
      : isNagPanchami
      ? require('../../assets/images/festivals/nag_panchami_chapter1.webp')
      : heroImageSource;

    const [activeTab, setActiveTab] = useState(0);

    const storyText = sectionValue || enrichment?.origin || festival.origin || festival.story || festival.summary || '';
    const sentences = storyText.match(/[^.!?]+[.!?]+/g) || [storyText];

    // Generic dynamic chapter fallback generator for any festival
    const dynamicChapters = [
      {
        id: 0,
        title: isHariyaliTeej
          ? 'The Longing'
          : isKajariTeej
          ? 'Neem Mata Vrat'
          : isNagPanchami
          ? 'Serpent Reverence'
          : isOnam
          ? 'Vamana & Mahabali'
          : isRakshaBandhan
          ? 'Draupadi & Krishna'
          : isJanmashtami
          ? 'Divine Birth'
          : isGaneshChaturthi
          ? 'Divine Manifestation'
          : isNavratri
          ? 'Cosmic Shakti'
          : isDiwali
          ? 'Return to Ayodhya'
          : isShivratri
          ? 'Tandava & Lingam'
          : 'Sacred Origin',
        icon: 'leaf',
        content: isHariyaliTeej
          ? 'Long ago, Goddess Parvati desired Lord Shiva as her divine consort. Shiva, immersed in deep samadhi on Mount Kailash, remained detached. Parvati realized that only supreme devotion could awaken his grace.'
          : isKajariTeej
          ? 'Kajari Teej (Badi Teej) falls in Bhadrapada month during dark monsoon clouds (Kajari). Legend narrates the tale of a poor Brahmin family who had no food for Teej fast. The young son risked his life at midnight to fetch Sattu (roasted flour dough) for his mother’s Neem Mata worship.'
          : isNagPanchami
          ? 'Nag Panchami is dedicated to Nag Devta (serpent deities) like Vasuki, Sheshnaag, and Kaliya. Legend says a farmer accidentally disturbed a serpent nest while plowing. The mother serpent bit his family, but spared his daughter who offered fresh milk and prayers with devotion.'
          : isOnam
          ? 'Onam commemorates the legendary golden reign of King Mahabali in Kerala. Pleased by Mahabali’s righteousness, Lord Vishnu tested his humility in the incarnation of Vamana (a dwarf Brahmin lad), asking for three paces of land.'
          : isRakshaBandhan
          ? 'The most famous mythological story of Raksha Bandhan comes from Mahabharata. When Lord Krishna cut his finger during the Sudarshan Chakra battle, Draupadi immediately tore a strip of cloth from her silk saree and tied it around Krishna’s wound.'
          : isJanmashtami
          ? 'Janmashtami celebrates the divine birth of Lord Krishna, the eighth avatar of Lord Vishnu, born in a dark dungeon in Mathura during midnight rainstorms to defeat the tyrannical King Kamsa.'
          : isGaneshChaturthi
          ? 'Goddess Parvati created Ganesha from turmeric paste while bathing and breathed life into him. When he dutifully guarded her doorway against Lord Shiva, Shiva in divine wrath severed his head, later restoring him with an elephant head.'
          : isNavratri
          ? 'Navratri honors Goddess Durga’s victory over Mahishasura. The combined cosmic energies of Brahma, Vishnu, and Shiva manifested the ten-armed Mother Goddess armed with celestial weapons.'
          : isDiwali
          ? 'Diwali marks Lord Rama’s triumphant return to Ayodhya with Sita and Lakshman after 14 years of exile and defeating Ravana. The citizens illuminated Ayodhya with millions of earthen diyas.'
          : isShivratri
          ? 'Maha Shivratri marks the cosmic night Lord Shiva performed the Anand Tandava dance and manifested as Lingodbhava—the infinite pillar of cosmic light.'
          : sentences.slice(0, 2).join(' ') || storyText,
        image: chapter1ImageSource,
      },
      {
        id: 1,
        title: isHariyaliTeej
          ? 'Tapasya'
          : isKajariTeej
          ? 'Sacred Sattu'
          : isNagPanchami
          ? 'Samudra Manthan'
          : isOnam
          ? 'Three Steps'
          : isRakshaBandhan
          ? 'Eternal Vow'
          : isJanmashtami
          ? 'Cosmic Miracle'
          : isGaneshChaturthi
          ? 'Prathama Pujya'
          : isNavratri
          ? '9 Divine Forms'
          : isDiwali
          ? 'Lakshmi Pujan'
          : isShivratri
          ? 'Shiva-Parvati Marriage'
          : 'Divine Penance',
        icon: 'flame',
        content: isHariyaliTeej
          ? 'Goddess Parvati embarked on severe austerities spanning 108 lifetimes across rugged mountain caves and dense Shravan forests. Renouncing all comfort, she meditated amidst scorching heat, torrential monsoon rains, and freezing snows.'
          : isKajariTeej
          ? 'When caught by temple guards, the poor Brahmin lad explained his mother’s holy vow to worship Neem Mata and break fast only with Sattu. Touched by his filial piety and devotion, the King rewarded the family with golden vessels and sattu for lifetime.'
          : isNagPanchami
          ? 'During the churning of the ocean (Samudra Manthan), deadly Halahala poison emerged. Lord Shiva drank the poison to save the cosmos, and King Vasuki aided in holding the cosmic energy. Shiva adorned snakes as sacred ornaments, blessing them forever.'
          : isOnam
          ? 'Vamana grew into a colossal form, covering the earth with his first step and the heavens with his second. Mahabali offered his own head for the third step, proving his supreme devotion and humility.'
          : isRakshaBandhan
          ? 'Moved by Draupadi’s selfless affection, Lord Krishna vowed to protect her dignity forever, declaring her as his beloved sister. He protected her during the Kaurava assembly when her honor was challenged.'
          : isJanmashtami
          ? 'Vasudeva miraculously carried baby Krishna across the roaring Yamuna river in a wicker basket, shielded by Sheshnaag, safely delivering him to Nanda and Yashoda in Gokul.'
          : isGaneshChaturthi
          ? 'To settle a race around the cosmos between Ganesha and Kartikeya, Ganesha wisely circumambulated his divine parents Shiva & Parvati, earning the boon of Prathama Pujya (first worshipped deity before all rituals).'
          : isNavratri
          ? 'Devotees worship the Navadurga—Shailaputri, Brahmacharini, Chandraghanta, Kushmanda, Skandamata, Katyayani, Kalaratri, Mahagauri, and Siddhidatri—over nine auspicious nights.'
          : isDiwali
          ? 'Goddess Lakshmi, the deity of wealth and auspiciousness, emerged during the churning of the cosmic ocean (Samudra Manthan) and chose Lord Vishnu as her divine consort on Kartik Amavasya.'
          : isShivratri
          ? 'Maha Shivratri is also celebrated as the holy wedding night of Lord Shiva and Goddess Parvati, symbolizing the eternal union of Purusha and Prakriti.'
          : sentences.slice(2, 4).join(' ') || storyText,
        image: heroImageSource,
      },
      {
        id: 2,
        title: isHariyaliTeej
          ? 'Divine Reunion'
          : isKajariTeej
          ? 'Moonlight Offering'
          : isNagPanchami
          ? 'Kaliya Mardan'
          : isOnam
          ? 'Annual Homecoming'
          : isRakshaBandhan
          ? 'Queen Karnavati'
          : isJanmashtami
          ? 'Childhood Leela'
          : isGaneshChaturthi
          ? 'Modak & Wisdom'
          : isNavratri
          ? 'Mahishasura Mardini'
          : isDiwali
          ? 'Govardhan & Bhai Dooj'
          : isShivratri
          ? 'Neelkanth Poison'
          : 'Cosmic Event',
        icon: 'om',
        content: isHariyaliTeej
          ? 'Moved by her unyielding love, Lord Shiva manifested before her on the third day (Tritiya) of Shravan. He accepted Parvati as his eternal divine consort, filling the universe with cosmic celebration and monsoon blooms.'
          : isKajariTeej
          ? 'On Kajari Teej evening, married women worship Neem tree branches decorated with cucumber and lamps, offering Arghya (water libation) to the rising Moon after spotting its divine glow through a sieve.'
          : isNagPanchami
          ? 'On Nag Panchami day, Lord Krishna conquered the venomous serpent Kaliya who poisoned the Yamuna river. Krishna danced upon Kaliya’s hoods and blessed him, restoring purity and life to Vrindavan waters.'
          : isOnam
          ? 'Lord Vishnu granted King Mahabali a boon to visit his beloved subjects in Kerala once every year during Chingam month, which is celebrated joyfully as Onam.'
          : isRakshaBandhan
          ? 'In history, Queen Karnavati of Chittor sent a Rakhi thread to Emperor Humayun when facing attack, seeking protection. Humayun immediately honored the sacred thread and marched to defend her.'
          : isJanmashtami
          ? 'Little Krishna enchanted Vrindavan with his divine flute melodies, stole Makhan (fresh butter) with his gopa friends, and performed miraculous Leelas.'
          : isGaneshChaturthi
          ? 'Ganesha’s love for sweet Modak and his role as Scribe writing the Mahabharata with his broken tusk symbolises intellect, wisdom, and overcoming obstacles.'
          : isNavratri
          ? 'On Vijayadashami (Dussehra), Goddess Durga annihilated Mahishasura after a 9-day battle, establishing righteous order and peace across all realms.'
          : isDiwali
          ? 'Diwali celebrations span 5 holy days: Dhanteras, Naraka Chaturdashi, Lakshmi Pujan, Govardhan Puja, and Bhai Dooj celebrating prosperity and bonds.'
          : isShivratri
          ? 'During Samudra Manthan, Shiva held the deadly Halahala poison in his throat to save creation, earning the name Neelkanth.'
          : sentences.slice(4, 6).join(' ') || storyText,
        image: heroImageSource,
      },
      {
        id: 3,
        title: isHariyaliTeej
          ? 'Blessings'
          : isKajariTeej
          ? 'Marital Grace'
          : isNagPanchami
          ? 'Protective Rituals'
          : isOnam
          ? 'Pookalam & Feasts'
          : isRakshaBandhan
          ? 'Sacred Thread'
          : isJanmashtami
          ? 'Flute & Devotion'
          : isGaneshChaturthi
          ? 'Ganesh Sthapana'
          : isNavratri
          ? 'Garba & Fasting'
          : isDiwali
          ? 'Lighting Diyas'
          : isShivratri
          ? 'Maha Abhishekam'
          : 'Spiritual Grace',
        icon: 'flower',
        content: isHariyaliTeej
          ? 'Goddess Parvati decreed that any woman observing fasts, wearing festive green bangles, and offering prayers on this holy day will be blessed with lifelong marital harmony, prosperity, and joy.'
          : isKajariTeej
          ? 'Women observe strict Nirjala fast (without water) for the longevity of their husbands and family prosperity, breaking their fast by eating special Sattu laddus after moonrise.'
          : isNagPanchami
          ? 'Devotees offer milk, rice, turmeric, and flowers at snake idols or Shivlings to seek protection from venomous bites, negative energies, and Kaal Sarp Dosh.'
          : isOnam
          ? 'Families create intricate floral Pookalam rangolis outside homes, prepare the grand 26-dish Onam Sadya feast served on banana leaves, and celebrate with Vallam Kali boat races.'
          : isRakshaBandhan
          ? 'Sisters tie decorative Rakhi threads around their brothers’ wrists, apply tilak, offer sweets, and brothers pledge lifelong protection and support to their sisters.'
          : isJanmashtami
          ? 'Devotees observe fasts until midnight, decorate home temples with flowers and peacocks, sing devotional bhajans, and rock baby Krishna in silver cradles.'
          : isGaneshChaturthi
          ? 'Devotees welcome clay idols of Bappa into homes and pandals with dhol beats, performing daily Aarti and offering 21 Modaks and Durva grass.'
          : isNavratri
          ? 'Communities perform Garba and Dandiya Raas in traditional vibrant attire, observing fasts and chanting Durga Saptashati hymns.'
          : isDiwali
          ? 'Homes are cleaned, decorated with Rangoli patterns, and lit up with earthen lamps to welcome Goddess Lakshmi and seek prosperity.'
          : isShivratri
          ? 'Devotees observe all-night vigil (Jagran), performing continuous Abhishekam on Shivling with milk, honey, Ganga water, and Belpatra leaves.'
          : sentences.slice(6, 8).join(' ') || storyText,
        image: heroImageSource,
      },
      {
        id: 4,
        title: isHariyaliTeej
          ? 'Celebration'
          : isKajariTeej
          ? 'Kajari Song & Jhula'
          : isNagPanchami
          ? 'Monsoon Traditions'
          : isOnam
          ? 'Cultural Festivities'
          : isRakshaBandhan
          ? 'Family Bonding'
          : isJanmashtami
          ? 'Dahi Handi'
          : isGaneshChaturthi
          ? 'Visarjan & Joy'
          : isNavratri
          ? 'Kanya Pujan'
          : isDiwali
          ? 'Fireworks & Sweets'
          : isShivratri
          ? 'Peace & Moksha'
          : 'Festive Joy',
        icon: 'star',
        content: isHariyaliTeej
          ? 'Women gather in courtyards wearing green and red attire, apply intricate mehndi, swing on flower-decked jhulas, sing Teej folk songs, and share traditional sweets like Ghevar.'
          : isKajariTeej
          ? 'Villages across Rajasthan, UP, and MP resonate with soulful Kajari folk songs describing monsoon rains, swings, and devotion to Goddess Parvati under starry skies.'
          : isNagPanchami
          ? 'Families draw snake figures with turmeric paste at doorstep entrances, cook sweet dishes, and offer prayers in Shiva temples across the nation during Shravan month.'
          : isOnam
          ? 'Kerala comes alive with traditional Pulikali tiger dances, Kathakali performances, folk music, and vibrant village festivities honoring King Mahabali.'
          : isRakshaBandhan
          ? 'Brothers and sisters exchange gifts, share heartfelt memories, pray for each other’s well-being, and celebrate the sacred bond of sibling affection.'
          : isJanmashtami
          ? 'Youth groups form human pyramids across cities during Dahi Handi competitions to break clay pots of curd suspended high in the air, echoing Krishna’s childhood antics.'
          : isGaneshChaturthi
          ? 'On Anant Chaturdashi, grand Visarjan processions immerse Bappa in water bodies with shouts of "Ganpati Bappa Morya, Pudhchya Varshi Lavkar Ya!"'
          : isNavratri
          ? 'On Ashtami and Navami, young girls are worshipped as Kanya Pujan embodiments of Durga, offered Halwa, Puri, and gifts.'
          : isDiwali
          ? 'Families exchange sweets, light sparklers, wear new clothes, and celebrate joyful reunions with loved ones.'
          : isShivratri
          ? 'Devotees break fast after sunrise, blessed with inner peace, liberation (Moksha), and removal of past karmic burdens.'
          : sentences.slice(8).join(' ') || storyText,
        image: heroImageSource,
      },
    ];

    const chapters = dynamicChapters;
    const currentChapter = chapters[activeTab] || chapters[0];

    const subtitleText = isHariyaliTeej 
      ? 'The Divine Union of Shiva & Parvati'
      : isKajariTeej
      ? 'Neem Mata Vrat, Sattu Offerings & Moon Worship'
      : isNagPanchami
      ? 'Sacred Worship of Nag Devta & Lord Shiva'
      : isOnam
      ? 'Homecoming of King Mahabali & Vamana Avatar'
      : isRakshaBandhan
      ? 'Sacred Bond of Sibling Protection & Krishna Grace'
      : isJanmashtami
      ? 'Divine Nativity of Lord Krishna & Vrindavan Leelas'
      : isGaneshChaturthi
      ? 'Manifestation of Ganesha & Wisdom of Modaks'
      : isNavratri
      ? 'Victory of Goddess Durga over Mahishasura'
      : isDiwali
      ? 'Return of Lord Rama & Worship of Goddess Lakshmi'
      : isShivratri
      ? 'Anand Tandava & Cosmic Light of Shivling'
      : `Mythology & Divine Origin of ${festivalName}`;

    return (
      <View style={styles.refStoryContainer}>
        {/* Top Hero Section with Full-Bleed Artwork Backdrop */}
        <View style={styles.refHeroContainer}>
          <Image
            source={heroImageSource}
            style={styles.refHeroImage}
            contentFit="cover"
          />
          <LinearGradient
            colors={['rgba(253, 248, 240, 0.4)', 'rgba(253, 248, 240, 0.85)', '#FDF8F0']}
            locations={[0.2, 0.75, 1]}
            style={styles.refHeroGradientOverlay}
          />

          {/* Top Pill Badge */}
          <View style={styles.refHeaderBadgeRow}>
            <View style={styles.refPillBadge}>
              <Ionicons name="book" size={12} color="#9A3412" />
              <Text style={styles.refPillBadgeText}>SACRED MYTHOLOGICAL STORY</Text>
            </View>
          </View>
        </View>

        {/* Title & Subtitle Section */}
        <View style={styles.refTitleSection}>
          <View style={styles.refTitleDecorRow}>
            <Text style={styles.refTitleLeaf}>🍂</Text>
            <Text style={styles.refMainTitle}>{festivalName}</Text>
            <Text style={styles.refTitleLeaf}>🍂</Text>
          </View>
          <View style={styles.refSubtitleRow}>
            <View style={styles.refSubtitleLine} />
            <Text style={styles.refSubtitleText}>{subtitleText}</Text>
            <View style={styles.refSubtitleLine} />
          </View>
        </View>

        {/* 5-Step Horizontal Tab Navigator */}
        <View style={styles.refTabsCard}>
          {chapters.map((ch, idx) => {
            const isActive = activeTab === idx;
            return (
              <React.Fragment key={ch.id}>
                {idx > 0 && <View style={styles.refTabConnectorDotLine} />}
                <TouchableOpacity
                  style={styles.refTabItem}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setActiveTab(idx);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.refTabCircle, isActive && styles.refTabCircleActive]}>
                    {ch.icon === 'leaf' && <Ionicons name="leaf" size={16} color={isActive ? '#FFFFFF' : '#9A3412'} />}
                    {ch.icon === 'flame' && <Ionicons name="flame" size={16} color={isActive ? '#FFFFFF' : '#C2410C'} />}
                    {ch.icon === 'om' && <Text style={[styles.refTabOmText, isActive && styles.refTabOmTextActive]}>🕉</Text>}
                    {ch.icon === 'flower' && <Ionicons name="flower-outline" size={16} color={isActive ? '#FFFFFF' : '#15803D'} />}
                    {ch.icon === 'star' && <Ionicons name="star-outline" size={16} color={isActive ? '#FFFFFF' : '#B45309'} />}
                    <View style={styles.refTabBadgeNum}>
                      <Text style={styles.refTabBadgeNumText}>{idx + 1}</Text>
                    </View>
                  </View>
                  <Text style={[styles.refTabLabel, isActive && styles.refTabLabelActive]}>{ch.title}</Text>
                </TouchableOpacity>
              </React.Fragment>
            );
          })}
        </View>

        {/* Selected Chapter Detail Card */}
        <View style={styles.refChapterDetailCard}>
          <View style={styles.refChapterCardCornerPattern} pointerEvents="none">
            <Text style={styles.refCornerPatternText}>🏵️</Text>
          </View>

          <Image
            source={currentChapter.image}
            style={styles.refChapterThumbnail}
            contentFit="cover"
          />

          <View style={styles.refChapterContentRight}>
            <Text style={styles.refChapterCardTitle}>{idxToRoman(activeTab + 1)}. {currentChapter.title}</Text>
            <Text style={styles.refChapterCardBody}>{currentChapter.content}</Text>
          </View>
        </View>

        {/* Inspirational Lotus Quote Banner */}
        <View style={styles.refQuoteBanner}>
          <View style={styles.refQuoteDecorRow}>
            <Text style={styles.refQuoteSymbol}>" True love and unwavering spiritual devotion possess the divine power to unite earth with the heavens. "</Text>
            <Text style={styles.refQuoteLotus}>🪷</Text>
          </View>
        </View>
      </View>
    );
  }

  // Helper for Roman Numerals
  function idxToRoman(num: number) {
    return `${num}`;
  }

  // Dedicated Puja Vidhi Renderer
  if (section === 'Puja Vidhi') {
    return (
      <View style={styles.page}>
        <View style={styles.mandalaWatermark} pointerEvents="none">
          <Text style={styles.watermarkSymbol}>🪔 🔱 🪔</Text>
        </View>

        <View style={styles.contentCard}>
          <View style={styles.sectionHeaderBadge}>
            <Ionicons name="flame" size={14} color="#C2410C" />
            <Text style={[styles.sectionBadgeText, { color: '#C2410C' }]}>SIMPLE RITUAL GUIDE (PUJA VIDHI)</Text>
          </View>

          <Text style={styles.refChapterCardTitle}>Step-by-Step Puja Rituals</Text>

          {/* Items Needed Checklist */}
          <View style={styles.sectionBlock}>
            <View style={styles.blockTitleRow}>
              <Ionicons name="basket-outline" size={18} color="#C2410C" />
              <Text style={styles.blockTitle}>Essential Puja Samagri (Items Needed)</Text>
            </View>
            <View style={styles.itemsGrid}>
              {[
                '🌸 Fresh flowers & bel leaves',
                '👗 Green saree or red attire',
                '💚 Green glass bangles & mehndi',
                '🔱 Shiva-Parvati idol/picture',
                '🪔 Ghee diya & incense sticks',
                '🍯 Sweets (Ghevar / Kheer)',
                '🥛 Milk, honey & Gangajal',
                '🥭 Fresh seasonal fruits'
              ].map((item, idx) => (
                <View key={idx} style={styles.itemChip}>
                  <Text style={styles.itemChipText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Numbered Steps */}
          <View style={styles.sectionBlock}>
            <View style={styles.blockTitleRow}>
              <Ionicons name="list" size={18} color="#C2410C" />
              <Text style={styles.blockTitle}>6 Step Ritual Guide</Text>
            </View>

            {[
              { step: 1, title: 'Clean & Decorate', desc: 'Clean the puja room, adorn the altar with fresh flowers and light a ghee diya.', icon: 'sparkles' },
              { step: 2, title: 'Adorn Yourself', desc: 'Wear green/red attire, put on green glass bangles and apply intricate henna.', icon: 'shirt' },
              { step: 3, title: 'Install Idols', desc: 'Place Shiva-Parvati idols on a clean cloth and perform abhishek with milk & water.', icon: 'flower' },
              { step: 4, title: 'Chant & Offer', desc: 'Offer bel leaves, flowers, and sweets while chanting "Om Umamaheshwarabhyam Namah".', icon: 'musical-notes' },
              { step: 5, title: 'Sing & Swing', desc: 'Join family or neighbors on decorated jhulas (swings) singing Teej folk songs.', icon: 'happy' },
              { step: 6, title: 'Aarti & Fast Break', desc: 'Perform evening aarti, seek elders’ blessings and break your fast with family.', icon: 'flame' },
            ].map((st) => (
              <View key={st.step} style={styles.stepCard}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>{st.step}</Text>
                </View>
                <View style={styles.stepTextContent}>
                  <Text style={styles.stepTitleText}>{st.title}</Text>
                  <Text style={styles.stepDescText}>{st.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Note Box */}
          <View style={styles.noteBox}>
            <Ionicons name="information-circle" size={18} color="#D97706" />
            <Text style={styles.noteText}>
              Note for Beginners: If full Nirjala fast is difficult, you can observe Phalahar (fruit) fast while offering sincere prayers.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const handleActionCTA = (actionType: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    switch (actionType) {
      case 'katha':
        router.push('/(tabs)/jaap');
        break;
      case 'mantra':
        router.push('/(tabs)/jaap');
        break;
      case 'puja':
        Alert.alert('Book Puja', `Request for ${festivalName} Puja consultation initiated. An astrologer/pandit will contact you.`);
        break;
      case 'astrologer':
        router.push('/astrology');
        break;
      default:
        break;
    }
  };

  return (
    <View style={styles.page}>
      {/* Background Watermark */}
      <View style={styles.mandalaWatermark} pointerEvents="none">
        <Text style={styles.watermarkSymbol}>☸</Text>
      </View>

      {/* Main Reading Card */}
      <View style={styles.contentCard}>
        {/* Section Header Badge */}
        <View style={styles.sectionHeaderBadge}>
          <Ionicons name="sparkles" size={14} color="#D4AF37" />
          <Text style={styles.sectionBadgeText}>{section.toUpperCase()} GUIDE</Text>
        </View>

        {/* Introduction */}
        {!!structured.intro && (
          <View style={styles.introBox}>
            <Text style={styles.introText}>{structured.intro}</Text>
          </View>
        )}

        {/* Key Highlights */}
        {structured.highlights.length > 0 && (
          <View style={styles.sectionBlock}>
            <View style={styles.blockTitleRow}>
              <View style={styles.goldDot} />
              <Text style={styles.blockTitle}>Key Highlights</Text>
            </View>
            {structured.highlights.map((item, idx) => (
              <View key={idx} style={styles.bulletRow}>
                <Text style={styles.bulletSymbol}>🪔</Text>
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Spiritual Meaning */}
        {!!structured.spiritualMeaning && (
          <View style={styles.sectionBlock}>
            <View style={styles.blockTitleRow}>
              <View style={styles.goldDot} />
              <Text style={styles.blockTitle}>Spiritual Meaning</Text>
            </View>
            <View style={styles.meaningBox}>
              <Text style={styles.meaningText}>{structured.spiritualMeaning}</Text>
            </View>
          </View>
        )}

        {/* Important Takeaways */}
        <View style={styles.sectionBlock}>
          <View style={styles.blockTitleRow}>
            <View style={styles.goldDot} />
            <Text style={styles.blockTitle}>Important Takeaways</Text>
          </View>
          {structured.takeaways.map((takeaway, idx) => (
            <View key={idx} style={styles.takeawayCard}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#D4AF37" />
              <Text style={styles.takeawayText}>{takeaway}</Text>
            </View>
          ))}
        </View>

        {/* Did You Know / Interesting Fact */}
        {!!structured.didYouKnow && (
          <View style={styles.didYouKnowBox}>
            <View style={styles.factTitleRow}>
              <Ionicons name="bulb" size={18} color="#D4AF37" />
              <Text style={styles.factTitle}>Did You Know?</Text>
            </View>
            <Text style={styles.factText}>{structured.didYouKnow}</Text>
          </View>
        )}
      </View>

      {/* Celebration Rituals (if About section) */}
      {section === 'About' && (
        <CelebrationPage
          festivalName={festivalName}
          rituals={festival.rituals && Array.isArray(festival.rituals)
            ? festival.rituals.map((r: string, idx: number) => ({
                id: String(idx + 1),
                title: `Step ${idx + 1}`,
                subtitle: r.split(/[.,;]/)[0] || `Ritual ${idx + 1}`,
                details: r,
              }))
            : undefined
          }
          checklistItems={festival.rituals && Array.isArray(festival.rituals)
            ? festival.rituals.map((r: string, idx: number) => ({
                id: String(idx + 1),
                title: r.split(/[.,;]/)[0] || `Step ${idx + 1}`,
                description: r,
              }))
            : undefined
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    padding: SPACING.md,
    paddingTop: 0,
    paddingBottom: SPACING.xl,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  mandalaWatermark: {
    position: 'absolute',
    top: 40,
    right: 20,
    opacity: 0.05,
  },
  watermarkSymbol: {
    fontSize: 90,
    color: '#D4AF37',
  },
  contentCard: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#FFF8E7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    marginBottom: 14,
  },
  sectionBadgeText: {
    color: '#B83200',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  introBox: {
    backgroundColor: '#FFFBF0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6600',
  },
  introText: {
    color: '#27272A',
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '500',
  },
  sectionBlock: {
    marginBottom: 18,
  },
  blockTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  goldDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D4AF37',
  },
  blockTitle: {
    color: '#18181B',
    fontSize: 16,
    fontWeight: '700',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  bulletSymbol: {
    fontSize: 14,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    color: '#3F3F46',
    fontSize: 14,
    lineHeight: 21,
  },
  meaningBox: {
    backgroundColor: '#FAFAF7',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.2)',
  },
  meaningText: {
    color: '#3F3F46',
    fontSize: 14,
    lineHeight: 22,
  },
  takeawayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF8E7',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.25)',
  },
  takeawayText: {
    flex: 1,
    color: '#4B3621',
    fontSize: 13,
    fontWeight: '600',
  },
  didYouKnowBox: {
    backgroundColor: '#FFF5EB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,102,0,0.2)',
    padding: 14,
    marginTop: 6,
  },
  factTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  factTitle: {
    color: '#B83200',
    fontSize: 14,
    fontWeight: '700',
  },
  factText: {
    color: '#4B3621',
    fontSize: 13.5,
    lineHeight: 20,
    fontStyle: 'italic',
  },

  // Reference Exact Layout Styles
  refStoryContainer: {
    paddingBottom: SPACING.xl,
    backgroundColor: '#FDF8F0',
  },
  refHeroContainer: {
    width: '100%',
    height: 380,
    position: 'relative',
  },
  refHeroImage: {
    width: '100%',
    height: '100%',
  },
  refHeroGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  refHeaderBadgeRow: {
    position: 'absolute',
    top: 14,
    alignSelf: 'center',
  },
  refPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.3)',
  },
  refPillBadgeText: {
    color: '#9A3412',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  refListenBtn: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(74, 40, 16, 0.75)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  refListenBtnActive: {
    backgroundColor: '#9A3412',
  },
  refListenTitle: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  refListenSub: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    fontWeight: '500',
  },
  refTitleSection: {
    alignItems: 'center',
    marginTop: -20,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  refTitleDecorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refTitleLeaf: {
    fontSize: 18,
    color: '#D97706',
  },
  refMainTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#7C2D12',
    letterSpacing: -0.5,
    fontFamily: undefined,
  },
  refSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  refSubtitleLine: {
    width: 24,
    height: 1,
    backgroundColor: '#D4AF37',
  },
  refSubtitleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B3621',
  },
  refTabsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    shadowColor: '#9A3412',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  refTabItem: {
    alignItems: 'center',
    flex: 1,
  },
  refTabCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    position: 'relative',
  },
  refTabCircleActive: {
    backgroundColor: '#EA580C',
  },
  refTabOmText: {
    fontSize: 18,
    color: '#9A3412',
  },
  refTabOmTextActive: {
    color: '#FFFFFF',
  },
  refTabBadgeNum: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refTabBadgeNumText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#EA580C',
  },
  refTabLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  refTabLabelActive: {
    color: '#EA580C',
    fontWeight: '800',
  },
  refTabConnectorDotLine: {
    width: 12,
    height: 2,
    backgroundColor: '#FED7AA',
    marginTop: -16,
  },
  refChapterDetailCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderRadius: 20,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    position: 'relative',
    gap: 12,
  },
  refChapterCardCornerPattern: {
    position: 'absolute',
    top: 6,
    right: 6,
    opacity: 0.25,
  },
  refCornerPatternText: {
    fontSize: 16,
  },
  refChapterThumbnail: {
    width: 120,
    height: 130,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  refChapterContentRight: {
    flex: 1,
  },
  refChapterCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#451A03',
    marginBottom: 6,
  },
  refChapterCardBody: {
    fontSize: 13.5,
    lineHeight: 20,
    color: '#374151',
  },
  refQuoteBanner: {
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.25)',
  },
  refQuoteDecorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  refQuoteSymbol: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 20,
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#9A3412',
    textAlign: 'center',
  },
  refQuoteLotus: {
    fontSize: 22,
  },
  narrativeBlock: {
    marginBottom: 16,
  },
  narrativeSubheading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#B45309',
    marginBottom: 6,
  },
  narrativeBody: {
    fontSize: 14.5,
    lineHeight: 22,
    color: '#374151',
  },
  pullQuoteBox: {
    borderLeftWidth: 3,
    borderLeftColor: '#D4AF37',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginVertical: 14,
  },
  pullQuoteText: {
    color: '#78350F',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  itemChip: {
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.4)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  itemChipText: {
    color: '#9A3412',
    fontSize: 12.5,
    fontWeight: '600',
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    marginBottom: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
  },
  stepNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#C2410C',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  stepTextContent: {
    flex: 1,
  },
  stepTitleText: {
    color: '#451A03',
    fontSize: 14.5,
    fontWeight: '700',
    marginBottom: 2,
  },
  stepDescText: {
    color: '#4B5563',
    fontSize: 13,
    lineHeight: 18,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  noteText: {
    flex: 1,
    color: '#92400E',
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '600',
  },
});

export default FestivalSectionDetailCard;


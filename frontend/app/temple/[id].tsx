import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, FlatList, Linking, Platform, Modal, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { getTemple, getTemplePosts, followTemple, unfollowTemple } from '../../src/services/api';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { getTempleImageById } from '../../src/constants/templeImages';

const DEFAULT_TEMPLE_LOCATIONS: Record<string, string> = {
 'ISKCON Mira Road': 'Mira Road, Thane',
 'Shirdi Sai Baba Temple': 'Shirdi, Maharashtra',
 'Tirupati Balaji Temple – Andhra Pradesh': 'Tirupati, Andhra Pradesh',
 'Vaishno Devi Temple – Jammu & Kashmir': 'Katra, Jammu & Kashmir',
 'Siddhivinayak Temple – Mumbai': 'Prabhadevi, Mumbai',
 'Jagannath Temple – Puri': 'Puri, Odisha',
 'Golden Temple – Amritsar': 'Amritsar, Punjab',
 'Meenakshi Temple – Madurai': 'Madurai, Tamil Nadu',
 'ISKCON Temple Bangalore – Karnataka': 'Rajajinagar, Bengaluru',
 'Somnath Temple – Gujarat': 'Prabhas Patan, Gujarat',
 'Kedarnath Temple – Uttarakhand': 'Rudraprayag, Uttarakhand',
 'Mahakaleshwar Temple – Ujjain': 'Ujjain, Madhya Pradesh',
 'Kashi Vishwanath Temple – Varanasi': 'Varanasi, Uttar Pradesh',
 'Bhimashankar Temple – Maharashtra': 'Pune district, Maharashtra',
 'Ramanathaswamy Temple – Rameswaram': 'Rameswaram, Tamil Nadu',
 'Grishneshwar Temple – Ellora': 'Ellora, Maharashtra',
 'Omkareshwar Temple – Madhya Pradesh': 'Khandwa, Madhya Pradesh',
 'Trimbakeshwar Temple – Nashik': 'Nashik, Maharashtra',
 'Nageshwar Temple – Dwarka': 'Dwarka, Gujarat',
 'Mallikarjuna Temple – Srisailam': 'Srisailam, Andhra Pradesh',
 'Baidyanath Temple – Deoghar': 'Deoghar, Jharkhand',
 'ISKCON MiraRd': 'Mira Road, Thane',
 'MIRA ROAD': 'Mira Road, Thane',
};
const isWeb = Platform.OS === 'web';

const SPECIAL_TEMPLE_DATA: Record<string, {
 aliases: string[];
 locationLabel: string;
 coords: { latitude: number; longitude: number };
 aartiSessions: Array<{ title: string; time: string }>;
 description: string;
 guidance: string;
 youtubeUrl?: string;
}> = {
 'ISKCON Mira Road': {
 aliases: ['mira road', 'iskcon mira', 'iskon borivali', 'iskcon borivali', 'radhagiridhari', 'borivali', 'brovali'],
 locationLabel: 'Mira Road, Thane',
 coords: { latitude: 19.2694199, longitude: 72.8716525 },
 aartiSessions: [
 { title: 'Mangala Aarti', time: '4:30 AM' },
 { title: 'Tulsi Puja', time: '5:00 AM - 5:15 AM' },
 { title: 'Sringar Darshan Aarti', time: '7:15 AM - 7:30 AM' },
 { title: 'Guru Puja', time: '7:25 AM - 7:45 AM' },
 ],
 description: 'Shri Radhagiridhari Mandir, ISKCON Mira Road is a vibrant spiritual temple dedicated to Radha and Giridhari, offering daily worship, bhajans, classes, and community service. The temple is known for its peaceful atmosphere, devotional programs, vegetarian prasadam, and regular festivals celebrating Krishna consciousness. Visitors can take part in congregational chanting, scripture study, and cultural programs organized for families and children.',
 guidance: 'Guidance: To reach ISKCON Mira Road, travel to Mira Road station and take a short taxi or auto-rickshaw ride toward Elderao Nagar. The temple is located near Radha Girdhari Mandir, close to the Mira Road bus depot and main Mira Bhayandar road. From Thane, use the Dahisar–Mira Road route; from Bhayandar, follow the highway toward Mira Road. Parking is available nearby and the temple is well signposted from local landmarks.',
 },
 'Shirdi Sai Baba Temple': {
 aliases: ['shirdi', 'sai baba', 'saibaba', 'samadhi', 'sai baba samadhi', 'sai baba mandir'],
 locationLabel: 'Shirdi, Maharashtra',
 coords: { latitude: 19.7661782, longitude: 74.4769973 },
 aartiSessions: [
 { title: 'Mangala Aarti', time: '5:00 AM' },
 { title: 'Dwarkamai Aarti', time: '6:30 AM' },
 { title: 'Rajbhog Aarti', time: '11:30 AM' },
 { title: 'Dhoop Aarti', time: '5:00 PM' },
 { title: 'Shej Aarti', time: '10:30 PM' },
 ],
 description: 'Shri Sai Baba Samadhi Mandir in Shirdi is a revered pilgrimage center built around the final resting place of Shirdi Sai Baba. The temple complex draws devotees from across India for daily darshan, sacred aarti ceremonies, and prasadam distribution, and it includes the nearby Dwarkamai and Chavadi sites associated with Sai Baba’s life.',
 guidance: 'Guidance: To reach Shirdi Sai Baba Temple, arrive at Shirdi railway station or Shirdi airport and take a short taxi or auto-rickshaw to the main temple complex. The Samadhi Mandir is located in central Shirdi near the main road, and marked local signs guide visitors to the temple, Dwarkamai, and Chavadi. During festivals, allow extra time for darshan and follow the designated queues and visitor lanes.',
 youtubeUrl: 'https://www.youtube.com/live/JArJ3YSsms4?si=Fo3trDpqr3TYlcPR',
 },
 'Somnath Temple – Gujarat': {
 aliases: ['somnath', 'prabhas patan', 'jyotirling-somnath'],
 locationLabel: 'Prabhas Patan, Gujarat',
 coords: { latitude: 20.888, longitude: 70.4012 },
 aartiSessions: [
 { title: 'Mangala Aarti', time: '7:00 AM' },
 { title: 'Madhyan Aarti', time: '12:00 PM' },
 { title: 'Sandhya Aarti', time: '7:00 PM' },
 ],
 description: 'Somnath Temple is one of the twelve sacred Jyotirling shrines of Lord Shiva, located at Prabhas Patan on the Gujarat coast. Revered for its deep spiritual significance and long history of restoration, Somnath remains a major pilgrimage destination where devotees gather for daily darshan, aarti, and temple rituals.',
 guidance: 'Guidance: To reach Somnath Temple, travel to Veraval railway station (about 7 km) or Diu airport (about 80 km), then continue by taxi or local transport to Prabhas Patan. The temple complex is well signposted from Somnath town roads and has organized entry lanes for darshan. Visit during early morning or evening aarti for a smoother experience and less crowding.',
 youtubeUrl: 'https://www.youtube.com/live/58NWbwkGrG0?si=u3rstcuQc5dbUiWC',
 },
 'Kedarnath Temple – Uttarakhand': {
 aliases: ['kedarnath'],
 locationLabel: 'Rudraprayag, Uttarakhand',
 coords: { latitude: 30.7352, longitude: 79.0669 },
 aartiSessions: [
 { title: 'Morning Aarti', time: '6:00 AM' },
 { title: 'Shiv Sahasranama Puja', time: '6:00 PM' },
 { title: 'Evening Aarti', time: '7:30 PM' },
 ],
 description: 'Kedarnath Jyotirling in the Himalayas is among the holiest Shiva shrines and a core destination of Char Dham pilgrimage. The stone temple, set amid high mountain terrain, draws devotees seeking darshan and traditional worship during the open season.',
 guidance: 'Guidance: Reach Kedarnath via Haridwar/Rishikesh to Sonprayag-Gaurikund by road, then complete the trek or use approved pony/palanquin/helicopter services. Keep weather buffers, register yatra details in advance, and start early for smoother darshan.',
 youtubeUrl: 'https://www.youtube.com/live/9gC4O6-9oCc?si=AQKFTRQ8OmEx2TD9',
 },
 'Mahakaleshwar Temple – Ujjain': {
 aliases: ['mahakaleshwar', 'ujjain jyotirling'],
 locationLabel: 'Ujjain, Madhya Pradesh',
 coords: { latitude: 23.1828, longitude: 75.7682 },
 aartiSessions: [
 { title: 'Bhasma Aarti', time: '4:00 AM' },
 { title: 'Madhyahna Aarti', time: '10:30 AM' },
 { title: 'Sandhya Aarti', time: '6:00 PM' },
 ],
 description: 'Mahakaleshwar Jyotirling in Ujjain is renowned for its ancient worship traditions and the iconic Bhasma Aarti. It is one of the most significant Shiva temples in central India.',
 guidance: 'Guidance: Reach Ujjain by rail or via Indore airport and continue by road to Mahakal area. Early-morning slots are preferred for Bhasma Aarti; follow queue instructions and dress-code guidance near the inner sanctum.',
 youtubeUrl: 'https://www.youtube.com/live/TLqrhY3bRp8?si=4sPKpeWVFnAtxPY2',
 },
 'Kashi Vishwanath Temple – Varanasi': {
 aliases: ['kashi vishwanath', 'vishwanath temple varanasi'],
 locationLabel: 'Varanasi, Uttar Pradesh',
 coords: { latitude: 25.3109, longitude: 83.0107 },
 aartiSessions: [
 { title: 'Mangala Aarti', time: '3:00 AM' },
 { title: 'Bhog Aarti', time: '11:15 AM' },
 { title: 'Sapt Rishi Aarti', time: '7:00 PM' },
 ],
 description: 'Kashi Vishwanath Jyotirling at Varanasi is one of India’s most sacred Shiva shrines, closely associated with the spiritual heart of Kashi and the Ganga ghats.',
 guidance: 'Guidance: Reach Varanasi Junction or Lal Bahadur Shastri Airport, then proceed to the Vishwanath corridor area. Use designated entry gates, carry minimal belongings, and plan darshan outside peak festival windows when possible.',
 youtubeUrl: 'https://www.youtube.com/live/DsdpAaHRo88?si=rq0htZT2p7EOtnk3',
 },
 'Bhimashankar Temple – Maharashtra': {
 aliases: ['bhimashankar'],
 locationLabel: 'Pune district, Maharashtra',
 coords: { latitude: 19.0714, longitude: 73.553 },
 aartiSessions: [
 { title: 'Kakada Aarti', time: '4:30 AM' },
 { title: 'Madhyan Aarti', time: '12:00 PM' },
 { title: 'Shej Aarti', time: '9:30 PM' },
 ],
 description: 'Bhimashankar Jyotirling is located in the Sahyadri hills and is revered for its spiritual aura and natural surroundings. Devotees visit year-round for darshan and temple rituals.',
 guidance: 'Guidance: Travel via Pune to Bhimashankar by road; the final stretch is hilly, so daytime travel is recommended. During monsoon, allow extra time and use designated parking and walking routes near the temple zone.',
 youtubeUrl: 'https://www.youtube.com/live/O5ohAPCGsho?si=mBlZWBRol0q79N-Z',
 },
 'Ramanathaswamy Temple – Rameswaram': {
 aliases: ['ramanathaswamy', 'rameswaram jyotirling'],
 locationLabel: 'Rameswaram, Tamil Nadu',
 coords: { latitude: 9.2881, longitude: 79.3174 },
 aartiSessions: [
 { title: 'Spatika Linga Darshan', time: '5:00 AM' },
 { title: 'Kala Santhi Puja', time: '10:00 AM' },
 { title: 'Ardha Jama Puja', time: '8:30 PM' },
 ],
 description: 'Ramanathaswamy Temple in Rameswaram is one of the Jyotirling shrines and is famed for its grand corridors, sacred wells, and deep Ramayana associations.',
 guidance: 'Guidance: Reach Rameswaram by rail/road from Madurai and proceed to the main temple streets. For a smoother visit, complete tirtha rituals early and follow temple queue lanes for darshan.',
 },
 'Grishneshwar Temple – Ellora': {
 aliases: ['grishneshwar', 'ghrishneshwar', 'ellora jyotirling'],
 locationLabel: 'Ellora, Maharashtra',
 coords: { latitude: 20.0258, longitude: 75.178 },
 aartiSessions: [
 { title: 'Mangala Aarti', time: '5:30 AM' },
 { title: 'Madhyan Aarti', time: '12:00 PM' },
 { title: 'Sandhya Aarti', time: '7:30 PM' },
 ],
 description: 'Grishneshwar Jyotirling near Ellora is the twelfth Jyotirling shrine in many traditions, known for its classic temple architecture and devotional worship.',
 guidance: 'Guidance: Reach Aurangabad and continue by road toward Ellora caves area; Grishneshwar temple is nearby with local signage. Combine darshan with off-peak timings to avoid heavy tourist congestion.',
 },
 'Omkareshwar Temple – Madhya Pradesh': {
 aliases: ['omkareshwar'],
 locationLabel: 'Khandwa, Madhya Pradesh',
 coords: { latitude: 22.2456, longitude: 76.151 },
 aartiSessions: [
 { title: 'Mangala Aarti', time: '5:00 AM' },
 { title: 'Madhyan Bhog', time: '12:20 PM' },
 { title: 'Sandhya Aarti', time: '8:00 PM' },
 ],
 description: 'Omkareshwar Jyotirling is situated on an island in the Narmada river and is one of the most spiritually significant Shiva pilgrimage centers in Madhya Pradesh.',
 guidance: 'Guidance: Reach Indore/Khandwa, then travel by road to Omkareshwar. Local bridges and boats connect key temple points; follow marked pilgrim circuits for Omkareshwar and Mamleshwar darshan.',
 },
 'Trimbakeshwar Temple – Nashik': {
 aliases: ['trimbakeshwar', 'tryambakeshwar'],
 locationLabel: 'Nashik, Maharashtra',
 coords: { latitude: 19.9419, longitude: 73.5298 },
 aartiSessions: [
 { title: 'Mangala Aarti', time: '5:30 AM' },
 { title: 'Madhyan Aarti', time: '1:00 PM' },
 { title: 'Sandhya Aarti', time: '7:00 PM' },
 ],
 description: 'Trimbakeshwar Jyotirling near Nashik is a prominent Shiva shrine associated with Vedic traditions and the origin region of the Godavari river.',
 guidance: 'Guidance: Reach Nashik city and continue by road to Trimbak town. The temple area is pedestrian-heavy near entry gates, so plan for short walks and keep darshan slots in mind during weekends.',
 },
 'Nageshwar Temple – Dwarka': {
 aliases: ['nageshwar', 'nagnath', 'dwarka jyotirling'],
 locationLabel: 'Dwarka, Gujarat',
 coords: { latitude: 22.4707, longitude: 69.086 },
 aartiSessions: [
 { title: 'Mangala Aarti', time: '5:00 AM' },
 { title: 'Madhyan Aarti', time: '12:00 PM' },
 { title: 'Sandhya Aarti', time: '7:00 PM' },
 ],
 description: 'Nageshwar Jyotirling near Dwarka is a revered Shiva temple on the coastal pilgrimage route of Gujarat and an important stop for Shiva devotees.',
 guidance: 'Guidance: Reach Dwarka by rail/road, then proceed to Nageshwar temple via local transport on the Dwarka-Bet Dwarka route. Combine darshan planning with Dwarka city temple timings for convenience.',
 },
 'Mallikarjuna Temple – Srisailam': {
 aliases: ['mallikarjuna', 'srisailam jyotirling'],
 locationLabel: 'Srisailam, Andhra Pradesh',
 coords: { latitude: 16.0728, longitude: 78.8686 },
 aartiSessions: [
 { title: 'Suprabhata Seva', time: '4:30 AM' },
 { title: 'Maha Mangala Aarti', time: '12:00 PM' },
 { title: 'Ratri Aarti', time: '8:30 PM' },
 ],
 description: 'Mallikarjuna Jyotirling at Srisailam is a major Shaiva pilgrimage center, also revered as a Shakti Peetha, attracting devotees from across southern India.',
 guidance: 'Guidance: Reach Hyderabad/Kurnool and continue to Srisailam by road through ghat sections. Arrive early for temple queue management, especially on Mondays and festival days.',
 },
 'Baidyanath Temple – Deoghar': {
 aliases: ['baidyanath', 'vaidyanath', 'deoghar jyotirling'],
 locationLabel: 'Deoghar, Jharkhand',
 coords: { latitude: 24.4844, longitude: 86.6994 },
 aartiSessions: [
 { title: 'Mangala Aarti', time: '4:00 AM' },
 { title: 'Bhog Aarti', time: '1:00 PM' },
 { title: 'Sandhya Aarti', time: '6:30 PM' },
 ],
 description: 'Baidyanath Jyotirling in Deoghar is one of the most visited Shiva pilgrimage sites, especially during the Shravan month Kanwar yatra season.',
 guidance: 'Guidance: Reach Jasidih railway junction and take local transport to Deoghar temple complex. During Shravan and major festivals, use the designated darshan queues and buffer extra time for entry.',
 },
 'Tirupati Balaji Temple – Andhra Pradesh': {
 aliases: ['tirupati balaji', 'tirumala', 'venkateswara temple'],
 locationLabel: 'Tirupati, Andhra Pradesh',
 coords: { latitude: 13.6833, longitude: 79.3476 },
 aartiSessions: [
 { title: 'Suprabhatam', time: '3:00 AM' },
 { title: 'Thomala Seva', time: '3:30 AM' },
 { title: 'Ekantha Seva', time: '1:30 AM' },
 ],
 description: 'Tirupati Balaji Temple at Tirumala is one of the most visited pilgrimage shrines in India, dedicated to Lord Venkateswara. The temple is known for disciplined darshan systems, daily sevas, and large-scale prasadam distribution for devotees.',
 guidance: 'Guidance: Reach Tirupati by rail/air, then continue to Tirumala via ghat road buses or private vehicles. Book darshan slots in advance when possible and arrive early to accommodate queue and security procedures.',
 },
 'Vaishno Devi Temple – Jammu & Kashmir': {
 aliases: ['vaishno devi', 'mata vaishno devi', 'katra shrine'],
 locationLabel: 'Katra, Jammu & Kashmir',
 coords: { latitude: 33.0308, longitude: 74.9492 },
 aartiSessions: [
 { title: 'Morning Aarti', time: '6:20 AM' },
 { title: 'Bhog Aarti', time: '12:00 PM' },
 { title: 'Evening Aarti', time: '7:20 PM' },
 ],
 description: 'Vaishno Devi Temple in the Trikuta hills is one of the most revered Shakti pilgrimage destinations. Devotees undertake the sacred yatra from Katra to the Bhawan for darshan of the holy pindis.',
 guidance: 'Guidance: Travel to Katra by rail/road and complete yatra registration before starting the trek. Use official pony, palki, battery car, or helicopter services as needed, and follow route advisories during peak season.',
 youtubeUrl: 'https://www.youtube.com/live/RIoLY_BOpcs?si=Ey3wyTB4aG64jYlN',
 },
 'Siddhivinayak Temple – Mumbai': {
 aliases: ['siddhivinayak', 'prabhadevi ganpati', 'siddhivinayak temple mumbai'],
 locationLabel: 'Prabhadevi, Mumbai',
 coords: { latitude: 19.0166, longitude: 72.8302 },
 aartiSessions: [
 { title: 'Kakad Aarti', time: '5:30 AM' },
 { title: 'Madhyan Aarti', time: '12:00 PM' },
 { title: 'Shej Aarti', time: '8:45 PM' },
 ],
 description: 'Siddhivinayak Temple in Mumbai is one of India’s most prominent Lord Ganesha temples, known for daily aarti, darshan, and strong devotional traditions among local and visiting devotees.',
 guidance: 'Guidance: Reach Prabhadevi via local train (Dadar/Prabhadevi area) or metro-road connections. Prefer non-peak hours for shorter queues and follow temple guidelines for entry and offerings.',
 youtubeUrl: 'https://www.youtube.com/live/pxs9ByLrqzU?si=0MMnHB8uvJN_KxPo',
 },
 'Jagannath Temple – Puri': {
 aliases: ['jagannath temple', 'puri jagannath', 'jagannath puri'],
 locationLabel: 'Puri, Odisha',
 coords: { latitude: 19.8049, longitude: 85.8189 },
 aartiSessions: [
 { title: 'Mangala Aarti', time: '5:30 AM' },
 { title: 'Madhyan Dhupa', time: '1:00 PM' },
 { title: 'Sandhya Dhupa', time: '7:00 PM' },
 ],
 description: 'Jagannath Temple in Puri is a sacred Vaishnav pilgrimage center and one of the Char Dham sites, renowned for its elaborate daily rituals and the globally known Rath Yatra festival.',
 guidance: 'Guidance: Reach Puri by rail/road and proceed to the Grand Road temple zone. Plan darshan with local timing advisories, and account for larger crowds during festival periods and weekends.',
 youtubeUrl: 'https://www.youtube.com/live/jpTOa9PVaTc?si=kc3oUWX-40k1y_k3',
 },
 'Golden Temple – Amritsar': {
 aliases: ['golden temple', 'harmandir sahib', 'amritsar golden temple'],
 locationLabel: 'Amritsar, Punjab',
 coords: { latitude: 31.6200, longitude: 74.8765 },
 aartiSessions: [
 { title: 'Prakash Ceremony', time: '4:00 AM' },
 { title: 'Asa Di Vaar Kirtan', time: '5:00 AM' },
 { title: 'Sukhasan Ceremony', time: '10:00 PM' },
 ],
 description: 'The Golden Temple (Sri Harmandir Sahib) in Amritsar is the holiest Sikh shrine, known for continuous kirtan, sacred sarovar, and the community langar that welcomes all visitors.',
 guidance: 'Guidance: Reach Amritsar city by rail/air and travel to the heritage zone near Harmandir Sahib. Cover your head, follow shrine etiquette, and use designated footwear and queue areas.',
 youtubeUrl: 'https://www.youtube.com/live/bOTR9X6JI_8?si=PNs-Us3q4_rjK0_9',
 },
 'Meenakshi Temple – Madurai': {
 aliases: ['meenakshi temple', 'madurai meenakshi', 'meenakshi amman'],
 locationLabel: 'Madurai, Tamil Nadu',
 coords: { latitude: 9.9195, longitude: 78.1193 },
 aartiSessions: [
 { title: 'Thiruvanandal Pooja', time: '5:00 AM' },
 { title: 'Uchikala Pooja', time: '10:30 AM' },
 { title: 'Ardhajama Pooja', time: '9:00 PM' },
 ],
 description: 'Meenakshi Temple in Madurai is a landmark Dravidian temple complex dedicated to Goddess Meenakshi and Lord Sundareswarar, celebrated for its architecture and daily ritual schedule.',
 guidance: 'Guidance: Reach Madurai junction/airport and continue to the temple streets in the old city. Prefer early morning or late evening slots for smoother darshan and easier movement around the complex.',
 },
 'ISKCON Temple Bangalore – Karnataka': {
 aliases: ['iskcon bangalore', 'iskcon temple bangalore', 'rajajinagar iskcon'],
 locationLabel: 'Rajajinagar, Bengaluru',
 coords: { latitude: 13.0098, longitude: 77.5511 },
 aartiSessions: [
 { title: 'Mangala Aarti', time: '4:30 AM' },
 { title: 'Darshan Aarti', time: '7:15 AM' },
 { title: 'Sandhya Aarti', time: '7:00 PM' },
 ],
 description: 'ISKCON Temple Bangalore is a major devotional center dedicated to Sri Radha Krishna, offering daily darshan, kirtan, spiritual classes, and festival celebrations for devotees and families.',
 guidance: 'Guidance: Reach Rajajinagar via metro or city roads and use the designated temple entry gates. Visit during non-peak evening hours for shorter queues and better access to darshan halls.',
 },
};

const getMapEmbedUrl = (coords: { latitude: number; longitude: number }) =>
 `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}&output=embed`;

const getMapSearchUrl = (coords: { latitude: number; longitude: number }) =>
 `https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`;

const getMapHtml = (coords: { latitude: number; longitude: number }) => `
<html>
 <body style="margin: 0; padding: 0;">
 <iframe
 width="100%"
 height="100%"
 frameborder="0"
 style="border:0;"
 src="${getMapEmbedUrl(coords)}"
 allowfullscreen
 />
 </body>
</html>`;

const STATIC_TEMPLE_DETAILS: Record<string, any> = {
 'jyotirling-somnath-temple-gujarat': {
 name: 'Somnath Temple – Gujarat',
 deity: 'Lord Shiva',
 description: 'Somnath Jyotirling on the western coast of Gujarat is one of the most revered Shiva temples and a major pilgrimage site.',
 location: 'Prabhas Patan, Gujarat',
 aarti_timings: {},
 timings: {},
 contact: '',
 is_following: false,
 },
 'jyotirling-kedarnath-temple-uttarakhand': {
 name: 'Kedarnath Temple – Uttarakhand',
 deity: 'Lord Shiva',
 description: 'Kedarnath Jyotirling in the Himalayas is a sacred shrine visited during the Char Dham yatra season.',
 location: 'Rudraprayag, Uttarakhand',
 aarti_timings: {},
 timings: {},
 contact: '',
 is_following: false,
 },
 'jyotirling-mahakaleshwar-temple-ujjain': {
 name: 'Mahakaleshwar Temple – Ujjain',
 deity: 'Lord Shiva',
 description: 'Mahakaleshwar Jyotirling in Ujjain is renowned for its unique Bhasma Aarti and deep spiritual significance.',
 location: 'Ujjain, Madhya Pradesh',
 aarti_timings: {},
 timings: {},
 contact: '',
 is_following: false,
 },
 'jyotirling-kashi-vishwanath-temple-varanasi': {
 name: 'Kashi Vishwanath Temple – Varanasi',
 deity: 'Lord Shiva',
 description: 'Kashi Vishwanath Jyotirling at Varanasi is one of India’s most sacred Shiva shrines on the banks of the Ganga.',
 location: 'Varanasi, Uttar Pradesh',
 aarti_timings: {},
 timings: {},
 contact: '',
 is_following: false,
 },
 'jyotirling-bhimashankar-temple-maharashtra': {
 name: 'Bhimashankar Temple – Maharashtra',
 deity: 'Lord Shiva',
 description: 'Bhimashankar Jyotirling is located in the Sahyadri hills and is revered for its natural and spiritual setting.',
 location: 'Pune district, Maharashtra',
 aarti_timings: {},
 timings: {},
 contact: '',
 is_following: false,
 },
 'jyotirling-ramanathaswamy-temple-rameswaram': {
 name: 'Ramanathaswamy Temple – Rameswaram',
 deity: 'Lord Shiva',
 description: 'Ramanathaswamy Temple in Rameswaram is a major Jyotirling pilgrimage destination known for its long temple corridors.',
 location: 'Rameswaram, Tamil Nadu',
 aarti_timings: {},
 timings: {},
 contact: '',
 is_following: false,
 },
 'jyotirling-grishneshwar-temple-ellora': {
 name: 'Grishneshwar Temple – Ellora',
 deity: 'Lord Shiva',
 description: 'Grishneshwar Jyotirling near Ellora is one of the twelve sacred Jyotirling shrines dedicated to Lord Shiva.',
 location: 'Ellora, Maharashtra',
 aarti_timings: {},
 timings: {},
 contact: '',
 is_following: false,
 },
 'jyotirling-omkareshwar-temple-madhya-pradesh': {
 name: 'Omkareshwar Temple – Madhya Pradesh',
 deity: 'Lord Shiva',
 description: 'Omkareshwar Jyotirling is located on the Narmada river island and is an important center of Shiva worship.',
 location: 'Khandwa, Madhya Pradesh',
 aarti_timings: {},
 timings: {},
 contact: '',
 is_following: false,
 },
 'jyotirling-trimbakeshwar-temple-nashik': {
 name: 'Trimbakeshwar Temple – Nashik',
 deity: 'Lord Shiva',
 description: 'Trimbakeshwar Jyotirling near Nashik is famed for its historic architecture and its association with the Godavari origin.',
 location: 'Nashik, Maharashtra',
 aarti_timings: {},
 timings: {},
 contact: '',
 is_following: false,
 },
 'jyotirling-nageshwar-temple-dwarka': {
 name: 'Nageshwar Temple – Dwarka',
 deity: 'Lord Shiva',
 description: 'Nageshwar Jyotirling near Dwarka is a revered Shiva temple and an important stop for pilgrims in Gujarat.',
 location: 'Dwarka, Gujarat',
 aarti_timings: {},
 timings: {},
 contact: '',
 is_following: false,
 },
 'jyotirling-mallikarjuna-temple-srisailam': {
 name: 'Mallikarjuna Temple – Srisailam',
 deity: 'Lord Shiva',
 description: 'Mallikarjuna Jyotirling at Srisailam is a major pilgrimage center combining rich history and devotional traditions.',
 location: 'Srisailam, Andhra Pradesh',
 aarti_timings: {},
 timings: {},
 contact: '',
 is_following: false,
 },
 'jyotirling-baidyanath-temple-deoghar': {
 name: 'Baidyanath Temple – Deoghar',
 deity: 'Lord Shiva',
 description: 'Baidyanath Jyotirling in Deoghar is one of the most visited Shiva pilgrimage sites, especially during Shravan.',
 location: 'Deoghar, Jharkhand',
 aarti_timings: {},
 timings: {},
 contact: '',
 is_following: false,
 },
 'other-tirupati-balaji-temple-andhra-pradesh': {
 name: 'Tirupati Balaji Temple – Andhra Pradesh',
 deity: 'Lord Venkateswara',
 description: 'Tirupati Balaji Temple at Tirumala is among the most visited pilgrimage shrines in India and is dedicated to Lord Venkateswara.',
 location: 'Tirupati, Andhra Pradesh',
 aarti_timings: {},
 timings: {},
 contact: '',
 is_following: false,
 },
 'other-vaishno-devi-temple-jammu-kashmir': {
 name: 'Vaishno Devi Temple – Jammu & Kashmir',
 deity: 'Maa Vaishno Devi',
 description: 'Vaishno Devi Temple in the Trikuta hills is a revered Shakti pilgrimage destination attracting devotees year-round.',
 location: 'Katra, Jammu & Kashmir',
 aarti_timings: {},
 timings: {},
 contact: '',
 is_following: false,
 },
 'other-siddhivinayak-temple-mumbai': {
 name: 'Siddhivinayak Temple – Mumbai',
 deity: 'Lord Ganesha',
 description: 'Siddhivinayak Temple in Mumbai is one of the most prominent Ganesha temples, known for its devotional significance and regular darshan queues.',
 location: 'Prabhadevi, Mumbai',
 aarti_timings: {},
 timings: {},
 contact: '',
 is_following: false,
 },
 'other-shirdi-sai-baba-temple-maharashtra': {
 name: 'Shirdi Sai Baba Temple – Maharashtra',
 deity: 'Sai Baba',
 description: 'Shirdi Sai Baba Temple is a major pilgrimage destination associated with the life and teachings of Sai Baba.',
 location: 'Shirdi, Maharashtra',
 aarti_timings: {},
 timings: {},
 contact: '',
 is_following: false,
 },
 'other-jagannath-temple-puri': {
 name: 'Jagannath Temple – Puri',
 deity: 'Lord Jagannath',
 description: 'Jagannath Temple in Puri is one of the most sacred Vaishnav temples and is renowned worldwide for the annual Rath Yatra.',
 location: 'Puri, Odisha',
 aarti_timings: {},
 timings: {},
 contact: '',
 is_following: false,
 },
 'other-golden-temple-amritsar': {
 name: 'Golden Temple – Amritsar',
 deity: 'Sri Harmandir Sahib',
 description: 'The Golden Temple in Amritsar is the holiest Sikh shrine, celebrated for its serene sarovar, kirtan, and community langar.',
 location: 'Amritsar, Punjab',
 aarti_timings: {},
 timings: {},
 contact: '',
 is_following: false,
 },
 'other-meenakshi-temple-madurai': {
 name: 'Meenakshi Temple – Madurai',
 deity: 'Meenakshi & Sundareswarar',
 description: 'Meenakshi Temple in Madurai is a historic South Indian temple complex known for its grand gopurams and daily puja traditions.',
 location: 'Madurai, Tamil Nadu',
 aarti_timings: {},
 timings: {},
 contact: '',
 is_following: false,
 },
 'other-iskcon-temple-bangalore-karnataka': {
 name: 'ISKCON Temple Bangalore – Karnataka',
 deity: 'Sri Radha Krishna',
 description: 'ISKCON Temple Bangalore is a major devotional center offering darshan, kirtan, spiritual classes, and festive celebrations.',
 location: 'Rajajinagar, Bengaluru',
 aarti_timings: {},
 timings: {},
 contact: '',
 is_following: false,
 },
};

const getSpecialTempleKey = (name: string) => {
 const normalizedName = String(name || '').toLowerCase();
 const specialTemple = Object.entries(SPECIAL_TEMPLE_DATA).find(([, value]) =>
 value.aliases.some((alias) => normalizedName.includes(alias))
 );
 if (specialTemple) {
 return specialTemple[0];
 }
 return '';
};

const formatTempleLocation = (temple: any) => {
 const location = temple?.location;
 const specialKey = getSpecialTempleKey(temple?.name);
 if (!location || (typeof location === 'object' && Object.keys(location).length === 0)) {
 if (specialKey) {
 return DEFAULT_TEMPLE_LOCATIONS[specialKey];
 }
 return DEFAULT_TEMPLE_LOCATIONS[temple?.name] || 'Unknown location';
 }
 if (typeof location === 'string') return location;
 const fallback = [location.area, location.city, location.state, location.country]
 .filter(Boolean)
 .join(', ');
 if (fallback) return fallback;
 if (specialKey) {
 return DEFAULT_TEMPLE_LOCATIONS[specialKey];
 }
 return Object.values(location || {})
 .filter((value) => typeof value === 'string' && value.trim())
 .join(', ') || DEFAULT_TEMPLE_LOCATIONS[temple?.name] || 'Unknown location';
};

export default function TempleDetailScreen() {
 const { id } = useLocalSearchParams<{ id: string }>();
 const resolvedTempleId = decodeURIComponent(String(id || '')).trim();
 const router = useRouter();
 const [temple, setTemple] = useState<any>(null);
 const [posts, setPosts] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [isFollowing, setIsFollowing] = useState(false);
 const [isMapModalVisible, setIsMapModalVisible] = useState(false);

 useEffect(() => {
 fetchTempleData();
 }, [id]);

 const fetchTempleData = async () => {
 try {
 const [templeRes, postsRes] = await Promise.all([
 getTemple(resolvedTempleId),
 getTemplePosts(resolvedTempleId).catch(() => ({ data: [] }))
 ]);
 setTemple(templeRes.data);
 setPosts(postsRes.data || []);
 setIsFollowing(templeRes.data?.is_following || false);
 } catch (error) {
 const staticTemple = STATIC_TEMPLE_DETAILS[resolvedTempleId];
 if (staticTemple) {
 setTemple(staticTemple);
 setPosts([]);
 setIsFollowing(false);
 } else {
 console.error('Error fetching temple:', error);
 }
 } finally {
 setLoading(false);
 }
 };

 const handleGoBack = () => {
 router.replace('/temple');
 };

 const handleFollowToggle = async () => {
 try {
 if (isFollowing) {
 await unfollowTemple(resolvedTempleId);
 } else {
 await followTemple(resolvedTempleId);
 }
 setIsFollowing(!isFollowing);
 } catch (error) {
 console.error('Error toggling follow:', error);
 }
 };

 if (loading) {
 return (
 <View style={styles.loadingContainer}>
 <ActivityIndicator size="large" color={COLORS.primary} />
 </View>
 );
 }

 if (!temple) {
 return (
 <SafeAreaView style={styles.container}>
 <View style={styles.header}>
 <TouchableOpacity onPress={handleGoBack}>
 <Ionicons name="arrow-back" size={24} color={COLORS.text} />
 </TouchableOpacity>
 </View>
 <View style={styles.errorContainer}>
 <Ionicons name="alert-circle" size={48} color={COLORS.textLight} />
 <Text style={styles.errorText}>Temple not found</Text>
 </View>
 </SafeAreaView>
 );
 }

 const getTempleAartiSessions = (timings: Record<string, string>, templeName: string) => {
 const order = ['morning', 'afternoon', 'evening'];
 const entries = Object.entries(timings || {}).filter(([, value]) => value);
 const ordered = order
 .map((key) => entries.find(([name]) => name.toLowerCase() === key))
 .filter(Boolean) as [string, string][];
 const rest = entries.filter(([name]) => !order.includes(name.toLowerCase()));
 const sessions = [...ordered, ...rest];
 if (sessions.length > 0) return sessions;

 const specialKey = getSpecialTempleKey(templeName);
 const specialTemple = SPECIAL_TEMPLE_DATA[specialKey];
 if (specialTemple?.aartiSessions?.length) {
 return specialTemple.aartiSessions.map(({ title, time }) => [title, time] as [string, string]);
 }
 return [];
 };


 const aartiSessions = getTempleAartiSessions(temple.aarti_timings || {}, temple.name);
 const templeKey = getSpecialTempleKey(temple.name);
 const specialTempleData = SPECIAL_TEMPLE_DATA[templeKey] || null;
 const templeImageSource = getTempleImageById(resolvedTempleId);
 const isMiraRoadTemple = templeKey === 'ISKCON Mira Road';
 const hasSpecialDetails = Boolean(specialTempleData);
 const hasSpecialMap = Boolean(specialTempleData?.coords);
 const displayName = templeKey || temple.name || 'Temple';

 const openTempleLocation = () => {
 const url = specialTempleData?.coords
 ? getMapSearchUrl(specialTempleData.coords)
 : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${temple.name} ${formatTempleLocation(temple)}`)}`;
 Linking.openURL(url).catch((error) => {
 console.warn('Unable to open map URL', error);
 });
 };

 const getTempleDescription = () => {
 if (specialTempleData?.description) {
 return specialTempleData.description;
 }
 return temple.description;
 };

 const getTempleGuidance = () => {
 if (specialTempleData?.guidance) {
 return specialTempleData.guidance;
 }
 return '';
 };

 const templeDescription = getTempleDescription();
 const templeGuidance = getTempleGuidance();
 return (
 <SafeAreaView style={styles.container}>
 {/* Header */}
 <View style={styles.header}>
 <TouchableOpacity onPress={handleGoBack}>
 <Ionicons name="arrow-back" size={24} color={COLORS.text} />
 </TouchableOpacity>
 <Text style={styles.headerTitle} numberOfLines={1}>{displayName}</Text>
 <TouchableOpacity onPress={handleFollowToggle}>
 <Ionicons 
 name={isFollowing ? "notifications" : "notifications-outline"} 
 size={24} 
 color={isFollowing ? COLORS.primary : COLORS.text} 
 />
 </TouchableOpacity>
 </View>

 <ScrollView showsVerticalScrollIndicator={false}>
 {/* Temple Info Card */}
 <View style={styles.infoCard}>
 <View style={styles.templeIconLarge}>
 <Image source={templeImageSource} style={styles.templeIconLargeImage} resizeMode="cover" />
 </View>
 <Text style={styles.templeName}>{displayName}</Text>
 {temple.deity && <Text style={styles.templeDeity}>{temple.deity}</Text>}
 <TouchableOpacity
 style={styles.locationCard}
 onPress={hasSpecialMap ? () => setIsMapModalVisible(true) : openTempleLocation}
 activeOpacity={0.8}
 >
 <View style={styles.locationRow}>
 <Ionicons name="location" size={16} color={COLORS.primary} />
 <Text style={styles.locationText}>
 {formatTempleLocation(temple)}
 </Text>
 </View>
 </TouchableOpacity>
 {temple.is_verified && (
 <View style={styles.verifiedBadge}>
 <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
 <Text style={styles.verifiedText}>Verified Temple</Text>
 </View>
 )}
 </View>

 {/* Aarti */}                                     
 <View style={styles.section}>
 <Text style={styles.sectionTitle}>Aarti</Text>
 {aartiSessions.length === 0 ? (
 <Text style={styles.noPostsText}>No aarti updates yet</Text>
 ) : (
 <>
 {isMiraRoadTemple && (
 <Text style={styles.morningAartiText}>Morning Aarti</Text>
 )}
 <View style={styles.aartiGrid}>
 {aartiSessions.map(([key, value]) => (
 <View key={key} style={styles.aartiCard}>
 <Text style={styles.aartiLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
 <Text style={styles.aartiTime}>{value}</Text>
 </View>
 ))}
 </View>
 {specialTempleData?.youtubeUrl ? (
 <TouchableOpacity
 style={styles.youtubeLinkButton}
 onPress={() => Linking.openURL(specialTempleData.youtubeUrl ?? '').catch((error) => console.warn('Unable to open YouTube URL', error))}
 activeOpacity={0.75}
 >
 <Text style={styles.youtubeLinkText}>Watch live aarti on YouTube</Text>
 </TouchableOpacity>
 ) : null}
 {isMiraRoadTemple && (
 <>
 <Text style={styles.afternoonAartiText}>Afternoon Aarti</Text>
 <View style={styles.aartiCard}>
 <Text style={styles.aartiLabel}>Raj Bhoga Aarti</Text>
 <Text style={styles.aartiTime}>12:30 PM</Text>
 </View>
 <Text style={styles.eveningAartiText}>Evening Aarti</Text>
 <View style={styles.aartiGrid}>
 <View style={styles.aartiCard}>
 <Text style={styles.aartiLabel}>Usthapana Aarti</Text>
 <Text style={styles.aartiTime}>4:15 PM - 4:30 PM</Text>
 </View>
 <View style={styles.aartiCard}>
 <Text style={styles.aartiLabel}>Sandhya Aarti</Text>
 <Text style={styles.aartiTime}>7:00 PM</Text>
 </View>
 <View style={styles.aartiCard}>
 <Text style={styles.aartiLabel}>Shayana Aarti</Text>
 <Text style={styles.aartiTime}>8:30 PM - 9:00 PM</Text>
 </View>
 </View>
 </>
 )}
 </>
 )}
 </View>

 {/* Description */}
 {hasSpecialDetails ? (
 <>
 <View style={styles.section}>
 <Text style={styles.sectionTitle}>Description</Text>
 {templeDescription ? (
 <Text style={styles.descriptionText}>{templeDescription}</Text>
 ) : (
 <Text style={styles.noPostsText}>No description yet</Text>
 )}
 </View>
 {templeGuidance ? (
 <View style={styles.section}>
 <Text style={styles.sectionTitle}>Guidance</Text>
 <Text style={styles.descriptionText}>{templeGuidance}</Text>
 </View>
 ) : null}
 {hasSpecialMap && (
 <View style={styles.mapSection}>
 <Text style={styles.sectionTitle}>Location</Text>
 <TouchableOpacity style={styles.mapWrapper} onPress={() => setIsMapModalVisible(true)} activeOpacity={0.9}>
 {isWeb ? (
 <iframe
 title={displayName}
 src={getMapEmbedUrl(specialTempleData!.coords)}
 style={styles.mapBox}
 frameBorder="0"
 allowFullScreen
 />
 ) : (
 <WebView
 source={{ html: getMapHtml(specialTempleData!.coords) }}
 style={styles.mapBox}
 scrollEnabled={false}
 originWhitelist={["*"]}
 pointerEvents="none"
 />
 )}
 <View style={styles.mapOverlay}>
 <Text style={styles.mapOverlayText}>Tap to view map</Text>
 </View>
 </TouchableOpacity>
 </View>
 )}
 </>
 ) : (
 templeDescription && (
 <View style={styles.section}>
 <Text style={styles.sectionTitle}>About</Text>
 <Text style={styles.descriptionText}>{templeDescription}</Text>
 </View>
 )
 )}

 </ScrollView>

 <Modal
 visible={isMapModalVisible}
 transparent
 animationType="fade"
 onRequestClose={() => setIsMapModalVisible(false)}
 >
 <View style={styles.modalBackdrop}>
 <View style={styles.modalCard}>
 <View style={styles.modalHeader}>
 <Text style={styles.modalTitle}>{displayName} Location</Text>
 <TouchableOpacity onPress={() => setIsMapModalVisible(false)} style={styles.modalClose}>
 <Ionicons name="close" size={20} color={COLORS.text} />
 </TouchableOpacity>
 </View>
 <TouchableOpacity style={styles.modalMapWrapper} onPress={openTempleLocation} activeOpacity={0.9}>
 {isWeb ? (
 <iframe
 title={`${displayName} map`}
 src={specialTempleData?.coords ? getMapEmbedUrl(specialTempleData.coords) : ''}
 style={styles.modalMap}
 frameBorder="0"
 allowFullScreen
 />
 ) : (
 <WebView
 source={{ html: getMapHtml(specialTempleData?.coords || { latitude: 0, longitude: 0 }) }}
 style={styles.modalMap}
 scrollEnabled={false}
 originWhitelist={["*"]}
 pointerEvents="none"
 />
 )}
 </TouchableOpacity>
 <View style={styles.modalActions}>
 <TouchableOpacity style={styles.primaryButton} onPress={openTempleLocation}>
 <Text style={styles.primaryButtonText}>Open in Maps</Text>
 </TouchableOpacity>
 </View>
 </View>
 </View>
 </Modal>
 </SafeAreaView>
 );
}

const styles = StyleSheet.create({
 container: {
 flex: 1,
 backgroundColor: COLORS.background,
 },
 loadingContainer: {
 flex: 1,
 justifyContent: 'center',
 alignItems: 'center',
 backgroundColor: COLORS.background,
 },
 errorContainer: {
 flex: 1,
 justifyContent: 'center',
 alignItems: 'center',
 },
 errorText: {
 fontSize: 16,
 color: COLORS.textSecondary,
 marginTop: SPACING.md,
 },
 header: {
 flexDirection: 'row',
 alignItems: 'center',
 justifyContent: 'space-between',
 padding: SPACING.md,
 backgroundColor: COLORS.surface,
 borderBottomWidth: 1,
 borderBottomColor: COLORS.divider,
 },
 headerTitle: {
 flex: 1,
 fontSize: 18,
 fontWeight: '600',
 color: COLORS.text,
 marginHorizontal: SPACING.md,
 textAlign: 'center',
 },
 infoCard: {
 backgroundColor: COLORS.surface,
 margin: SPACING.md,
 padding: SPACING.lg,
 borderRadius: BORDER_RADIUS.lg,
 alignItems: 'center',
 },
 templeIconLarge: {
 width: 80,
 height: 80,
 borderRadius: 40,
 backgroundColor: `${COLORS.primary}15`,
 justifyContent: 'center',
 alignItems: 'center',
 marginBottom: SPACING.md,
 overflow: 'hidden',
 },
 templeIconLargeImage: {
 width: '100%',
 height: '100%',
 },
 templeName: {
 fontSize: 22,
 fontWeight: '700',
 color: COLORS.text,
 textAlign: 'center',
 },
 templeDeity: {
 fontSize: 14,
 color: COLORS.textSecondary,
 marginTop: SPACING.xs,
 },
 locationCard: {
 backgroundColor: COLORS.surface,
 borderRadius: BORDER_RADIUS.md,
 padding: SPACING.md,
 marginTop: SPACING.sm,
 borderWidth: 1,
 borderColor: COLORS.border,
 },
 locationRow: {
 flexDirection: 'row',
 alignItems: 'center',
 },
 locationText: {
 fontSize: 14,
 color: COLORS.textSecondary,
 marginLeft: SPACING.xs,
 },
 verifiedBadge: {
 flexDirection: 'row',
 alignItems: 'center',
 backgroundColor: `${COLORS.success}15`,
 paddingHorizontal: SPACING.md,
 paddingVertical: SPACING.xs,
 borderRadius: 20,
 marginTop: SPACING.md,
 },
 verifiedText: {
 fontSize: 12,
 color: COLORS.success,
 fontWeight: '600',
 marginLeft: SPACING.xs,
 },
 section: {
 backgroundColor: COLORS.surface,
 marginHorizontal: SPACING.md,
 marginBottom: SPACING.md,
 padding: SPACING.md,
 borderRadius: BORDER_RADIUS.lg,
 },
 sectionTitle: {
 fontSize: 16,
 fontWeight: '600',
 color: COLORS.text,
 marginBottom: SPACING.md,
 },
 timingRow: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 paddingVertical: SPACING.xs,
 borderBottomWidth: 1,
 borderBottomColor: COLORS.divider,
 },
 timingLabel: {
 fontSize: 14,
 color: COLORS.textSecondary,
 },
 timingValue: {
 fontSize: 14,
 color: COLORS.text,
 fontWeight: '500',
 },
 aartiGrid: {
 flexDirection: 'row',
 flexWrap: 'wrap',
 marginHorizontal: -SPACING.sm / 2,
 },
 aartiCard: {
 width: '48%',
 backgroundColor: COLORS.background,
 borderRadius: BORDER_RADIUS.md,
 padding: SPACING.md,
 margin: SPACING.sm / 2,
 borderWidth: 1,
 borderColor: COLORS.border,
 },
 aartiLabel: {
 fontSize: 14,
 color: COLORS.textSecondary,
 marginBottom: SPACING.xs,
 textTransform: 'capitalize',
 },
 aartiTime: {
 fontSize: 16,
 color: COLORS.text,
 fontWeight: '700',
 },
 youtubeLinkButton: {
 marginTop: SPACING.sm,
 paddingVertical: SPACING.sm,
 paddingHorizontal: SPACING.md,
 borderRadius: BORDER_RADIUS.md,
 backgroundColor: `${COLORS.primary}12`,
 alignSelf: 'flex-start',
 },
 youtubeLinkText: {
 fontSize: 14,
 color: COLORS.primary,
 fontWeight: '700',
 },
 morningAartiText: {
 fontSize: 14,
 color: COLORS.primary,
 fontWeight: '600',
 marginBottom: SPACING.sm,
 },
 afternoonAartiText: {
 fontSize: 14,
 color: COLORS.primary,
 fontWeight: '600',
 marginTop: SPACING.sm,
 textAlign: 'left',
 },
 afternoonAartiDetailText: {
 fontSize: 13,
 color: COLORS.textSecondary,
 marginTop: SPACING.xs,
 textAlign: 'left',
 },
 eveningAartiText: {
 fontSize: 14,
 color: COLORS.primary,
 fontWeight: '600',
 marginTop: SPACING.sm,
 textAlign: 'left',
 },
 usthapanaAartiText: {
 fontSize: 13,
 color: COLORS.textSecondary,
 marginTop: SPACING.xs,
 textAlign: 'left',
 },
 descriptionText: {
 fontSize: 14,
 color: COLORS.textSecondary,
 lineHeight: 22,
 },
 mapSection: {
 marginHorizontal: SPACING.md,
 marginBottom: SPACING.md,
 },
 mapWrapper: {
 width: '100%',
 height: 180,
 borderRadius: BORDER_RADIUS.lg,
 overflow: 'hidden',
 borderWidth: 1,
 borderColor: COLORS.border,
 },
 mapBox: {
 width: '100%',
 height: '100%',
 backgroundColor: COLORS.background,
 },
 mapOverlay: {
 position: 'absolute',
 bottom: 0,
 left: 0,
 right: 0,
 padding: SPACING.sm,
 backgroundColor: `${COLORS.background}CC`,
 },
 mapOverlayText: {
 fontSize: 12,
 color: COLORS.textSecondary,
 textAlign: 'center',
 },
 modalBackdrop: {
 flex: 1,
 backgroundColor: 'rgba(0,0,0,0.45)',
 justifyContent: 'center',
 padding: SPACING.md,
 },
 modalCard: {
 backgroundColor: COLORS.surface,
 borderRadius: BORDER_RADIUS.lg,
 overflow: 'hidden',
 },
 modalHeader: {
 flexDirection: 'row',
 alignItems: 'center',
 justifyContent: 'space-between',
 paddingHorizontal: SPACING.md,
 paddingVertical: SPACING.sm,
 borderBottomWidth: 1,
 borderBottomColor: COLORS.border,
 },
 modalTitle: {
 fontSize: 16,
 fontWeight: '600',
 color: COLORS.text,
 flex: 1,
 },
 modalClose: {
 padding: SPACING.xs,
 marginLeft: SPACING.sm,
 },
 modalMapWrapper: {
 width: '100%',
 height: 260,
 },
 modalMap: {
 width: '100%',
 height: '100%',
 backgroundColor: COLORS.background,
 },
 modalActions: {
 padding: SPACING.md,
 },
 primaryButton: {
 backgroundColor: COLORS.primary,
 borderRadius: BORDER_RADIUS.md,
 alignItems: 'center',
 justifyContent: 'center',
 paddingVertical: SPACING.sm,
 },
 primaryButtonText: {
 color: COLORS.surface,
 fontSize: 14,
 fontWeight: '700',
 },
 noPostsText: {
 fontSize: 14,
 color: COLORS.textLight,
 textAlign: 'center',
 paddingVertical: SPACING.md,
 },
 postCard: {
 backgroundColor: COLORS.background,
 padding: SPACING.md,
 borderRadius: BORDER_RADIUS.md,
 marginBottom: SPACING.sm,
 },
 postTitle: {
 fontSize: 15,
 fontWeight: '600',
 color: COLORS.text,
 marginBottom: SPACING.xs,
 },
 postContent: {
 fontSize: 14,
 color: COLORS.textSecondary,
 lineHeight: 20,
 },
 postDate: {
 fontSize: 12,
 color: COLORS.textLight,
 marginTop: SPACING.sm,
 },
});
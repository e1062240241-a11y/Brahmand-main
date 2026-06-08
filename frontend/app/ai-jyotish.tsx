import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function AIJyotishScreen() {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [askNowModalVisible, setAskNowModalVisible] = useState(true);

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={['#FF8D57', '#EA9B76', '#FFEEE5']}
        locations={[0, 0.0913, 0.25]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Top Navigation */}
        <View style={styles.topNav}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>

          <View style={styles.navTitleContainer}>
            <View style={styles.avatarCircle}>
              <Ionicons name="scale-outline" size={18} color="#FFF" />
            </View>
            <Text style={styles.navTitle}>AI Jyotish</Text>
          </View>

          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Chat Area */}
        <ScrollView style={styles.chatContainer} contentContainerStyle={styles.chatContent}>
          {/* Chat messages will be rendered here dynamically */}
        </ScrollView>

        {/* Bottom Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.textInputBox}>
            <TextInput
              style={styles.textInput}
              placeholder="Message..."
              placeholderTextColor="rgba(0,0,0,0.50)"
              value={message}
              onChangeText={setMessage}
            />
            <TouchableOpacity style={styles.micBtn}>
              <Ionicons name="mic-outline" size={20} color="#000" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.sendBtn}>
            <Ionicons name="paper-plane" size={18} color="#FFF" style={{ marginLeft: -2 }} />
          </TouchableOpacity>
        </View>

        {/* Ask Now / Birth Details Modal */}
        <Modal visible={askNowModalVisible} transparent={true} animationType="fade">
          <View style={styles.askNowOverlay}>
            <TouchableWithoutFeedback onPress={() => setAskNowModalVisible(false)}>
              <View style={StyleSheet.absoluteFill} />
            </TouchableWithoutFeedback>
            <View style={styles.askNowModal}>
              <Text style={styles.askNowTitle}>Enter Birth Details</Text>

              <View style={styles.askNowInputGroup}>
                <View style={styles.askNowLabelRow}>
                  <Ionicons name="calendar-outline" size={14} color="#5A4136" />
                  <Text style={styles.askNowLabel}>Date of Birth</Text>
                </View>
                <TextInput
                  style={styles.askNowInput}
                  placeholder="dd/mm/yyyy"
                  placeholderTextColor="#A9968F"
                />
              </View>

              <View style={styles.askNowInputGroup}>
                <View style={styles.askNowLabelRow}>
                  <Ionicons name="time-outline" size={14} color="#5A4136" />
                  <Text style={styles.askNowLabel}>Time of Birth</Text>
                </View>
                <TextInput
                  style={styles.askNowInput}
                  placeholder="--:-- --"
                  placeholderTextColor="#A9968F"
                />
              </View>

              <View style={styles.askNowInputGroup}>
                <View style={styles.askNowLabelRow}>
                  <Ionicons name="location-outline" size={14} color="#5A4136" />
                  <Text style={styles.askNowLabel}>Place of Birth</Text>
                </View>
                <TextInput
                  style={styles.askNowInput}
                  placeholder="City, State or Country"
                  placeholderTextColor="#A9968F"
                />
              </View>

              <View style={styles.askNowNotice}>
                <Ionicons name="information-circle-outline" size={20} color="#FF7B00" />
                <Text style={styles.askNowNoticeText}>
                  Precise birth details ensure high-accuracy planetary alignments for your Dashas and Yogis.
                </Text>
              </View>

              <TouchableOpacity style={styles.askNowCalcBtn} onPress={() => setAskNowModalVisible(false)}>
                <Text style={styles.askNowCalcBtnText}>Calculate Horoscope</Text>
                <Ionicons name="chevron-forward" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF8A00',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    fontFamily: 'System',
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  // User Bubble
  userMessageContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  userBubble: {
    backgroundColor: '#FFF',
    maxWidth: 290,
    paddingVertical: 16,
    paddingLeft: 25,
    paddingRight: 25,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 3,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  userMessageText: {
    fontSize: 14,
    lineHeight: 24,
    color: '#000',
    fontFamily: 'System',
  },
  statusText: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.50)',
    marginTop: 6,
    fontFamily: 'System',
  },
  // AI Bubble
  aiMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF8A00',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 4,
  },
  aiBubbleContainer: {
    flex: 1,
  },
  aiBubble: {
    backgroundColor: '#FFF',
    maxWidth: 290,
    padding: 16,
    borderTopLeftRadius: 19.5,
    borderTopRightRadius: 19.5,
    borderBottomRightRadius: 19.5,
    borderBottomLeftRadius: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  aiMessageText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1B1C1C',
    fontFamily: 'System',
    marginBottom: 12,
  },
  // Scripture Card
  scriptureCard: {
    width: 258,
    borderRadius: 9.6,
    borderWidth: 0.8,
    borderColor: 'rgba(226,191,176,0.50)',
    backgroundColor: '#FFF',
    overflow: 'hidden',
  },
  scriptureImagePlaceholder: {
    width: '100%',
    height: 76.8,
    backgroundColor: '#FBE9E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scriptureInfo: {
    padding: 12.8,
  },
  scriptureTitle: {
    fontSize: 11.2,
    fontWeight: '600',
    color: '#A04100',
    marginBottom: 4,
    fontFamily: 'System',
    letterSpacing: 0.56,
  },
  scriptureSubtitle: {
    fontSize: 11.2,
    color: '#5A4136',
    marginBottom: 8,
    fontFamily: 'System',
  },
  scriptureLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scriptureLinkText: {
    fontSize: 9.6,
    fontWeight: '500',
    color: '#A04100',
    marginRight: 4,
    fontFamily: 'System',
  },
  // Input Area
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  textInputBox: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.50)',
    borderRadius: 22,
    paddingLeft: 16,
    paddingRight: 10,
    backgroundColor: '#FFF',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    fontFamily: 'System',
    height: '100%',
  },
  micBtn: {
    padding: 4,
  },
  sendBtn: {
    width: 44,
    height: 42,
    backgroundColor: '#FF8A00',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  
  // Ask Now Modal Styles
  askNowOverlay: {
    flex: 1,
    backgroundColor: 'rgba(49, 19, 3, 0.20)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  askNowModal: {
    display: 'flex',
    width: '100%',
    paddingVertical: 24,
    paddingHorizontal: 24,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(226, 191, 176, 0.30)',
    backgroundColor: '#FFF',
    shadowColor: 'rgba(160, 65, 0, 0.08)',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 1,
    shadowRadius: 60,
    elevation: 10,
  },
  askNowTitle: {
    alignSelf: 'stretch',
    color: '#1B1C1C',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 24,
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 40,
  },
  askNowInputGroup: {
    alignSelf: 'stretch',
  },
  askNowLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  askNowLabel: {
    color: '#5A4136',
    fontFamily: 'Inter',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 24,
    marginLeft: 8,
  },
  askNowInput: {
    height: 50,
    backgroundColor: '#FBE9E0',
    borderWidth: 1,
    borderColor: '#E2BFB0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1B1C1C',
  },
  askNowNotice: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(160, 65, 0, 0.05)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  askNowNoticeText: {
    color: '#5A4136',
    fontFamily: 'Inter',
    fontSize: 12,
    fontStyle: 'italic',
    fontWeight: '500',
    lineHeight: 16,
    marginLeft: 16,
    flex: 1,
  },
  askNowCalcBtn: {
    alignSelf: 'center',
    width: 300,
    height: 56,
    backgroundColor: '#FF7B00',
    borderRadius: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(255, 123, 0, 0.30)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 8,
  },
  askNowCalcBtnText: {
    color: '#FFF',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 24,
    textTransform: 'capitalize',
    marginRight: 8,
  },
});

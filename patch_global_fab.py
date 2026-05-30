import re

with open("frontend/src/components/GlobalFAB.tsx", "r") as f:
    content = f.read()

# Add imports
imports_to_add = """import { getMySOSAlert, resolveSOSAlert } from '../services/api';
import { useTranslation } from '../utils/i18n';
import { DeviceEventEmitter, Alert } from 'react-native';"""

if "import { getMySOSAlert" not in content:
    content = content.replace("import { useSafeAreaInsets } from 'react-native-safe-area-context';", "import { useSafeAreaInsets } from 'react-native-safe-area-context';\n" + imports_to_add)

# Add state and effects
state_and_effects = """
  const { t } = useTranslation();
  const [activeSOS, setActiveSOS] = useState<any>(null);

  const checkSOSStatus = useCallback(async () => {
    try {
      const res = await getMySOSAlert();
      setActiveSOS(res.data);
    } catch (e) {}
  }, []);

  useEffect(() => {
    checkSOSStatus();
  }, [checkSOSStatus]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('open_sos_modal', () => {
      setFabExpanded(true);
      Animated.parallel([
        Animated.spring(fabScale, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
        Animated.timing(fabRotation, { toValue: 1, duration: 300, useNativeDriver: true }),
        ...fabItemAnims.map((anim, i) =>
          Animated.spring(anim, { toValue: 1, friction: 5, tension: 50, delay: i * 40, useNativeDriver: true })
        ),
      ]).start();
      checkSOSStatus();
    });
    return () => sub.remove();
  }, [fabScale, fabRotation, fabItemAnims, checkSOSStatus]);

  const handleResolveActiveSOS = async (status: 'resolved' | 'cancelled') => {
    if (!activeSOS?.id) return;
    if (status === 'cancelled') {
      try {
        await resolveSOSAlert(activeSOS.id, status);
        setActiveSOS(null);
      } catch (error: any) {
        Alert.alert('Error', error.response?.data?.detail || 'Failed to cancel SOS');
      }
      return;
    }
    Alert.alert(
      'Help Received',
      'Confirm this action?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', onPress: async () => {
            try {
              await resolveSOSAlert(activeSOS.id, status);
              setActiveSOS(null);
            } catch (error) {}
          }
        }
      ]
    );
  };
"""

if "const { t } = useTranslation();" not in content:
    content = content.replace("const [fabExpanded, setFabExpanded] = useState(false);", "const [fabExpanded, setFabExpanded] = useState(false);" + state_and_effects)

# Add UI
sos_active_ui = """
                {activeSOS ? (
                  <View style={fabStyles.sosActiveView}>
                    <View style={fabStyles.sosHeader}>
                      <View style={fabStyles.sosCircleIcon}>
                        <Text style={fabStyles.sosHeaderText}>SOS</Text>
                      </View>
                      <Text style={fabStyles.sosActiveTitle}>{t('yourSosIsActive') || 'YOUR SOS IS ACTIVE'}</Text>
                      <Text style={fabStyles.sosActiveSub}>{t('sosActiveSub') || 'We are notifying nearby users and keeping you safe.'}</Text>
                    </View>
                    <View style={fabStyles.centerGuruContainerSOS}>
                      <View style={fabStyles.guruImageWrapperSOS}>
                        <Image source={require('../../assets/images/krishna_guru.png')} style={fabStyles.guruImage} />
                      </View>
                    </View>
                    <View style={fabStyles.sosStatusCard}>
                      <View style={fabStyles.sosStatusHeader}>
                        <View style={fabStyles.peopleIconBox}>
                          <Ionicons name="people" size={24} color="#FFF" />
                        </View>
                        <View style={fabStyles.sosStatusTextCol}>
                          <Text style={fabStyles.sosStatusTitle}>{(activeSOS.responders?.length || 0)} {(activeSOS.responders?.length === 1) ? (t('personIs') || 'PERSON IS') : (t('peopleAre') || 'PEOPLE ARE')}</Text>
                          <Text style={fabStyles.sosStatusTitle}>{t('comingToHelpYou') || 'COMING TO HELP YOU'}</Text>
                          <View style={fabStyles.sosVerifiedRow}>
                            <Ionicons name="checkmark-circle" size={12} color="#FFD54F" />
                            <Text style={fabStyles.sosVerifiedText}>{(activeSOS.responders?.length || 0)} {t('respondersConfirmed') || 'responders confirmed nearby'}</Text>
                          </View>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={fabStyles.receivedHelpBtn}
                        onPress={() => handleResolveActiveSOS('resolved')}
                      >
                        <View style={fabStyles.receivedHelpCheck}>
                          <Ionicons name="checkmark" size={18} color="#D32F2F" />
                        </View>
                        <Text style={fabStyles.receivedHelpText}>{t('receivedHelp') || 'I HAVE RECEIVED HELP'}</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={fabStyles.cancelSOSLink} onPress={() => handleResolveActiveSOS('cancelled')}>
                      <Text style={fabStyles.cancelSOSText}>{t('cancelSOS') || 'Cancel SOS'}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <View style={fabStyles.dottedRing} />
"""

if "activeSOS ?" not in content:
    content = content.replace("<View style={fabStyles.dottedRing} />", sos_active_ui)
    
    # Close the fragment
    center_button_end = "</Animated.View>"
    content = content.replace(center_button_end + "\n              </View>", center_button_end + "\n                  </>\n                )\n              }\n              </View>")

# Add styles
styles_to_add = """
  sosActiveView: { width: '100%', height: '100%', alignItems: 'center', padding: 12, backgroundColor: 'rgba(211, 47, 47, 0.95)', borderRadius: 180 },
  sosHeader: { alignItems: 'center', marginTop: 10 },
  sosCircleIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 8 },
  sosHeaderText: { color: '#D32F2F', fontWeight: '900', fontSize: 16 },
  sosActiveTitle: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  sosActiveSub: { color: '#FFCDD2', fontSize: 10, textAlign: 'center', marginTop: 4, lineHeight: 14 },
  centerGuruContainerSOS: { marginTop: 12, alignItems: 'center' },
  guruImageWrapperSOS: { width: 66, height: 66, borderRadius: 33, borderWidth: 3, borderColor: '#FFF', overflow: 'hidden' },
  guruImage: { width: '100%', height: '100%' },
  sosStatusCard: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 12, marginTop: 16, width: '85%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  sosStatusHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  peopleIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  sosStatusTextCol: { flex: 1 },
  sosStatusTitle: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  sosVerifiedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  sosVerifiedText: { color: '#FFD54F', fontSize: 10, marginLeft: 4, fontWeight: '600' },
  receivedHelpBtn: { backgroundColor: '#FFF', borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  receivedHelpCheck: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  receivedHelpText: { color: '#D32F2F', fontSize: 12, fontWeight: '800' },
  cancelSOSLink: { marginTop: 12, padding: 8 },
  cancelSOSText: { color: '#FFCDD2', fontSize: 12, textDecorationLine: 'underline', fontWeight: '600' },
});
"""

content = content.replace("});", styles_to_add)

# Make the outer ring style dynamic based on activeSOS
if "backgroundColor: activeSOS ? '#FFEBEE' : '#FFD5B8'" not in content:
    content = content.replace("backgroundColor: '#FFD5B8',", "backgroundColor: activeSOS ? '#FFEBEE' : '#FFD5B8',")
    content = content.replace("backgroundColor: '#FFEEE7',", "backgroundColor: activeSOS ? '#D32F2F' : '#FFEEE7',")

with open("frontend/src/components/GlobalFAB.tsx", "w") as f:
    f.write(content)


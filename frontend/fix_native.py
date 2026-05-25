import sys, re

with open('src/components/LiveJaapRoom/LiveJaapRoomView.native.tsx', 'r') as f:
    content = f.read()

# Replace return block
return_pattern = re.compile(r'  return \(\n    <View style=\{styles\.container\}>.*?\n    </View>\n  \);\n\}', re.DOTALL)
new_return_block = """  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={['#FFDFAC', '#FFDEAD', '#FFFFFF']} locations={[0, 0.4471, 1]} style={StyleSheet.absoluteFill} />
      <View style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {/* NEW HEADER */}
        <View style={styles.headerNew}>
          <TouchableOpacity onPress={() => {
              if (mantraType === 'kedarnath' || fromHome === 'true') {
                router.replace('/(tabs)/home');
              } else {
                router.replace('/(tabs)/jaap');
              }
            }} style={styles.backBtnNew}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <View style={styles.titleContainerNew}>
            <Text style={styles.titleNew}>{roomTitle || 'Hanuman Chalisa'}</Text>
            <Text style={styles.subtitleNew}>LIVE COLLECTIVE JAAP</Text>
          </View>
          <View style={styles.countPillNew}>
            <Text style={styles.countLabelNew}>Your\\ncount</Text>
            <Text style={styles.countValueNew}>{personalCount}</Text>
          </View>
        </View>

        {!isSessionActive ? (
            <View style={styles.countdownContainer}>
              <View style={styles.countdownGlassCard}>
                <Text style={styles.countdownOmSymbol}>🕉️</Text>
                <Text style={styles.countdownTitle}>Live {roomTitle || 'Mantra'} Chanting</Text>
                <Text style={styles.countdownSubtitle}>Communal Live Jaap is currently offline</Text>
                
                <View style={styles.countdownTimerBox}>
                  <Text style={styles.countdownLabel}>NEXT LIVE SESSION STARTS IN</Text>
                  <Text style={styles.countdownTimerText}>
                    {(() => {
                      const nextStart = (isHanuman && !hanumanStatus.isActive) 
                        ? hanumanStatus.nextSessionStart 
                        : ((!isHanuman && !otherStatus.isActive) ? otherStatus.nextSessionStart : null);
                      if (!nextStart) return '00:00:00';
                      const diffMs = nextStart.getTime() - now.getTime();
                      if (diffMs <= 0) return '00:00:00';
                      const hrs = Math.floor(diffMs / 3600000);
                      const mins = Math.floor((diffMs % 3600000) / 60000);
                      const secs = Math.floor((diffMs % 60000) / 1000);
                      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                    })()}
                  </Text>
                  <Text style={styles.nextSessionNameText}>
                    Session: {(() => {
                      const nextName = (isHanuman && !hanumanStatus.isActive) 
                        ? hanumanStatus.nextSessionName 
                        : ((!isHanuman && !otherStatus.isActive) ? otherStatus.nextSessionName : '');
                      return nextName;
                    })()}
                  </Text>
                </View>

                <View style={styles.personalOfflineStatsBox}>
                  <Ionicons name="person-circle-outline" size={24} color="#FFEBB5" />
                  <Text style={styles.personalOfflineStatsTitle}>Your Completed Chanting Count</Text>
                  <Text style={styles.personalOfflineStatsCount}>{personalCount}</Text>
                </View>

                <View style={styles.scheduleDetailsBox}>
                  <Text style={styles.scheduleTitle}>Daily Live Schedule:</Text>
                  {isHanuman ? (
                    <>
                      <Text style={styles.scheduleItem}>• Morning (13 rounds): 5:30 AM – 9:00 AM</Text>
                      <Text style={styles.scheduleItem}>• Afternoon (13 rounds): 12:00 PM – 3:30 PM</Text>
                      <Text style={styles.scheduleItem}>• Evening (13 rounds): 4:00 PM – 7:30 PM</Text>
                      <Text style={styles.scheduleItem}>• Night (12 rounds): 9:00 PM – 12:15 AM</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.scheduleItem}>• Morning Session: 8:00 AM – 11:00 AM</Text>
                      <Text style={styles.scheduleItem}>• Evening Session: 4:00 PM – 9:00 PM</Text>
                    </>
                  )}
                </View>

                <TouchableOpacity 
                  style={styles.ekantRedirectBtn}
                  onPress={() => router.replace('/ekant-jaap')}
                >
                  <LinearGradient
                    colors={['#FF6B00', '#FF8A00']}
                    style={styles.ekantBtnGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="person" size={18} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.ekantRedirectBtnText}>Chant in Ekant (Solo) Mode</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
        ) : (
            <View style={styles.activeRoomContainerNew}>
              {/* CHANTING WITH YOU PILL */}
              <View style={styles.chantingWithYouContainer}>
                <View style={styles.chantingWithYouPill}>
                  <Text style={styles.chantingLabelNew}>CHANTING WITH YOU  </Text>
                  <Text style={styles.chantingValueNew}>{(remotePeers + 1) * 18} souls </Text>
                  <Ionicons name="cellular" size={14} color="#FF8A00" />
                </View>
              </View>

              {/* MAIN CHANTING LYRICS AREA */}
              <View style={styles.lyricsAreaNew}>
                {isHanuman && hanumanStatus.isActive && hanumanStatus.isBreak ? (
                   <View style={styles.breakMessageContainer}>
                     <Text style={[styles.breakTextMain, { color: '#000' }]}>Have a deep breath.</Text>
                     <Text style={[styles.breakTextSub, { color: '#555' }]}>Next jaap is starting soon...</Text>
                   </View>
                ) : (
                   <View style={styles.lyricsBoxNew}>
                      {/* Current Line */}
                      <View style={styles.currentLineBoxNew}>
                        {lineItems.map((word: string, idx: number) => {
                          const isHighlighted = highlightedIdx === idx;
                          return (
                            <Text key={`${word}-${idx}`} style={[styles.wordNew, isHighlighted && styles.wordHighlightNew]}>
                              {word}{' '}
                            </Text>
                          );
                        })}
                      </View>
                      
                      {/* Next Line */}
                      <View style={styles.nextLineBoxNew}>
                         <Text style={styles.nextLineTextNew}>{nextLineText || ' '}</Text>
                      </View>
                   </View>
                )}
              </View>

              {/* BOTTOM ACTIONS AND METRICS */}
              <View style={styles.bottomAreaNew}>
                {/* Emojis */}
                <View style={styles.reactionRowNew}>
                  <TouchableOpacity style={styles.reactionBtnNew} onPress={() => addReaction('❤️')}>
                     <Text style={styles.reactionEmojiNew}>❤️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.reactionBtnNew} onPress={() => addReaction('🙏')}>
                     <Text style={styles.reactionEmojiNew}>🙏</Text>
                     <View style={styles.reactionBadgeNew}><Text style={styles.reactionBadgeTextNew}>434</Text></View>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.reactionBtnNew} onPress={() => addReaction('ॐ')}>
                     <Text style={styles.reactionEmojiNew}>ॐ</Text>
                  </TouchableOpacity>
                </View>

                {/* Metrics */}
                <View style={styles.metricsRowNew}>
                  <View style={styles.metricItemNew}>
                    <Text style={styles.metricLabelNew}>JAAP</Text>
                    <Text style={styles.metricValueNew}>{isHanuman ? hanumanStatus.roundOfSession : 1}<Text style={styles.metricSlashNew}> / {isHanuman ? hanumanStatus.totalRepsInSession : 21}</Text></Text>
                  </View>
                  <View style={styles.metricItemNew}>
                    <Text style={styles.metricLabelNew}>REMAINING</Text>
                    <Text style={styles.metricValueNew}>{(() => {
                        const nextEnd = isHanuman ? hanumanStatus.sessionEnd : otherStatus.sessionEnd;
                        if (!nextEnd) return '0h 0m';
                        const diffMs = nextEnd.getTime() - now.getTime();
                        if (diffMs <= 0) return '0h 0m';
                        const hrs = Math.floor(diffMs / 3600000);
                        const mins = Math.floor((diffMs % 3600000) / 60000);
                        return `${hrs}h ${mins}m`;
                      })()} <Text style={styles.metricSlashNew}>remaining</Text></Text>
                  </View>
                  <View style={styles.metricItemNew}>
                    <Text style={styles.metricLabelNew}>LINE</Text>
                    <Text style={styles.metricValueNew}>{isHanuman ? Math.floor((audioStatus?.currentTime || 0)/15) + 1 : currentIndex + 1}<Text style={styles.metricSlashNew}> / {isHanuman ? 46 : Math.ceil(WORDS.length / 4)}</Text></Text>
                  </View>
                </View>

                {/* Controls Bar */}
                <View style={styles.controlsBarNew}>
                  <TouchableOpacity onPress={toggleMic} style={styles.controlIconBtnNew}>
                    <Ionicons name={isMicEnabled ? "mic" : "mic-off"} size={24} color={isMicEnabled ? "#FF8A00" : "#000"} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setIsMuted(!isMuted)} style={styles.volumeMuteBtnNew}>
                    <Ionicons name={isMuted ? "volume-mute" : "volume-medium"} size={26} color="#FFF" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.controlIconBtnNew}>
                    <Ionicons name="share-social-outline" size={24} color="#000" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
        )}
      </View>

      <View style={styles.reactionOverlay} pointerEvents="none">
        {reactions.map(r => (
          <Animated.Text key={r.id} style={[styles.floatingEmoji, {
             opacity: r.anim.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 1, 1, 0] }),
             transform: [
               { translateY: r.anim.interpolate({ inputRange: [0, 1], outputRange: [0, -300] }) },
               { translateX: r.anim.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, 15, -15, 10, 0] }) },
               { scale: r.anim.interpolate({ inputRange: [0, 0.2], outputRange: [0.6, 1.2], extrapolate: 'clamp' }) }
             ]
          }]}>{r.emoji}</Animated.Text>
        ))}
      </View>
    </View>
  );
}"""

content = return_pattern.sub(new_return_block, content)

# Append styles properly
styles_append = """
  headerNew: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, zIndex: 10 },
  backBtnNew: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.4)', justifyContent: 'center', alignItems: 'center' },
  titleContainerNew: { flex: 1, alignItems: 'center' },
  titleNew: { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
  subtitleNew: { fontSize: 10, fontWeight: '700', color: '#D45D00', letterSpacing: 1.5, marginTop: 2 },
  countPillNew: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center', gap: 6 },
  countLabelNew: { fontSize: 9, fontWeight: '700', color: '#555', textAlign: 'right', lineHeight: 10 },
  countValueNew: { fontSize: 18, fontWeight: '800', color: '#000' },
  
  activeRoomContainerNew: { flex: 1, justifyContent: 'space-between' },
  chantingWithYouContainer: { alignItems: 'center', marginTop: 25 },
  chantingWithYouPill: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, alignItems: 'center' },
  chantingLabelNew: { fontSize: 11, fontWeight: '700', color: '#555', letterSpacing: 0.5 },
  chantingValueNew: { fontSize: 13, fontWeight: '800', color: '#1A1A1A' },

  lyricsAreaNew: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  lyricsBoxNew: { alignItems: 'center', width: '100%' },
  currentLineBoxNew: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 30 },
  wordNew: { fontSize: 30, fontWeight: '400', color: '#44403C', textAlign: 'center', lineHeight: 48, fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif' },
  wordHighlightNew: { color: '#FF7300', fontWeight: '800' },
  nextLineBoxNew: { alignItems: 'center', paddingHorizontal: 10 },
  nextLineTextNew: { fontSize: 18, fontWeight: '500', color: 'rgba(0,0,0,0.4)', textAlign: 'center', lineHeight: 28 },

  bottomAreaNew: { paddingBottom: Platform.OS === 'ios' ? 10 : 20, paddingHorizontal: 20 },
  reactionRowNew: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 25 },
  reactionBtnNew: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
  reactionEmojiNew: { fontSize: 24 },
  reactionBadgeNew: { position: 'absolute', top: -4, right: -10, backgroundColor: '#FF453A', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  reactionBadgeTextNew: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  
  metricsRowNew: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, marginBottom: 25 },
  metricItemNew: { alignItems: 'center' },
  metricLabelNew: { fontSize: 10, fontWeight: '800', color: 'rgba(0,0,0,0.5)', letterSpacing: 1, marginBottom: 4 },
  metricValueNew: { fontSize: 16, fontWeight: '800', color: '#000' },
  metricSlashNew: { fontSize: 12, fontWeight: '700', color: 'rgba(0,0,0,0.5)' },

  controlsBarNew: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 40, padding: 10, justifyContent: 'space-around', alignItems: 'center' },
  controlIconBtnNew: { padding: 10 },
  volumeMuteBtnNew: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FF8A00', justifyContent: 'center', alignItems: 'center', shadowColor: '#FF8A00', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
"""
content = re.sub(r'(\}\);\n?)$', styles_append + r'\1', content)

with open('src/components/LiveJaapRoom/LiveJaapRoomView.native.tsx', 'w') as f:
    f.write(content)

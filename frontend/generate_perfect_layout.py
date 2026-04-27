import re

with open('app/passport/index.tsx', 'r') as f:
    content = f.read()

placeholder_regex = r'<View style=\{styles\.passportShadowContainer\}>.*?</View>'

new_body = """<View style={styles.passportShadowContainer}>
        {/* INNER PASSPORT PAGE (LEFT/RIGHT DETAILS) */}
        <View style={styles.innerPage}>
          <View style={styles.innerHeader}>
            <Text style={styles.innerCountryName}>SANATAN LOK</Text>
            <Text style={styles.innerPassportText}>PASSPORT / यात्रा</Text>
          </View>
          
          <View style={styles.innerContentColumn}>
             <View style={styles.detailsPanel}>
                <View style={styles.photoContainer}>
                  {user?.photoURL ? (
                    <Image source={{ uri: user.photoURL }} style={styles.innerPhoto} />
                  ) : null}
                </View>

                <View style={styles.detailsContainer}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>SL No / Sl No.</Text>
                    <Text style={styles.detailValue}>{user?.uid?.substring(0,8).toUpperCase() || 'BRAHM-01'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Name / Nom</Text>
                    <Text style={styles.detailValue}>{user?.displayName || 'Sanatan Pilgrim'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Gotra / Lineage</Text>
                    <Text style={styles.detailValue}>Kashyapa</Text>
                  </View>
                </View>
             </View>
          </View>
          <View style={styles.mrzContainer}>
            <Text style={styles.mrzText} numberOfLines={2}>
              P&lt;SL&lt;&lt;{mrzName}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;{"\\n"}
              {user?.uid?.substring(0,8).toUpperCase() || 'BRAHM01'}&lt;2IND8504126M331110&lt;&lt;&lt;&lt;&lt;02
            </Text>
          </View>
        </View>

        {/* ANIMATED TIMELINE / NEXT PAGE OVERLAY */}
        <Animated.View style={[styles.nextPage, { 
             position: 'absolute', top: 0, left: 0, bottom: 0, width: '100%',
             transform: [
               { perspective: 1200 },
               { rotateY: pageTurnAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-150deg'] }) }
             ],
             opacity: flipAnim.interpolate({ inputRange: [0.8, 1], outputRange: [0, 1] }),
             pointerEvents: showTimelinePage ? 'auto' : 'none',
             zIndex: showTimelinePage ? 20 : 5,
             backgroundColor: '#fdfbf7', // passport paper color
             borderTopRightRadius: 8,
             borderBottomRightRadius: 8,
          }]}>
             <ScrollView style={[styles.nextPageContent, { transform: [{ scaleX: -1 }] }]}>
                <Text style={styles.nextPageTitle}>{journeys.length > 0 ? 'My Stamped Journeys' : 'Blank Pages'}</Text>
                
                {journeys.length === 0 ? (
                  <Text style={styles.timelineEmpty}>Your passport awaits its first stamp. Begin a new Journey!</Text>
                ) : (
                  journeys.map((j, i) => (
                    <View key={j.id || i} style={styles.timelineCard}>
                       <View style={{ flex: 1 }}>
                         <Text style={styles.timelineCardTitle} numberOfLines={1}>{j.temple_name || j.title}</Text>
                         <Text style={styles.timelineCardMeta}>{new Date(j.created_at || Date.now()).toLocaleDateString()}</Text>
                       </View>
                       <Ionicons name="shield-checkmark" size={24} color="#16a34a" />
                    </View>
                  ))
                )}
             </ScrollView>
        </Animated.View>

        {/* COVER PIVOT */}
        <Animated.View style={[styles.coverPivotWrapper, { transform: [{ perspective: 1200 }, { rotateY: coverRotate }] }]} pointerEvents={showTimelinePage ? "none" : "auto"}>
          <View style={styles.frontCover}>
            <View style={{ width: '100%', height: '100%', backgroundColor: '#0f172a' }}>
              <View style={styles.coverBorder}>
                 <Animated.View style={[{ alignItems: 'center', marginTop: 40 }, { opacity: coverTextOpacity, transform: [{ scale: textPulseScale }] }]}>
                    <Text style={styles.coverTitle}>SANATAN{"\\n"}LOK</Text>
                    <Text style={styles.passportText}>PASSPORT</Text>
                 </Animated.View>
              </View>
            </View>
          </View>
        </Animated.View>

        </View>"""

content = re.sub(placeholder_regex, new_body, content, flags=re.DOTALL)

with open('app/passport/index.tsx', 'w') as f:
    f.write(content)

print("Restored layout!")
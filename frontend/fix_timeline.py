import re

with open('app/passport/index.tsx', 'r') as f:
    content = f.read()

placeholder_regex = r'<View style=\{styles\.passportShadowContainer\}>\s*<Text style=\{\{\s*color:\s*[\'"]white[\'"]\s*\}\}>BOOK BODY PLACEHOLDER</Text>\s*</View>'

new_body = """<View style={styles.passportShadowContainer}>
          {/* Cover & Back Cover (same as original rotation) */}
          <Animated.View style={[styles.passportCover, styles.passportBackCover, { transform: [{ rotateY: backCoverRotate }] }]} pointerEvents="none" />
          
          <Animated.View style={[styles.passportInnerPages, { transform: [{ rotateY: backCoverRotate }, { translateX: -0.5 }] }]}>
            <View style={styles.pageInner}>
              <View style={styles.topProfileSection}>
                <View style={styles.photoContainer}>
                  {user?.photoURL ? (
                    <Image source={{ uri: user.photoURL }} style={styles.userPhoto} />
                  ) : (
                    <View style={styles.photoPlaceholder} />
                  )}
                </View>
                <View style={styles.identityTextContainer}>
                  <Text style={styles.subtext}>SL No / Sl No.</Text>
                  <Text style={styles.passportNumber}>{user?.uid?.substring(0,8).toUpperCase() || 'BRAHM-01'}</Text>
                  <Text style={styles.subtext}>Name / Nom</Text>
                  <Text style={styles.infoText}>{user?.displayName || 'Sanatan Pilgrim'}</Text>
                  <Text style={styles.subtext}>Gotra / Lineage</Text>
                  <Text style={styles.infoText}>Kashyapa</Text>
                </View>
              </View>
              <View style={styles.bottomSection}>
                <Text style={styles.subtext}>Date of Issue / Date de délivrance</Text>
                <Text style={styles.infoText}>12 / 04 / 2024</Text>
                <Text style={styles.mrzText} numberOfLines={2}>
                  P&lt;SL&lt;&lt;{mrzName || 'SANATAN'}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* FRONT COVER */}
          <Animated.View style={[styles.passportCover, { transform: [{ rotateY: coverRotate }]}, { zIndex: 10 }]} pointerEvents={showTimelinePage ? "none" : "auto"}>
             <View style={styles.coverTexture}>
              <Animated.View style={[{ alignItems: 'center'}, { opacity: coverTextOpacity, transform: [{ scale: textPulseScale }] }]}>
                <Text style={[styles.countryTitle]}>SANATAN{'\n'}LOK</Text>
                <Text style={styles.passportText}>PASSPORT</Text>
              </Animated.View>
             </View>
          </Animated.View>

          {/* ANIMATED TIMELINE OVERLAY */}
          <Animated.View 
            style={[
              styles.timelinePage, 
              { 
                transform: [
                  { perspective: 1000 },
                  { rotateY: pageTurnAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-150deg'] }) }
                ],
                opacity: flipAnim.interpolate({ inputRange: [0.8, 1], outputRange: [0, 1] }),
                pointerEvents: showTimelinePage ? 'auto' : 'none',
                zIndex: showTimelinePage ? 20 : 5
              }
            ]}
          >
             <ScrollView style={[styles.pageInner, { backgroundColor: '#fef9c3', transform: [{ scaleX: -1 }] }]} contentContainerStyle={{ padding: 15 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#854d0e', marginBottom: 10, textAlign: 'center' }}>My Memory Stamps</Text>
                {journeys.length === 0 ? (
                   <Text style={{ textAlign: 'center', color: '#a16207', marginTop: 20 }}>No stamps yet. Begin your Yatra!</Text>
                ) : (
                   journeys.map((j, i) => (
                     <View key={j.id || i} style={styles.stampItem}>
                       <View style={{ marginLeft: 8, flex: 1 }}>
                         <Text style={styles.stampTitle} numberOfLines={1}>{j.temple_name || j.title}</Text>
                         <Text style={styles.stampDate}>{new Date(j.created_at || Date.now()).toLocaleDateString()}</Text>
                       </View>
                     </View>
                   ))
                )}
             </ScrollView>
          </Animated.View>
        </View>"""


# remove the broken placeholder and replace
content = re.sub(placeholder_regex, new_body, content)

with open('app/passport/index.tsx', 'w') as f:
    f.write(content)

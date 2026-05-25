import sys, re

with open('src/components/LiveJaapRoom/LiveJaapRoomView.native.tsx', 'r') as f:
    content = f.read()

# Replace return block start
content = content.replace(
    "<View style={styles.container}>\n      <StatusBar barStyle=\"dark-content\" />\n      <LinearGradient colors={['#FFDFAC', '#FFDEAD', '#FFFFFF']} locations={[0, 0.4471, 1]} style={StyleSheet.absoluteFill} />",
    "<LinearGradient colors={['#FFDFAC', '#FFDEAD', '#FFFFFF']} locations={[0, 0.4471, 1]} style={styles.container}>\n      <StatusBar barStyle=\"dark-content\" />"
)
content = content.replace(
    "</View>\n  );\n}",
    "</LinearGradient>\n  );\n}"
)

# Remove backgroundColor from container
content = content.replace("container: { flex: 1, backgroundColor: '#050505' },", "container: { flex: 1 },")

with open('src/components/LiveJaapRoom/LiveJaapRoomView.native.tsx', 'w') as f:
    f.write(content)

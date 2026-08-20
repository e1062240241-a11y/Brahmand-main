# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt

# Keep standard annotations, reflections, and attributes
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod,SourceFile,LineNumberTable
-keepclassmembers,allowobfuscation interface * {
    @com.facebook.proguard.annotations.DoNotStrip <methods>;
}

# ----------------------------------------------------
# React Native & Hermes
# ----------------------------------------------------
-keep class com.facebook.react.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.hermes.unicode.** { *; }
-dontwarn com.facebook.react.**

# ----------------------------------------------------
# React Native Reanimated & Gesture Handler & Screens
# ----------------------------------------------------
-keep class com.swmansion.reanimated.** { *; }
-keep class com.swmansion.gesturehandler.** { *; }
-keep class com.swmansion.rnscreens.** { *; }
-keep class com.swmansion.common.** { *; }
-dontwarn com.swmansion.**

# ----------------------------------------------------
# Expo Modules (Audio, Video, Notifications, Location, Speech, etc.)
# ----------------------------------------------------
-keep class expo.modules.** { *; }
-keepclassmembers class * extends expo.modules.kotlin.modules.Module { *; }
-keepclassmembers class * extends expo.modules.kotlin.views.ViewManager { *; }
-dontwarn expo.modules.**

# ----------------------------------------------------
# Agora RTC (Live Voice / Mantra Rooms)
# ----------------------------------------------------
-keep class io.agora.** { *; }
-keepclassmembers class io.agora.** { *; }
-dontwarn io.agora.**

# ----------------------------------------------------
# Firebase (Auth, Core, Messaging)
# ----------------------------------------------------
-keep class io.invertase.firebase.** { *; }
-keep class com.google.firebase.** { *; }
-dontwarn io.invertase.firebase.**
-dontwarn com.google.firebase.**

# ----------------------------------------------------
# Google Maps & Google Places
# ----------------------------------------------------
-keep class com.google.android.gms.maps.** { *; }
-keep class com.google.android.libraries.places.** { *; }
-keep class com.airbnb.android.react.maps.** { *; }
-dontwarn com.google.android.gms.**
-dontwarn com.airbnb.android.react.maps.**

# ----------------------------------------------------
# ViewShot & SVG & WebView & Picker & FlashList
# ----------------------------------------------------
-keep class fr.greweb.reactnativeviewshot.** { *; }
-keep class com.horcrux.svg.** { *; }
-keep class com.reactnativecommunity.webview.** { *; }
-keep class com.reactnativecommunity.picker.** { *; }
-keep class com.shopify.reactnative.flash_list.** { *; }
-dontwarn fr.greweb.reactnativeviewshot.**
-dontwarn com.horcrux.svg.**
-dontwarn com.shopify.reactnative.flash_list.**

# ----------------------------------------------------
# Networking, WebSockets & Security (OkHttp, Socket.io)
# ----------------------------------------------------
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**
-dontwarn javax.net.ssl.**
-keep class io.socket.** { *; }
-dontwarn io.socket.**

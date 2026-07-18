import React, { useMemo, useState, useEffect, useRef } from "react";
// Touch file to force Metro bundler rebuild after correcting JSX tags
import {ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
  Animated,
  SafeAreaView,
  KeyboardAvoidingView,
  PanResponder,
  Image as RNImage} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS, SPACING } from "../constants/theme";
import { uploadUserPost, getAllUsers } from "../services/api";
import { MentionInput } from "./MentionInput";
import { getFilterStyle, getOverlayStyle } from "../utils/filters";
import { useTranslation } from "../utils/i18n";
import { useUploadStore } from "../store/uploadStore";
import { KeyboardAwareScrollView } from './KeyboardAwareScrollView';

let ExpoVideoModule: any = null;
try {
  ExpoVideoModule = require("expo-video");
} catch (error) {
  console.warn("expo-video unavailable:", error);
}

const useSafeVideoPlayer = (
  source: string | null,
  setup: (player: any) => void,
) => {
  if (!ExpoVideoModule?.useVideoPlayer) return null;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return ExpoVideoModule.useVideoPlayer(source, setup);
};

const UploadVideoPreview = React.memo(({
  uri,
  style,
  selectedFilter,
}: {
  uri: string;
  style: any;
  selectedFilter: any;
}) => {
  const player = useSafeVideoPlayer(uri, (p) => {
    if (p) {
      p.loop = true;
      p.muted = false;
    }
  });

  useEffect(() => {
    if (player) {
      try {
        player.play();
      } catch (e) {
        console.warn('[UploadVideoPreview] play failed:', e);
      }
    }
  }, [player]);



  if (!ExpoVideoModule?.VideoView || !player) {
    return <View style={{ width: '100%', height: '100%', backgroundColor: '#000' }} />;
  }

  return (
    <ExpoVideoModule.VideoView
      player={player}
      style={style}
      contentFit="cover"
      nativeControls={false}
      playsInline
    />
  );
});
UploadVideoPreview.displayName = 'UploadVideoPreview';

let UploadDocumentPicker: any = null;
const getUploadDocumentPicker = async () => {
  if (!UploadDocumentPicker) {
    UploadDocumentPicker = await import("expo-document-picker");
  }
  return UploadDocumentPicker;
};

type SelectedMedia = {
  uri: string;
  name: string;
  mimeType: string;
  mediaType: "image" | "video";
  width?: number;
  height?: number;
};

type UploadPostModalProps = {
  visible: boolean;
  onClose: () => void;
  onUploadSuccess: (post: any) => void;
  onUploadStart?: (
    media: SelectedMedia,
    caption: string,
    filterName?: string,
    communityLevel?: string,
    category?: string,
    mediaWidth?: number,
    mediaHeight?: number,
    cropOffsetX?: number,
    cropOffsetY?: number,
    originalWidth?: number,
    originalHeight?: number,
  ) => void;
};

const ACCEPTED_MEDIA_TYPES = ["image/*", "video/*"];
const ACCEPTED_VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-matroska",
];
const FILTERS = ["Normal", "Vivid", "Warm", "Cool"];

const buildFileName = (uri: string, mediaType: "image" | "video") => {
  const fromUri = uri.split("/").pop();
  if (fromUri && fromUri.includes(".")) {
    return fromUri;
  }
  const ext = mediaType === "video" ? "mp4" : "jpg";
  return `post-${Date.now()}.${ext}`;
};

const detectMediaType = (mimeType?: string) => {
  if ((mimeType || "").startsWith("video/")) {
    return "video" as const;
  }
  return "image" as const;
};

// Material 3 Styled Input Component
const M3OutlinedInput = ({
  label,
  value,
  onChangeText,
  multiline = false,
  placeholder = "",
}: any) => {
  const [isFocused, setIsFocused] = useState(false);
  const [mentionResults, setMentionResults] = useState<any[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const searchTimeout = useRef<any>(null);

  const handleChangeText = (text: string) => {
    onChangeText(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    const cursorPos = text.length;
    const atIndex = text.lastIndexOf("@", cursorPos);
    if (atIndex === -1) {
      setShowMentions(false);
      return;
    }
    const query = text.slice(atIndex + 1, cursorPos);
    if (!query || /\s/.test(query)) {
      setShowMentions(false);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await getAllUsers(query, 10);
        const users = Array.isArray(res.data)
          ? res.data
          : res.data?.items || [];
        setMentionResults(users.slice(0, 10));
        setShowMentions(users.length > 0);
      } catch {
        setShowMentions(false);
      }
    }, 300);
  };

  const handleSelectMention = (user: any) => {
    const cursorPos = value.length;
    const atIndex = value.lastIndexOf("@", cursorPos);
    if (atIndex === -1) return;
    const mentionText = user.sl_id || user.phone || user.name || "user";
    const newText =
      value.slice(0, atIndex) + `@${mentionText} ` + value.slice(cursorPos);
    onChangeText(newText);
    setShowMentions(false);
  };

  return (
    <View style={styles.inputContainer}>
      {isFocused || value ? (
        <Text
          style={[
            styles.inputLabelFloating,
            { color: isFocused ? COLORS.primary : COLORS.textSecondary },
          ]}
        >
          {label}
        </Text>
      ) : null}
      {showMentions && mentionResults.length > 0 && (
        <View style={styles.mentionDropdown}>
          {mentionResults.map((user: any) => (
            <TouchableOpacity
              key={user.id}
              style={styles.mentionItem}
              onPress={() => handleSelectMention(user)}
            >
              <Text style={styles.mentionName}>{user.name || "Unknown"}</Text>
              <Text style={styles.mentionSL}>
                @{user.sl_id || user.phone || ""}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <TextInput
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          isFocused && styles.inputFocused,
        ]}
        value={value}
        onChangeText={handleChangeText}
        placeholder={isFocused ? placeholder : label}
        placeholderTextColor={COLORS.textSecondary}
        multiline={multiline}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </View>
  );
};

export const UploadPostModal = ({
  visible,
  onClose,
  onUploadSuccess,
  onUploadStart,
}: UploadPostModalProps) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia | null>(
    null,
  );
  const [caption, setCaption] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("Normal");
  const [communityLevel, setCommunityLevel] = useState("city");
  const [category, setCategory] = useState("feed");

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [mutedAudio, setMutedAudio] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: uploadProgress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [uploadProgress]);

  const getClosestAspectRatio = (
    width: number,
    height: number,
  ): "1:1" | "4:5" | "1.91:1" | "9:16" => {
    const ratio = width / height;
    const options = [
      { mode: "9:16" as const, value: 9 / 16 },
      { mode: "4:5" as const, value: 4 / 5 },
      { mode: "1:1" as const, value: 1.0 },
      { mode: "1.91:1" as const, value: 1.91 },
    ];
    let closest = options[0];
    let minDiff = Math.abs(ratio - closest.value);
    for (let i = 1; i < options.length; i++) {
      const diff = Math.abs(ratio - options[i].value);
      if (diff < minDiff) {
        minDiff = diff;
        closest = options[i];
      }
    }
    return closest.mode;
  };

  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;
  const availableWidth = screenWidth - SPACING.lg * 2;
  const [dynamicRatio, setDynamicRatio] = useState<number>(4 / 5);
  const [aspectRatioMode, setAspectRatioMode] = useState<
    "1:1" | "4:5" | "1.91:1" | "9:16"
  >("4:5");

  // Video player is now fully encapsulated within UploadVideoPreview component to manage lifecycle safely.

  useEffect(() => {
    if (selectedMedia?.width && selectedMedia?.height) {
      setDynamicRatio(selectedMedia.width / selectedMedia.height);
      const closestMode = getClosestAspectRatio(
        selectedMedia.width,
        selectedMedia.height,
      );
      setAspectRatioMode(closestMode);
    } else {
      setDynamicRatio(4 / 5);
      setAspectRatioMode("4:5");
    }
  }, [selectedMedia]);

  const getSelectedRatio = () => {
    switch (aspectRatioMode) {
      case "1:1":
        return 1.0;
      case "4:5":
        return 4 / 5;
      case "1.91:1":
        return 1.91;
      case "9:16":
        return 9 / 16;
      default:
        return 4 / 5;
    }
  };

  const [offsetXPercent, setOffsetXPercent] = useState<number>(0.5);
  const [offsetYPercent, setOffsetYPercent] = useState<number>(0.5);
  const [scrollEnabled, setScrollEnabled] = useState<boolean>(true);

  const dragX = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const gridOpacity = useRef(new Animated.Value(0)).current;

  const currentDragX = useRef(0);
  const currentDragY = useRef(0);

  useEffect(() => {
    const idX = dragX.addListener(({ value }) => {
      currentDragX.current = value;
    });
    const idY = dragY.addListener(({ value }) => {
      currentDragY.current = value;
    });
    return () => {
      dragX.removeListener(idX);
      dragY.removeListener(idY);
    };
  }, [dragX, dragY]);

  const offsetXPercentRef = useRef(0.5);
  const offsetYPercentRef = useRef(0.5);

  const displayRatio = getSelectedRatio();
  const maxPreviewHeight = screenHeight * 0.55;

  let previewWidth = availableWidth;
  let previewHeight = availableWidth / displayRatio;

  if (previewHeight > maxPreviewHeight) {
    previewHeight = maxPreviewHeight;
    previewWidth = maxPreviewHeight * displayRatio;
  }

  const imgWidth =
    displayRatio < dynamicRatio ? previewHeight * dynamicRatio : previewWidth;
  const imgHeight =
    displayRatio > dynamicRatio ? previewWidth / dynamicRatio : previewHeight;

  const aspectRatioModeRef = useRef(aspectRatioMode);
  const imgWidthRef = useRef(imgWidth);
  const imgHeightRef = useRef(imgHeight);
  const previewHeightRef = useRef(previewHeight);
  const previewWidthRef = useRef(previewWidth);

  useEffect(() => {
    aspectRatioModeRef.current = aspectRatioMode;
    imgWidthRef.current = imgWidth;
    imgHeightRef.current = imgHeight;
    previewHeightRef.current = previewHeight;
    previewWidthRef.current = previewWidth;
  }, [aspectRatioMode, imgWidth, imgHeight, previewHeight, previewWidth]);

  useEffect(() => {
    offsetXPercentRef.current = 0.5;
    offsetYPercentRef.current = 0.5;
    setOffsetXPercent(0.5);
    setOffsetYPercent(0.5);

    const initialX =
      imgWidth > previewWidth ? -0.5 * (imgWidth - previewWidth) : 0;
    const initialY =
      imgHeight > previewHeight ? -0.5 * (imgHeight - previewHeight) : 0;

    dragX.setValue(initialX);
    dragY.setValue(initialY);
  }, [
    aspectRatioMode,
    selectedMedia,
    displayRatio,
    imgWidth,
    imgHeight,
    previewWidth,
    previewHeight,
  ]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        const currentW = imgWidthRef.current;
        const currentH = imgHeightRef.current;
        const currentPrevW = previewWidthRef.current;
        const currentPrevH = previewHeightRef.current;
        const canDrag = currentW > currentPrevW || currentH > currentPrevH;
        return (
          canDrag &&
          (Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3)
        );
      },
      onPanResponderGrant: () => {
        setScrollEnabled(false);
        Animated.timing(gridOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderMove: (evt, gestureState) => {
        const currentW = imgWidthRef.current;
        const currentH = imgHeightRef.current;
        const currentPrevW = previewWidthRef.current;
        const currentPrevH = previewHeightRef.current;

        if (currentW > currentPrevW) {
          const maxDragX = currentW - currentPrevW;
          const startX = -offsetXPercentRef.current * maxDragX;
          const newX = Math.max(
            -maxDragX,
            Math.min(0, startX + gestureState.dx),
          );
          dragX.setValue(newX);
        } else if (currentH > currentPrevH) {
          const maxDragY = currentH - currentPrevH;
          const startY = -offsetYPercentRef.current * maxDragY;
          const newY = Math.max(
            -maxDragY,
            Math.min(0, startY + gestureState.dy),
          );
          dragY.setValue(newY);
        }
      },
      onPanResponderRelease: () => {
        setScrollEnabled(true);
        Animated.timing(gridOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();

        const currentW = imgWidthRef.current;
        const currentH = imgHeightRef.current;
        const currentAvailW = previewWidthRef.current;
        const currentPrevH = previewHeightRef.current;

        if (currentW > currentAvailW) {
          const maxDragX = currentW - currentAvailW;
          offsetXPercentRef.current = -currentDragX.current / maxDragX;
          setOffsetXPercent(offsetXPercentRef.current);
        } else if (currentH > currentPrevH) {
          const maxDragY = currentH - currentPrevH;
          offsetYPercentRef.current = -currentDragY.current / maxDragY;
          setOffsetYPercent(offsetYPercentRef.current);
        }
      },
      onPanResponderTerminate: () => {
        setScrollEnabled(true);
        Animated.timing(gridOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      },
    }),
  ).current;

  const isCroppedHorizontally = imgWidth > previewWidth;
  const isCroppedVertically = imgHeight > previewHeight;

  let tooltipText = "Drag to adjust fit";
  if (isCroppedHorizontally) {
    tooltipText = "← Drag left / right to adjust fit →";
  } else if (isCroppedVertically) {
    tooltipText = "↑ Drag up / down to adjust fit ↓";
  }

  const canUpload = useMemo(() => {
    if (!selectedMedia || uploading) return false;
    return true;
  }, [selectedMedia, uploading]);

  const resetAndClose = () => {
    setSelectedMedia(null);
    setCaption("");
    setSelectedFilter("Normal");
    setUploading(false);
    setUploadProgress(0);
    setIsCompressing(false);
    setMutedAudio(false);
    setAspectRatioMode("4:5");
    setOffsetXPercent(0.5);
    setOffsetYPercent(0.5);
    setScrollEnabled(true);
    onClose();
  };

  const handleSaveDraft = () => {
    alert("Draft Saved.");
    resetAndClose();
  };

  const captureFromCamera = async () => {
    if (Platform.OS === "web") {
      alert(
        "Direct camera capture is not supported in web build. Please use mobile app for camera capture.",
      );
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") return alert("Camera permission is required.");
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images", "videos"] as any,
      allowsEditing: false,
      quality: 0.9,
      videoMaxDuration: 60,
    });
    if (result.canceled || !result.assets?.length) return;
    handleAssetSelected(result.assets[0]);
  };

  const selectFromPhotoGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted")
      return alert("Photo library permission is required.");
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"] as any,
      allowsEditing: false,
      quality: 0.9,
      videoMaxDuration: 60,
    });
    if (result.canceled || !result.assets?.length) return;
    handleAssetSelected(result.assets[0]);
  };

  const selectFromFiles = async () => {
    const DocumentPicker = await getUploadDocumentPicker();
    const result = await DocumentPicker.getDocumentAsync({
      type: ACCEPTED_MEDIA_TYPES,
      multiple: false,
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.length) return;
    const file = result.assets[0];
    let mimeType = file.mimeType || "application/octet-stream";
    if (mimeType === "application/octet-stream" && file.name) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "mp4") mimeType = "video/mp4";
      else if (ext === "mov") mimeType = "video/quicktime";
      else if (ext === "png") mimeType = "image/png";
      else if (ext === "jpg" || ext === "jpeg") mimeType = "image/jpeg";
      else if (ext === "webp") mimeType = "image/webp";
    }
    if (
      !mimeType.startsWith("image/") &&
      !ACCEPTED_VIDEO_MIME_TYPES.includes(mimeType)
    ) {
      return alert("Only image files and mp4/mov videos are supported.");
    }
    const mediaType = detectMediaType(mimeType);
    if (mediaType === "image") {
      RNImage.getSize(
        file.uri,
        (width, height) => {
          setSelectedMedia({
            uri: file.uri,
            mimeType,
            mediaType,
            name: file.name || buildFileName(file.uri, mediaType),
            width,
            height,
          });
        },
        () => {
          setSelectedMedia({
            uri: file.uri,
            mimeType,
            mediaType,
            name: file.name || buildFileName(file.uri, mediaType),
          });
        },
      );
    } else {
      setSelectedMedia({
        uri: file.uri,
        mimeType,
        mediaType,
        name: file.name || buildFileName(file.uri, mediaType),
      });
    }
  };

  const handleAssetSelected = (asset: any) => {
    const mimeType =
      asset.mimeType || (asset.type === "video" ? "video/mp4" : "image/jpeg");
    const mediaType = asset.type === "video" ? "video" : "image";
    if (mediaType === "image" && !mimeType.startsWith("image/"))
      return alert("Only image files are supported for photos.");
    if (mediaType === "video" && !ACCEPTED_VIDEO_MIME_TYPES.includes(mimeType))
      return alert("Only mp4 and mov videos are supported.");

    if (mediaType === "video") {
      if (asset.duration && asset.duration > 60000) {
        // 60 seconds (duration is usually in ms here for ImagePicker)
        const toast = require("../store/toastStore").toast;
        toast.error("Video size above limit. Maximum duration is 60 seconds.");
        return;
      }
      if (asset.fileSize && asset.fileSize > 1024 * 1024 * 1024) {
        // 1GB
        const toast = require("../store/toastStore").toast;
        toast.error("Video size above limit. Maximum file size is 1GB.");
        return;
      }
    }

    setSelectedMedia({
      uri: asset.uri,
      mimeType,
      mediaType,
      name: asset.fileName || buildFileName(asset.uri, mediaType),
      width: asset.width,
      height: asset.height,
    });
  };

  const handleUpload = async () => {
    if (!selectedMedia) return;

    let mediaWidth: number | undefined;
    let mediaHeight: number | undefined;

    switch (aspectRatioMode) {
      case "1:1":
        mediaWidth = 1080;
        mediaHeight = 1080;
        break;
      case "4:5":
        mediaWidth = 1080;
        mediaHeight = 1350;
        break;
      case "1.91:1":
        mediaWidth = 1080;
        mediaHeight = 566;
        break;
      case "9:16":
        mediaWidth = 1080;
        mediaHeight = 1920;
        break;
      default:
        mediaWidth = 1080;
        mediaHeight = 1350;
        break;
    }

    const uploadCategory = aspectRatioMode === "9:16" ? "reels" : category;

    if (onUploadStart) {
      onUploadStart(
        selectedMedia,
        caption,
        selectedFilter,
        communityLevel,
        uploadCategory,
        mediaWidth,
        mediaHeight,
        offsetXPercent,
        offsetYPercent,
        selectedMedia.width,
        selectedMedia.height,
      );
      resetAndClose();
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    setIsCompressing(false);

    try {
      const fullCaption = caption;

      const response = await uploadUserPost(
        {
          uri: selectedMedia.uri,
          type: selectedMedia.mimeType,
          name: selectedMedia.name,
        },
        fullCaption,
        selectedFilter,
        (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            setUploadProgress(percent);
            if (percent >= 100 && selectedMedia.mediaType === "video")
              setIsCompressing(true);
          }
        },
        communityLevel,
        uploadCategory,
        mediaWidth,
        mediaHeight,
        offsetXPercent,
        offsetYPercent,
        selectedMedia.width,
        selectedMedia.height,
        mutedAudio,
      );
      const uploadedPost = response.data;
      const normalizedPost = uploadedPost ? {
        ...uploadedPost,
        mediaUrl: uploadedPost.mediaUrl || uploadedPost.media_url,
        media_url: uploadedPost.media_url || uploadedPost.mediaUrl,
        mediaType: uploadedPost.mediaType || uploadedPost.media_type || (selectedMedia.mediaType === "video" ? "video" : "image"),
        media_type: uploadedPost.media_type || uploadedPost.mediaType || (selectedMedia.mediaType === "video" ? "video" : "image"),
        thumbnailUrl: uploadedPost.thumbnailUrl || uploadedPost.thumbnail_url || uploadedPost.metadata?.thumbnail_url,
        thumbnail_url: uploadedPost.thumbnail_url || uploadedPost.thumbnailUrl || uploadedPost.metadata?.thumbnail_url,
      } : uploadedPost;
      onUploadSuccess(normalizedPost);
      resetAndClose();
    } catch (error: any) {
      console.warn("Upload post failed:", error);
      alert(error?.message || "Could not upload post. Please try again.");
    } finally {
      setUploading(false);
      setIsCompressing(false);
      setUploadProgress(0);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType={Platform.OS === 'android' ? 'fade' : 'slide'}
      hardwareAccelerated={Platform.OS === 'android'}
      statusBarTranslucent={Platform.OS === 'android'}
      onRequestClose={resetAndClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.appBar}>
            <TouchableOpacity onPress={resetAndClose} style={styles.iconBtn}>
              <MaterialIcons name="close" size={28} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.title}>
              {t("language") === "hi" ? "नई पोस्ट बनाएं" : "Create New Post"}
            </Text>
            <View style={styles.iconBtn} />
          </View>
          <KeyboardAwareScrollView
            scrollEnabled={scrollEnabled}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.mediaContainer}>
              <View
                style={[
                  styles.previewBox,
                  selectedMedia
                    ? { width: previewWidth, height: previewHeight }
                    : {},
                ]}
              >
                {!selectedMedia ? (
                  <View style={styles.emptyPreview}>
                    <MaterialIcons
                      name="add-photo-alternate"
                      size={48}
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.previewPlaceholder}>
                      {t("uploadPlaceholder")}
                    </Text>
                    <Text style={styles.emptyPreviewDisclaimer}>
                      {t("language") === "hi"
                        ? "सामग्री अपलोड करके, आप पुष्टि करते हैं कि इस ऑडियो और वीडियो का मालिकाना हक आपका है या आपके पास इसे इस्तेमाल करने का अधिकार है।"
                        : "By uploading content, you confirm you own or have rights to use the audio and video."}
                    </Text>
                  </View>
                ) : (
                  <View
                    style={{
                      width: "100%",
                      height: "100%",
                      overflow: "hidden",
                      backgroundColor: "#000",
                      position: "relative",
                    }}
                    {...panResponder.panHandlers}
                  >
                    <Animated.View
                      pointerEvents="none"
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: imgWidth,
                        height: imgHeight,
                        transform: [
                          { translateX: dragX },
                          { translateY: dragY },
                        ],
                      }}
                    >
                      {selectedMedia.mediaType === "image" ? (
                        <Image
                          source={{ uri: selectedMedia.uri }}
                          style={[
                            { width: "100%", height: "100%" },
                            getFilterStyle(selectedFilter),
                          ]}
                          contentFit="cover"
                        />
                      ) : Platform.OS === "web" ? (
                        <video
                          src={selectedMedia.uri}
                          loop
                          muted
                          autoPlay
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            ...getFilterStyle(selectedFilter),
                          }}
                        />
                      ) : selectedMedia?.uri ? (
                        <UploadVideoPreview
                          uri={selectedMedia.uri}
                          style={{ width: "100%", height: "100%" }}
                          selectedFilter={selectedFilter}
                        />
                      ) : (
                        <View
                          style={{
                            width: "100%",
                            height: "100%",
                            backgroundColor: "#000",
                          }}
                        />
                      )}
                    </Animated.View>
                    {Platform.OS !== "web" && selectedFilter !== "Normal" && (
                      <View
                        style={[
                          StyleSheet.absoluteFill,
                          getOverlayStyle(selectedFilter),
                        ]}
                        pointerEvents="none"
                      />
                    )}

                    {/* Rule of Thirds Grid Overlay (Fades in on drag) */}
                    <Animated.View
                      style={[styles.gridOverlay, { opacity: gridOpacity }]}
                      pointerEvents="none"
                    >
                      <View style={styles.gridRow}>
                        <View style={styles.gridCell} />
                        <View
                          style={[
                            styles.gridCell,
                            styles.gridCellMiddleHorizontal,
                          ]}
                        />
                        <View style={styles.gridCell} />
                      </View>
                      <View
                        style={[styles.gridRow, styles.gridRowMiddleVertical]}
                      >
                        <View style={styles.gridCell} />
                        <View
                          style={[
                            styles.gridCell,
                            styles.gridCellMiddleHorizontal,
                          ]}
                        />
                        <View style={styles.gridCell} />
                      </View>
                      <View style={styles.gridRow}>
                        <View style={styles.gridCell} />
                        <View
                          style={[
                            styles.gridCell,
                            styles.gridCellMiddleHorizontal,
                          ]}
                        />
                        <View style={styles.gridCell} />
                      </View>
                    </Animated.View>
                  </View>
                )}

                {selectedMedia && (
                  <View style={styles.dragTooltip} pointerEvents="none">
                    <Ionicons name="move" size={14} color="#FFF" />
                    <Text style={styles.dragTooltipText}>
                      {t("language") === "hi"
                        ? isCroppedHorizontally
                          ? "← फिट समायोजित करने के लिए बाएं/दाएं खींचें →"
                          : isCroppedVertically
                            ? "↑ फिट समायोजित करने के लिए ऊपर/नीचे खींचें ↓"
                            : "फिट समायोजित करने के लिए खींचें"
                        : tooltipText}
                    </Text>
                  </View>
                )}
              </View>

              {selectedMedia && (
                <View style={styles.aspectRatioContainer}>
                  <TouchableOpacity
                    onPress={() => setAspectRatioMode("1:1")}
                    style={[
                      styles.aspectRatioBtn,
                      aspectRatioMode === "1:1" && styles.aspectRatioBtnActive,
                    ]}
                  >
                    <Ionicons name="square-outline" size={13} color="#fff" />
                    <Text style={styles.aspectRatioBtnText}>
                      {t("language") === "hi" ? "चौकोर (1:1)" : "1:1"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setAspectRatioMode("4:5")}
                    style={[
                      styles.aspectRatioBtn,
                      aspectRatioMode === "4:5" && styles.aspectRatioBtnActive,
                    ]}
                  >
                    <Ionicons name="resize-outline" size={13} color="#fff" />
                    <Text style={styles.aspectRatioBtnText}>
                      {t("language") === "hi" ? "पोर्ट्रेट (4:5)" : "4:5"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setAspectRatioMode("1.91:1")}
                    style={[
                      styles.aspectRatioBtn,
                      aspectRatioMode === "1.91:1" &&
                        styles.aspectRatioBtnActive,
                    ]}
                  >
                    <Ionicons
                      name="tablet-landscape-outline"
                      size={13}
                      color="#fff"
                    />
                    <Text style={styles.aspectRatioBtnText}>
                      {t("language") === "hi" ? "लैंडस्केप (1.91:1)" : "1.91:1"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setAspectRatioMode("9:16")}
                    style={[
                      styles.aspectRatioBtn,
                      aspectRatioMode === "9:16" && styles.aspectRatioBtnActive,
                    ]}
                  >
                    <Ionicons
                      name="phone-portrait-outline"
                      size={13}
                      color="#fff"
                    />
                    <Text style={styles.aspectRatioBtnText}>
                      {t("language") === "hi" ? "रील्स (9:16)" : "9:16"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.sourceRow}>
                <TouchableOpacity
                  style={styles.sourceCard}
                  onPress={captureFromCamera}
                >
                  <MaterialIcons
                    name="camera-alt"
                    size={24}
                    color={COLORS.primary}
                  />
                  <Text style={styles.sourceCardText}>{t("camera")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sourceCard}
                  onPress={selectFromPhotoGallery}
                >
                  <MaterialIcons
                    name="photo-library"
                    size={24}
                    color={COLORS.primary}
                  />
                  <Text style={styles.sourceCardText}>{t("gallery")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sourceCard}
                  onPress={selectFromFiles}
                >
                  <MaterialIcons
                    name="folder"
                    size={24}
                    color={COLORS.primary}
                  />
                  <Text style={styles.sourceCardText}>{t("files")}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {selectedMedia && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>{t("applyFilter")}</Text>
                <KeyboardAwareScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.filterRow}
                >
                  {FILTERS.map((filter) => (
                    <TouchableOpacity
                      key={filter}
                      style={[
                        styles.filterChip,
                        selectedFilter === filter && styles.filterChipActive,
                      ]}
                      onPress={() => setSelectedFilter(filter)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedFilter === filter &&
                            styles.filterChipTextActive,
                        ]}
                      >
                        {filter === "Normal"
                          ? t("language") === "hi"
                            ? "सामान्य"
                            : "Normal"
                          : filter === "Warm"
                            ? t("language") === "hi"
                              ? "गर्म"
                              : "Warm"
                            : filter === "Cool"
                              ? t("language") === "hi"
                                ? "ठंडा"
                                : "Cool"
                              : filter === "Chrome"
                                ? t("language") === "hi"
                                  ? "क्रोम"
                                  : "Chrome"
                                : filter === "Fade"
                                  ? t("language") === "hi"
                                    ? "धुंधला"
                                    : "Fade"
                                  : filter === "Mono"
                                    ? t("language") === "hi"
                                      ? "मोनो"
                                      : "Mono"
                                    : filter === "Noir"
                                      ? t("language") === "hi"
                                        ? "ब्लैक एंड व्हाइट"
                                        : "Noir"
                                      : filter}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </KeyboardAwareScrollView>
              </View>
            )}

            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>
                {t("language") === "hi" ? "पोस्ट विवरण" : "Post Details"}
              </Text>
              <M3OutlinedInput
                label={
                  t("language") === "hi"
                    ? "कैप्शन / विवरण"
                    : "Caption / Description"
                }
                value={caption}
                onChangeText={setCaption}
                multiline
              />
              {selectedMedia?.mediaType === "video" && (
                <View style={styles.muteRow}>
                  <Ionicons
                    name={mutedAudio ? "volume-mute" : "volume-high"}
                    size={20}
                    color="#666"
                  />
                  <Text style={styles.muteLabel}>
                    {t("language") === "hi"
                      ? "ऑडियो म्यूट करें"
                      : "Mute Audio"}
                  </Text>
                  <Switch
                    value={mutedAudio}
                    onValueChange={setMutedAudio}
                    trackColor={{ false: "#ddd", true: "#FF6B00" }}
                    thumbColor="#fff"
                  />
                </View>
              )}
            </View>

            <View style={styles.bottomBar}>
              {uploading ? (
                <View style={styles.uploadingContainer}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: SPACING.sm,
                      marginBottom: 8,
                    }}
                  >
                    <ActivityIndicator color={COLORS.primary} size="small" />
                    <Text style={{ color: COLORS.primary, fontWeight: "600" }}>
                      {isCompressing
                        ? t("language") === "hi"
                          ? "प्रक्रिया चल रही है..."
                          : "Processing..."
                        : uploadProgress > 0 && uploadProgress < 100
                          ? t("language") === "hi"
                            ? `अपलोड हो रहा है ${uploadProgress}%...`
                            : `Uploading ${uploadProgress}%...`
                          : t("language") === "hi"
                            ? "अपलोड हो रहा है..."
                            : "Uploading..."}
                    </Text>
                  </View>
                  <View style={styles.progressBarBackground}>
                    <Animated.View
                      style={[styles.progressBarFill, { width: progressWidth }]}
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.draftBtn}
                    onPress={handleSaveDraft}
                  >
                    <Text style={styles.draftBtnText}>
                      {t("language") === "hi" ? "ड्राफ्ट सहेजें" : "Save Draft"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.submitBtn,
                      !canUpload && styles.uploadBtnDisabled,
                    ]}
                    onPress={handleUpload}
                    disabled={!canUpload}
                  >
                    <Text style={styles.submitBtnText}>{t("createPost")}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </KeyboardAwareScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF9F6",
  },
  appBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    height: 56,
    backgroundColor: "#FAF9F6",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  title: {
    color: "#1C1B1F",
    fontSize: 20,
    fontWeight: "600",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 30 : 16,
  },
  mediaContainer: {
    marginBottom: 16,
  },
  previewBox: {
    width: "100%",
    minHeight: 220,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#EADDFF",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  emptyPreview: {
    alignItems: "center",
    justifyContent: "center",
  },
  previewPlaceholder: {
    color: "#49454F",
    fontSize: 16,
    marginTop: 8,
    fontWeight: "500",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  previewVideo: {
    width: "100%",
    height: "100%",
  },
  dragTooltip: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    zIndex: 10,
  },
  dragTooltipText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "600",
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    zIndex: 5,
  },
  gridRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  gridRowMiddleVertical: {
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: "rgba(255,255,255,0.35)",
  },
  gridCell: {
    flex: 1,
  },
  gridCellMiddleHorizontal: {
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: "rgba(255,255,255,0.35)",
  },
  aspectRatioContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#1E1E24",
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
    marginTop: 12,
    width: "100%",
    alignSelf: "center",
  },
  aspectRatioBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  aspectRatioBtnActive: {
    backgroundColor: COLORS.primary,
  },
  aspectRatioBtnText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
  sourceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: SPACING.sm,
  },
  sourceCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: SPACING.md,
    alignItems: "center",
    justifyContent: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  sourceCardText: {
    color: COLORS.primary,
    fontSize: 13,
    marginTop: 6,
    fontWeight: "600",
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#1C1B1F",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: SPACING.md,
  },
  toggleRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  toggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#79747E",
    marginBottom: 8,
  },
  toggleBtnActive: {
    backgroundColor: "#E8DEF8",
    borderColor: COLORS.primary,
  },
  toggleBtnText: {
    fontSize: 15,
    color: "#49454F",
    fontWeight: "600",
  },
  toggleBtnTextActive: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  subLabel: {
    color: "#49454F",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  filterRow: {
    marginBottom: SPACING.sm,
  },
  filterChip: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#79747E",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
  },
  filterChipActive: {
    backgroundColor: "#E8DEF8",
    borderColor: "transparent",
  },
  filterChipText: {
    color: "#49454F",
    fontWeight: "600",
    fontSize: 14,
  },
  filterChipTextActive: {
    color: "#1D192B",
  },
  brandRow: {
    marginBottom: SPACING.md,
  },
  brandChip: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#79747E",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
  },
  brandChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  brandChipText: {
    color: "#49454F",
    fontWeight: "600",
    fontSize: 14,
  },
  brandChipTextActive: {
    color: "#fff",
  },
  inputContainer: {
    marginBottom: SPACING.md,
    marginTop: 6,
    position: "relative",
  },
  inputLabelFloating: {
    position: "absolute",
    top: -10,
    left: 12,
    backgroundColor: "#FAF9F6",
    paddingHorizontal: 4,
    fontSize: 12,
    zIndex: 1,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#79747E",
    borderRadius: 8,
    color: "#1C1B1F",
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 14 : 12,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  bottomBar: {
    padding: SPACING.md,
    backgroundColor: "#FAF9F6",
    borderTopWidth: 1,
    borderTopColor: "#E8E8E8",
    marginTop: SPACING.sm,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: SPACING.md,
  },
  draftBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#79747E",
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  draftBtnText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "600",
  },
  submitBtn: {
    flex: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  uploadBtnDisabled: {
    backgroundColor: "#E0E0E0",
  },
  uploadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingVertical: 10,
  },
  progressBarBackground: {
    width: "100%",
    height: 6,
    backgroundColor: "#EADDFF",
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 6,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
  },
  mentionDropdown: {
    position: "absolute",
    bottom: "100%",
    left: 0,
    right: 0,
    maxHeight: 180,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    overflow: "hidden",
    zIndex: 100,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: -2 },
      },
      android: { elevation: 6 },
    }),
  },
  mentionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F0F0F0",
  },
  mentionName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
    flex: 1,
  },
  mentionSL: {
    fontSize: 12,
    color: "#888",
  },
  muteRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingHorizontal: 4,
    gap: 8,
  },
  muteLabel: {
    flex: 1,
    fontSize: 14,
    color: "#444",
    fontWeight: "500",
  },
  disclaimerContainer: {
    marginTop: 12,
    paddingHorizontal: 4,
  },
  disclaimerText: {
    fontSize: 12,
    color: "#666666",
    lineHeight: 18,
    fontStyle: "italic",
  },
  emptyPreviewDisclaimer: {
    fontSize: 11,
    color: "#666666",
    textAlign: "center",
    marginTop: 16,
    paddingHorizontal: 20,
    lineHeight: 16,
    fontStyle: "italic",
  },
});
export default UploadPostModal;

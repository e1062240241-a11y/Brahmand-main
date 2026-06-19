import { create } from "zustand";
import { uploadUserPost } from "../services/api";
import { toast } from "./toastStore";
import { useFeedStore } from "./feedStore";
import { DeviceEventEmitter } from "react-native";

interface UploadState {
  isUploading: boolean;
  progress: number;
  isCompressing: boolean;
  status: "idle" | "uploading" | "compressing" | "success" | "error";
  caption: string;
  mediaType: "video" | "image" | null;
  errorMessage: string | null;
  startBackgroundUpload: (params: {
    uri: string;
    type: string;
    name: string;
    mediaType: string;
    caption: string;
    selectedFilter: string;
    communityLevel: string;
    uploadCategory: string;
    mediaWidth?: number;
    mediaHeight?: number;
    offsetXPercent?: number;
    offsetYPercent?: number;
    originalWidth?: number;
    originalHeight?: number;
    muteAudio?: boolean;
  }) => Promise<void>;
  reset: () => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  isUploading: false,
  progress: 0,
  isCompressing: false,
  status: "idle",
  caption: "",
  mediaType: null,
  errorMessage: null,
  startBackgroundUpload: async (params) => {
    set({
      isUploading: true,
      progress: 0,
      isCompressing: false,
      status: "uploading",
      caption: params.caption,
      mediaType: params.mediaType === "video" ? "video" : "image",
      errorMessage: null,
    });

    try {
      const response = await uploadUserPost(
        { uri: params.uri, type: params.type, name: params.name },
        params.caption,
        params.selectedFilter,
        (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            set({ progress: percent });
            if (percent >= 100 && params.mediaType === "video") {
              set({ isCompressing: true, status: "compressing" });
            }
          }
        },
        params.communityLevel,
        params.uploadCategory,
        params.mediaWidth,
        params.mediaHeight,
        params.offsetXPercent,
        params.offsetYPercent,
        params.originalWidth,
        params.originalHeight,
        params.muteAudio,
      );

      const newPost = response.data;
      if (newPost) {
        const activeTab = useFeedStore.getState().activeTab;
        const category = params.uploadCategory || "feed";

        // Optimistically add to current active tab if it matches the category
        // or if we are in 'for_you'
        if (activeTab === "for_you" || activeTab === category) {
          const currentPosts =
            useFeedStore.getState().tabFeeds[activeTab]?.posts || [];
          const currentOffset =
            useFeedStore.getState().tabFeeds[activeTab]?.offset || 0;
          useFeedStore.getState().setTabFeed(activeTab, {
            posts: [newPost, ...currentPosts],
            offset: currentOffset + 1,
          });
        }

        // Also clear cache for 'festivals' if we uploaded a festival post so it refreshes next time
        if (category === "festivals" && activeTab !== "festivals") {
          useFeedStore.getState().setTabFeed("festivals", { lastFetched: 0 }); // Mark as stale
        }
      }

      // Notify profile tab and any other listeners to instantly reflect the new post
      DeviceEventEmitter.emit("post_uploaded", newPost);

      set({
        status: "success",
        isUploading: false,
        progress: 100,
        isCompressing: false,
      });
      toast.success(
        params.mediaType === "video"
          ? "Video uploaded successfully!"
          : "Post uploaded successfully!",
      );

      setTimeout(() => {
        set({
          status: "idle",
          isUploading: false,
          progress: 0,
          isCompressing: false,
          caption: "",
          mediaType: null,
        });
      }, 3000);
    } catch (error: any) {
      console.error("[UploadStore] Background upload failed:", error);
      set({
        status: "error",
        isUploading: false,
        errorMessage: error?.message || "Upload failed",
      });
      toast.error(error?.message || "Could not upload post. Please try again.");

      setTimeout(() => {
        set({
          status: "idle",
          isUploading: false,
          progress: 0,
          isCompressing: false,
          caption: "",
          mediaType: null,
          errorMessage: null,
        });
      }, 5000);
    }
  },
  reset: () => {
    set({
      isUploading: false,
      progress: 0,
      isCompressing: false,
      status: "idle",
      caption: "",
      mediaType: null,
      errorMessage: null,
    });
  },
}));

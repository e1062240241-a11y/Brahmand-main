import { useState, useCallback } from 'react';

export interface CreatePostState {
  visible: boolean;
  newMessage: string;
  selectedImage: string | null;
  selectedMediaType: 'image' | 'video' | null;
  postCategory: string;
  contactNumber: string;
  sevaDetails: string;
  eventLocation: string;
  eventDate: Date | null;
  showDatePicker: boolean;
  showTimePicker: boolean;
  showInlineCategories: boolean;
}

const initialCreatePostState: CreatePostState = {
  visible: false,
  newMessage: '',
  selectedImage: null,
  selectedMediaType: null,
  postCategory: '',
  contactNumber: '',
  sevaDetails: '',
  eventLocation: '',
  eventDate: null,
  showDatePicker: false,
  showTimePicker: false,
  showInlineCategories: false,
};

export function useCreatePostState() {
  const [createPostState, setCreatePostState] = useState<CreatePostState>(initialCreatePostState);

  const resetCreatePostState = useCallback(() => {
    setCreatePostState(initialCreatePostState);
  }, []);

  const setShowCreateModal = useCallback((val: boolean | ((prev: boolean) => boolean)) => {
    setCreatePostState(prev => ({ ...prev, visible: typeof val === 'function' ? val(prev.visible) : val }));
  }, []);

  const setNewMessage = useCallback((val: string | ((prev: string) => string)) => {
    setCreatePostState(prev => ({ ...prev, newMessage: typeof val === 'function' ? val(prev.newMessage) : val }));
  }, []);

  const setSelectedImage = useCallback((val: string | null | ((prev: string | null) => string | null)) => {
    setCreatePostState(prev => ({ ...prev, selectedImage: typeof val === 'function' ? val(prev.selectedImage) : val }));
  }, []);

  const setSelectedMediaType = useCallback((val: 'image' | 'video' | null | ((prev: 'image' | 'video' | null) => 'image' | 'video' | null)) => {
    setCreatePostState(prev => ({ ...prev, selectedMediaType: typeof val === 'function' ? val(prev.selectedMediaType) : val }));
  }, []);

  const setPostCategory = useCallback((val: string | ((prev: string) => string)) => {
    setCreatePostState(prev => ({ ...prev, postCategory: typeof val === 'function' ? val(prev.postCategory) : val }));
  }, []);

  const setContactNumber = useCallback((val: string | ((prev: string) => string)) => {
    setCreatePostState(prev => ({ ...prev, contactNumber: typeof val === 'function' ? val(prev.contactNumber) : val }));
  }, []);

  const setSevaDetails = useCallback((val: string | ((prev: string) => string)) => {
    setCreatePostState(prev => ({ ...prev, sevaDetails: typeof val === 'function' ? val(prev.sevaDetails) : val }));
  }, []);

  const setEventLocation = useCallback((val: string | ((prev: string) => string)) => {
    setCreatePostState(prev => ({ ...prev, eventLocation: typeof val === 'function' ? val(prev.eventLocation) : val }));
  }, []);

  const setEventDate = useCallback((val: Date | null | ((prev: Date | null) => Date | null)) => {
    setCreatePostState(prev => ({ ...prev, eventDate: typeof val === 'function' ? val(prev.eventDate) : val }));
  }, []);

  const setShowDatePicker = useCallback((val: boolean | ((prev: boolean) => boolean)) => {
    setCreatePostState(prev => ({ ...prev, showDatePicker: typeof val === 'function' ? val(prev.showDatePicker) : val }));
  }, []);

  const setShowTimePicker = useCallback((val: boolean | ((prev: boolean) => boolean)) => {
    setCreatePostState(prev => ({ ...prev, showTimePicker: typeof val === 'function' ? val(prev.showTimePicker) : val }));
  }, []);

  const setShowInlineCategories = useCallback((val: boolean | ((prev: boolean) => boolean)) => {
    setCreatePostState(prev => ({ ...prev, showInlineCategories: typeof val === 'function' ? val(prev.showInlineCategories) : val }));
  }, []);

  return {
    createPostState,
    setCreatePostState,
    resetCreatePostState,
    showCreateModal: createPostState.visible,
    setShowCreateModal,
    newMessage: createPostState.newMessage,
    setNewMessage,
    selectedImage: createPostState.selectedImage,
    setSelectedImage,
    selectedMediaType: createPostState.selectedMediaType,
    setSelectedMediaType,
    postCategory: createPostState.postCategory,
    setPostCategory,
    contactNumber: createPostState.contactNumber,
    setContactNumber,
    sevaDetails: createPostState.sevaDetails,
    setSevaDetails,
    eventLocation: createPostState.eventLocation,
    setEventLocation,
    eventDate: createPostState.eventDate,
    setEventDate,
    showDatePicker: createPostState.showDatePicker,
    setShowDatePicker,
    showTimePicker: createPostState.showTimePicker,
    setShowTimePicker,
    showInlineCategories: createPostState.showInlineCategories,
    setShowInlineCategories,
  };
}

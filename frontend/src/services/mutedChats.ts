import AsyncStorage from '@react-native-async-storage/async-storage';

const MUTED_KEY = 'muted_conversations';

const loadMuted = async (): Promise<Set<string>> => {
  try {
    const raw = await AsyncStorage.getItem(MUTED_KEY);
    if (raw) return new Set(JSON.parse(raw));
    return new Set();
  } catch {
    return new Set();
  }
};

const saveMuted = async (ids: Set<string>) => {
  try {
    await AsyncStorage.setItem(MUTED_KEY, JSON.stringify([...ids]));
  } catch {}
};

let cached: Set<string> | null = null;
let initPromise: Promise<void> | null = null;

const ensureLoaded = async () => {
  if (cached) return;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    cached = await loadMuted();
  })();
  return initPromise;
};

export const isConversationMuted = async (conversationId: string): Promise<boolean> => {
  await ensureLoaded();
  return cached?.has(conversationId) ?? false;
};

export const muteConversationLocal = async (conversationId: string) => {
  await ensureLoaded();
  cached!.add(conversationId);
  await saveMuted(cached!);
};

export const unmuteConversationLocal = async (conversationId: string) => {
  await ensureLoaded();
  cached!.delete(conversationId);
  await saveMuted(cached!);
};

export const getAllMutedConversations = async (): Promise<Set<string>> => {
  await ensureLoaded();
  return new Set(cached);
};

export const isConversationMutedSync = (conversationId: string): boolean => {
  return cached?.has(conversationId) ?? false;
};

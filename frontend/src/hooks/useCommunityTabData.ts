import { useMemo } from 'react';
import {
  isLostFoundRequest,
  isTempleUpdateRequest,
  isSevaRequest,
} from '../utils/communityUtils';
import { parseUTCDate, getUnixTimestamp } from '../utils/dateUtils';

export function useCommunityTabData(
  activeTab: string,
  requests: any[],
  events: any[],
  discussionPosts: any[],
  communityPosts: any[],
  userId: string | undefined,
  blockedUserSet: Set<string>,
  festivalSort: 'latest' | 'oldest',
  selectedFestival: string | null,
  allFestivals: any[]
): any[] {
  const filteredRequests = useMemo(() => {
    return requests.filter((item: any) => !isSevaRequest(item));
  }, [requests]);

  const filteredSevaRequests = useMemo(() => {
    return requests.filter((item: any) => isSevaRequest(item));
  }, [requests]);

  const combinedData = useMemo(() => {
    const isUserBlocked = (item: any) => {
      const uid =
        item?.user_id ||
        item?.creator_id ||
        item?.creator?.id ||
        item?.sender_id ||
        item?.user?.id;
      return uid && blockedUserSet.has(String(uid));
    };

    if (activeTab === 'My Posts') {
      const filteredRequestsList = requests.filter((item) => !isUserBlocked(item));
      const filteredDiscussionPostsList = discussionPosts.filter((item) => !isUserBlocked(item));
      const filteredCommunityPostsList = communityPosts.filter((item) => !isUserBlocked(item));

      const itemMap = new Map();

      // All chat messages (community posts)
      filteredCommunityPostsList.forEach((p) => {
        const cleanPost = { ...p };
        if (cleanPost.id && !String(cleanPost.id).startsWith('post-')) {
          delete cleanPost.threadParentId;
        }
        itemMap.set(p.id, cleanPost);
      });

      // Discussion posts
      filteredDiscussionPostsList.forEach((p) => {
        if (!itemMap.has(p.id)) {
          itemMap.set(p.id, p);
        }
      });

      // Include Community Requests
      filteredRequestsList.forEach((req) => {
        if (!itemMap.has(req.id)) {
          itemMap.set(req.id, {
            ...req,
            type: 'request_item',
            isRequestInFeed: true,
          });
        }
      });

      const allItems = Array.from(itemMap.values());

      // Filter only user's own posts/requests
      const userOwnItems = allItems.filter((item) => {
        return (
          (item.sender_id && userId && String(item.sender_id) === String(userId)) ||
          (item.user_id && userId && String(item.user_id) === String(userId)) ||
          String(item.id).startsWith('post-') ||
          String(item.id).startsWith('repost-')
        );
      });

      // Sort posts descending (newest first)
      userOwnItems.sort((a, b) => {
        const timeA = getUnixTimestamp(a);
        const timeB = getUnixTimestamp(b);
        if (timeA !== timeB) return timeB - timeA;
        return String(b.id).localeCompare(String(a.id));
      });

      return userOwnItems;
    }

    if (activeTab === 'Requests') {
      const filteredApiRequests = filteredRequests.filter((item) => !isUserBlocked(item));
      const filteredCommunityPostsList = communityPosts.filter((item) => !isUserBlocked(item));
      const apiList = filteredApiRequests.filter(
        (item: any) => !isLostFoundRequest(item) && !isTempleUpdateRequest(item)
      );
      const localList = filteredCommunityPostsList
        .filter((p: any) => (p.category || '').toLowerCase().trim() === 'requests')
        .map((p: any) => ({
          ...p,
          type: 'request_item',
          isRequestItem: true,
          isRequestInFeed: false,
          title: p.title || 'Community Request',
          description: p.description || p.content || '',
          user_name: p.user_name || p.user?.name || 'Devotee',
          created_at: p.created_at || p.timestamp || new Date().toISOString(),
          urgency_level: p.urgency_level || 'normal',
          request_type: p.request_type || 'help',
          image: p.image || p.image_url || p.media_url,
          image_url: p.image_url || p.image || p.media_url,
        }));

      const reqMap = new Map();
      apiList.forEach((r) => reqMap.set(r.id, r));
      localList.forEach((r) => reqMap.set(r.id, r));

      const list = Array.from(reqMap.values()).sort(
        (a, b) => getUnixTimestamp(b) - getUnixTimestamp(a)
      );
      return list;
    }

    if (activeTab === 'Events') {
      const filteredEventsList = events.filter((item) => !isUserBlocked(item));
      const filteredCommunityPostsList = communityPosts.filter((item) => !isUserBlocked(item));
      const apiList = filteredEventsList.map((e: any) => {
        let locStr = 'Online';
        if (e.location) {
          if (typeof e.location === 'object') {
            locStr =
              e.location.display_name ||
              e.location.address ||
              e.location.name ||
              e.location.city ||
              e.location.area ||
              'Online';
          } else {
            locStr = String(e.location);
          }
        }

        let startTime = e.start_time;
        if (!startTime && e.date) {
          startTime = e.time ? `${e.date}T${e.time}` : e.date;
        }
        if (!startTime) {
          startTime = e.created_at || new Date().toISOString();
        }

        return {
          ...e,
          isEventItem: true,
          title: e.name || e.title || 'Community Event',
          description: e.description || '',
          start_time: startTime,
          location: locStr,
          user_name: e.organizer_name || e.user_name || e.user?.name || 'Organizer',
          image: e.image || e.image_url || e.media_url,
          image_url: e.image_url || e.image || e.media_url,
        };
      });

      const localList = filteredCommunityPostsList
        .filter((p: any) => (p.category || '').toLowerCase().trim() === 'events')
        .map((p: any) => ({
          ...p,
          isEventItem: true,
          title: p.title || 'Community Event',
          description: p.description || p.content || '',
          user_name: p.user_name || p.user?.name || 'Devotee',
          start_time: p.start_time || p.timestamp || new Date().toISOString(),
          location: p.location || 'Online',
          image: p.image || p.image_url || p.media_url,
          image_url: p.image_url || p.image || p.media_url,
        }));

      const evtMap = new Map();
      apiList.forEach((e) => evtMap.set(e.id, e));
      localList.forEach((e) => evtMap.set(e.id, e));

      const list = Array.from(evtMap.values()).sort(
        (a, b) => getUnixTimestamp(b) - getUnixTimestamp(a)
      );
      return list;
    }

    if (activeTab === 'Festivals') {
      const filteredCommunityPostsList = communityPosts.filter((item) => !isUserBlocked(item));
      const userFestivals = filteredCommunityPostsList
        .filter((p: any) => (p.category || '').toLowerCase().trim() === 'festivals')
        .map((p: any) => {
          let eventImage = p.image || p.image_url || p.media_url;
          let resolvedImage = typeof eventImage === 'string' ? { uri: eventImage } : eventImage;
          const diffInSeconds = p.timestamp
            ? Math.floor((new Date().getTime() - parseUTCDate(p.timestamp).getTime()) / 1000)
            : 0;
          let timeAgoStr = 'Just now';
          if (diffInSeconds >= 86400) timeAgoStr = `${Math.floor(diffInSeconds / 86400)}d ago`;
          else if (diffInSeconds >= 3600) timeAgoStr = `${Math.floor(diffInSeconds / 3600)}h ago`;
          else if (diffInSeconds >= 60) timeAgoStr = `${Math.floor(diffInSeconds / 60)}m ago`;

          return {
            id: p.id,
            title: p.title || null,
            description: p.description || p.content || 'Join our community celebration!',
            location: p.location || p.sevaDetails || undefined,
            time:
              p.time ||
              (p.timestamp
                ? (() => {
                    const d = parseUTCDate(p.timestamp);
                    if (isNaN(d.getTime())) return 'Today';
                    const day = String(d.getDate()).padStart(2, '0');
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    return `${day}/${month}/${d.getFullYear()}`;
                  })()
                : 'Today'),
            image: resolvedImage,
            organizer: {
              name: p.user?.name || 'Devotee',
              photo: p.user?.photo || null,
              isVerified: p.user?.isVerified || p.user?.is_verified || p.is_verified || false,
            },
            timeAgo: timeAgoStr,
            type: 'festival_event',
            isReal: true,
            timestamp: p.timestamp || p.created_at,
            festival_name: p.festival_name || p.festival || null,
          };
        });

      let eventList = [...userFestivals];

      if (selectedFestival) {
        const targetFestival = allFestivals.find((f) => f.name === selectedFestival);
        let targetDateStr = '';
        if (targetFestival && targetFestival.date) {
          try {
            const d = parseUTCDate(targetFestival.date);
            if (!isNaN(d.getTime())) {
              const day = String(d.getDate()).padStart(2, '0');
              const month = String(d.getMonth() + 1).padStart(2, '0');
              targetDateStr = `${day}/${month}/${d.getFullYear()}`;
            }
          } catch (err) {
            console.warn('Failed to parse target festival date', err);
          }
        }

        eventList = eventList.filter((e) => {
          if (targetDateStr && e.time && e.time.includes(targetDateStr)) {
            return true;
          }
          const title = (e.title || '').toLowerCase();
          const desc = (e.description || '').toLowerCase();
          const festName = (e.festival_name || '').toLowerCase();
          const name = selectedFestival.toLowerCase();
          return (
            title.includes(name) ||
            desc.includes(name) ||
            festName.includes(name) ||
            festName === name
          );
        });
      }

      eventList.sort((a, b) => {
        const timeA = getUnixTimestamp(a);
        const timeB = getUnixTimestamp(b);
        return festivalSort === 'latest' ? timeB - timeA : timeA - timeB;
      });

      return [
        { id: 'fest-header-main', type: 'festivals_header' },
        { id: 'fest-list-horizontal', type: 'festivals_list' },
        { id: 'fest-events-header-sub', type: 'festival_events_header' },
        ...eventList,
        { id: 'fest-banner-footer', type: 'festival_banner' },
      ];
    }

    if (activeTab === 'Lost & Found') {
      const filteredRequestsList = requests.filter((item) => !isUserBlocked(item));
      const filteredCommunityPostsList = communityPosts.filter((item) => !isUserBlocked(item));
      const apiList = filteredRequestsList.filter((item: any) => isLostFoundRequest(item));
      const localList = filteredCommunityPostsList
        .filter((p: any) => isLostFoundRequest(p))
        .map((p: any) => ({
          ...p,
          isRequestItem: true,
          title: p.title || 'Lost & Found',
          description: p.description || p.content || '',
          user_name: p.user_name || p.user?.name || 'Devotee',
          created_at: p.created_at || p.timestamp || new Date().toISOString(),
          request_type: 'lost_found',
          image: p.image || p.image_url || p.media_url,
          image_url: p.image_url || p.image || p.media_url,
        }));

      const lfMap = new Map();
      apiList.forEach((r) => lfMap.set(r.id, r));
      localList.forEach((r) => lfMap.set(r.id, r));

      const list = Array.from(lfMap.values()).sort(
        (a, b) => getUnixTimestamp(b) - getUnixTimestamp(a)
      );
      return list;
    }

    if (activeTab === 'Temple Updates') {
      const filteredRequestsList = requests.filter((item) => !isUserBlocked(item));
      const filteredCommunityPostsList = communityPosts.filter((item) => !isUserBlocked(item));
      const formatTemplePost = (p: any) => ({
        ...p,
        id: p.id || `tu-${Math.random()}`,
        isCommunityMsg: true,
        user: p.user || {
          name: p.user_name || p.creator_name || 'Temple Trustee Board',
          photo: p.user_photo || p.photo || null,
          isVerified: true,
          verificationLabel: 'Official',
        },
        content:
          p.content ||
          (p.title
            ? p.description
              ? `${p.title}\n\n${p.description}`
              : p.title
            : p.description || 'Temple Update'),
        timestamp: p.timestamp || p.created_at || new Date().toISOString(),
        category: 'Temple Updates',
        contact_number:
          p.contact_number ||
          p.contact ||
          p.user_phone ||
          p.user?.phone ||
          p.user?.phone_number ||
          p.user?.contact_number ||
          p.user?.contact ||
          p.phone ||
          '',
        likes: p.likes || p.likes_count || 0,
        comments: p.comments || p.comments_count || 0,
        reposts: p.reposts || 0,
        image: p.image || p.image_url || p.media_url,
      });

      const apiList = filteredRequestsList
        .filter((item: any) => isTempleUpdateRequest(item))
        .map(formatTemplePost);
      const localList = filteredCommunityPostsList
        .filter((p: any) => isTempleUpdateRequest(p))
        .map(formatTemplePost);

      const tuMap = new Map();
      apiList.forEach((r) => tuMap.set(r.id, r));
      localList.forEach((r) => tuMap.set(r.id, r));

      let list = Array.from(tuMap.values()).sort(
        (a, b) => getUnixTimestamp(b) - getUnixTimestamp(a)
      );
      return list;
    }

    if (activeTab === 'Seva') {
      const filteredApiSevaRequests = filteredSevaRequests.filter((item) => !isUserBlocked(item));
      const filteredCommunityPostsList = communityPosts.filter((item) => !isUserBlocked(item));
      const apiSeva = filteredApiSevaRequests.map((r: any) => ({
        ...r,
        isSevaPost: true,
        isRequestItem: true,
      }));
      const localSeva = filteredCommunityPostsList
        .filter((p: any) => (p.category || '').toLowerCase().trim() === 'seva')
        .map((p: any) => ({
          ...p,
          isSevaPost: true,
          isRequestItem: true,
          title: p.title || 'Seva Request',
          description: p.description || p.content || '',
          user_name: p.user_name || p.user?.name || 'Devotee',
          created_at: p.created_at || p.timestamp || new Date().toISOString(),
          request_type: 'seva',
          image: p.image || p.image_url || p.media_url,
          image_url: p.image_url || p.image || p.media_url,
        }));

      const sevaMap = new Map();
      apiSeva.forEach((s) => sevaMap.set(s.id, s));
      localSeva.forEach((s) => sevaMap.set(s.id, s));

      const mergedSeva = Array.from(sevaMap.values());
      const sortedSeva = mergedSeva.sort((a, b) => getUnixTimestamp(b) - getUnixTimestamp(a));

      return sortedSeva;
    }

    if (activeTab === 'Feed') {
      const filteredCommunityPostsList = communityPosts.filter((item) => !isUserBlocked(item));
      const filteredDiscussionPostsList = discussionPosts.filter((item) => !isUserBlocked(item));
      const filteredRequestsList = requests.filter((item) => !isUserBlocked(item));
      const itemMap = new Map();

      filteredCommunityPostsList.forEach((p) => {
        const cleanPost = { ...p };
        if (cleanPost.id && !String(cleanPost.id).startsWith('post-')) {
          delete cleanPost.threadParentId;
        }
        itemMap.set(p.id, cleanPost);
      });

      filteredDiscussionPostsList.forEach((p) => {
        if (!itemMap.has(p.id)) {
          itemMap.set(p.id, p);
        }
      });

      filteredRequestsList.forEach((req) => {
        if (!itemMap.has(req.id)) {
          itemMap.set(req.id, {
            ...req,
            type: 'request_item',
            isRequestInFeed: true,
          });
        }
      });

      const allItems = Array.from(itemMap.values());

      allItems.sort((a, b) => {
        const aIsLocal = String(a.id).startsWith('post-');
        const bIsLocal = String(b.id).startsWith('post-');
        if (aIsLocal && !bIsLocal) return 1;
        if (!aIsLocal && bIsLocal) return -1;
        if (aIsLocal && bIsLocal) {
          return String(a.id).localeCompare(String(b.id));
        }

        const aNum = parseInt(a.id, 10);
        const bNum = parseInt(b.id, 10);
        const aIsNumeric = !isNaN(aNum) && /^\d+$/.test(String(a.id));
        const bIsNumeric = !isNaN(bNum) && /^\d+$/.test(String(b.id));

        if (aIsNumeric && bIsNumeric) {
          return aNum - bNum;
        }
        if (aIsNumeric && !bIsNumeric) return 1;
        if (!aIsNumeric && bIsNumeric) return -1;

        return String(a.id).localeCompare(String(a.id));
      });

      for (let i = 0; i < allItems.length; i++) {
        const current = allItems[i];
        if (String(current.id).startsWith('post-')) continue;

        let j = i + 1;
        while (j < allItems.length) {
          const next = allItems[j];
          if (String(next.id).startsWith('post-')) break;

          const isSameSender =
            (next.sender_id && current.sender_id && String(next.sender_id) === String(current.sender_id)) ||
            (next.user?.name && current.user?.name && next.user.name === current.user.name);

          if (isSameSender) {
            const timeA = new Date(current.timestamp).getTime();
            const timeB = new Date(next.timestamp).getTime();
            const timeDiff = Math.abs(timeA - timeB);
            const isSameRelativeTime =
              current.timestamp && next.timestamp && current.timestamp === next.timestamp;

            if ((!isNaN(timeDiff) && timeDiff < 60000) || isSameRelativeTime) {
              next.threadParentId = current.threadParentId || current.id;
              j++;
              continue;
            }
          }
          break;
        }
        i = j - 1;
      }

      const parents: any[] = [];
      const childrenMap = new Map<string, any[]>();

      allItems.forEach((item) => {
        if (item.threadParentId) {
          const list = childrenMap.get(item.threadParentId) || [];
          list.push(item);
          childrenMap.set(item.threadParentId, list);
        } else {
          parents.push(item);
        }
      });

      const sortCutoffMs = Date.now() - 24 * 60 * 60 * 1000;
      const isRecentAnn = (post: any) => {
        const isAnn = post.isNationalAnnouncement || post.isStateAnnouncement;
        if (!isAnn) return false;
        const ts = post.timestamp || post.created_at;
        if (!ts || ts === 'Just now') return true;
        try {
          const tMs = parseUTCDate(ts).getTime();
          return !isNaN(tMs) && tMs >= sortCutoffMs;
        } catch {
          return true;
        }
      };

      parents.sort((a, b) => {
        const aIsRecentAnn = isRecentAnn(a);
        const bIsRecentAnn = isRecentAnn(b);

        if (aIsRecentAnn && !bIsRecentAnn) return -1;
        if (!aIsRecentAnn && bIsRecentAnn) return 1;

        if (aIsRecentAnn && bIsRecentAnn) {
          if (a.isNationalAnnouncement && !b.isNationalAnnouncement) return -1;
          if (!a.isNationalAnnouncement && b.isNationalAnnouncement) return 1;
        }

        const timeA = getUnixTimestamp(a);
        const timeB = getUnixTimestamp(b);
        if (timeA !== timeB) return timeB - timeA;

        return String(b.id).localeCompare(String(a.id));
      });

      const sortedResult: any[] = [];
      parents.forEach((parent) => {
        sortedResult.push(parent);
        const children = childrenMap.get(parent.id);
        if (children) {
          children.sort((a, b) => {
            return String(a.id).localeCompare(String(b.id));
          });
          sortedResult.push(...children);
        }
      });

      return sortedResult;
    }

    return [];
  }, [
    activeTab,
    requests,
    events,
    discussionPosts,
    communityPosts,
    filteredRequests,
    filteredSevaRequests,
    userId,
    blockedUserSet,
    festivalSort,
    selectedFestival,
    allFestivals,
  ]);

  return combinedData;
}

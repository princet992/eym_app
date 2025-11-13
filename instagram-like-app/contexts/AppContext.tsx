import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { api, FileDescriptor } from '../lib/api';

export type UserRole = 'admin' | 'member' | 'guest';

type Comment = {
  id: string;
  author: string;
  message: string;
  createdAt: string;
};

export type Post = {
  id: string;
  title: string;
  content: string;
  image?: string;
  comments: Comment[];
  createdAt?: string;
};

export type Event = {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  location: string;
  coverImage?: string;
};

export type MediaItem = {
  id: string;
  type: 'image' | 'video';
  title: string;
  url: string;
  description?: string;
};

export type Member = {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  monthlyContribution: number;
  status: 'active' | 'pending' | 'inactive';
  avatar?: string;
  roleLabel?: string;
};

export type DonationRecord = {
  id: string;
  memberId: string;
  memberName: string;
  month: string;
  monthlyStatus: string;
  amount: number;
  notedBy: string;
};

type ReliefFund = {
  id: string;
  title: string;
  description: string;
  goal: number;
  raised: number;
  contactEmail?: string;
  bankDetails: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    ifsc?: string;
    swift?: string;
  }[];
};

type AppContextValue = {
  loading: boolean;
  role: UserRole;
  setRole: (role: UserRole) => void;
  refresh: () => Promise<void>;
  posts: Post[];
  addPost: (payload: { title: string; content: string; media?: FileDescriptor | null }) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  addCommentToPost: (postId: string, payload: { message: string; author?: string }) => Promise<void>;
  events: Event[];
  addEvent: (payload: {
    title: string;
    description: string;
    startsAt: string;
    location: string;
    coverImage?: FileDescriptor | null;
  }) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  media: MediaItem[];
  addMedia: (payload: { title: string; description?: string; file?: FileDescriptor | null; type: 'image' | 'video' }) => Promise<void>;
  deleteMedia: (mediaId: string) => Promise<void>;
  members: Member[];
  addOrUpdateMember: (payload: {
    id?: string;
    name: string;
    email: string;
    phoneNumber?: string;
    roleLabel?: string;
    status: 'active' | 'pending' | 'inactive';
    avatar?: FileDescriptor | null;
  }) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  donations: DonationRecord[];
  logDonation: (payload: { memberId: string; amount: number; month: string; status?: string }) => Promise<void>;
  updateDonation: (payload: { id: string; amount: number; month: string; status?: string }) => Promise<void>;
  removeDonation: (donationId: string) => Promise<void>;
  reliefFunds: ReliefFund[];
  addOrUpdateReliefFund: (payload: ReliefFund & { draftId?: string }) => Promise<void>;
  removeReliefFund: (fundId: string) => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

function mapFeedToPost(feed: any, comments: Comment[]): Post {
  return {
    id: feed._id ?? feed.id ?? Math.random().toString(36).slice(2),
    title: feed.title ?? 'Untitled',
    content: feed.description ?? '',
    image: feed.media ?? undefined,
    comments,
    createdAt: feed.createdAt,
  };
}

function mapComment(comment: any): Comment {
  return {
    id: comment._id ?? comment.id ?? Math.random().toString(36).slice(2),
    author: comment.userId?.userName ?? comment.author ?? 'Member',
    message: comment.text ?? comment.message ?? '',
    createdAt: comment.createdAt ?? new Date().toISOString(),
  };
}

function mapEvent(event: any): Event {
  return {
    id: event._id ?? event.id ?? Math.random().toString(36).slice(2),
    title: event.title ?? 'Untitled',
    description: event.description ?? '',
    startsAt: event.date ?? event.startsAt ?? new Date().toISOString(),
    location: event.location ?? 'TBD',
    coverImage: event.cover ?? event.coverImage ?? event.media,
  };
}

function mapMedia(item: any): MediaItem {
  const url = item.media ?? item.url ?? '';
  return {
    id: item._id ?? item.id ?? Math.random().toString(36).slice(2),
    title: item.title ?? 'Media',
    description: item.description ?? '',
    type: url && url.includes('.mp4') ? 'video' : 'image',
    url,
  };
}

function normalizeMemberRole(role?: string): 'active' | 'pending' | 'inactive' {
  if (!role) return 'active';
  const lowered = role.toLowerCase();
  if (lowered.includes('pending')) return 'pending';
  if (lowered.includes('inactive')) return 'inactive';
  return 'active';
}

function mapMember(member: any): Member {
  return {
    id: member._id ?? member.id ?? Math.random().toString(36).slice(2),
    name: member.userName ?? member.name ?? 'Member',
    email: member.email ?? 'n/a',
    phoneNumber: member.phoneNumber,
    monthlyContribution: 0,
    status: normalizeMemberRole(member.role ?? member.status),
    avatar: member.media ?? undefined,
    roleLabel: member.role,
  };
}

function mapCollection(collection: any): DonationRecord {
  const member = collection.member ?? {};
  const memberName = member.userName ?? member.name ?? 'Member';
  const monthlyAmount = collection.monthlyAmount ?? 'Pending';
  const bhawanAmount = Number(collection.bhawanAmount ?? 0) || 0;
  const status = typeof monthlyAmount === 'string' ? monthlyAmount : 'Pending';

  return {
    id: collection._id ?? collection.id ?? Math.random().toString(36).slice(2),
    memberId: member._id ?? member.id ?? 'unknown',
    memberName,
    month: collection.date ?? '',
    monthlyStatus: status,
    amount: bhawanAmount,
    notedBy: status,
  };
}

function mapReliefFund(fund: any): ReliefFund {
  return {
    id: fund._id ?? fund.id ?? Math.random().toString(36).slice(2),
    title: fund.title ?? 'Relief appeal',
    description: fund.description ?? '',
    goal: Number(fund.goal ?? 0) || 0,
    raised: Number(fund.raised ?? 0) || 0,
    contactEmail: fund.contactEmail ?? undefined,
    bankDetails: Array.isArray(fund.bankDetails)
      ? fund.bankDetails.map((detail: any) => ({
          bankName: detail.bankName ?? 'Bank',
          accountName: detail.accountName ?? 'Account',
          accountNumber: detail.accountNumber ?? 'N/A',
          ifsc: detail.ifsc ?? undefined,
          swift: detail.swift ?? undefined,
        }))
      : [],
  };
}

type AppProviderProps = {
  children: ReactNode;
};

export function AppProvider({ children }: AppProviderProps) {
  const [role, setRole] = useState<UserRole>('guest');
  const [loading, setLoading] = useState<boolean>(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [reliefFunds, setReliefFunds] = useState<ReliefFund[]>([]);

  const loadFeeds = useCallback(async () => {
    const feedResponse = await api.fetchFeeds();
    const feeds = feedResponse.data ?? [];
    const commentsByFeed = await Promise.all(
      feeds.map(async (feed) => {
        try {
          const res = await api.fetchComments(feed._id);
          return res.data?.map(mapComment) ?? [];
        } catch (error) {
          console.warn('Failed to fetch comments for feed', feed._id, error);
          return [];
        }
      }),
    );

    const mapped = feeds.map((feed, index) => mapFeedToPost(feed, commentsByFeed[index] ?? []));
    setPosts(mapped);
  }, []);

  const loadEvents = useCallback(async () => {
    const response = await api.fetchEvents();
    setEvents((response.data ?? []).map(mapEvent));
  }, []);

  const loadMedia = useCallback(async () => {
    const response = await api.fetchMedia();
    setMedia((response.data ?? []).map(mapMedia));
  }, []);

  const loadMembers = useCallback(async () => {
    const response = await api.fetchMembers();
    setMembers((response.data ?? []).map(mapMember));
  }, []);

  const loadCollections = useCallback(async () => {
    const response = await api.fetchCollections();
    setDonations((response.data ?? []).map(mapCollection));
  }, []);

  const loadReliefFunds = useCallback(async () => {
    try {
      // The backend does not expose explicit relief routes yet; reuse collections
      setReliefFunds([]);
    } catch (error) {
      console.warn('Relief fund load skipped', error);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadFeeds(), loadEvents(), loadMedia(), loadMembers(), loadCollections(), loadReliefFunds()]);
    } finally {
      setLoading(false);
    }
  }, [loadFeeds, loadEvents, loadMedia, loadMembers, loadCollections, loadReliefFunds]);

  useEffect(() => {
    refresh().catch((error) => console.error('Initial data load failed', error));
  }, [refresh]);

  const addPost = useCallback<AppContextValue['addPost']>(
    async ({ title, content, media: mediaFile }) => {
      const response = await api.createFeed({ title, description: content, media: mediaFile ?? undefined });
      const feed = response.data;
      let comments: Comment[] = [];
      try {
        const commentRes = await api.fetchComments(feed._id);
        comments = (commentRes.data ?? []).map(mapComment);
      } catch (error) {
        console.warn('Unable to fetch comments for new feed', error);
      }
      setPosts((prev) => [mapFeedToPost(feed, comments), ...prev]);
    },
    [],
  );

  const deletePost = useCallback<AppContextValue['deletePost']>(async (postId) => {
    await api.deleteFeed(postId);
    setPosts((prev) => prev.filter((post) => post.id !== postId));
  }, []);

  const addCommentToPost = useCallback<AppContextValue['addCommentToPost']>(async (postId, { message, author }) => {
    const post = posts.find((item) => item.id === postId);
    if (!post) {
      return;
    }

    await api.createComment({ feedId: postId, text: message, userId: author });
    const commentRes = await api.fetchComments(postId);
    const comments = (commentRes.data ?? []).map(mapComment);
    setPosts((prev) => prev.map((item) => (item.id === postId ? { ...item, comments } : item)));
  }, [posts]);

  const addEvent = useCallback<AppContextValue['addEvent']>(
    async ({ title, description, startsAt, location, coverImage }) => {
      const response = await api.createEvent({ title, description, startsAt, location, coverImage });
      setEvents((prev) => [mapEvent(response.data), ...prev]);
    },
    [],
  );

  const deleteEvent = useCallback<AppContextValue['deleteEvent']>(async (eventId) => {
    await api.deleteEvent(eventId);
    setEvents((prev) => prev.filter((event) => event.id !== eventId));
  }, []);

  const addMedia = useCallback<AppContextValue['addMedia']>(
    async ({ title, description, file, type }) => {
      let uploadFile: FileDescriptor | null = file ?? null;
      if (type === 'video' && file?.uri?.startsWith('http')) {
        uploadFile = null;
      }

      const response = await api.createMedia({ title, media: uploadFile ?? undefined });
      const mapped = mapMedia({ ...response.data, description, title });
      setMedia((prev) => [mapped, ...prev]);
    },
    [],
  );

  const deleteMedia = useCallback<AppContextValue['deleteMedia']>(async (mediaId) => {
    await api.deleteMedia(mediaId);
    setMedia((prev) => prev.filter((item) => item.id !== mediaId));
  }, []);

  const addOrUpdateMember = useCallback<AppContextValue['addOrUpdateMember']>(
    async ({ id, name, email, phoneNumber, roleLabel, status, avatar: avatarFile }) => {
      const payload = {
        userName: name,
        email,
        role: roleLabel ?? status,
        phoneNumber,
        media: avatarFile ?? undefined,
      };

      let response;
      if (id) {
        response = await api.updateMember(id, payload);
      } else {
        response = await api.createMember(payload);
      }

      const member = mapMember(response.data);
      member.status = status;

      setMembers((prev) => {
        const exists = prev.some((item) => item.id === member.id);
        if (exists) {
          return prev.map((item) => (item.id === member.id ? member : item));
        }
        return [member, ...prev];
      });
    },
    [],
  );

  const removeMember = useCallback<AppContextValue['removeMember']>(async (memberId) => {
    await api.deleteMember(memberId);
    setMembers((prev) => prev.filter((member) => member.id !== memberId));
    setDonations((prev) => prev.filter((donation) => donation.memberId !== memberId));
  }, []);

  const logDonation = useCallback<AppContextValue['logDonation']>(
    async ({ memberId, amount, month, status }) => {
      const payload = {
        memberId,
        bhawanAmount: amount,
        date: month,
        monthlyAmount: status ?? (amount > 0 ? 'Paid' : 'Pending'),
      };
      const response = await api.createCollection(payload);
      const mapped = mapCollection(response.data);
      setDonations((prev) => [mapped, ...prev]);
    },
    [],
  );

  const updateDonation = useCallback<AppContextValue['updateDonation']>(
    async ({ id, amount, month, status }) => {
      const payload = {
        collectionId: id,
        bhawanAmount: amount,
        date: month,
        monthlyAmount: status ?? (amount > 0 ? 'Paid' : 'Pending'),
      };
      const response = await api.updateCollection(payload);
      const mapped = mapCollection(response.data);
      setDonations((prev) => prev.map((item) => (item.id === mapped.id ? mapped : item)));
    },
    [],
  );

  const removeDonation = useCallback<AppContextValue['removeDonation']>(async (donationId) => {
    await api.deleteCollection(donationId);
    setDonations((prev) => prev.filter((item) => item.id !== donationId));
  }, []);

  const addOrUpdateReliefFund = useCallback<AppContextValue['addOrUpdateReliefFund']>(async () => {
    console.warn('Relief fund management is not supported by the backend yet.');
  }, []);

  const removeReliefFund = useCallback<AppContextValue['removeReliefFund']>(async () => {
    console.warn('Relief fund removal is not supported by the backend yet.');
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      loading,
      role,
      setRole,
      refresh,
      posts,
      addPost,
      deletePost,
      addCommentToPost,
      events,
      addEvent,
      deleteEvent,
      media,
      addMedia,
      deleteMedia,
      members,
      addOrUpdateMember,
      removeMember,
      donations,
      logDonation,
      updateDonation,
      removeDonation,
      reliefFunds,
      addOrUpdateReliefFund,
      removeReliefFund,
    }),
    [
      loading,
      role,
      refresh,
      posts,
      addPost,
      deletePost,
      addCommentToPost,
      events,
      addEvent,
      deleteEvent,
      media,
      addMedia,
      deleteMedia,
      members,
      addOrUpdateMember,
      removeMember,
      donations,
      logDonation,
      updateDonation,
      removeDonation,
      reliefFunds,
      addOrUpdateReliefFund,
      removeReliefFund,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

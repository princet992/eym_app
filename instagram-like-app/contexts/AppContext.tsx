import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

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
  monthlyContribution: number;
  status: 'active' | 'pending' | 'inactive';
  avatar?: string;
};

export type DonationRecord = {
  id: string;
  memberId: string;
  amount: number;
  month: string;
  notedBy: string;
};

type ReliefBankDetail = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifsc?: string;
  swift?: string;
};

export type ReliefFund = {
  id: string;
  title: string;
  description: string;
  goal: number;
  raised: number;
  bankDetails: ReliefBankDetail[];
  contactEmail?: string;
};

type AppContextValue = {
  role: UserRole;
  setRole: (role: UserRole) => void;
  posts: Post[];
  addPost: (post: Omit<Post, 'id' | 'comments'>) => void;
  addCommentToPost: (postId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => void;
  events: Event[];
  addEvent: (event: Omit<Event, 'id'>) => void;
  media: MediaItem[];
  addMedia: (media: Omit<MediaItem, 'id'>) => void;
  members: Member[];
  addOrUpdateMember: (member: Omit<Member, 'id'> & { id?: string }) => void;
  removeMember: (memberId: string) => void;
  donations: DonationRecord[];
  logDonation: (record: Omit<DonationRecord, 'id'>) => void;
  updateDonation: (donationId: string, updates: Partial<Omit<DonationRecord, 'id'>>) => void;
  removeDonation: (donationId: string) => void;
  reliefFunds: ReliefFund[];
  addOrUpdateReliefFund: (fund: Omit<ReliefFund, 'id' | 'raised'> & { id?: string; raised?: number }) => void;
  removeReliefFund: (fundId: string) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

const createId = () => Math.random().toString(36).slice(2, 11);

const initialPosts: Post[] = [
  {
    id: 'post-1',
    title: 'Community Outreach Success',
    content:
      'We had an amazing turnout for last week’s outreach. Thank you to everyone who volunteered their time and energy!',
    image:
      'https://images.unsplash.com/photo-1515165562835-c4c2b1c3d3c9?auto=format&fit=crop&w=900&q=60',
    comments: [
      {
        id: 'comment-1',
        author: 'Leslie',
        message: 'So proud of our community!',
        createdAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'post-2',
    title: 'New Scholarship Opportunity',
    content:
      'Applications are now open for the 2026 Youth Leadership Scholarship. Check the events tab for information sessions.',
    comments: [],
  },
];

const initialEvents: Event[] = [
  {
    id: 'event-1',
    title: 'Fundraising Gala',
    description: 'An evening of celebration and fundraising for our youth mentorship program.',
    startsAt: new Date().toISOString(),
    location: 'Downtown Community Center',
    coverImage:
      'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=60',
  },
  {
    id: 'event-2',
    title: 'Volunteer Orientation',
    description: 'Required orientation session for all new volunteers and members.',
    startsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
    location: 'Main Hall A',
  },
];

const initialMedia: MediaItem[] = [
  {
    id: 'media-1',
    type: 'image',
    title: 'Gala Highlights',
    url: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=60',
    description: 'A snapshot from the 2024 gala.',
  },
  {
    id: 'media-2',
    type: 'video',
    title: 'Volunteer Stories',
    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    description: 'Hear from our volunteers about their experiences.',
  },
];

const initialMembers: Member[] = [
  {
    id: 'member-1',
    name: 'Alex Johnson',
    email: 'alex@example.com',
    monthlyContribution: 50,
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=400&q=60',
  },
  {
    id: 'member-2',
    name: 'Maria Chen',
    email: 'maria@example.com',
    monthlyContribution: 25,
    status: 'pending',
  },
];

const initialDonations: DonationRecord[] = [
  {
    id: 'donation-1',
    memberId: 'member-1',
    amount: 50,
    month: '2025-10',
    notedBy: 'Admin',
  },
];

const initialReliefFunds: ReliefFund[] = [
  {
    id: 'fund-1',
    title: 'Flood Relief 2025',
    description:
      'Raising emergency support for families displaced by the recent floods. Funds will be used for housing, food, and medical supplies.',
    goal: 25000,
    raised: 11250,
    bankDetails: [
      {
        bankName: 'National Cooperative Bank',
        accountName: 'EYM Disaster Relief',
        accountNumber: '1234567890',
        ifsc: 'NCBL0001234',
      },
      {
        bankName: 'City Credit Union',
        accountName: 'EYM Relief USD',
        accountNumber: '9988776655',
        swift: 'CCUSUS44',
      },
    ],
    contactEmail: 'relief@eym.org',
  },
];

type AppProviderProps = {
  children: ReactNode;
};

export function AppProvider({ children }: AppProviderProps) {
  const [role, setRole] = useState<UserRole>('guest');
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [media, setMedia] = useState<MediaItem[]>(initialMedia);
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [donations, setDonations] = useState<DonationRecord[]>(initialDonations);
  const [reliefFunds, setReliefFunds] = useState<ReliefFund[]>(initialReliefFunds);

  const addPost = (post: Omit<Post, 'id' | 'comments'>) => {
    setPosts((prev) => [
      {
        ...post,
        id: createId(),
        comments: [],
      },
      ...prev,
    ]);
  };

  const addCommentToPost = (postId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: [
                ...post.comments,
                {
                  ...comment,
                  id: createId(),
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : post,
      ),
    );
  };

  const addEvent = (event: Omit<Event, 'id'>) => {
    setEvents((prev) => [
      {
        ...event,
        id: createId(),
      },
      ...prev,
    ]);
  };

  const addMedia = (item: Omit<MediaItem, 'id'>) => {
    setMedia((prev) => [
      {
        ...item,
        id: createId(),
      },
      ...prev,
    ]);
  };

  const addOrUpdateMember = (member: Omit<Member, 'id'> & { id?: string }) => {
    setMembers((prev) => {
      if (member.id) {
        return prev.map((existing) => (existing.id === member.id ? { ...existing, ...member } : existing));
      }
      return [
        ...prev,
        {
          ...member,
          id: createId(),
        },
      ];
    });
  };

  const removeMember = (memberId: string) => {
    setMembers((prev) => prev.filter((member) => member.id !== memberId));
    setDonations((prev) => prev.filter((donation) => donation.memberId !== memberId));
  };

  const logDonation = (record: Omit<DonationRecord, 'id'>) => {
    setDonations((prev) => [
      ...prev,
      {
        ...record,
        id: createId(),
      },
    ]);
  };

  const updateDonation = (donationId: string, updates: Partial<Omit<DonationRecord, 'id'>>) => {
    setDonations((prev) =>
      prev.map((donation) => (donation.id === donationId ? { ...donation, ...updates } : donation)),
    );
  };

  const removeDonation = (donationId: string) => {
    setDonations((prev) => prev.filter((donation) => donation.id !== donationId));
  };

  const addOrUpdateReliefFund = (fund: Omit<ReliefFund, 'id' | 'raised'> & { id?: string; raised?: number }) => {
    setReliefFunds((prev) => {
      if (fund.id) {
        return prev.map((existing) => (existing.id === fund.id ? { ...existing, ...fund } : existing));
      }
      return [
        ...prev,
        {
          ...fund,
          id: createId(),
          raised: fund.raised ?? 0,
        },
      ];
    });
  };

  const removeReliefFund = (fundId: string) => {
    setReliefFunds((prev) => prev.filter((fund) => fund.id !== fundId));
  };

  const value = useMemo<AppContextValue>(
    () => ({
      role,
      setRole,
      posts,
      addPost,
      addCommentToPost,
      events,
      addEvent,
      media,
      addMedia,
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
      role,
      posts,
      events,
      media,
      members,
      donations,
      reliefFunds,
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

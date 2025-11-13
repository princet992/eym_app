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
};

export type DonationRecord = {
  id: string;
  memberId: string;
  amount: number;
  month: string;
  notedBy: string;
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
  donations: DonationRecord[];
  logDonation: (record: Omit<DonationRecord, 'id'>) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

const createId = () => Math.random().toString(36).slice(2, 11);

const initialPosts: Post[] = [
  {
    id: 'post-1',
    title: 'Community Outreach Success',
    content:
      'We had an amazing turnout for last week’s outreach. Thank you to everyone who volunteered their time and energy!',
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
  { id: 'member-1', name: 'Alex Johnson', email: 'alex@example.com', monthlyContribution: 50, status: 'active' },
  { id: 'member-2', name: 'Maria Chen', email: 'maria@example.com', monthlyContribution: 25, status: 'pending' },
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

  const logDonation = (record: Omit<DonationRecord, 'id'>) => {
    setDonations((prev) => [
      ...prev,
      {
        ...record,
        id: createId(),
      },
    ]);
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
      donations,
      logDonation,
    }),
    [role, posts, events, media, members, donations],
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

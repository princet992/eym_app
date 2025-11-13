import { Platform } from 'react-native';

export const API_BASE_URL = 'https://eym-sandha.onrender.com';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

type FetchOptions = {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: BodyInit | null;
};

async function request<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: options.headers,
    body: options.body ?? null,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request to ${path} failed with status ${response.status}`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return (await response.json()) as T;
  }

  return (await response.text()) as unknown as T;
}

type FileDescriptor = {
  uri: string;
  name?: string;
  type?: string;
};

function appendFile(form: FormData, field: string, file?: FileDescriptor | null) {
  if (!file?.uri) {
    return;
  }

  const uri = Platform.OS === 'ios' ? file.uri.replace('file://', '') : file.uri;
  const name = file.name ?? uri.split('/').pop() ?? 'upload.jpg';
  const type = file.type ?? 'image/jpeg';

  form.append(field, {
    uri: file.uri,
    name,
    type,
  } as unknown as Blob);
}

export const api = {
  register(form: FormData) {
    return request<{ success: boolean; token?: string }>('/register', { method: 'POST', body: form });
  },
  login(credentials: { email: string; password: string }) {
    return request<{ success: boolean; token?: string; user?: unknown }>('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
  },

  fetchFeeds() {
    return request<{ success: boolean; data: any[] }>('/feeds');
  },
  createFeed(payload: { title: string; description: string; category?: string; media?: FileDescriptor | null }) {
    const form = new FormData();
    form.append('title', payload.title);
    form.append('description', payload.description);
    form.append('category', payload.category ?? 'General');
    appendFile(form, 'media', payload.media);
    return request<{ success: boolean; data: any }>('/feeds', { method: 'POST', body: form });
  },
  deleteFeed(feedId: string) {
    return request<{ success: boolean; message?: string }>(`/feeds/${feedId}`, { method: 'DELETE' });
  },
  fetchComments(feedId: string) {
    return request<{ success: boolean; data: any[] }>(`/comments/${feedId}`);
  },
  createComment(payload: { feedId: string; userId?: string; text: string }) {
    return request<{ success: boolean; data: any }>('/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },
  deleteComment(commentId: string) {
    return request<{ success: boolean; message?: string }>(`/comments/${commentId}`, { method: 'DELETE' });
  },
  toggleLike(feedId: string, userId?: string) {
    return request<{ success: boolean; data: any }>(`/like/${feedId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
  },

  fetchEvents() {
    return request<{ success: boolean; data: any[] }>('/events');
  },
  createEvent(payload: {
    title: string;
    description: string;
    startsAt: string;
    location: string;
    coverImage?: FileDescriptor | null;
  }) {
    const form = new FormData();
    form.append('title', payload.title);
    form.append('description', payload.description);
    form.append('date', payload.startsAt);
    form.append('location', payload.location);
    appendFile(form, 'cover', payload.coverImage);
    return request<{ success: boolean; data: any }>('/events', { method: 'POST', body: form });
  },
  updateEvent(eventId: string, payload: {
    title: string;
    description: string;
    startsAt: string;
    location: string;
    coverImage?: FileDescriptor | null;
  }) {
    const form = new FormData();
    form.append('title', payload.title);
    form.append('description', payload.description);
    form.append('date', payload.startsAt);
    form.append('location', payload.location);
    appendFile(form, 'cover', payload.coverImage);
    return request<{ success: boolean; data: any }>(`/events/${eventId}`, { method: 'PUT', body: form });
  },
  deleteEvent(eventId: string) {
    return request<{ success: boolean; message?: string }>(`/events/${eventId}`, { method: 'DELETE' });
  },

  fetchMedia() {
    return request<{ success: boolean; data: any[] }>('/getMedia/');
  },
  createMedia(payload: { title?: string; category?: string; media?: FileDescriptor | null }) {
    const form = new FormData();
    form.append('title', payload.title ?? '');
    form.append('category', payload.category ?? 'General');
    appendFile(form, 'media', payload.media);
    return request<{ success: boolean; data: any }>('/createMedia', { method: 'POST', body: form });
  },
  deleteMedia(mediaId: string) {
    return request<{ success: boolean; message?: string }>(`/deleteMedia/${mediaId}`, { method: 'DELETE' });
  },

  fetchMembers() {
    return request<{ success: boolean; count?: number; data: any[] }>('/members/');
  },
  createMember(payload: { userName: string; email: string; role: string; phoneNumber?: string; media?: FileDescriptor | null }) {
    const form = new FormData();
    form.append('userName', payload.userName);
    form.append('email', payload.email);
    form.append('role', payload.role);
    if (payload.phoneNumber) form.append('phoneNumber', payload.phoneNumber);
    appendFile(form, 'media', payload.media);
    return request<{ success: boolean; data: any }>('/members', { method: 'POST', body: form });
  },
  updateMember(memberId: string, payload: { userName: string; email: string; role: string; phoneNumber?: string; media?: FileDescriptor | null }) {
    const form = new FormData();
    form.append('userName', payload.userName);
    form.append('email', payload.email);
    form.append('role', payload.role);
    if (payload.phoneNumber) form.append('phoneNumber', payload.phoneNumber);
    appendFile(form, 'media', payload.media);
    return request<{ success: boolean; data: any }>(`/members/${memberId}`, { method: 'PUT', body: form });
  },
  deleteMember(memberId: string) {
    return request<{ success: boolean; message?: string }>(`/members/${memberId}`, { method: 'DELETE' });
  },

  fetchCollections() {
    return request<{ success: boolean; data: any[]; message?: string }>('/collections/');
  },
  createCollection(payload: { memberId: string; date?: string; monthlyAmount?: string; bhawanAmount?: number }) {
    return request<{ success: boolean; data: any }>('/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },
  updateCollection(payload: { collectionId: string; monthlyAmount?: string; bhawanAmount?: number; date?: string }) {
    return request<{ success: boolean; data: any }>('/collections', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },
  deleteCollection(collectionId: string) {
    return request<{ success: boolean; message?: string }>(`/collections/${collectionId}`, { method: 'DELETE' });
  },
};

export type { FileDescriptor };

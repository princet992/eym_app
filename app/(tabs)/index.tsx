import { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { RoleSwitcher } from '../../components/RoleSwitcher';
import { useApp } from '../../contexts/AppContext';

export default function PostsScreen() {
  const { posts, addPost, addCommentToPost, role } = useApp();
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const canCreatePost = role === 'admin';

  const authorLabel = useMemo(() => {
    if (role === 'admin') return 'Admin';
    if (role === 'member') return 'Member';
    return 'Community Guest';
  }, [role]);

  const handleCreatePost = () => {
    if (!postTitle.trim() || !postContent.trim()) {
      return;
    }
    addPost({
      title: postTitle.trim(),
      content: postContent.trim(),
    });
    setPostTitle('');
    setPostContent('');
  };

  const handleComment = (postId: string) => {
    const draft = commentDrafts[postId];
    if (!draft || !draft.trim()) {
      return;
    }
    addCommentToPost(postId, {
      author: authorLabel,
      message: draft.trim(),
    });
    setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <RoleSwitcher />

        {canCreatePost && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Create an update</Text>
            <TextInput
              placeholder="Post title"
              value={postTitle}
              onChangeText={setPostTitle}
              style={styles.input}
            />
            <TextInput
              placeholder="Share what's new"
              value={postContent}
              onChangeText={setPostContent}
              style={[styles.input, styles.multilineInput]}
              multiline
            />
            <Text style={styles.primaryButton} onPress={handleCreatePost}>
              Publish post
            </Text>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest posts</Text>
          <Text style={styles.sectionSubtitle}>Updates authored by the admin team</Text>
        </View>

        {posts.map((post) => (
          <View key={post.id} style={styles.card}>
            <Text style={styles.postTitle}>{post.title}</Text>
            <Text style={styles.postContent}>{post.content}</Text>
            <View style={styles.commentsHeader}>
              <Text style={styles.cardSubtitle}>Comments</Text>
              <Text style={styles.commentCount}>{post.comments.length}</Text>
            </View>
            {post.comments.map((comment) => (
              <View key={comment.id} style={styles.comment}>
                <Text style={styles.commentAuthor}>{comment.author}</Text>
                <Text style={styles.commentMessage}>{comment.message}</Text>
                <Text style={styles.commentDate}>{new Date(comment.createdAt).toLocaleString()}</Text>
              </View>
            ))}
            <View style={styles.commentComposer}>
              <TextInput
                placeholder="Add a comment"
                value={commentDrafts[post.id] ?? ''}
                onChangeText={(value) => setCommentDrafts((prev) => ({ ...prev, [post.id]: value }))}
                style={[styles.input, styles.commentInput]}
              />
              <Text style={styles.secondaryButton} onPress={() => handleComment(post.id)}>
                Post comment
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  container: {
    padding: 16,
    gap: 16,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cardSubtitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  postTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  postContent: {
    fontSize: 16,
    lineHeight: 22,
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  commentComposer: {
    gap: 8,
  },
  comment: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    gap: 4,
    backgroundColor: '#f9fafb',
  },
  commentAuthor: {
    fontWeight: '600',
  },
  commentMessage: {
    fontSize: 15,
    color: '#374151',
  },
  commentDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  commentInput: {
    backgroundColor: '#fff',
  },
  primaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#2563eb',
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    fontWeight: '600',
    overflow: 'hidden',
  },
  secondaryButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#111827',
    color: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    fontWeight: '600',
    overflow: 'hidden',
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentCount: {
    backgroundColor: '#e0e7ff',
    color: '#1d4ed8',
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
});

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useApp, UserRole } from '@/contexts/AppContext';
import { Colors } from '@/constants/theme';

const roles: UserRole[] = ['admin', 'member', 'guest'];

export function RoleSwitcher() {
  const { role, setRole } = useApp();

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Viewing as:</Text>
      <View style={styles.roleRow}>
        {roles.map((item) => {
          const isActive = item === role;
          return (
            <Pressable
              key={item}
              style={[styles.roleChip, isActive && styles.activeRoleChip]}
              onPress={() => setRole(item)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}>
              <Text style={[styles.roleText, isActive && styles.activeRoleText]}>{item}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  label: {
    fontWeight: '600',
    fontSize: 16,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleChip: {
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  activeRoleChip: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  roleText: {
    fontSize: 14,
    textTransform: 'capitalize',
    color: '#4b5563',
    fontWeight: '600',
  },
  activeRoleText: {
    color: '#fff',
  },
});


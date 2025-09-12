import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  FlatList,
  Modal,
  Alert,
  ActivityIndicator
} from 'react-native';
import { parseDueDate, computeStatusFromTimestamp, apiGet, apiPost, apiPut, apiDelete } from '../lib/core';

type Reminder = {
  id?: number;
  title: string;
  dueDate: string;
  timestamp?: number | null;
  status: 'pending' | 'soon' | 'overdue' | 'completed';
  createdAt?: number;
};

type Props = {
  navigation: { goBack: () => void };
};

export default function RemindersScreen({ navigation }: Props) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      const result = await apiGet('reminders');
      if (Array.isArray(result)) {
        const processed = result.map((r: any) => ({
          id: r.id,
          title: r.title || '',
          dueDate: r.dueDate || '',
          timestamp: r.timestamp,
          status: r.status || computeStatusFromTimestamp(r.timestamp, r.dueDate),
          createdAt: r.createdAt
        }));
        setReminders(processed);
      }
    } catch (e) {
      console.warn('Failed to load reminders:', e);
    } finally {
      setLoading(false);
    }
  };

  const createReminder = async () => {
    if (!newTitle.trim() || !newDueDate.trim()) {
      Alert.alert('Error', 'Please enter both title and due date.');
      return;
    }

    const parsed = parseDueDate(newDueDate);
    const reminder: Omit<Reminder, 'id'> = {
      title: newTitle.trim(),
      dueDate: parsed.display,
      timestamp: parsed.timestamp,
      status: computeStatusFromTimestamp(parsed.timestamp, parsed.display),
      createdAt: Date.now()
    };

    try {
      const result = await apiPost('reminders', reminder);
      if (result && result.id) {
        const newReminder = { ...reminder, id: result.id };
        setReminders(prev => [newReminder, ...prev]);
      }
      setShowCreateModal(false);
      setNewTitle('');
      setNewDueDate('');
    } catch (e) {
      Alert.alert('Error', 'Failed to create reminder.');
    }
  };


  const toggleComplete = async (reminder: Reminder) => {
    if (!reminder.id) return;

    const newStatus: Reminder['status'] = reminder.status === 'completed' ? 'pending' : 'completed';
    const updated: Reminder = { ...reminder, status: newStatus };

    // Optimistic update
    setReminders(prev => prev.map(r => r.id === reminder.id ? updated : r));

    try {
      await apiPut(`reminders/${reminder.id}`, {
        status: newStatus,
        completedAt: newStatus === 'completed' ? Date.now() : null
      });
    } catch (e) {
      // Revert on error
      setReminders(prev => prev.map(r => r.id === reminder.id ? reminder : r));
      Alert.alert('Error', 'Failed to update reminder.');
    }
  };

  const deleteReminder = async (reminder: Reminder) => {
    if (!reminder.id) return;

    Alert.alert(
      'Delete Reminder',
      `Delete "${reminder.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Optimistic update
            setReminders(prev => prev.filter(r => r.id !== reminder.id));

            try {
              await apiDelete(`reminders/${reminder.id}`);
            } catch (e) {
              // Revert on error
              setReminders(prev => [reminder, ...prev]);
              Alert.alert('Error', 'Failed to delete reminder.');
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue': return '#dc3545';
      case 'soon': return '#ffc107';
      case 'completed': return '#28a745';
      default: return '#6c757d';
    }
  };

  const renderReminder = ({ item }: { item: Reminder }) => (
    <View style={styles.reminderItem}>
      <Pressable
        style={styles.reminderContent}
        onPress={() => toggleComplete(item)}
        onLongPress={() => deleteReminder(item)}
      >
        <View style={styles.reminderHeader}>
          <Text style={[styles.reminderTitle, item.status === 'completed' && styles.completedText]}>
            {item.title}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>
        <Text style={[styles.reminderDate, item.status === 'completed' && styles.completedText]}>
          {item.dueDate}
        </Text>
      </Pressable>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingText}>Loading reminders...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reminders</Text>
        <Pressable style={styles.addButton} onPress={() => setShowCreateModal(true)}>
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      </View>

      <FlatList
        data={reminders}
        keyExtractor={(item) => item.id?.toString() || item.title}
        renderItem={renderReminder}
        style={styles.list}
        contentContainerStyle={reminders.length === 0 && styles.emptyContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No reminders yet</Text>
            <Text style={styles.emptySubtitle}>Create your first reminder to get started</Text>
          </View>
        }
      />

      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Reminder</Text>

            <TextInput
              style={styles.input}
              placeholder="Reminder title"
              value={newTitle}
              onChangeText={setNewTitle}
              autoFocus
            />

            <TextInput
              style={styles.input}
              placeholder="Due date (e.g., 'tomorrow 3pm', 'in 2 hours')"
              value={newDueDate}
              onChangeText={setNewDueDate}
            />

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowCreateModal(false);
                  setNewTitle('');
                  setNewDueDate('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.createButton]}
                onPress={createReminder}
              >
                <Text style={styles.createButtonText}>Create</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)'
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0b1220'
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center'
  },
  addButtonText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: '300'
  },
  list: {
    flex: 1
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyState: {
    alignItems: 'center',
    padding: 40
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0b1220',
    marginBottom: 8
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center'
  },
  reminderItem: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  reminderContent: {
    padding: 16
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0b1220',
    flex: 1,
    marginRight: 12
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#6c757d'
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff'
  },
  reminderDate: {
    fontSize: 14,
    color: '#6c757d'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0b1220',
    marginBottom: 20,
    textAlign: 'center'
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)'
  },
  cancelButtonText: {
    color: '#6c757d',
    fontWeight: '600'
  },
  createButton: {
    backgroundColor: '#4f46e5'
  },
  createButtonText: {
    color: '#ffffff',
    fontWeight: '600'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d'
  }
});
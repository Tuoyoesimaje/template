import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator
} from 'react-native';
import { renderMarkdown } from '../lib/markdown';
import { apiGet, apiPost, apiPut, postGemini } from '../lib/core';

type Note = {
  id?: number;
  title: string;
  content: string;
  created_at?: string;
  updated_at?: string;
};

type Props = {
  navigation: { goBack: () => void };
};

export default function NotesEditorScreen({ navigation }: Props) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState<Note>({ title: '', content: '' });
  const [showPreview, setShowPreview] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [titleSuggestions, setTitleSuggestions] = useState<Note[]>([]);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const result = await apiGet('notes');
      if (Array.isArray(result)) {
        setNotes(result);
      }
    } catch (e) {
      console.warn('Failed to load notes:', e);
    } finally {
      setLoading(false);
    }
  };

  const saveNote = async () => {
    if (!currentNote.title.trim() || !currentNote.content.trim()) {
      Alert.alert('Error', 'Please enter both title and content.');
      return;
    }

    try {
      let result;
      if (currentNote.id) {
        // Update existing note
        result = await apiPut(`notes/${currentNote.id}`, {
          title: currentNote.title.trim(),
          content: currentNote.content.trim()
        });
      } else {
        // Create new note
        result = await apiPost('notes', {
          title: currentNote.title.trim(),
          content: currentNote.content.trim()
        });
      }

      if (result && result.id) {
        const savedNote = {
          ...currentNote,
          id: result.id,
          created_at: result.created_at,
          updated_at: result.updated_at
        };

        if (currentNote.id) {
          setNotes(prev => prev.map(n => n.id === currentNote.id ? savedNote : n));
        } else {
          setNotes(prev => [savedNote, ...prev]);
        }

        Alert.alert('Success', 'Note saved successfully!');
        setCurrentNote({ title: '', content: '' });
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to save note.');
    }
  };

  const generateNote = async () => {
    if (!currentNote.title.trim()) {
      Alert.alert('Error', 'Please enter a title first.');
      return;
    }

    setGenerating(true);
    try {
      const prompt = `Generate detailed study notes about: ${currentNote.title}. Include key concepts, examples, and important details. Format as clean, readable markdown.`;
      const response = await postGemini({
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });

      setCurrentNote(prev => ({ ...prev, content: response }));
    } catch (e) {
      Alert.alert('Error', 'Failed to generate note content.');
    } finally {
      setGenerating(false);
    }
  };

  const loadNote = (note: Note) => {
    setCurrentNote({
      id: note.id,
      title: note.title,
      content: note.content
    });
    setShowSuggestions(false);
  };

  const updateTitleSuggestions = (title: string) => {
    if (!title.trim()) {
      setTitleSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const matches = notes.filter(note =>
      note.title.toLowerCase().includes(title.toLowerCase())
    );
    setTitleSuggestions(matches);
    setShowSuggestions(matches.length > 0);
  };

  const clearEditor = () => {
    setCurrentNote({ title: '', content: '' });
    setShowSuggestions(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingText}>Loading notes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notes Editor</Text>
        <View style={styles.headerButtons}>
          <Pressable
            style={[styles.headerButton, showPreview && styles.headerButtonActive]}
            onPress={() => setShowPreview(!showPreview)}
          >
            <Text style={[styles.headerButtonText, showPreview && styles.headerButtonTextActive]}>
              👁️
            </Text>
          </Pressable>
          <Pressable style={styles.headerButton} onPress={clearEditor}>
            <Text style={styles.headerButtonText}>🗑️</Text>
          </Pressable>
          <Pressable style={styles.headerButton} onPress={saveNote}>
            <Text style={styles.headerButtonText}>💾</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.editorContainer}>
        <View style={styles.titleContainer}>
          <TextInput
            style={styles.titleInput}
            placeholder="Note title"
            value={currentNote.title}
            onChangeText={(text) => {
              setCurrentNote(prev => ({ ...prev, title: text }));
              updateTitleSuggestions(text);
            }}
          />

          {showSuggestions && (
            <View style={styles.suggestionsContainer}>
              <FlatList
                data={titleSuggestions}
                keyExtractor={(item) => item.id?.toString() || item.title}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.suggestionItem}
                    onPress={() => loadNote(item)}
                  >
                    <Text style={styles.suggestionTitle}>{item.title}</Text>
                    <Text style={styles.suggestionDate}>
                      {item.updated_at ? new Date(item.updated_at).toLocaleDateString() : ''}
                    </Text>
                  </Pressable>
                )}
                style={styles.suggestionsList}
              />
            </View>
          )}
        </View>

        <View style={styles.contentContainer}>
          {showPreview ? (
            <ScrollView style={styles.previewContainer}>
              <Text style={styles.previewText}>
                {renderMarkdown(currentNote.content)}
              </Text>
            </ScrollView>
          ) : (
            <TextInput
              style={styles.contentInput}
              placeholder="Write your note in markdown..."
              value={currentNote.content}
              onChangeText={(text) => setCurrentNote(prev => ({ ...prev, content: text }))}
              multiline
              textAlignVertical="top"
            />
          )}
        </View>

        <View style={styles.toolbar}>
          <Pressable
            style={[styles.toolbarButton, generating && styles.toolbarButtonDisabled]}
            onPress={generateNote}
            disabled={generating}
          >
            {generating ? (
              <ActivityIndicator size="small" color="#4f46e5" />
            ) : (
              <Text style={styles.toolbarButtonText}>🤖 Generate</Text>
            )}
          </Pressable>
          <Pressable style={styles.toolbarButton} onPress={saveNote}>
            <Text style={styles.toolbarButtonText}>💾 Save</Text>
          </Pressable>
        </View>
      </View>

      <Modal visible={showSuggestions && titleSuggestions.length === 0} animationType="fade" transparent>
        <Pressable
          style={styles.allNotesOverlay}
          onPress={() => setShowSuggestions(false)}
        >
          <View style={styles.allNotesContainer}>
            <Text style={styles.allNotesTitle}>All Notes</Text>
            <FlatList
              data={notes}
              keyExtractor={(item) => item.id?.toString() || item.title}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.noteItem}
                  onPress={() => loadNote(item)}
                >
                  <Text style={styles.noteTitle}>{item.title}</Text>
                  <Text style={styles.noteDate}>
                    {item.updated_at ? new Date(item.updated_at).toLocaleDateString() : ''}
                  </Text>
                </Pressable>
              )}
              style={styles.allNotesList}
            />
          </View>
        </Pressable>
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
    fontSize: 20,
    fontWeight: '700',
    color: '#0b1220'
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerButtonActive: {
    backgroundColor: '#4f46e5'
  },
  headerButtonText: {
    fontSize: 16
  },
  headerButtonTextActive: {
    color: '#ffffff'
  },
  editorContainer: {
    flex: 1,
    padding: 16
  },
  titleContainer: {
    marginBottom: 16
  },
  titleInput: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    fontWeight: '600',
    backgroundColor: '#ffffff'
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
    maxHeight: 200,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5
  },
  suggestionsList: {
    maxHeight: 200
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  suggestionTitle: {
    fontSize: 16,
    color: '#0b1220',
    flex: 1
  },
  suggestionDate: {
    fontSize: 12,
    color: '#6c757d'
  },
  contentContainer: {
    flex: 1,
    marginBottom: 16
  },
  contentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    textAlignVertical: 'top'
  },
  previewContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#ffffff'
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12
  },
  toolbarButton: {
    flex: 1,
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  toolbarButtonDisabled: {
    backgroundColor: '#9aa0ff'
  },
  toolbarButtonText: {
    color: '#ffffff',
    fontWeight: '600'
  },
  allNotesOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  allNotesContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '70%'
  },
  allNotesTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0b1220',
    marginBottom: 16,
    textAlign: 'center'
  },
  allNotesList: {
    maxHeight: 300
  },
  noteItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  noteTitle: {
    fontSize: 16,
    color: '#0b1220',
    flex: 1
  },
  noteDate: {
    fontSize: 12,
    color: '#6c757d'
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
  },
  previewText: {
    fontSize: 16,
    color: '#0b1220',
    lineHeight: 24
  }
});
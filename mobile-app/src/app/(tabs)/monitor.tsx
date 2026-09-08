import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldAlert, FileText, Play, Image as ImageIcon } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';

interface Evidence {
  id: string;
  title: string;
  location: string;
  timestamp: any;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  severity?: 'low' | 'medium' | 'high';
}

export default function MonitorScreen() {
  const { colors, theme } = useTheme();
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Escuchar evidencias en tiempo real
    const q = query(collection(db, 'ai_evidences'), orderBy('timestamp', 'desc'), limit(20));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const docData = doc.data();
        return {
          id: doc.id,
          title: docData.title || 'Infracción Detectada',
          location: docData.location || 'Ubicación Desconocida',
          timestamp: docData.timestamp,
          mediaUrl: docData.mediaUrl,
          mediaType: docData.mediaType || 'image',
          severity: docData.severity || 'medium'
        } as Evidence;
      });
      
      setEvidences(data);
      setIsLoading(false);
    }, (error) => {
      console.error("Error cargando evidencias: ", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatTime = (ts: any) => {
    if (!ts) return '';
    // Dependiendo de si es un Timestamp de Firestore o un string ISO
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return colors.danger; // Rojo
      case 'low': return colors.success; // Verde
      default: return '#F59E0B'; // Ámbar/Amarillo
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.text }]}>Monitoreo</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Evidencias e Infracciones (IA)</Text>
        </View>
        <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.card, shadowColor: theme === 'light' ? '#000' : '#fff' }]}>
          <ShieldAlert color={colors.danger} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.Text entering={FadeInUp.delay(100)} style={[styles.sectionTitle, { color: colors.text }]}>
          Acciones Rápidas
        </Animated.Text>
        
        <Animated.View entering={FadeInUp.delay(200)} style={styles.actionsContainer}>
          <TouchableOpacity style={{ width: '100%' }}>
            <View style={[styles.actionCard, { backgroundColor: colors.accent }]}>
              <FileText color="#fff" size={32} />
              <Text style={styles.actionText}>Generar Reporte de Evidencias</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        <Animated.Text entering={FadeInUp.delay(300)} style={[styles.sectionTitle, { color: colors.text }]}>
          Historial Reciente
        </Animated.Text>
        
        {isLoading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : evidences.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ color: colors.textSecondary }}>No hay evidencias registradas por la IA.</Text>
          </View>
        ) : (
          evidences.map((evidence, index) => {
            const iconColor = getSeverityColor(evidence.severity || 'medium');
            
            return (
              <Animated.View key={evidence.id} entering={FadeInUp.delay(400 + (index * 100))}>
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.listRow}>
                    <View style={[styles.listIconContainer, { backgroundColor: `${iconColor}20` }]}>
                      {evidence.mediaType === 'video' ? (
                        <ShieldAlert color={iconColor} size={20} />
                      ) : (
                        <ImageIcon color={iconColor} size={20} />
                      )}
                    </View>
                    <View style={styles.listTextContainer}>
                      <Text style={[styles.listTitle, { color: colors.text }]}>{evidence.title}</Text>
                      <Text style={[styles.listSubtitle, { color: colors.textSecondary }]}>
                        {evidence.location} • {formatTime(evidence.timestamp)}
                      </Text>
                    </View>
                  </View>
                  
                  {evidence.mediaUrl ? (
                    <View style={styles.mediaContainer}>
                      <Image 
                        source={{ uri: evidence.mediaUrl }} 
                        style={styles.mediaImage} 
                        contentFit="cover"
                        transition={300}
                      />
                      {evidence.mediaType === 'video' && (
                        <View style={styles.playButtonOverlay}>
                          <Play color="#fff" size={32} fill="#fff" />
                        </View>
                      )}
                    </View>
                  ) : null}
                </View>
              </Animated.View>
            );
          })
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  greeting: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    marginTop: 4,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    marginBottom: 16,
    marginTop: 10,
  },
  actionsContainer: {
    marginBottom: 24,
  },
  actionCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  actionText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#fff',
    marginTop: 12,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  listIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  listTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  listSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    marginTop: 2,
  },
  mediaContainer: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  playButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  }
});

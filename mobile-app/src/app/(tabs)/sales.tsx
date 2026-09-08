import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, Printer, ShieldAlert, History, Calendar } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import Animated, { FadeInUp } from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import { startOfDay, endOfDay } from 'date-fns';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '../../firebase/config';

interface Transaction {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  type: 'sale' | 'close' | 'alert';
  amount?: string;
  status: 'completed' | 'warning' | 'info';
  timestamp: Date;
}

export default function SalesScreen() {
  const { colors, theme } = useTheme();
  
  // Estados para el Calendario
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Estados para Datos
  const [historyData, setHistoryData] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const start = startOfDay(selectedDate);
    const end = endOfDay(selectedDate);

    // Escuchar ventas de este día
    const qSales = query(
      collection(db, 'sales'),
      where('timestamp', '>=', start),
      where('timestamp', '<=', end)
    );

    // Escuchar cierres de caja de este día
    const qRegisters = query(
      collection(db, 'cash_registers'),
      where('timestamp', '>=', start),
      where('timestamp', '<=', end)
    );

    // Debido a que Firestore no permite un "OR" fácil combinando colecciones con orderBy,
    // usamos múltiples snapshots y los unimos en memoria (ya que filtramos por un solo día).
    
    let salesData: Transaction[] = [];
    let registersData: Transaction[] = [];

    const updateCombinedData = () => {
      const combined = [...salesData, ...registersData].sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      );
      setHistoryData(combined);
      setIsLoading(false);
    };

    const unsubSales = onSnapshot(qSales, (snapshot) => {
      salesData = snapshot.docs.map(doc => {
        const d = doc.data();
        const date = d.timestamp?.toDate ? d.timestamp.toDate() : new Date();
        return {
          id: `sale_${doc.id}`,
          title: `Venta #${d.orderId || doc.id.substring(0, 6)}`,
          subtitle: `${d.itemsCount || 1} artículos - Caja Principal`,
          time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'sale',
          amount: `$${(d.total || 0).toFixed(2)}`,
          status: 'completed',
          timestamp: date
        };
      });
      updateCombinedData();
    }, (error) => {
      console.log("Error ventas:", error);
      setIsLoading(false);
    });

    const unsubRegisters = onSnapshot(qRegisters, (snapshot) => {
      registersData = snapshot.docs.map(doc => {
        const d = doc.data();
        const date = d.timestamp?.toDate ? d.timestamp.toDate() : new Date();
        return {
          id: `reg_${doc.id}`,
          title: `Cierre de Caja`,
          subtitle: `Cajero: ${d.cashierName || 'Admin'}`,
          time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'close',
          amount: `$${(d.reportedAmount || 0).toFixed(2)}`,
          status: 'info',
          timestamp: date
        };
      });
      updateCombinedData();
    }, (error) => {
      console.log("Error cajas:", error);
      setIsLoading(false);
    });

    return () => {
      unsubSales();
      unsubRegisters();
    };
  }, [selectedDate]); // Se vuelve a ejecutar cuando cambia la fecha

  const onValueChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setSelectedDate(selectedDate);
    }
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
  };

  const onDismiss = () => {
    setShowDatePicker(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return colors.success;
      case 'warning': return colors.danger;
      case 'info': return colors.accent;
      default: return colors.textSecondary;
    }
  };

  const getIcon = (type: string, color: string) => {
    switch (type) {
      case 'sale': return <FileText color={color} size={20} />;
      case 'close': return <History color={color} size={20} />;
      case 'alert': return <ShieldAlert color={color} size={20} />;
      default: return <FileText color={color} size={20} />;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.text }]}>Auditoría de Caja</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Reportes y Cierres Z</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={[styles.iconButton, { backgroundColor: colors.card, shadowColor: theme === 'light' ? '#000' : '#fff' }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Calendar color={colors.text} size={22} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Picker (Modal nativo en Android, inline/spinner en iOS) */}
      {showDatePicker && (
        <View style={Platform.OS === 'ios' ? styles.iosDatePickerContainer : undefined}>
          {Platform.OS === 'ios' && (
            <View style={styles.iosDatePickerHeader}>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={{ color: colors.accent, fontFamily: 'Inter_600SemiBold' }}>Listo</Text>
              </TouchableOpacity>
            </View>
          )}
          <DateTimePicker
            testID="dateTimePicker"
            value={selectedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onValueChange={onValueChange}
            onDismiss={onDismiss}
            textColor={colors.text} // Util para el spinner de iOS en dark mode
          />
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        <Animated.View entering={FadeInUp.delay(100)} style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Fecha Seleccionada</Text>
            <Text style={[styles.statValue, { color: colors.accent }]}>
              {selectedDate.toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
            </Text>
          </View>
        </Animated.View>

        <Animated.Text entering={FadeInUp.delay(200)} style={[styles.sectionTitle, { color: colors.text }]}>
          Documentos y Cierres
        </Animated.Text>
        
        <Animated.View entering={FadeInUp.delay(300)} style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIcon, { backgroundColor: `${colors.accent}20` }]}>
              <Printer color={colors.accent} size={24} />
            </View>
            <Text style={[styles.actionText, { color: colors.text }]}>Imprimir Cierre Diario</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIcon, { backgroundColor: `${colors.danger}20` }]}>
              <FileText color={colors.danger} size={24} />
            </View>
            <Text style={[styles.actionText, { color: colors.text }]}>Descargar Reporte PDF</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.Text entering={FadeInUp.delay(400)} style={[styles.sectionTitle, { color: colors.text }]}>
          Historial del Día
        </Animated.Text>
        
        <View style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {isLoading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={{ color: colors.textSecondary, marginTop: 10 }}>Cargando datos del día...</Text>
            </View>
          ) : historyData.length === 0 ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <History color={colors.textSecondary} size={48} style={{ opacity: 0.5, marginBottom: 12 }} />
              <Text style={{ color: colors.textSecondary }}>No hay movimientos en esta fecha.</Text>
            </View>
          ) : (
            historyData.map((item, index) => {
              const statusColor = getStatusColor(item.status);
              
              return (
                <Animated.View 
                  key={item.id} 
                  entering={FadeInUp.delay(500 + (index * 50))}
                  style={[
                    styles.historyItem, 
                    index !== historyData.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
                  ]}
                >
                  <View style={[styles.historyIcon, { backgroundColor: `${statusColor}15` }]}>
                    {getIcon(item.type, statusColor)}
                  </View>
                  <View style={styles.historyTextContainer}>
                    <Text style={[styles.historyTitle, { color: colors.text }]}>{item.title}</Text>
                    <Text style={[styles.historySubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
                  </View>
                  <View style={styles.historyRightContainer}>
                    {item.amount && <Text style={[styles.historyAmount, { color: colors.text }]}>{item.amount}</Text>}
                    <Text style={[styles.historyTime, { color: colors.textSecondary }]}>{item.time}</Text>
                  </View>
                </Animated.View>
              );
            })
          )}
        </View>

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
  headerRight: {
    flexDirection: 'row',
    gap: 12,
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
    width: 44,
    height: 44,
    borderRadius: 22,
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
  iosDatePickerContainer: {
    backgroundColor: 'rgba(255,255,255,0.95)', // For light mode mostly, hard to dynamic style without restructuring
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    borderTopWidth: 1,
    borderColor: '#e5e5e5'
  },
  iosDatePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderColor: '#e5e5e5'
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsContainer: {
    marginBottom: 24,
  },
  statCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.1)', // accent tint
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    alignItems: 'center',
  },
  statLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    marginBottom: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    textAlign: 'center',
  },
  historyCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  historyTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  historySubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    marginTop: 2,
  },
  historyRightContainer: {
    alignItems: 'flex-end',
  },
  historyAmount: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
  historyTime: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 4,
  }
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Dimensions, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Search, MoreVertical, LogOut, Moon, Sun, User, Truck } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';

const { width } = Dimensions.get('window');

// Datos por defecto (fallback visual)
const fallbackMonthly = {
  labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun"],
  datasets: [{ data: [1, 1, 1, 1, 1, 1] }]
};

export default function DashboardScreen() {
  const { theme, toggleTheme, colors } = useTheme();
  const { user, signOut } = useAuth();
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  // Estados de métricas Firebase
  const [totalSales, setTotalSales] = useState(0);
  const [netUtility, setNetUtility] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [avgTicket, setAvgTicket] = useState(0);
  const [newClients, setNewClients] = useState(0);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState(fallbackMonthly);

  useEffect(() => {
    // Escuchar la colección 'sales' de Firebase
    const q = query(collection(db, 'sales'), orderBy('timestamp', 'desc'), limit(100));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let sumSales = 0;
      let count = 0;
      let categories: Record<string, number> = { 'Tecnología': 0, 'Muebles': 0, 'Oficina': 0, 'Otros': 0 };

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.total) {
          sumSales += data.total;
          count++;
          
          const cat = data.category || 'Otros';
          if (categories[cat] !== undefined) {
            categories[cat] += data.total;
          } else {
            categories['Otros'] += data.total;
          }
        }
      });
      
      setTotalSales(sumSales);
      setNetUtility(sumSales * 0.15); // Calculamos una utilidad estimada
      setTotalOrders(count);
      setAvgTicket(count > 0 ? sumSales / count : 0);
      
      // Actualizar PieChart con datos de Firebase
      const newPie = [
        { name: 'Tecnología', population: categories['Tecnología'] || 0, color: '#EF4444', legendFontColor: '#7F7F7F', legendFontSize: 12 },
        { name: 'Muebles', population: categories['Muebles'] || 0, color: '#1F2937', legendFontColor: '#7F7F7F', legendFontSize: 12 },
        { name: 'Oficina', population: categories['Oficina'] || 0, color: '#9CA3AF', legendFontColor: '#7F7F7F', legendFontSize: 12 },
        { name: 'Otros', population: categories['Otros'] || 0, color: '#D1D5DB', legendFontColor: '#7F7F7F', legendFontSize: 12 },
      ];
      setCategoryData(newPie);
      setIsLoadingData(false);
    }, (error) => {
      console.error("Error cargando ventas: ", error);
      setIsLoadingData(false);
    });
    
    return () => unsubscribe();
  }, []);

  const formatMoney = (amount: number) => {
    if (amount >= 1000000) return `$ ${(amount / 1000000).toFixed(2)}M`;
    if (amount >= 1000) return `$ ${(amount / 1000).toFixed(1)}K`;
    return `$ ${amount.toFixed(2)}`;
  };

  const chartConfig = {
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    color: (opacity = 1) => `rgba(${theme === 'dark' ? '239, 68, 68' : '239, 68, 68'}, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    propsForDots: { r: "0" },
    decimalPlaces: 0,
    labelColor: (opacity = 1) => colors.textSecondary,
  };

  const barChartConfig = {
    ...chartConfig,
    color: (opacity = 1) => theme === 'dark' ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
  };

  const renderSparkline = (dataArr: number[]) => (
    <LineChart
      data={{ labels: [], datasets: [{ data: dataArr.length ? dataArr : [0, 0] }] }}
      width={120}
      height={60}
      chartConfig={{
        ...chartConfig,
        color: () => colors.chartLine,
        propsForBackgroundLines: { strokeWidth: 0 },
      }}
      withDots={false}
      withInnerLines={false}
      withOuterLines={false}
      withHorizontalLabels={false}
      withVerticalLabels={false}
      style={{ paddingRight: 0, paddingTop: 10 }}
      bezier
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton}>
          <View style={[styles.menuLine, { backgroundColor: colors.text }]} />
          <View style={[styles.menuLine, { backgroundColor: colors.text, width: 16 }]} />
          <View style={[styles.menuLine, { backgroundColor: colors.text }]} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Ventas Ejecutivas</Text>
          <Text style={styles.headerSubtitle}>Tiempo Real (Firebase)</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity onPress={toggleTheme} style={styles.iconButton}>
            {theme === 'light' ? <Moon color={colors.text} size={22} /> : <Sun color={colors.text} size={22} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setProfileModalVisible(true)} style={styles.iconButton}>
            <User color={colors.text} size={22} />
          </TouchableOpacity>
        </View>
      </View>

      {isLoadingData ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Conectando a Firebase...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Ventas Totales */}
          <Animated.View entering={FadeInUp.delay(100).duration(600).springify()}>
            <View style={[styles.card, { backgroundColor: theme === 'dark' ? '#1F2937' : '#111827' }]}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={[styles.cardTitle, { color: '#9CA3AF' }]}>Ventas Totales</Text>
                  <Text style={[styles.cardValue, { color: '#FFFFFF' }]}>{formatMoney(totalSales)}</Text>
                  <Text style={styles.cardGrowth}>En Tiempo Real</Text>
                </View>
                {renderSparkline([10, 15, 20, 25, 30, totalSales > 0 ? 50 : 0])}
              </View>
            </View>
          </Animated.View>

          {/* Utilidad Neta */}
          <Animated.View entering={FadeInUp.delay(200).duration(600).springify()}>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Utilidad Neta (Est.)</Text>
                  <Text style={[styles.cardValue, { color: colors.text }]}>{formatMoney(netUtility)}</Text>
                  <Text style={styles.cardGrowth}>En Tiempo Real</Text>
                </View>
                {renderSparkline([5, 8, 12, 10, 25, netUtility > 0 ? 35 : 0])}
              </View>
            </View>
          </Animated.View>

          {/* Métricas pequeñas (Grid 3 columnas) */}
          <Animated.View entering={FadeInUp.delay(300).duration(600).springify()} style={styles.gridRow}>
            <View style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.gridTitle, { color: colors.textSecondary }]}>Órdenes</Text>
              <Text style={[styles.gridValue, { color: colors.text }]}>{totalOrders}</Text>
            </View>
            
            <View style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.gridTitle, { color: colors.textSecondary }]}>Nuevos</Text>
              <Text style={[styles.gridValue, { color: colors.text }]}>{newClients}</Text>
            </View>

            <View style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.gridTitle, { color: colors.textSecondary }]}>Ticket Prom.</Text>
              <Text style={[styles.gridValue, { color: colors.text }]}>{formatMoney(avgTicket)}</Text>
            </View>
          </Animated.View>

          {/* Ventas por Categoría */}
          <Animated.View entering={FadeInUp.delay(400).duration(600).springify()}>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
              <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 16 }]}>Ventas por Categoría</Text>
              {totalSales > 0 ? (
                <PieChart
                  data={categoryData.map(d => ({ ...d, legendFontColor: colors.textSecondary }))}
                  width={width - 40}
                  height={140}
                  chartConfig={chartConfig}
                  accessor={"population"}
                  backgroundColor={"transparent"}
                  paddingLeft={"-10"}
                  hasLegend={true}
                  absolute
                />
              ) : (
                <Text style={{ color: colors.textSecondary, textAlign: 'center', marginVertical: 20 }}>No hay suficientes datos por ahora.</Text>
              )}
            </View>
          </Animated.View>

          {/* Ventas por Mes */}
          <Animated.View entering={FadeInUp.delay(500).duration(600).springify()}>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
              <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 16 }]}>Historial Mensual</Text>
              <BarChart
                data={monthlyData}
                width={width - 80}
                height={180}
                yAxisLabel="$"
                yAxisSuffix=""
                chartConfig={barChartConfig}
                style={{
                  borderRadius: 16,
                }}
                withHorizontalLabels={false}
                withInnerLines={false}
                showValuesOnTopOfBars={false}
              />
            </View>
          </Animated.View>

          {/* Botón de Entradas de Suplidores */}
          <Animated.View entering={FadeInUp.delay(600).duration(600).springify()} style={{ marginBottom: 40 }}>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.accent }]}>
              <Truck color="#fff" size={20} style={{ marginRight: 8 }} />
              <Text style={styles.actionButtonText}>Ver Entradas de Suplidores</Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={{ height: 60 }} />
        </ScrollView>
      )}

      {/* Modal de Perfil / Logout */}
      <Modal
        visible={profileModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Perfil de Usuario</Text>
            <Text style={[styles.modalEmail, { color: colors.textSecondary }]}>{user?.email}</Text>
            
            <TouchableOpacity 
              style={styles.logoutButton} 
              onPress={() => {
                setProfileModalVisible(false);
                signOut();
              }}
            >
              <LogOut color="#fff" size={20} />
              <Text style={styles.logoutText}>Cerrar Sesión</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.closeModalButton} 
              onPress={() => setProfileModalVisible(false)}
            >
              <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_600SemiBold' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  menuLine: {
    height: 2,
    width: 20,
    borderRadius: 2,
    marginVertical: 2.5,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
  headerSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#9CA3AF',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 16,
    padding: 20,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  cardValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    marginVertical: 4,
  },
  cardGrowth: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#10B981',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  gridCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  gridTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    marginBottom: 4,
  },
  gridValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    marginBottom: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    marginBottom: 8,
  },
  modalEmail: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    marginBottom: 24,
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  logoutText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#fff',
  },
  closeModalButton: {
    padding: 8,
  },
  actionButton: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#fff',
  }
});

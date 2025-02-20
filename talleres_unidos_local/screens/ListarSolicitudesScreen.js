import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Pressable, Alert } from 'react-native';
import axios from 'axios';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const apiUrl = 'http://192.168.0.205:3000/solicitudes/pendientes';

export default function ListarSolicitudesScreen({ navigation }) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);


  const fetchSolicitudes = async () => {
    setLoading(true);
    try {
      const response = await axios.get(apiUrl);
      setSolicitudes(response.data);
    } catch (error) {
      console.error("Error obteniendo solicitudes: ", error);
      Alert.alert("Error", "No se pudieron obtener las solicitudes");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSolicitudes();
    }, [])
  );

  if (loading) {
    return <ActivityIndicator size="large" color="#009BFF" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Solicitudes Pendientes</Text>
      <FlatList
        data={solicitudes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('DetallesSolicitud', { solicitudId: item.id })}
          >
            <View style={styles.solicitudItem}>
              <View style={styles.solicitudHeader}>
                <MaterialIcons name="assignment" size={24} color="#009BFF" />
                <Text style={styles.solicitudId}>ID: {item.id}</Text>
              </View>
              <Text style={styles.vinText}>VIN: {item.vin}</Text>
              <Text style={styles.text}>Pieza: {item.pieza}</Text>
              <Text style={styles.text}>Taller: {item.taller}</Text>
              <Text style={styles.text}>Fecha: {new Date(item.fecha).toLocaleDateString()}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  solicitudItem: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  solicitudHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  solicitudId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#009BFF',
    marginLeft: 10,
  },
  vinText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  text: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
});

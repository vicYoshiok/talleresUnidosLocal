import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, Alert, TouchableOpacity, Pressable, ScrollView } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons'; 

export default function DetallesSolicitudScreen({ route, navigation }) {
  const { solicitudId } = route.params;
  const [solicitud, setSolicitud] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchSolicitud = async () => {
      try {
        console.log(`http://192.168.0.205:3000/solicitud/${solicitudId}`);
        const response = await fetch(`http://192.168.0.205:3000/solicitud/${solicitudId}`);
        const data = await response.json();

        if (response.ok) {
          setSolicitud(data);
          console.log("data recibida:", data)
        } else {
          Alert.alert('Error', 'No se encontró la solicitud.');
        }
      } catch (error) {
        console.error('Error al obtener la solicitud:', error);
        Alert.alert('Error', 'No se pudo obtener la solicitud desde el servidor.');
      } finally {
        setLoading(false);
      }
    };

    if (solicitudId) {
      fetchSolicitud();
    }
  }, [solicitudId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#009BFF" />
      </View>
    );
  }

  const hasLocation = solicitud?.localizacion?.latitude && solicitud?.localizacion?.longitude;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Detalles de la Solicitud</Text>

        <View style={styles.card}>
          <Text style={styles.detailText}><Text style={styles.label}>VIN:</Text> {solicitud?.vin}</Text>
          <View style={styles.separator} />
          <Text style={styles.detailText}><Text style={styles.label}>Pieza:</Text> {solicitud?.pieza}</Text>
          <View style={styles.separator} />
          <Text style={styles.detailText}><Text style={styles.label}>Taller:</Text> {solicitud?.taller}</Text>
          <View style={styles.separator} />
          <Text style={styles.detailText}><Text style={styles.label}>Fecha:</Text> {new Date(solicitud?.fecha).toLocaleDateString()}</Text>
          <View style={styles.separator} />
          <Text style={styles.detailText}><Text style={styles.label}>Estado:</Text> {solicitud?.estado}</Text>
        </View>

        {solicitud?.foto && (
          <Image
            source={{ uri: `http://192.168.0.205:3000${solicitud.foto}` }} // URL completa
            style={styles.image}
            resizeMode="cover"
            onError={(error) => console.error('Error al cargar la imagen:', error.nativeEvent.error)}
          />
        )}

        {hasLocation ? (
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: solicitud.localizacion.latitude,
                longitude: solicitud.localizacion.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }}
            >
              <Marker
                coordinate={{
                  latitude: solicitud.localizacion.latitude,
                  longitude: solicitud.localizacion.longitude,
                }}
                title="Ubicación del taller"
                description={solicitud.taller}
              />
            </MapView>
          </View>
        ) : (
          <Text style={styles.noLocationText}>No hay ubicación disponible para este taller.</Text>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed
          ]}
          onPress={() => navigation.navigate('ResponderSolicitud', { solicitudId })}
        >
          <Text style={styles.buttonText}>Responder Solicitud</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginVertical: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  detailText: {
    fontSize: 17,
    color: '#555',
    paddingVertical: 5,
  },
  label: {
    fontWeight: 'bold',
    color: '#000',
  },
  separator: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 8,
  },
  image: {
    width: '100%',
    height: 240,
    borderRadius: 12,
    marginTop: 15,
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: '#ccc',
  },
  mapContainer: {
    marginTop: 20,
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 4,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  noLocationText: {
    marginTop: 20,
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  button: {
    marginTop: 25,
    backgroundColor: '#009BFF',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 25,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
});
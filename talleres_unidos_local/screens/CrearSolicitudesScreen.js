import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Image, Alert, ScrollView, StyleSheet, Pressable, Switch } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios'; // Asegúrate de instalar axios

export default function CrearSolicitudesScreen() {
  const [state, setState] = useState({
    vin: "",
    pieza: "",
    taller: "",
    fecha: new Date(),
    localizacion: null,
    foto: null, // Cambiado a null para manejar mejor la ausencia de foto
    estadoInstalacion: false,
    nombreMecanico: "",
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(null);

  useEffect(() => {
    (async () => {
      // Permisos para la cámara
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === 'granted');

      // Permisos para la ubicación
      const locationStatus = await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(locationStatus.status === 'granted');
    })();
  }, []);

  const handleChanges = (name, value) => {
    setState({ ...state, [name]: value });
  };

  const handleTomarFoto = async () => {
    if (hasCameraPermission) {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri; 
        console.log('URI de la foto:', uri); 
        handleChanges("foto", uri);
      } else {
        Alert.alert('Error', 'No se pudo tomar la foto');
      }
    } else {
      Alert.alert('Error', 'No tiene permisos para acceder a la cámara');
    }
  };

  const handleObtenerUbicacion = async () => {
    if (hasLocationPermission) {
      const { coords } = await Location.getCurrentPositionAsync({});
      handleChanges('localizacion', coords);
    } else {
      Alert.alert('Error', 'No tiene permisos para acceder a la ubicación');
    }
  };

  const handleCrearSolicitud = async () => {
    if (!state.pieza || !state.taller || !state.fecha || !state.localizacion) {
      Alert.alert('Error', 'Por favor complete todos los campos');
      return;
    }

    try {
      const data = new FormData();
      data.append("vin", state.vin || "");
      data.append("pieza", state.pieza || "");
      data.append("taller", state.taller || "");
      data.append("fecha", state.fecha.toISOString());
      data.append("localizacion", JSON.stringify(state.localizacion) || "");
      data.append("estado", state.estadoInstalacion ? 'instalada' : 'pendiente');

      if (state.foto) {
        const photo = {
          uri: state.foto,
          type: 'image/jpeg',
          name: 'foto.jpg',
        };
        console.log('Imagen añadida al FormData:', photo); 
        data.append("foto", photo);
      }

      const response = await axios.post('http://192.168.0.205:3000/solicitudes', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 201) {
        Alert.alert('Éxito', 'Solicitud creada con éxito');
        setState({
          vin: "",
          pieza: "",
          taller: "",
          fecha: new Date(),
          localizacion: null,
          foto: null,
          estadoInstalacion: false,
          nombreMecanico: "",
        });
      }
    } catch (error) {
      console.error('Error creando solicitud:', error);
      Alert.alert('Error', 'Hubo un problema al crear la solicitud');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Crear Solicitud de refacción</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Pieza</Text>
        <TextInput
          style={styles.input}
          value={state.pieza}
          onChangeText={(text) => handleChanges("pieza", text)}
          placeholder="Ingrese la pieza"
        />

        <Text style={styles.label}>Taller</Text>
        <TextInput
          style={styles.input}
          value={state.taller}
          onChangeText={(text) => handleChanges("taller", text)}
          placeholder="Ingrese el taller"
        />

        <Text style={styles.label}>Fecha</Text>
        <Pressable onPress={() => setShowDatePicker(true)} style={styles.datePicker}>
          <Text style={styles.dateText}>{state.fecha.toDateString()}</Text>
        </Pressable>
        {showDatePicker && (
          <DateTimePicker
            value={state.fecha}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) handleChanges("fecha", selectedDate);
            }}
          />
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Estado de la refacción</Text>
        <View style={styles.switchContainer}>
          <Text style={styles.switchText}>{state.estadoInstalacion ? "Instalada" : "Pendiente"}</Text>
          <Switch
            value={state.estadoInstalacion}
            onValueChange={(value) => handleChanges('estadoInstalacion', value)}
          />
        </View>

        {!state.estadoInstalacion && (
          <>
            <Text style={styles.label}>Nombre del Mecánico</Text>
            <TextInput
              style={styles.input}
              value={state.nombreMecanico}
              onChangeText={(text) => handleChanges("nombreMecanico", text)}
              placeholder="Ingrese el nombre del mecánico"
            />

            <Text style={styles.label}>VIN</Text>
            <TextInput
              style={styles.input}
              value={state.vin}
              onChangeText={(text) => handleChanges("vin", text)}
              placeholder="Ingrese el VIN"
            />
          </>
        )}
      </View>

      <View style={styles.card}>
        <Pressable style={styles.button} onPress={handleTomarFoto}>
          <Text style={styles.buttonText}>Tomar Foto</Text>
        </Pressable>

        {state.foto && <Image source={{ uri: state.foto }} style={styles.image} />}

        <Pressable style={styles.button} onPress={handleObtenerUbicacion}>
          <Text style={styles.buttonText}>Obtener Ubicación</Text>
        </Pressable>

        {state.localizacion && (
          <Text style={styles.localizacionText}>
            {`Lat: ${state.localizacion.latitude}, Lon: ${state.localizacion.longitude}`}
          </Text>
        )}
      </View>

      <Pressable style={styles.buttonPrimary} onPress={handleCrearSolicitud}>
        <Text style={styles.buttonText}>
          {state.estadoInstalacion ? "Registrar instalación" : "Crear solicitud de refacción"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#555',
  },
  input: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  datePicker: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  switchText: {
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#28a745',
    borderRadius: 20,
    paddingVertical: 12,
    marginVertical: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  buttonPrimary: {
    backgroundColor: '#007bff',
    borderRadius: 20,
    paddingVertical: 12,
    marginVertical: 20,
    alignItems: 'center',
  },
  image: {
    width: 100,
    height: 100,
    marginVertical: 10,
    borderRadius: 8,
  },
  localizacionText: {
    fontSize: 16,
    color: '#555',
    marginTop: 10,
  },
});
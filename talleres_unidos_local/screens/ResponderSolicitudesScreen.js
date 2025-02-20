import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Image, Alert, ScrollView, StyleSheet, Pressable } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

export default function ResponderSolicitudScreen({ route, navigation }) {
  const { solicitudId } = route.params;
  console.log("id recibido: ", solicitudId); 
  const [respuesta, setRespuesta] = useState({
    mecanico: "",
    taller: "",
    fechaEnvio: new Date(),
    localizacion: null,
    foto: null
  });

  useEffect(() => {
    (async () => {
      await ImagePicker.requestCameraPermissionsAsync();
      await Location.requestForegroundPermissionsAsync();
    })();
  }, []);

  const handleChanges = (name, value) => {
    setRespuesta({ ...respuesta, [name]: value });
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 1 });

    if (!result.canceled && result.assets.length > 0) {
      setRespuesta({ ...respuesta, foto: result.assets[0].uri });
    }
  };

  const getLocation = async () => {
    let location = await Location.getCurrentPositionAsync({});
    setRespuesta({
      ...respuesta,
      localizacion: { latitude: location.coords.latitude, longitude: location.coords.longitude }
    });
  };

  const enviarRespuesta = async () => {
    if (!respuesta.mecanico || !respuesta.taller || !respuesta.localizacion || !respuesta.foto) {
      Alert.alert("Error", "Todos los campos son obligatorios");
      return;
    }
  
    try {
      let formData = new FormData();
      formData.append('mecanico', respuesta.mecanico);
      formData.append('taller', respuesta.taller);
      formData.append('fechaEnvio', respuesta.fechaEnvio.toISOString());
      formData.append('latitud', respuesta.localizacion.latitude);
      formData.append('longitud', respuesta.localizacion.longitude);
      formData.append('solicitudOriginalId', solicitudId); 
      formData.append('foto', {
        uri: respuesta.foto,
        name: `respuesta_${Date.now()}.jpg`,
        type: 'image/jpeg'
      });
      console.log(formData)
      let response = await fetch('http://192.168.0.205:3000/inserta_solicitud_respondida', {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
  
      let result = await response.json();
      
      if (result.success) {
        Alert.alert("Éxito", "Respuesta enviada correctamente");
        navigation.navigate('ListarSolicitudes');
      } else {
        Alert.alert("Error", result.message || "Error al enviar la respuesta");
      }
    } catch (error) {
      console.error("Error al enviar respuesta:", error);
      Alert.alert("Error", "No se pudo enviar la respuesta");
    }
  };
  
  //

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Responder Solicitud</Text>

      <Text style={styles.label}>Mecánico</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre del mecánico"
        onChangeText={(value) => handleChanges('mecanico', value)}
      />

      <Text style={styles.label}>Taller</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre del taller"
        onChangeText={(value) => handleChanges('taller', value)}
      />

      <Text style={styles.label}>Ubicación</Text>
      {respuesta.localizacion ? (
        <Text style={styles.locationText}>
          Lat: {respuesta.localizacion.latitude.toFixed(6)}, Lon: {respuesta.localizacion.longitude.toFixed(6)}
        </Text>
      ) : (
        <Text style={styles.locationText}>Ubicación no obtenida</Text>
      )}

      <Pressable onPress={getLocation} style={styles.button}>
        <Text style={styles.buttonText}>Obtener Ubicación</Text>
      </Pressable>

      <Pressable onPress={pickImage} style={styles.button}>
        <Text style={styles.buttonText}>Tomar Foto</Text>
      </Pressable>

      {respuesta.foto && <Image source={{ uri: respuesta.foto }} style={styles.image} />}

      <Pressable onPress={enviarRespuesta} style={styles.button}>
        <Text style={styles.buttonText}>Enviar Respuesta</Text>
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
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#555',
  },
  input: {
    height: 45,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    marginBottom: 15,
  },
  locationText: {
    fontSize: 14,
    color: '#444',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  button: {
    marginTop: 10,
    backgroundColor: '#009BFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 10,
    marginTop: 15,
    alignSelf: 'center',
  },
});

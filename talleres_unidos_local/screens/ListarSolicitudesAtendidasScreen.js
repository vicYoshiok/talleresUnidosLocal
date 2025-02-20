import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Pressable, Alert, Modal, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';

const apiUrl = 'http://192.168.0.205:3000/solicitudes/atendidas';

export default function ListarSolicitudesAtendidasScreen() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [talleres, setTalleres] = useState([]);
  const [tallerSeleccionado, setTallerSeleccionado] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);

  const fetchSolicitudesAtendidas = async () => {
    try {
      const response = await axios.get(apiUrl);
      const data = response.data;
      console.log(data); 

      const talleresUnicos = [
        ...new Set(data.map(item => item.taller.trim().replace(/\s+/g, ' '))),
      ];

      setTalleres(["Todos", ...talleresUnicos]);
      setSolicitudes(data);
    } catch (error) {
      console.error("Error obteniendo solicitudes: ", error);
      Alert.alert("Error", error.response?.data?.error || "No se pudieron obtener las solicitudes");
    } finally {
      setLoading(false);
    }
  };

  const solicitudesFiltradas = tallerSeleccionado === "Todos"
    ? solicitudes
    : solicitudes.filter(item => item.taller === tallerSeleccionado);

  const solicitudesOrdenadas = solicitudesFiltradas.sort((a, b) => {
    if (a.estatus === "Enviada" && b.estatus !== "Enviada") return -1;
    if (a.estatus !== "Enviada" && b.estatus === "Enviada") return 1;
    return new Date(b.fecha) - new Date(a.fecha);
  });

  const finalizarSolicitud = async (solicitudRespondidaId) => {
    try {

      const solicitud = solicitudes.find(item => item.solicitudRespondidaId === solicitudRespondidaId);
      if (!solicitud) {
        Alert.alert("Error", "No se encontró la solicitud");
        return;
      }
  
      console.log("ID de la solicitud respondida:", solicitudRespondidaId);
  
      if (!solicitudRespondidaId) {
        Alert.alert("Error", "No se encontró el ID de la solicitud respondida");
        return;
      }
  
      const response = await axios.put(`http://192.168.0.205:3000/solicitudes/${solicitudRespondidaId}`, { estado: "Instalada" });
  
      if (response.data && response.data.message === "Solicitud actualizada") {
        setSolicitudes(prev => prev.map(item => 
          item.solicitudRespondidaId === solicitudRespondidaId ? { ...item, estatus: "Instalada" } : item
        ));
        Alert.alert("Éxito", "Solicitud finalizada correctamente");
      } else {
        Alert.alert("Error", "No se pudo actualizar la solicitud");
      }
    } catch (error) {
      console.error("Error finalizando solicitud: ", error);

      setSolicitudes(prev => prev.map(item => 
        item.solicitudRespondidaId === solicitudRespondidaId ? { ...item, estatus: "Enviada" } : item
      ));
      Alert.alert("Error", error.response?.data?.error || "No se pudo finalizar la solicitud");
    }
  };

  const eliminarSolicitud = async (id) => {
    try {

      const response = await axios.delete(`http://192.168.0.205:3000/solicitudes/${id}`);
  
      if (response.status === 200) {

        setSolicitudes(prevSolicitudes => 
          prevSolicitudes.filter(item => item.solicitudOriginalId !== id)
        );
        Alert.alert("Éxito", "Solicitud eliminada correctamente");
      }
    } catch (error) {
      console.error("Error eliminando solicitud: ", error);
      Alert.alert("Error", error.response?.data?.error || "No se pudo eliminar la solicitud");
    }
  };
  

  useFocusEffect(
    React.useCallback(() => {
      fetchSolicitudesAtendidas();
    }, [])
  );

  const handlePickerClose = () => {
    setShowPicker(false);
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#009BFF" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Solicitudes Atendidas</Text>

      <Pressable
        style={styles.pickerInput}
        onPress={() => setShowPicker(true)}
      >
        <Text style={styles.pickerInputText}>{tallerSeleccionado}</Text>
        <Text style={styles.pickerArrow}>▼</Text>
      </Pressable>

      <Modal
        visible={showPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={handlePickerClose}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.pickerContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handlePickerClose}
            >
              <Text style={styles.closeText}>Cerrar</Text>
            </TouchableOpacity>
            
            <Picker
              selectedValue={tallerSeleccionado}
              onValueChange={(itemValue) => {
                setTallerSeleccionado(itemValue);
                handlePickerClose();
              }}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              {talleres.map((taller, index) => (
                <Picker.Item 
                  key={index} 
                  label={taller} 
                  value={taller} 
                />
              ))}
            </Picker>
          </View>
        </View>
      </Modal>

      <FlatList
        data={solicitudesOrdenadas}
        keyExtractor={(item, index) => item.solicitudOriginalId ? `${item.solicitudOriginalId}-${index}` : index.toString()}
        renderItem={({ item }) => {
          return (
            <View style={[
              styles.solicitudItem,
              item.estatus === "Instalada" && styles.instaladaItem
            ]}>
              <Text style={styles.vinText}>Taller: {item.taller}</Text>
              <Text style={styles.detailText}>Pieza: {item.pieza}</Text>
              <Text style={styles.detailText}>VIN: {item.vin}</Text>
              <Text style={styles.detailText}>
                Fecha: {new Date(item.fecha).toLocaleDateString()}
              </Text>
              <Text style={[
                styles.estadoText,
                item.estatus === "Enviada" ? styles.enviadaText : styles.instaladaText
              ]}>
                Estado: {item.estatus}
              </Text>

              <Text style={styles.detailText}>
                ID Solicitud Respondida: {item.solicitudRespondidaId}
              </Text>

              {item.estatus === "Enviada" && (
                <Pressable
                  style={styles.finalizarButton}
                  onPress={() => finalizarSolicitud(item.solicitudRespondidaId)}
                >
                  <Text style={styles.buttonText}>Marcar como Instalada</Text>
                </Pressable>
              )}

              {(item.estatus === "Instalada") && (
                <Pressable
                  style={styles.eliminarButton}
                  onPress={() => eliminarSolicitud(item.solicitudOriginalId)} 
                >
                  <Text style={styles.buttonText}>Eliminar Solicitud</Text>
                </Pressable>
              )}
            </View>
          );
        }}
      />


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#2c3e50',
  },
  pickerInput: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#dcdcdc',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },
  pickerInputText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  pickerArrow: {
    color: '#3498db',
    fontSize: 14,
  },
  pickerItem: {
    color: '#333', 
    fontSize: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  closeButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  closeText: {
    fontSize: 18,
    color: '#3498db',
  },
  solicitudItem: {
    backgroundColor: '#ffffff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  instaladaItem: {
    backgroundColor: '#e9f7ef',
  },
  vinText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  detailText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  estadoText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5,
  },
  enviadaText: {
    color: '#3498db',
  },
  instaladaText: {
    color: '#2ecc71',
  },
  finalizarButton: {
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  eliminarButton: {
    backgroundColor: '#e74c3c',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
  }
});

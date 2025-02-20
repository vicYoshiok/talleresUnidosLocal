import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import CrearSolicitudesScreen from './screens/CrearSolicitudesScreen';
import ListarSolicitudesAtendidasScreen from './screens/ListarSolicitudesAtendidasScreen';
import ListarSolicitudesScreen from './screens/ListarSolicitudesScreen';
import DetallesSolicitudScreen from './screens/DetallesSolicitudScreen'
import ResponderSolicitudScreen from './screens/ResponderSolicitudesScreen'

const Tab = createBottomTabNavigator();
const SolicitudesStack = createStackNavigator();

function SolicitudesStackScreen() {
  return (
    <SolicitudesStack.Navigator>
      <SolicitudesStack.Screen
        name="ListarSolicitudes"
        component={ListarSolicitudesScreen}
        options={{ title: 'Solicitudes Pendientes' }}
      />
      <SolicitudesStack.Screen
        name="DetallesSolicitud"
        component={DetallesSolicitudScreen}
        options={{ title: 'Detalles de la Solicitud' }}
      />
     <SolicitudesStack.Screen
        name="ResponderSolicitud"
        component={ResponderSolicitudScreen}
        options={{ title: 'Responder Solicitud' }}
      />
    </SolicitudesStack.Navigator>
  );
}
export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Crear Solicitud') {
              iconName = focused ? 'add-circle' : 'add-circle-outline';
            } else if (route.name === 'Solicitudes Pendientes') {
              iconName = focused ? 'list' : 'list-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#009BFF',
          tabBarInactiveTintColor: 'gray',
        })}
      >
        <Tab.Screen name="Crear Solicitud" component={CrearSolicitudesScreen} />
        <Tab.Screen
          name="Solicitudes Pendientes"
          component={SolicitudesStackScreen}
          options={{ headerShown: false }}
        />
        <Tab.Screen
          name="Solicitudes Atendidas"
          component={ListarSolicitudesAtendidasScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="checkmark-done" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>

    </NavigationContainer>
  );
}

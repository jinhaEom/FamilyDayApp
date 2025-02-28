import './react-native-config';
import React from 'react';
import {SafeAreaView, StyleSheet} from 'react-native';
import Navigation from './src/navigation/Navigations';
import AuthProvider from './src/auth/AuthProvider';
import usePushNotification from './src/hooks/usePushNotification';
const App = () => {
  usePushNotification();
  return (
    <AuthProvider>
      <SafeAreaView style={styles.container}>
        <Navigation />
      </SafeAreaView>
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
export default App;

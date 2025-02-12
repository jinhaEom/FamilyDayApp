import React from 'react';
import {SafeAreaView, StyleSheet} from 'react-native';
import Navigation from './src/navigation/Navigations';
import AuthProvider from './src/auth/AuthProvider';

const App = () => {
  return (
    <SafeAreaView style={styles.container}>
      <AuthProvider>
        <Navigation />
      </AuthProvider>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
export default App;

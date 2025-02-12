import React from 'react';
import {Text, View, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';

interface HeaderProps {
  title: string;
  showRightIcon: boolean;
}

const styles = StyleSheet.create({
  container: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  backIcon: {
    position: 'absolute',
    left: 10,
    zIndex: 1,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
  },
  rightIcon: {
    position: 'absolute',
    right: 10,
    zIndex: 1,
  },
});

const Header = ({title, showRightIcon = false}: HeaderProps) => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Icon
        style={styles.backIcon}
        name="arrow-back"
        size={24}
        color="black"
        onPress={() => navigation.goBack()}
      />
      <Text style={styles.title}>{title}</Text>
      {showRightIcon && (
        <Icon style={styles.rightIcon} name="home" size={24} color="black" />
      )}
    </View>
  );
};

export default Header;

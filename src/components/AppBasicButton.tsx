import React from 'react';
import {TouchableOpacity, Text, StyleSheet, View, StyleProp, ViewStyle} from 'react-native';
import {Colors} from '../constants/Colors';

interface BasicButtonProps {
  onPress: () => void;
  buttonBackgroundColor: string;
  buttonTextColor: string;
  disabled?: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const AppBasicButton = ({
  onPress,
  buttonBackgroundColor,
  buttonTextColor,
  disabled,
  children,
  style,
}: BasicButtonProps) => {
  return (
    <TouchableOpacity
      style={[styles.button, {backgroundColor: buttonBackgroundColor}, style]}
      onPress={disabled ? () => {} : onPress}>
      <View style={styles.contentContainer}>
        <Text style={[styles.buttonText, {color: buttonTextColor}]}>
          {children}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.BLACK,
    padding: 12,
    margin: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.WHITE,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default AppBasicButton;

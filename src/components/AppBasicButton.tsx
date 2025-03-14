import React from 'react';
import {TouchableOpacity, Text, View, StyleProp, ViewStyle} from 'react-native';

interface BasicButtonProps {
  onPress: () => void;
  buttonBackgroundColor: string;
  buttonTextColor: string;
  disabled?: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  className?: string;
}

const AppBasicButton = ({
  onPress,
  buttonBackgroundColor,
  buttonTextColor,
  disabled,
  children,
  style,
  className,
}: BasicButtonProps) => {
  return (
    <TouchableOpacity
      className={`py-3 px-4 m-4 mb-4 rounded-xl ${className || ''}`}
      style={[{backgroundColor: buttonBackgroundColor}, style]}
      onPress={disabled ? () => {} : onPress}>
      <View className="flex-row justify-center items-center">
        <Text
          className="text-center font-bold"
          style={{color: buttonTextColor}}>
          {children}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default AppBasicButton;

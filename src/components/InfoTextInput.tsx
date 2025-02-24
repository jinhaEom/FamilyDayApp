import React, { useState, useEffect, forwardRef } from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Colors } from '../constants/Colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { StyleProp, ViewStyle } from 'react-native';

interface InfoTextInputProps extends TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  placeholderTextColor?: string;
  secureTextEntry?: boolean;
  onBlur?: () => void;
  style?: StyleProp<ViewStyle>;
}

const InfoTextInput = forwardRef<TextInput, InfoTextInputProps>(
  (
    {
      value,
      onChangeText,
      placeholder,
      placeholderTextColor,
      secureTextEntry,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [deleteIconVisible, setDeleteIconVisible] = useState(false);

    useEffect(() => {
      setDeleteIconVisible(value.length > 0 && isFocused);
    }, [value, isFocused]);

    return (
      <View
        style={{
          height: 40,
          borderColor: isFocused ? Colors.PRIMARY : Colors.LIGHT_GRAY,
          backgroundColor: Colors.LIGHT_GRAY,
          borderWidth: 1,
          marginBottom: 15,
          paddingHorizontal: 10,
          justifyContent: 'center',
          borderRadius: 12,
          ...(props.style as ViewStyle),
        }}>
        <TextInput
          ref={ref}
          style={{ color: Colors.BLACK }}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          secureTextEntry={secureTextEntry}
          // multiline={!secureTextEntry}
          {...props}
          onFocus={() => {
            setIsFocused(true);
          }}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
        />
        {deleteIconVisible && (
          <TouchableOpacity style={styles.iconTouchStyle}>
            <Ionicons
              name="close-circle"
              size={18}
              color={Colors.GRAY}
              onPress={() => {
                onChangeText('');
              }}
            />
          </TouchableOpacity>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  iconTouchStyle: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
});

export default InfoTextInput;

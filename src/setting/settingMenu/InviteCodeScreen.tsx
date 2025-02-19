import React, {useCallback, useContext} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {AuthContext} from '../../auth/AuthContext';
import Header from '../../components/header/header';
import {Colors} from '../../constants/Colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-simple-toast';

const InviteCodeScreen = () => {
  const {currentRoom} = useContext(AuthContext);

  const copyToClipboard = useCallback(() => {
    Clipboard.setString(currentRoom?.inviteCode || '');
    Toast.show('초대 코드가 복사되었습니다.', Toast.SHORT, {
      backgroundColor: Colors.PRIMARY_SUB,
      textColor: Colors.WHITE,
    });
  }, [currentRoom]);
  return (
    <>
      <Header title="초대 코드" />

      <View style={styles.container}>
        <Text style={styles.titleText}>
          아래 코드를 초대할 상대에게 보여주세요!
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          {Array(6)
            .fill(0)
            .map((_, index) => {
              return (
                <View key={index} style={styles.codeBox}>
                  <Text style={styles.codeText}>
                    {currentRoom?.inviteCode[index]}
                  </Text>
                </View>
              );
            })}
        </View>
        <TouchableOpacity style={styles.copyButton} onPress={copyToClipboard}>
          <Text style={styles.copyButtonText}>코드복사하기</Text>
          <Ionicons name="copy" size={24} color={Colors.GRAY} />
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  titleText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 48,
    color: Colors.PRIMARY_SUB,
  },
  descriptionText: {
    fontSize: 16,
    marginBottom: 20,
    color: Colors.GRAY,
  },
  dialogContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeBox: {
    width: 50,
    height: 50,
    backgroundColor: Colors.PRIMARY,
    borderRadius: 10,
  },
  codeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.WHITE,
    textAlign: 'center',
    margin: 10,
  },
  copyButton: {
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    flexDirection: 'row',
    gap: 10,
  },
  copyButtonText: {
    fontSize: 16,
    color: Colors.BLACK,
  },
});

export default InviteCodeScreen;

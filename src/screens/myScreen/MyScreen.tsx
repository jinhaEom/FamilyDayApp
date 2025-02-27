import React, {useContext, useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {AuthContext} from '../../auth/AuthContext';
import {launchImageLibrary} from 'react-native-image-picker';
import {Colors} from '../../constants/Colors';
import FastImage from 'react-native-fast-image';
import {Image as CompressorImage} from 'react-native-compressor';
import {ToastMessage} from '../../components/ToastMessage';

export default function MyScreen() {
  const {
    user,
    userProfileImage,
    changeProfileImage,
    currentRoom,
    nickName,
    changeNickname,
  } = useContext(AuthContext);

  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);

  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [tempNickname, setTempNickname] = useState(nickName);

  useEffect(() => {
    setTempNickname(nickName);
  }, [nickName]);

  // 이미지 URI가 없을 경우 서버 이미지 사용
  useEffect(() => {
    if (!localImageUri && userProfileImage) {
      setLocalImageUri(userProfileImage);
    }
  }, [userProfileImage]);

  const handleImagePress = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 0.8,
      });

      if (result.assets && result.assets[0]?.uri) {
        setLocalImageUri(result.assets[0].uri);

        // 로딩 상태 시작
        setIsLoading(true);
        setUploadProgress(0);

        const compressedUri = await CompressorImage.compress(
          result.assets[0].uri,
          {
            maxWidth: 800,
            maxHeight: 800,
            quality: 0.7,
          },
        );

        setUploadProgress(50);

        // 백그라운드에서 업로드 처리
        changeProfileImage(compressedUri)
          .then(() => {
            setUploadProgress(100);
            setTimeout(() => {
              setIsLoading(false);
              setUploadProgress(0);
            }, 500);
          })
          .catch(error => {
            console.error('이미지 업로드 오류:', error);
            Alert.alert('오류', '이미지를 업로드하는 중 오류가 발생했습니다.');
            setIsLoading(false);
            setUploadProgress(0);
          });
      }
    } catch (error) {
      console.error('이미지 선택 오류:', error);
      Alert.alert('오류', '이미지를 선택하는 중 오류가 발생했습니다.');
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  // 닉네임 저장(실제 Firestore에 반영)
  const handleSaveNickname = async () => {
    if (!tempNickname || tempNickname.trim() === '') {
      ToastMessage({message: '닉네임을 입력해주세요.', type: 'error'});
      return;
    }

    try {
      await changeNickname(tempNickname.trim());
      setIsEditingNickname(false); // 수정 모드 해제
    } catch (error) {
      console.error('닉네임 변경 오류:', error);
      Alert.alert('오류', '닉네임 변경에 실패했습니다.');
    }
  };

  return (
    <View style={styles.container}>
      {/* 프로필 이미지 영역 */}
      <TouchableOpacity
        style={styles.imageContainer}
        onPress={handleImagePress}
        disabled={isLoading}>
        {localImageUri ? (
          <>
            <FastImage
              key={localImageUri}
              source={{
                uri: localImageUri,
                priority: FastImage.priority.high,
                cache: FastImage.cacheControl.immutable,
              }}
              style={styles.selectedImage}
              resizeMode={FastImage.resizeMode.cover}
            />

            {isLoading && (
              <View style={styles.loadingOverlay}>
                <View style={styles.progressContainer}>
                  <ActivityIndicator size="large" color={Colors.WHITE} />
                  <Text style={styles.loadingText}>
                    {uploadProgress < 50
                      ? '이미지 압축 중...'
                      : uploadProgress < 100
                      ? '업로드 중...'
                      : '완료!'}
                  </Text>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        {width: `${uploadProgress}%`},
                      ]}
                    />
                  </View>
                </View>
              </View>
            )}
          </>
        ) : (
          <Text style={styles.imageText}>
            {isLoading ? '이미지 업로드 중...' : '프로필 이미지를 선택하세요!'}
          </Text>
        )}
      </TouchableOpacity>
      <Text
        style={{alignSelf: 'center', marginBottom: 20}}
        onPress={handleImagePress}>
        프로필 변경하기
      </Text>

      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>회원정보</Text>
        <TouchableOpacity
          onPress={() => {
            setIsEditingNickname(true);
            if (isEditingNickname) {
              setIsEditingNickname(false);
            }
          }}>
          <Text style={styles.headerButtonText}>✏️ 닉네임 변경</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>이름 : {user?.name}</Text>
        <Text style={styles.infoText}>이메일 : {user?.email}</Text>

        <View style={{marginBottom: 10}}>
          {isEditingNickname ? (
            <View style={styles.nicknameEditContainer}>
              <Text style={styles.infoText}>닉네임 : </Text>
              <TextInput
                style={styles.nicknameInput}
                value={tempNickname}
                onChangeText={setTempNickname}
                placeholder="새 닉네임 입력"
                placeholderTextColor={Colors.GRAY}
              />
              <TouchableOpacity onPress={handleSaveNickname}>
                <Text style={styles.saveButton}>저장</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsEditingNickname(false)}>
                <Text style={styles.cancelButton}>취소</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // 닉네임 수정 모드가 아닐 때: 기존 텍스트 표시
            <Text style={styles.infoText}>
              닉네임 :{' '}
              {currentRoom?.members?.[user?.userId ?? '']?.nickname ||
                '닉네임 없음'}
            </Text>
          )}
        </View>

        <Text style={styles.infoText}>
          포지션 : {currentRoom?.members[user?.userId ?? '']?.role}
        </Text>
      </View>
    </View>
  );
}

/* 스타일 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF', // 필요에 따라 변경
  },
  imageContainer: {
    backgroundColor: Colors.GRAY,
    borderRadius: 10,
    width: 300,
    height: 300,
    alignSelf: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    alignItems: 'center',
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  imageText: {
    color: Colors.WHITE,
    textAlign: 'center',
    fontSize: 14,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    width: '80%',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    padding: 15,
  },
  loadingText: {
    color: Colors.WHITE,
    fontSize: 16,
    marginTop: 10,
    marginBottom: 10,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.PRIMARY,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  headerButtonText: {
    fontSize: 14,
    color: Colors.PRIMARY,
  },
  infoContainer: {
    paddingHorizontal: 10,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 10,
    paddingVertical: 8,
    color: '#333',
  },
  /* 닉네임 수정 모드 스타일 */
  nicknameEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nicknameInput: {
    borderBottomWidth: 1,
    borderColor: '#ccc',
    minWidth: 100,
    paddingHorizontal: 5,
    color: '#333',
    width: 200,
    bottom: 5,
  },
  saveButton: {
    marginLeft: 10,
    color: Colors.PRIMARY,
    bottom: 5,
  },
  // 취소 버튼 스타일도 추가 가능
  cancelButton: {
    marginLeft: 10,
    color: 'red',
    bottom: 5,
  },
});

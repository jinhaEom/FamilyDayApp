import React, {useContext, useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {AuthContext} from '../../auth/AuthContext';
import {launchImageLibrary} from 'react-native-image-picker';
import {Colors} from '../../constants/Colors';
import FastImage from 'react-native-fast-image';
import {Image as CompressorImage} from 'react-native-compressor';
import {ToastMessage} from '../../components/ToastMessage';
import Ionicons from 'react-native-vector-icons/Ionicons';

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
  }, [userProfileImage, localImageUri]);

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
              ToastMessage({
                message: '프로필 이미지가 변경되었습니다.',
                type: 'success',
              });
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
  const handleSaveNickname = useCallback(async () => {
    if (!tempNickname || tempNickname.trim() === '') {
      ToastMessage({message: '닉네임을 입력해주세요.', type: 'error'});
      return;
    }

    try {
      await changeNickname(tempNickname.trim());
      setIsEditingNickname(false); // 수정 모드 해제
      ToastMessage({message: '닉네임이 변경되었습니다.', type: 'success'});
    } catch (error) {
      console.error('닉네임 변경 오류:', error);
      Alert.alert('오류', '닉네임 변경에 실패했습니다.');
    }
  }, [changeNickname, tempNickname]);

  return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}>
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>마이 프로필</Text>
          <Text style={styles.headerSubtitle}>내 정보 관리</Text>
        </View>

        {/* 프로필 이미지 영역 */}
        <View style={styles.profileSection}>
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
              <View style={styles.placeholderContainer}>
                <Ionicons name="person" size={50} color={Colors.GRAY} />
                <Text style={styles.imageText}>
                  {isLoading
                    ? '이미지 업로드 중...'
                    : '프로필 이미지를 선택하세요!'}
                </Text>
              </View>
            )}

            <View style={styles.cameraIconContainer}>
              <Ionicons name="camera" size={20} color={Colors.WHITE} />
            </View>
          </TouchableOpacity>

          <Text style={styles.profileName}>
            {currentRoom?.members?.[user?.userId ?? '']?.nickname ||
              user?.name ||
              '사용자'}
          </Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
        </View>

        {/* 회원정보 섹션 */}
        <View style={styles.infoSectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons
                name="person-circle-outline"
                size={22}
                color={Colors.PRIMARY}
              />
              <Text style={styles.sectionTitle}>회원정보</Text>
            </View>
          </View>

          <View style={styles.infoContainer}>
            <InfoItem
              label="이름"
              value={user?.name || '이름 없음'}
              icon="person-outline"
            />

            <InfoItem
              label="이메일"
              value={user?.email || '이메일 없음'}
              icon="mail-outline"
            />

            {/* 닉네임 섹션 */}
            <View style={styles.infoItemContainer}>
              <View style={styles.infoLabelContainer}>
                <Ionicons
                  name="at-outline"
                  size={18}
                  color={Colors.PRIMARY}
                  style={styles.infoIcon}
                />
                <Text style={styles.infoLabel}>닉네임</Text>
              </View>

              {isEditingNickname ? (
                <View style={styles.nicknameEditContainer}>
                  <TextInput
                    style={styles.nicknameInput}
                    value={tempNickname}
                    onChangeText={setTempNickname}
                    placeholder="새 닉네임 입력"
                    placeholderTextColor={Colors.GRAY}
                  />
                  <View style={styles.nicknameButtonsContainer}>
                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={handleSaveNickname}>
                      <Text style={styles.saveButtonText}>저장</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => setIsEditingNickname(false)}>
                      <Text style={styles.cancelButtonText}>취소</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.infoValueContainer}>
                  <Text style={styles.infoValue}>
                    {currentRoom?.members?.[user?.userId ?? '']?.nickname ||
                      '닉네임 없음'}
                  </Text>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => setIsEditingNickname(true)}>
                    <Ionicons
                      name="create-outline"
                      size={18}
                      color={Colors.PRIMARY}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <InfoItem
              label="포지션"
              value={
                currentRoom?.members[user?.userId ?? '']?.role || '포지션 없음'
              }
              icon="briefcase-outline"
            />
          </View>
        </View>
      </ScrollView>
  );
}

// 정보 항목 컴포넌트
const InfoItem = ({label, value, icon}: {label: string; value: string; icon: string}) => (
  <View style={styles.infoItemContainer}>
    <View style={styles.infoLabelContainer}>
      <Ionicons
        name={icon}
        size={18}
        color={Colors.PRIMARY}
        style={styles.infoIcon}
      />
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 30,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.GRAY,
    marginBottom: 10,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  imageContainer: {
    width: 180,
    height: 180,
    borderRadius: 40,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    padding: 10,
  },
  imageText: {
    color: Colors.GRAY,
    textAlign: 'center',
    fontSize: 12,
    marginTop: 5,
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 18,
    right: 18,
    width: 24,
    height: 24,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.GRAY,
    marginBottom: 5,
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
    fontSize: 14,
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
  infoSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginHorizontal: 20,
    marginVertical: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderWidth: 0.8,
    borderColor: Colors.LIGHT_GRAY,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 8,
  },
  infoContainer: {
    width: '100%',
  },
  infoItemContainer: {
    marginBottom: 15,
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.GRAY,
  },
  infoValueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  editButton: {
    padding: 6,
  },
  nicknameEditContainer: {
    width: '100%',
  },
  nicknameInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
    color: '#333',
    marginBottom: 8,
  },
  nicknameButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  saveButton: {
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  saveButtonText: {
    color: Colors.WHITE,
    fontWeight: '500',
    fontSize: 14,
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '500',
    fontSize: 14,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    width: '100%',
  },
  logoutButtonText: {
    color: Colors.WHITE,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});

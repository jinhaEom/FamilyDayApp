import React, {useContext, useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  Text,
  useWindowDimensions,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {Colors} from '../../constants/Colors';
import firestore from '@react-native-firebase/firestore';
import {AuthContext} from '../../auth/AuthContext';
import {Room} from '../../types/type';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/Navigations';
import AppBasicButton from '../../components/AppBasicButton';

const ExistChoiceRoom = () => {
  const {width} = useWindowDimensions();
  const {user, setCurrentRoom} = useContext(AuthContext);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    const fetchRooms = async () => {
      if (!user) {
        return;
      }

      try {
        const snapshot = await firestore()
          .collection('rooms')
          .where(`members.${user.userId}`, '!=', null)
          .get();

        const fetchedRooms = snapshot.docs.map(doc => ({
          roomId: doc.id,
          ...doc.data(),
        })) as Room[];

        setRooms(fetchedRooms);
      } catch (error) {
        console.error('방 목록 조회 중 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [user]);

  const handleRoomPress = async (room: Room) => {
    try {
      // 선택한 방 정보를 users 컬렉션에 저장
      await firestore().collection('users').doc(user?.userId).update({
        currentRoomId: room.roomId,
        currentRoomName: room.roomName,
      });

      setCurrentRoom(room);
      navigation.navigate('MainTabs', {
        roomId: room.roomId,
        roomName: room.roomName,
        nickname: room.members[user?.userId || '']?.nickname || '',
        inviteCode: room.inviteCode,
      });
    } catch (error) {
      console.error('방 선택 중 오류:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.BLACK} />
      </View>
    );
  }

  return (
    <>
      <View style={styles.topContainer}>
        <Text style={styles.titleText}>참여한 방 선택하기</Text>
        {rooms.length === 0 ? (
          <Text style={styles.noRoomText}>참여한 방이 없습니다.</Text>
        ) : (
          <>
            <ScrollView>
              <View style={styles.container}>
                {rooms.map(room => (
                  <TouchableOpacity
                    key={room.roomId}
                    style={[styles.roomListCard, {width: width / 2.4}]}
                    onPress={() => handleRoomPress(room)}>
                    <Text style={styles.roomNameText}>{room.roomName}</Text>
                    <Text style={styles.memberCountText}>
                      멤버 {Object.keys(room.members).length}명
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </>
        )}
      </View>
      <View style={styles.bottomButtonContainer}>
        <AppBasicButton
          onPress={() => navigation.goBack()}
          buttonBackgroundColor={Colors.LIGHT_GRAY}
          buttonTextColor={Colors.BLACK}>
          뒤로가기
        </AppBasicButton>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topContainer: {
    flex: 1,
    padding: 20,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: Colors.BLACK,
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  roomListCard: {
    backgroundColor: Colors.BLACK,
    padding: 20,
    margin: 5,
    height: 100,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  roomNameText: {
    color: Colors.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  memberCountText: {
    color: Colors.LIGHT_GRAY,
    fontSize: 12,
  },
  noRoomText: {
    fontSize: 16,
    color: Colors.GRAY,
    textAlign: 'center',
    marginTop: 20,
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
});

export default ExistChoiceRoom;

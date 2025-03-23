import React, {useEffect, useState, useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useRoute, RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '../../navigation/navigations';
import {Schedule, ScheduleComment} from '../../types/type';
import Header from '../../components/header/header';
import {Colors} from '../../constants/Colors';
import {formatDate} from '../../components/DateFormat';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {SelectList} from 'react-native-dropdown-select-list';
import {useScheduleFilter} from '../../hooks/useScheduleFilter';
import FastImage from 'react-native-fast-image';
import ImageView from 'react-native-image-viewing';
import firestore from '@react-native-firebase/firestore';
import {AuthContext} from '../../auth/AuthContext';

// 코멘트 아이템 컴포넌트
interface CommentItemProps {
  comment: ScheduleComment;
}

const CommentItem = ({comment}: CommentItemProps) => {
  return (
    <View style={styles.commentItem}>
      <View style={styles.commentUser}>
        <Text style={styles.commentUserName}>{comment.userName}</Text>
        <Text style={styles.commentDate}>
          {formatDate(comment.createdAt?.toDate())}
        </Text>
      </View>
      <Text style={styles.commentText}>{comment.text}</Text>
    </View>
  );
};

// 일정 카드 컴포넌트
interface ScheduleCardProps {
  schedule: Schedule;
  index: number;
  roomId: string;
}

const ScheduleCard = ({schedule, index, roomId}: ScheduleCardProps) => {
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [comments, setComments] = useState<ScheduleComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const {user: authUser} = useContext(AuthContext);

  const isSameDay =
    formatDate(schedule.scheduleDate) === formatDate(schedule.scheduleEndDate);

  // 코멘트 불러오기
  useEffect(() => {
    const fetchComments = async () => {
      if (!schedule.scheduleId) {
        return;
      }

      try {
        setLoadingComments(true);
        const commentsSnapshot = await firestore()
          .collection('rooms')
          .doc(roomId)
          .collection('schedules')
          .doc(schedule.scheduleId)
          .collection('comments')
          .orderBy('createdAt', 'asc')
          .get();

        const loadedComments = commentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as ScheduleComment[];

        setComments(loadedComments);
      } catch (error) {
        console.error('댓글 로딩 오류:', error);
      } finally {
        setLoadingComments(false);
      }
    };

    if (commentsVisible && schedule.scheduleId) {
      fetchComments();
    }
  }, [commentsVisible, schedule.scheduleId, roomId]);

  // 댓글 추가
  const addComment = async () => {
    if (!commentText.trim() || !schedule.scheduleId || !authUser) return;

    try {
      setIsLoading(true);

      const commentRef = firestore()
        .collection('rooms')
        .doc(roomId)
        .collection('schedules')
        .doc(schedule.scheduleId)
        .collection('comments')
        .doc();

      const commentData = {
        id: commentRef.id,
        scheduleId: schedule.scheduleId,
        userId: authUser?.userId || '',
        userName: authUser?.name || '익명',
        text: commentText.trim(),
        createdAt: firestore.FieldValue.serverTimestamp(),
      };

      await commentRef.set(commentData);

      setCommentText('');

      const fetchComments = async () => {
        try {
          const commentsSnapshot = await firestore()
            .collection('rooms')
            .doc(roomId)
            .collection('schedules')
            .doc(schedule.scheduleId)
            .collection('comments')
            .orderBy('createdAt', 'asc')
            .get();

          const loadedComments = commentsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as ScheduleComment[];

          setComments(loadedComments);
        } catch (error) {
          console.error('코멘트 로딩 오류:', error);
        }
      };

      await fetchComments();
    } catch (error) {
      console.error('코멘트 추가 오류:', error);
      Alert.alert('오류', '코멘트를 추가하는 중 문제가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.scheduleCard}>
      <View
        style={[
          styles.importanceIndicator,
          schedule.isImportant && styles.importantIndicator,
        ]}
      />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.countContainer}>
            <Text style={styles.countText}>{index + 1}</Text>
          </View>
          <Text style={styles.scheduleTitleText}>{schedule.scheduleTitle}</Text>
        </View>

        <View style={styles.scheduleDetails}>
          <View style={styles.iconTextRow}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={Colors.PRIMARY}
            />
            {isSameDay ? (
              <Text style={styles.scheduleText}>
                {formatDate(schedule.scheduleDate)} 종일
              </Text>
            ) : (
              <Text style={styles.scheduleText}>
                {formatDate(schedule.scheduleDate)} ~{' '}
                {formatDate(schedule.scheduleEndDate)}
              </Text>
            )}
          </View>

          {schedule.scheduleContent && (
            <View style={styles.iconTextRow}>
              <Ionicons
                name="document-text-outline"
                size={16}
                color={Colors.PRIMARY}
              />
              <Text style={styles.scheduleText}>
                {schedule.scheduleContent}
              </Text>
            </View>
          )}

          <View style={styles.iconTextRow}>
            <Ionicons name="person-outline" size={16} color={Colors.PRIMARY} />
            <Text style={styles.scheduleText}>{schedule.userName}</Text>
          </View>

          <TouchableOpacity
            style={styles.commentsButton}
            onPress={() => setCommentsVisible(!commentsVisible)}>
            <Ionicons
              name={commentsVisible ? 'chatbubble' : 'chatbubble-outline'}
              size={16}
              color={Colors.PRIMARY}
            />
            <Text style={styles.commentsButtonText}>
              {commentsVisible ? '댓글 접기' : '댓글 보기'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 댓글 섹션 */}
        {commentsVisible && (
          <View style={styles.commentsSection}>
            <View style={styles.commentsDivider} />
            {/* 댓글 리스트 */}
            {loadingComments ? (
              <ActivityIndicator
                color={Colors.PRIMARY}
                style={{marginVertical: 10}}
              />
            ) : comments.length > 0 ? (
              comments.map(comment => (
                <CommentItem key={comment.id} comment={comment} />
              ))
            ) : (
              <Text style={styles.noCommentsText}>댓글이 없습니다.</Text>
            )}
            ㄷ{/* 댓글 입력 */}
            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="댓글 입력하기"
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={200}
              />
              <TouchableOpacity
                style={[
                  styles.commentSubmitButton,
                  (!commentText.trim() || isLoading) && styles.disabledButton,
                ]}
                onPress={addComment}
                disabled={!commentText.trim() || isLoading}>
                {isLoading ? (
                  <ActivityIndicator size="small" color={Colors.WHITE} />
                ) : (
                  <Ionicons name="send" size={18} color={Colors.WHITE} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

// 빈 일정 상태 컴포넌트
const EmptySchedule = () => (
  <View style={styles.emptyContainer}>
    <Ionicons name="calendar-outline" size={60} color={Colors.LIGHT_GRAY} />
    <Text style={styles.emptyText}>일정이 없습니다.</Text>
    <Text style={styles.emptySubText}>새로운 일정을 추가해보세요!</Text>
  </View>
);

const UserScDetailScreen = () => {
  const {params} = useRoute<RouteProp<RootStackParamList, 'UserScDetail'>>();

  const {selectedCase, setSelectedCase, filterSchedules, filterOptions} =
    useScheduleFilter();

  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([]);
  const [isImageVisible, setIsImageVisible] = useState(false);

  useEffect(() => {
    const schedules = Array.isArray(params.schedules) ? params.schedules : [];
    const newFilteredSchedules = filterSchedules(schedules);
    setFilteredSchedules(newFilteredSchedules);
  }, [selectedCase, filterSchedules, params.schedules]);

  return (
    <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <Header title={`${params.userName}님의 일정`} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              {params.profileImage ? (
                <>
                  <FastImage
                    source={{
                      uri: params.profileImage,
                      priority: FastImage.priority.high,
                      cache: FastImage.cacheControl.immutable,
                    }}
                    style={styles.avatarImage}
                    resizeMode={FastImage.resizeMode.cover}
                    onTouchStart={() => setIsImageVisible(true)}
                  />
                </>
              ) : (
                <View style={styles.avatarWrapper}>
                  <View style={styles.defaultAvatar}>
                    <Ionicons name="person" size={24} color={Colors.PRIMARY} />
                  </View>
                </View>
              )}
            </View>
            <ImageView
              images={[{uri: params.profileImage || ''}]}
              imageIndex={0}
              presentationStyle="overFullScreen"
              animationType="fade"
              visible={isImageVisible}
              onRequestClose={() => setIsImageVisible(false)}
            />
            <Text style={styles.titleText}>{params.userName}님의 일정</Text>
          </View>
          <Text style={styles.scheduleCount}>
            총 {filteredSchedules.length}개의 일정
          </Text>
        </View>

        <SelectList
          setSelected={setSelectedCase}
          data={filterOptions}
          save="key"
          defaultOption={filterOptions.find(
            option => option.key === selectedCase,
          )}
          search={false}
        />

        <View style={styles.divider} />
        <Text style={styles.subTitleText}>일정 상세</Text>

        {filteredSchedules.length === 0 ? (
          <EmptySchedule />
        ) : (
          <View style={styles.scheduleList}>
            {filteredSchedules.map((schedule: Schedule, index: number) => (
              <ScheduleCard
                key={schedule.scheduleId || index}
                schedule={schedule}
                index={index}
                roomId={params.roomId}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  headerSection: {
    marginBottom: 24,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: Colors.WHITE,
    fontSize: 22,
    fontWeight: 'bold',
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
  },
  scheduleCount: {
    fontSize: 14,
    color: Colors.GRAY,
    marginTop: 4,
    marginLeft: 62, // avatar width + margin
  },
  divider: {
    height: 1,
    backgroundColor: Colors.LIGHT_GRAY,
    marginBottom: 20,
  },
  subTitleText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: Colors.DARK_GRAY,
  },
  scheduleList: {
    marginBottom: 16,
  },
  scheduleCard: {
    flexDirection: 'row',
    backgroundColor: Colors.WHITE,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 0.8,
    borderColor: Colors.LIGHT_GRAY,
    overflow: 'hidden',
  },
  importanceIndicator: {
    width: 6,
    backgroundColor: Colors.LIGHT_GRAY,
  },
  importantIndicator: {
    backgroundColor: Colors.PRIMARY,
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  countContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  countText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.WHITE,
  },
  scheduleDetails: {
    marginLeft: 42, // countContainer width + marginRight
  },
  iconTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  scheduleTitleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.DARK_GRAY,
    flex: 1,
  },
  scheduleText: {
    fontSize: 14,
    color: Colors.DARK_GRAY,
    marginLeft: 8,
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.DARK_GRAY,
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: Colors.GRAY,
    marginTop: 4,
  },
  avatarWrapper: {
    padding: 3,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: Colors.PRIMARY_LIGHT,
  },
  defaultAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.LIGHT_GRAY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 코멘트 관련 스타일
  commentsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  commentsButtonText: {
    fontSize: 14,
    color: Colors.PRIMARY,
    marginLeft: 8,
  },
  commentsSection: {
    marginTop: 8,
    marginLeft: 42,
  },
  commentsDivider: {
    height: 1,
    backgroundColor: Colors.LIGHT_GRAY,
    marginVertical: 10,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.LIGHT_GRAY,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxHeight: 100,
  },
  commentSubmitButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: Colors.GRAY,
  },
  noCommentsText: {
    fontSize: 14,
    color: Colors.GRAY,
    textAlign: 'center',
    paddingVertical: 10,
  },
  commentItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.LIGHT_GRAY,
  },
  commentUser: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
  },
  commentDate: {
    fontSize: 12,
    color: Colors.GRAY,
  },
  commentText: {
    fontSize: 14,
    color: Colors.DARK_GRAY,
  },
});

export default UserScDetailScreen;

export const formatDate = (timestamp: any): string | null => {
  if (!timestamp) {
    return null;
  }

  try {
    if (timestamp.seconds) {
      const date = new Date(timestamp.seconds * 1000);
      return date.toISOString().split('T')[0];
    }

    // 문자열인 경우
    if (typeof timestamp === 'string') {
      const date = new Date(timestamp);
      return date.toISOString().split('T')[0];
    }

    return null;
  } catch (error) {
    console.error('날짜 변환 중 오류:', error);
    return null;
  }
};

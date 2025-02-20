import Toast from 'react-native-simple-toast';
import {Colors} from '../constants/Colors';
export const ToastMessage = ({
  message,
  type,
}: {
  message: string;
  type: 'success' | 'error';
}) => {
  Toast.show(message, Toast.SHORT, {
    backgroundColor: type === 'success' ? Colors.PRIMARY : Colors.ERROR,
    textColor: Colors.WHITE,
  });
  return null;
};

import { Platform } from 'react-native';
import EditarProductoMobile from '@/components/producto/EditarProductoMobile';
import EditarProductoWeb from '@/components/producto/EditarProductoWeb';

const isWeb = Platform.OS === 'web';

export default function EditarProductoScreen() {
    console.log('🔍 Platform.OS:', Platform.OS, '| isWeb:', isWeb);
    return isWeb ? <EditarProductoWeb /> : <EditarProductoMobile />;
}

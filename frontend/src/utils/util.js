// 消息提示
import {ElMessage, ElMessageBox} from "element-plus";
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'
import nprogress from "nprogress"

export function showMessage(message = '提示内容', type = 'success', customClass = '') {
    // 将 \n 替换为 <br>
    const formattedMessage = message.replace(/\n/g, '<br>');

    return ElMessage({
        type: type,
        message: formattedMessage,
        customClass,
        dangerouslyUseHTMLString: true, // 允许使用 HTML 字符串
    });
}


export function showModel(content = '提示内容', type = 'warning', title = '') {
    return ElMessageBox.confirm(
        content,
        title,
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type,
        }
    )
}
// 显示页面加载 Loading
export function showPageLoading() {
    nprogress.start()
}

// 隐藏页面加载 Loading
export function hidePageLoading() {
    nprogress.done()
}

// 获取图片
export const getImage = (name) => {
    if(name === 'text2.png'){
        return 'https://edu.av-display.com:9000/template/surface2.png';
    }else if(name === 'text3.png'){
        return 'https://edu.av-display.com:9000/template/surface3.png';
    }
    return 'https://edu.av-display.com:9000/template/surface1.png';
}

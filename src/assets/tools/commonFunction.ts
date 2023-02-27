/**
 * 复制
 * @param text 复制文本
 * @param callback 回调函数
 */
export const copyToClipboard = (text?: string, callback?: () => void) => {
  if (text) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.zIndex = "-10000";
      document.body.appendChild(textArea);
      textArea.readOnly = true;
      textArea.focus();
      textArea.select();
      new Promise((resolve, reject) => {
        document.execCommand("copy") ? resolve(true) : reject();
        textArea.remove();
      });
    }
    if (callback) {
      setTimeout(() => {
        callback();
      }, 500);
    }
  }
};
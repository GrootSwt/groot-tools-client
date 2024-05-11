export function debounce(fn: (...args: unknown[]) => unknown, delay = 200) {
  let timer = 0;
  return (...innerArgs: unknown[]) => {
    timer && clearTimeout(timer);
    timer = setTimeout(() => {
      fn(innerArgs);
    }, delay);
  };
}

/**
 * 复制
 * @param text 复制文本
 * @param callback 回调函数
 */
export const copyToClipboard = (text?: string) => {
  return new Promise((resolve, reject) => {
    if (text) {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text);
        setTimeout(() => {
          resolve("复制成功");
        }, 200);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.zIndex = "-10000";
        document.body.appendChild(textArea);
        textArea.readOnly = true;
        textArea.focus();
        textArea.select();
        if (document.execCommand("copy")) {
          setTimeout(() => {
            resolve("复制成功");
          }, 200);
        } else {
          reject("复制失败");
        }
        textArea.remove();
      }
    } else {
      reject("复制内容不可为空");
    }
  });
};

/**
 *
 * @param originImageFile 源图片文件
 * @param maxSize 最大图片文件大小 单位KB
 * @param maxWidth 最大图片宽度 单位px
 * @param maxHeight 最大图片高度 单位px
 * @returns
 */
export function compressImage(
  originImageFile: File,
  maxSize: number,
  fileTypes?: Array<string>,
  maxWidth?: number,
  maxHeight?: number
): Promise<File> {
  if (fileTypes && fileTypes.length > 0) {
    const fileType = originImageFile.type;
    if (!fileTypes.find((type) => type === fileType)) {
      return Promise.reject("file type is not correct");
    }
  }
  const fileName = originImageFile.name.split(".")[0];
  const fileSize = originImageFile.size / 1024;
  const fileReader = new FileReader();
  return new Promise((resolve, reject) => {
    fileReader.onload = (e) => {
      const result = e.target?.result;
      if (result) {
        const image = new Image();
        image.onload = () => {
          const originWidth = image.width;
          const originHeight = image.height;

          let targetWidth = originWidth;
          let targetHeight = originHeight;

          if (maxWidth && targetWidth > maxWidth) {
            targetHeight = +((targetHeight * maxWidth) / targetWidth).toFixed(
              2
            );
            targetWidth = maxWidth;
          }
          if (maxHeight && targetHeight > maxHeight) {
            targetWidth = +((targetWidth * maxHeight) / targetHeight).toFixed(
              2
            );
            targetHeight = maxHeight;
          }
          if (
            fileSize < maxSize &&
            targetWidth === originWidth &&
            targetHeight === originHeight
          ) {
            resolve(originImageFile);
            return;
          } else {
            let newFile: File | null = null;
            let quality = 0.9;
            do {
              newFile = getCompressImage(
                image,
                fileName,
                targetWidth,
                targetHeight,
                quality
              );
              quality = +(quality - 0.1).toFixed(2);
              if (quality <= 0) {
                reject("file is too large");
                return;
              }
              console.log(newFile?.size);
            } while (newFile && newFile.size / 1024 > maxSize);
            if (newFile) {
              resolve(newFile);
              return;
            } else {
              reject("file compress error");
              return;
            }
          }
        };
        image.src = result as string;
      } else {
        reject(new Error("file load error"));
        return;
      }
    };
    fileReader.readAsDataURL(originImageFile);
  });
}

function getCompressImage(
  image: HTMLImageElement,
  name: string,
  width: number,
  height: number,
  quality = 0.9
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.drawImage(image, 0, 0, width, height);
    const base64 = canvas.toDataURL("image/jpeg", quality);
    const bytes = window.atob(base64.split(",")[1]);
    const buffer = new ArrayBuffer(bytes.length);
    const array = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i++) {
      array[i] = bytes.charCodeAt(i);
    }
    const blob = new Blob([buffer], { type: "image/jpeg" });
    const newFile = new File([blob], `${name}_thumbnail.jpeg`, {
      type: blob.type,
    });
    return newFile;
  } else {
    return null;
  }
}

export function setCanvasContextTransparentBackground(
  canvas: HTMLCanvasElement
) {
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = "rgba(0, 0, 0, 0)";
    ctx.fillRect(0, 0, width, height);
  } else {
    throw new Error("该浏览器不支持canvas context");
  }
}

export function canvasToImageFile(
  canvas: HTMLCanvasElement,
  imageWidth = 200,
  filename: string
) {
  const { width, height } = canvas;
  const offScreenCanvas = document.createElement("canvas");
  offScreenCanvas.width = imageWidth;
  offScreenCanvas.height = (imageWidth / width) * height;
  const { width: offscreen_width, height: offscreen_height } = offScreenCanvas;
  setCanvasContextTransparentBackground(offScreenCanvas);
  const offScreenCtx = offScreenCanvas.getContext("2d");
  if (offScreenCtx) {
    offScreenCtx.drawImage(
      canvas,
      0,
      0,
      width,
      height,
      0,
      0,
      offscreen_width,
      offscreen_height
    );
    const base64 = offScreenCanvas.toDataURL("image/png");
    const bytes = window.atob(base64.split(",")[1]);
    const buffer = new ArrayBuffer(bytes.length);
    const array = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i++) {
      array[i] = bytes.charCodeAt(i);
    }
    const blob = new Blob([buffer], {
      type: "image/png",
    });
    const file = new File([blob], `${filename}.png`, {
      type: blob.type,
    });
    return file;
  } else {
    throw new Error("该浏览器不支持canvas context");
  }
}

/**
 * 获取适合单位的文件大小
 * @param size 文件大小（单位为B的纯数值）
 * @returns 文件大小（自适应MB、KB、B）
 */
export function getFileSize(size?: number) {
  if (size) {
    if (size > 1024 * 1024) {
      return +(size / 1024 / 1024).toFixed(2) + "MB";
    }
    if (size > 1024) {
      return +(size / 1024).toFixed(2) + "KB";
    }
    return size + "B";
  }
  return "";
}

/**
 * 图片文件信息
 */
export interface ImageFileInfo {
  // 大小
  size: string;
  // 宽度
  width: string;
  // 高度
  height: string;
}
/**
 * 获取图片文件信息
 * @param file 图片文件
 * @returns 图片文件信息
 */
export function getImageFileInfo(file: File): Promise<ImageFileInfo> {
  return new Promise((resolve, reject) => {
    const size = getFileSize(file.size);
    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      const result = e.target?.result;
      if (result) {
        const image = new Image();
        image.onload = () => {
          const width = image.width + "px";
          const height = image.height + "px";
          resolve({
            size,
            width,
            height,
          });
        };
        image.onerror = () => {
          reject("图片加载失败");
        };
        image.src = result as string;
      } else {
        reject("文件加载失败");
      }
    };
    fileReader.onerror = () => {
      reject("文件加载失败");
    };
    fileReader.readAsDataURL(file);
  });
}

/**
 * 下载文件
 * @param file 文件
 * @returns 是否下载成功
 */
export function downloadFile(file: File) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      if (e.target?.result) {
        const a = document.createElement("a");
        a.download = file.name;
        a.href = e.target.result as string;
        document.body.appendChild(a);
        a.style.display = "none";
        a.click();
        document.body.removeChild(a);
        resolve("success");
      } else {
        reject("error");
      }
    };
    fileReader.onerror = () => {
      reject("error");
    };
    fileReader.readAsDataURL(file);
  });
}

export function fetchDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.download = filename;
  a.href = url;
  document.body.appendChild(a);
  a.style.display = "none";
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validateNumeric(obj: any, prop: string) {
  obj[prop] = +(obj[prop] as string).replaceAll(/[^0-9]+/g, "");
}

/**
 * 随机生成颜色
 * @param a 透明度，默认值为1
 * @returns rgba格式颜色
 */
export function randomColor(a = 1) {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export enum DeviceTypeEnum {
  PC,
  SP,
}

/**
 * 获取用户代理类型
 * @returns 设备类型 PC ｜ SP
 */
export function getDeviceType(): DeviceTypeEnum {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return userAgent.includes("mobile") ? DeviceTypeEnum.SP : DeviceTypeEnum.PC;
}

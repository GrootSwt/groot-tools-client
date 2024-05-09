<script lang="ts" setup>
import {
  getDeviceType,
  DeviceTypeEnum,
  canvasToImageFile,
  downloadFile,
  debounce,
} from "@/assets/tools";
import { ElMessage } from "element-plus";
import ButtonView from "@/components/ButtonView.vue";

const defaultFontColor = "#000000";
const defaultLineWidth = 5;
const fontColor = ref(defaultFontColor);
const lineWidth = ref(defaultLineWidth);

const operationBoxRef = shallowRef<HTMLElement | null>(null);
const canvasBoxRef = shallowRef<HTMLElement | null>(null);
const canvasRef = shallowRef<HTMLCanvasElement | null>(null);
const canvasContext = shallowRef<CanvasRenderingContext2D | null>(null);

function clearCanvas() {
  const canvas = canvasRef.value;
  const ctx = canvasContext.value;
  if (canvas && ctx) {
    setTransparentBackground(canvas, ctx);
    setContextBaseConfig(ctx);
    lineMap.clear();
  }
}

function setStrokeStyle(value: string | null) {
  fontColor.value = value || defaultFontColor;
}
function setLineWidth(value: number | undefined) {
  lineWidth.value = value || defaultLineWidth;
}

function setContextBaseConfig(ctx: CanvasRenderingContext2D) {
  ctx.lineCap = "round";
  ctx.strokeStyle = fontColor.value;
  ctx.lineWidth = lineWidth.value;
}

function setTransparentBackground(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
) {
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);
  ctx.globalCompositeOperation = "destination-over";
  ctx.fillStyle = "rgba(0, 0, 0, 0)";
  ctx.fillRect(0, 0, width, height);
}

function redraw() {
  const canvasBoxEl = canvasBoxRef.value;
  const canvas = canvasRef.value;
  const ctx = canvasContext.value;
  if (!canvasBoxEl || !canvas || !ctx) {
    return;
  }
  const { strokeStyle: ctx_stroke_style, lineWidth: ctx_line_width } = ctx;
  if (
    fontColor.value.toLowerCase() === ctx_stroke_style &&
    lineWidth.value === ctx_line_width
  ) {
    ElMessage.info("字体颜色和字体宽度未改变，不需要重绘");
    return;
  }
  if (lineMap.size === 0) {
    ElMessage.info("未绘制任何内容，不需要重绘");
    return;
  }
  const offScreenCanvas = document.createElement("canvas");
  const { offsetWidth, offsetHeight } = canvasBoxEl;
  offScreenCanvas.style.width = offsetWidth + "px";
  offScreenCanvas.style.height = offsetHeight + "px";
  offScreenCanvas.width = offsetWidth;
  offScreenCanvas.height = offsetHeight;
  const offscreenCtx = offScreenCanvas.getContext("2d");
  if (offscreenCtx) {
    setTransparentBackground(offScreenCanvas, offscreenCtx);
    setContextBaseConfig(offscreenCtx);
    lineMap.forEach((pointList) => {
      if (pointList.length > 0) {
        startPoint.x = pointList[0].x;
        startPoint.y = pointList[0].y;
        for (let i = 1; i < pointList.length; i++) {
          const { x, y } = pointList[i];
          drawLine(offscreenCtx, x, y);
        }
      }
    });
    setTransparentBackground(canvas, ctx);
    ctx.drawImage(offScreenCanvas, 0, 0);
  }
}

function downloadFileByCanvas() {
  const canvas = canvasRef.value;
  if (canvas) {
    const file = canvasToImageFile(canvas, 300, "电子签名");
    downloadFile(file);
  }
}

let start = false;
let startPoint = {
  x: 0,
  y: 0,
};

enum PointTypeEnum {
  start,
  middle,
  end,
}

type Point = {
  x: number;
  y: number;
  type: PointTypeEnum;
};
const lineMap: Map<number, Array<Point>> = new Map();

function drawLine(
  ctx: CanvasRenderingContext2D,
  targetX: number,
  targetY: number
) {
  ctx.beginPath();
  ctx.moveTo(startPoint.x, startPoint.y);
  ctx.lineTo(targetX, targetY);
  ctx.stroke();
  startPoint.x = targetX;
  startPoint.y = targetY;
}
let drawCount = 0;
let currentLineList: Array<Point> = new Array<Point>();
function mouseDownListener(event: MouseEvent) {
  const canvas = canvasRef.value;
  const ctx = canvasContext.value;
  if (canvas && ctx) {
    setContextBaseConfig(ctx);
    startPoint.x = event.offsetX;
    startPoint.y = event.offsetY;
    drawCount++;
    currentLineList = new Array<Point>({
      x: startPoint.x,
      y: startPoint.y,
      type: PointTypeEnum.start,
    });
    lineMap.set(drawCount, currentLineList);
    start = true;
  }
}
function mouseMoveListener(event: MouseEvent) {
  const ctx = canvasContext.value;
  if (ctx && start) {
    const { offsetX, offsetY } = event;
    drawLine(ctx, offsetX, offsetY);
    currentLineList.push({
      x: offsetX,
      y: offsetY,
      type: PointTypeEnum.middle,
    });
  }
}
function mouseUpListener(event: MouseEvent) {
  const ctx = canvasContext.value;
  if (ctx && start) {
    const { offsetX, offsetY } = event;
    drawLine(ctx, offsetX, offsetY);
    currentLineList.push({
      x: offsetX,
      y: offsetY,
      type: PointTypeEnum.end,
    });
  }
  start = false;
}

function addPCEventListener() {
  if (canvasRef.value) {
    canvasRef.value.addEventListener("mousedown", mouseDownListener);
    canvasRef.value.addEventListener("mousemove", mouseMoveListener);
    canvasRef.value.addEventListener("mouseup", mouseUpListener);
    window.addEventListener("resize", debounce_resize);
  }
}
function getTouchRelativePosition(
  canvas: HTMLCanvasElement,
  event: TouchEvent
) {
  const { offsetLeft, offsetTop } = canvas;
  const { clientX, clientY } = event.touches[0];
  return { x: clientX - offsetLeft, y: clientY - offsetTop };
}

function touchStartListener(event: TouchEvent) {
  const canvas = canvasRef.value;
  const ctx = canvasContext.value;
  if (canvas && ctx) {
    setContextBaseConfig(ctx);
    const { x, y } = getTouchRelativePosition(canvas, event);
    startPoint.x = x;
    startPoint.y = y;
    drawCount++;
    currentLineList = new Array<Point>({
      x: startPoint.x,
      y: startPoint.y,
      type: PointTypeEnum.start,
    });
    lineMap.set(drawCount, currentLineList);
    start = true;
  }
}

function touchMoveListener(event: TouchEvent) {
  event.preventDefault();
  if (start) {
    const canvas = canvasRef.value;
    const ctx = canvasContext.value;
    if (canvas && ctx) {
      const { x, y } = getTouchRelativePosition(canvas, event);
      drawLine(ctx, x, y);
      currentLineList.push({
        x,
        y,
        type: PointTypeEnum.middle,
      });
    }
  }
}
function touchEndListener() {
  start = false;
}

function addSPEventListener() {
  if (canvasRef.value) {
    canvasRef.value.addEventListener("touchstart", touchStartListener);
    canvasRef.value.addEventListener("touchmove", touchMoveListener);
    canvasRef.value.addEventListener("touchend", touchEndListener);
    window.addEventListener("orientationchange", debounce_resize);
  }
}

function init() {
  if (canvasBoxRef.value && canvasRef.value) {
    const canvasBox = canvasBoxRef.value;
    const { offsetWidth: box_width, offsetHeight: box_height } = canvasBox;
    const canvas = canvasRef.value;
    const devicePixelRatio = window.devicePixelRatio;
    canvas.style.width = box_width + "px";
    canvas.style.height = Math.max(box_height, 300) + "px";
    canvas.width = box_width * devicePixelRatio;
    canvas.height = Math.max(box_height, 300) * devicePixelRatio;
    canvasContext.value = canvas.getContext("2d");
    const ctx = canvasContext.value;
    if (ctx) {
      ctx.scale(devicePixelRatio, devicePixelRatio);
      setTransparentBackground(canvas, ctx);
      setContextBaseConfig(ctx);
      if (getDeviceType() === DeviceTypeEnum.PC) {
        addPCEventListener();
      } else {
        addSPEventListener();
      }
    }
  }
}

function resize() {
  const canvasBox = canvasBoxRef.value;
  const canvas = canvasRef.value;
  const header = document.querySelector("header#header");
  const operationBox = operationBoxRef.value;
  const windowHeight = window.innerHeight;
  if (header && operationBox && canvasBox && canvas) {
    const headerHeight = header.clientHeight;
    const operationBoxHeight = operationBox.clientHeight;
    const width = window.innerWidth;
    const height = Math.max(
      windowHeight - headerHeight - operationBoxHeight,
      300
    );
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      setTransparentBackground(canvas, ctx);
      setContextBaseConfig(ctx);
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
  }
}

let debounce_resize = debounce(resize, 50);

onMounted(() => {
  init();
});
onBeforeUnmount(() => {
  if (canvasRef.value) {
    if (getDeviceType() === DeviceTypeEnum.PC) {
      canvasRef.value.removeEventListener("mousedown", mouseDownListener);
      canvasRef.value.removeEventListener("mousemove", mouseMoveListener);
      canvasRef.value.removeEventListener("mouseup", mouseUpListener);
      window.removeEventListener("resize", debounce_resize);
    } else {
      canvasRef.value.removeEventListener("touchstart", touchStartListener);
      canvasRef.value.removeEventListener("touchmove", touchMoveListener);
      canvasRef.value.removeEventListener("touchend", touchEndListener);
      window.removeEventListener("orientationchange", debounce_resize);
    }
  }
});
</script>
<template>
  <section class="h-full flex flex-col">
    <section
      ref="operationBoxRef"
      class="flex justify-between flex-col sm:flex-row gap-2 px-2 py-2"
    >
      <section class="flex gap-2">
        <article class="flex items-center">
          <span class="flex-none">字体颜色：</span>
          <el-color-picker v-model="fontColor" @change="setStrokeStyle" />
        </article>
        <article class="flex-1 flex items-center">
          <span class="flex-none">字体宽度：</span>
          <el-input-number
            v-model="lineWidth"
            :min="2"
            :max="10"
            :step="1"
            step-strictly
            @change="setLineWidth"
          ></el-input-number>
        </article>
      </section>
      <section class="flex-none flex gap-3">
        <ButtonView @click="clearCanvas"> 清空 </ButtonView>
        <ButtonView @click="redraw"> 重绘 </ButtonView>
        <ButtonView @click="downloadFileByCanvas"> 下载 </ButtonView>
      </section>
    </section>
    <section ref="canvasBoxRef" class="flex-1 bg-slate-300">
      <canvas ref="canvasRef" class="w-full h-full bg-transparent"></canvas>
    </section>
  </section>
</template>

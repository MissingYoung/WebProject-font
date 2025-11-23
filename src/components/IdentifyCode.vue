<!-- src/components/IdentifyCode.vue -->
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  width: { type: Number, default: 120 },
  height: { type: Number, default: 40 }
})

const emit = defineEmits(['update:code'])

const canvasRef = ref<HTMLCanvasElement | null>(null)
const code = ref('')

// 生成随机数
const randomNum = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min) + min)
}

// 生成随机颜色
const randomColor = (min: number, max: number) => {
  const r = randomNum(min, max)
  const g = randomNum(min, max)
  const b = randomNum(min, max)
  return `rgb(${r},${g},${b})`
}

// 绘制验证码
const draw = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  //  填充背景
  ctx.fillStyle = randomColor(240, 255) // 浅色背景
  ctx.fillRect(0, 0, props.width, props.height)

  //  生成 4 位随机文字
  const pool = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let imgCode = ''
  for (let i = 0; i < 4; i++) {
    const text = pool[randomNum(0, pool.length)]!
    imgCode += text
    
    // 随机字体大小和旋转
    const fontSize = randomNum(20, 30)
    const deg = randomNum(-30, 30)
    
    ctx.font = `${fontSize}px SimHei`
    ctx.textBaseline = 'top'
    ctx.fillStyle = randomColor(80, 150) // 深色文字

    ctx.save()
    ctx.translate(30 * i + 15, 15)
    ctx.rotate((deg * Math.PI) / 180)
    ctx.fillText(text, -10, -10)
    ctx.restore()
  }
  
  // 更新生成的验证码给父组件
  code.value = imgCode
  emit('update:code', imgCode)

  //  绘制干扰线
  for (let i = 0; i < 5; i++) {
    ctx.beginPath()
    ctx.moveTo(randomNum(0, props.width), randomNum(0, props.height))
    ctx.lineTo(randomNum(0, props.width), randomNum(0, props.height))
    ctx.strokeStyle = randomColor(180, 230)
    ctx.closePath()
    ctx.stroke()
  }

  //  绘制干扰点
  for (let i = 0; i < 40; i++) {
    ctx.beginPath()
    ctx.arc(randomNum(0, props.width), randomNum(0, props.height), 1, 0, 2 * Math.PI)
    ctx.closePath()
    ctx.fillStyle = randomColor(150, 200)
    ctx.fill()
  }
}

// 点击刷新
const refresh = () => {
  draw()
}

onMounted(() => {
  draw()
})

// 暴露刷新方法给父组件
defineExpose({ refresh })
</script>

<template>
  <canvas 
    ref="canvasRef" 
    :width="props.width" 
    :height="props.height"
    class="cursor-pointer border rounded-md hover:shadow-sm transition-all"
    @click="refresh"
    title="看不清？点击刷新"
  ></canvas>
</template>
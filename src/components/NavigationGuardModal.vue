<template>
  <div v-if="visible" class="guard-modal-overlay">
    <div class="guard-modal-content">
      <div class="guard-modal-header">
        <div class="warning-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        <h2 class="guard-title">生成过程中请勿离开</h2>
        <p class="guard-subtitle">
          当前正在进行内容生成，离开此页面可能导致生成任务失败。
          <br />
          请等待生成完成或点击"再来一篇"或"放弃本次生成"后再进行操作。
        </p>
      </div>

      <div class="guard-modal-footer">
        <button class="btn btn-primary" @click="handleConfirm">
          我知道了
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  visible: boolean
}

interface Emits {
  (e: 'confirm'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const handleConfirm = () => {
  emit('confirm')
}
</script>

<style scoped>
.guard-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  backdrop-filter: blur(4px);
}

.guard-modal-content {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.guard-modal-header {
  padding: 32px 32px 24px;
  text-align: center;
  border-bottom: 1px solid var(--border-color, #f0f0f0);
}

.warning-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff9800 0%, #ffb74d 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: scaleIn 0.3s ease-out;
}

@keyframes scaleIn {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}

.guard-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-main, #333);
  margin: 0 0 12px;
}

.guard-subtitle {
  font-size: 14px;
  color: var(--text-sub, #666);
  margin: 0;
  line-height: 1.6;
}

.guard-modal-footer {
  padding: 20px 32px 32px;
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn {
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-primary {
  background: var(--primary, #1890ff);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-hover, #40a9ff);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}
</style>

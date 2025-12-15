<template>
  <div class="style-example-card" @click="handleClick">
    <div class="style-image-wrapper">
      <img 
        :src="imageUrl" 
        :alt="name" 
        class="style-image"
        loading="lazy"
      />
    </div>
    <div class="style-info">
      <h4 class="style-name">{{ name }}</h4>
      <div class="style-prompt">
        <p>{{ prompt }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  id: string;
  name: string;
  imageUrl: string;
  prompt: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'click', id: string): void;
}>();

const handleClick = () => {
  emit('click', props.id);
};
</script>

<style scoped>
.style-example-card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  width: 100%;
  max-width: 300px;
}

.style-example-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.style-image-wrapper {
  width: 100%;
  padding-top: 133.33%; /* 3:4 比例 */
  position: relative;
  overflow: hidden;
}

.style-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.style-example-card:hover .style-image {
  transform: scale(1.05);
}

.style-info {
  padding: 16px;
}

.style-name {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #333;
}

.style-prompt {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .style-example-card {
    max-width: 100%;
  }
  
  .style-info {
    padding: 12px;
  }
  
  .style-name {
    font-size: 14px;
  }
  
  .style-prompt {
    font-size: 13px;
  }
}
</style>
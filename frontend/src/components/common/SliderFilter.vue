<template>


  <div class="slider-filter slider-wrapper" :style="{ maxWidth: `${maxWidth}px` }">
    <div class="slider-track">
      <!-- 动态生成选项按钮 -->
      <button
          v-for="(option, index) in options"
          :key="option.value"
          class="slider-option"
          :class="{ active: activeValue === option.value }"
          @click="handleFilterChange(option.value)"
      >
        {{ option.label }}
      </button>

      <!-- 滑块 -->
      <div
          class="slider-thumb"
          :style="{
            width: `calc(${100 / options.length}% - 2px)`,
            transform: `translateX(${activeIndex * 100}%)`
          }"
      ></div>
    </div>
  </div>
</template>

<script setup>
import {ref, computed, watch} from 'vue';
// 组件名称：SliderFilter（滑动筛选器）
// 功能描述：一款支持动态选项数量的滑动式筛选组件，通过平滑的滑块动画实现选项切换，适用于各类数据筛选场景（如市场类型、数据分类等）。
// 特点：支持动态选项配置、双向数据绑定、自适应布局、平滑过渡动画。
// 定义组件属性
const props = defineProps({
  // 选项列表，格式: [{ label: '名称', value: '值' }, ...]
  options: {
    type: Array,
    required: true,
    validator: (value) => {
      // 验证选项格式
      return value.length >= 2 && value.every(item =>
          item.hasOwnProperty('label') && item.hasOwnProperty('value')
      );
    }
  },
  // 绑定值（v-model）
  modelValue: {
    type: String,
    required: true
  },
  // 最大宽度（根据选项数量自动调整）
  maxWidth: {
    type: Number,
    default: 500
  }
});

// 定义事件（用于v-model双向绑定）
const emit = defineEmits(['update:modelValue', 'change']);

// 活跃值（与v-model同步）
const activeValue = ref(props.modelValue);

// 计算当前活跃索引
const activeIndex = computed(() => {
  return props.options.findIndex(option => option.value === activeValue.value);
});

// 处理选项变更
const handleFilterChange = (value) => {
  activeValue.value = value;
  emit('update:modelValue', value); // 更新v-model
  emit('change', value); // 触发change事件
};

// 监听外部v-model变化
watch(
    () => props.modelValue,
    (newVal) => {
      activeValue.value = newVal;
    }
);
</script>

<style scoped>
.slider-filter {
  flex: 1;
  width: auto;
}

.slider-filter .slider-wrapper {
  width: 100%;
}

.slider-filter .slider-track {
  display: flex;
  background: #f1f5f9;
  border-radius: 20px;
  position: relative;
  padding: 2px;
}

.slider-filter .slider-option {
  flex: 1;
  padding: 10px 0;
  background: transparent;
  border: none;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  z-index: 2;
  transition: color 0.3s ease;
}

.slider-filter .slider-option.active {
  color: #2563eb;
  font-weight: 600;
}

.slider-filter .slider-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  bottom: 3px;
  background: white;
  border-radius: 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 1;
}

/* 移除scoped对深层选择器的影响 */
:deep(.slider-option) {
  user-select: none;
}
</style>

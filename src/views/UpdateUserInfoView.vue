<script setup lang="ts">
import UpdateUserInfoForm from '../components/UpdateUserInfoForm.vue'
</script>

<template>
  <div class="page-container">
    <div class="content-wrapper">
      <UpdateUserInfoForm />
    </div>
  </div>
</template>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 0;
  background: linear-gradient(to bottom, #fafbfc 0%, #f0f2f5 100%);
}

.content-wrapper {
  width: 100%;
  height: 100vh;
  max-width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

@media (max-width: 640px) {
  .page-container {
    padding: 0;
  }
}
</style>

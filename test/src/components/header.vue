<template>
    <button @click="goTo('/page2')">page2</button>
    <button @click="goTo('/page3')">page3</button>
    <button @click="goTo('/page4')">page4</button>
</template>
<script setup>
import { useRouter } from 'vue-router';

const router = useRouter()
const goTo = (to) => {
    router.push(to);
}
</script>

<style scoped>
button {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
}
</style>
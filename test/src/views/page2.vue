
<template>
    <Header/>
    <p>page2</p>
    <p>clicks: {{ clicks }}</p>
    <button @click="makeAction({key:'tokens.count'})">Сделать клик</button>
</template>
<script setup>
import Header from '@/components/header.vue';
import { useAuthStore } from '@payment-app/authSdk';
import { ref } from 'vue';

const authStore = useAuthStore();
const clicks = ref(0)

const makeAction = async (action)=>{
    const response = await authStore.isActionAvailable(action)
    if(response.available){
        clicks.value++
    }else{

    }
}

</script>

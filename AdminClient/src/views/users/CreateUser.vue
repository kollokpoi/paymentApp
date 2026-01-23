<template>
    <div class="space-y-6">
        <div class="flex items-center text-sm text-gray-500">
            <router-link to="/users" class="hover:text-blue-600">Пользователи</router-link>
            <i class="pi pi-chevron-right mx-2"></i>
            <span>Создание пользователя</span>
        </div>
    </div>

    <h1 class="text-2xl font-bold">Создание нового пользователя</h1>

    <CardPrime>
        <template #title>Основная информация</template>
        <template #content>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 class="font-medium text-gray-700 mb-4">Данные пользователя</h3>
                    <dl class="space-y-3">
                        <EditableText label="Имя" :type="FieldTypes.Text" v-model:value="formData.name" required
                            :is-editing="true" v-on:validation-change="onValidationChange('name', $event)" />

                        <EditableEmail required label="Email" v-model:value="formData.email" :is-editing="true"
                            :type="FieldTypes.Email" v-on:validation-change="onValidationChange('email', $event)" />

                        <EditableSelect label="Роль" v-model:value="formData.role" required :items="roleOptions"
                            :is-editing="true" />
                        <EditableText label="Пароль" v-model:value="formData.password" :is-editing="true" required
                            :type="FieldTypes.Password"
                            v-on:validation-change="onValidationChange('password', $event)" />
                        <EditableText label="Повторите пароль" v-model:value="passwordRewrite" required
                            :is-editing="true" :type="FieldTypes.Password" :validators="passwordValidatiors"
                            v-on:validation-change="onValidationChange('passwordRewrite', $event)" />
                    </dl>
                </div>
            </div>
        </template>
    </CardPrime>

    <div class="flex gap-2 justify-end">
        <ButtonPrime label="Отмена" icon="pi pi-times" outlined @click="cancel" />
        <ButtonPrime label="Создать" icon="pi pi-check" :disabled="!canCreate" @click="createUser" />
    </div>
    <ConfirmDialog :draggable="true" />
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast, useConfirm } from 'primevue'
import CardPrime from 'primevue/card'
import ButtonPrime from 'primevue/button'
import ConfirmDialog from 'primevue/confirmdialog'

import { userService } from '@/services'

import { AdminRole } from '@/types/api/responses'
import EditableText from '@/components/editableFields/EditableText.vue'
import EditableSelect from '@/components/editableFields/EditableSelect.vue'
import EditableEmail from '@/components/editableFields/EditableEmail.vue'
import { FieldTypes, type ValidationResult } from '@/types/editable'
import type { CreateUserRequest } from '@/services/user.service'

const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const passwordRewrite = ref('')
const validationErrors = ref<Array<{ field: string; message: string }>>([])

const onValidationChange = (field: string, result: ValidationResult) => {
    validationErrors.value = validationErrors.value.filter(e => e.field !== field)

    if (!result.isValid && result.message) {
        validationErrors.value.push({
            field,
            message: result.message
        })
    }
    console.log(validationErrors)
}

const canCreate = computed(() => validationErrors.value.length === 0)

const formData = reactive<CreateUserRequest>({
    email: '',
    name: '',
    role: AdminRole.SUPPORT,
    password: ''
})


const roleOptions = [
    { value: AdminRole.SUPERADMIN, label: 'Суперадминистратор' },
    { value: AdminRole.ADMIN, label: 'Администратор' },
    { value: AdminRole.SUPPORT, label: 'Менеджер' }
]

const passwordValidatiors = [
    (value: string): ValidationResult => {
        if (formData.password !== value) {
            return { isValid: false, message: "Пароли не совпадают" }
        }
        return { isValid: true }
    }
]
const cancel = () => {
    if (formData.name || formData.email || formData.password) {
        confirm.require({
            message: 'Вы уверены? Введенные данные будут потеряны',
            header: 'Подтверждение выхода',
            icon: 'pi pi-exclamation-triangle',
            acceptClass: 'p-button-danger',
            acceptLabel: 'Выход',
            rejectLabel: 'Остаться',
            accept() {
                router.push('/tariffs')
            },
        })
    } else
        router.push('/tariffs')
}
const createUser = async () => {
    if (!canCreate.value) {
        toast.add({
            severity: 'warn',
            summary: 'Заполните обязательные поля',
            detail: 'Не все обязательные значения указаны',
            life: 3000,
        })
        return
    }
    try {
        const response = await userService.create(formData)

        if (response.success) {
            toast.add({
                severity: 'success',
                summary: 'Успешно',
                detail: 'Пользователь создан',
                life: 3000
            })

            router.push(`/users/${response.data.id}`)
        } else {
            toast.add({
                severity: 'error',
                summary: 'Ошибка',
                detail: response.message || 'Не удалось добавить пользователя',
                life: 3000,
            })
        }
    } catch {
        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: 'Не удалось добавить пользователя',
            life: 3000,
        })
    }
}
</script>

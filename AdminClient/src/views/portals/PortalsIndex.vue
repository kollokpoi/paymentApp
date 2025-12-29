<template>
  <div>
    <!-- Простой заголовок -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold mb-2">Порталы</h1>
      <p class="text-gray-600">Управление порталами Bitrix24</p>
    </div>

    <!-- Простой поиск -->
    <div class="mb-6">
      <div class="flex gap-3">
        <div class="flex-1">
          <InputText
            v-model="search"
            placeholder="Поиск по названию или домену..."
            class="w-full"
          />
        </div>
        <Button label="Добавить" icon="pi pi-plus"></Button>
      </div>
    </div>

    <DataTable
        :value="filteredPortals"
        responsiveLayout="scroll"
        class="p-datatable-sm"
        stripedRows
        paginator
        :rows="20"
        :rowsPerPageOptions="[10, 20, 50]"
        :rowClass="rowClassFunction"
        @row-click="onRowClick"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Показано {first} - {last} из {totalRecords} сделок">

        <Column field="companyName" header="Компания"></Column>
        <Column field="b24Domain" header="Домен"></Column>
        <Column field="adminEmail" header="Админстратор">
          <template #body="{ data }">
            {{ data.adminEmail }}
          </template>
        </Column>
        <Column field="subscriptions" header="Подписки">
          <template #body="{ data }">
            {{ data.subscriptions.length }}
          </template>
        </Column>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { portalService } from '@/services'
import {useRouter } from 'vue-router';
import type { PortalDTO } from '@/types/dto'
import Button from 'primevue/button'
import Column from 'primevue/column'
import type { DataTableRowClickEvent } from 'primevue'

const loading = ref(true)
const search = ref('')
const portals = ref<PortalDTO[]>([])
const router = useRouter();

const filteredPortals = computed(() => {
  if (!search.value) return portals.value
  const query = search.value.toLowerCase()
  return portals.value.filter(portal =>
    portal.companyName?.toLowerCase().includes(query) ||
    portal.b24Domain?.toLowerCase().includes(query) ||
    portal.adminEmail?.toLowerCase().includes(query)
  )
})

const onRowClick = (event : DataTableRowClickEvent<PortalDTO>) => {
  const id = event.data.id
  router.push({
    path: `/portals/${id}`
  });
};

const rowClassFunction = ():string=>
{
  const classes = ['cursor-pointer'];
  return classes.join(' ')
}

const loadPortals = async () => {
  try {
    loading.value = true
    const response = await portalService.getPortals()

    if (response.data?.items) {
      portals.value = response.data.items
    } else if (Array.isArray(response.data)) {
      portals.value = response.data
    } else {
      portals.value = []
    }

    console.log('Portals loaded:', portals.value)
  } catch (error) {
    console.error('Ошибка загрузки порталов:', error)
  } finally {
    loading.value = false
  }
}

onMounted(async()=>{
  await loadPortals();
})
</script>

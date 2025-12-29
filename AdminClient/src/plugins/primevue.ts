// Импортируем PrimeVue
import PrimeVue from 'primevue/config'

// Импортируем кастомный Пресет
import MyPreset from './primeVuePreset.ts'

// Импортируем компоненты PrimeVue
import Accordion from 'primevue/accordion'
import AccordionTab from 'primevue/accordiontab'
import Button from 'primevue/button'
import ButtonGroup from 'primevue/buttongroup'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import Divider from 'primevue/divider'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import ProgressBar from 'primevue/progressbar'
import Skeleton from 'primevue/skeleton'
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
import TabView from 'primevue/tabview'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'
import Timeline from 'primevue/timeline'
import DatePicker from 'primevue/datepicker'
import InputNumber from 'primevue/inputnumber'
import Toast from 'primevue/toast'
import ToastService from 'primevue/toastservice'
import Avatar from 'primevue/avatar'
import Menu from 'primevue/menu'
import SplitButton from 'primevue/splitbutton'
import InputSwitch from 'primevue/inputswitch'
import { AutoComplete } from 'primevue'

export default {
  install(app: any) {
    app.use(PrimeVue, {
      theme: {
        preset: MyPreset,
        options: {
          prefix: 'p',
          darkModeSelector: false,
          cssLayer: false,
        },
      },
      ripple: true,
    })

    // Регистрируем сервисы
    app.use(ToastService)

    // Регистрируем компоненты
    app.component('AccordionPrime', Accordion)
    app.component('AccordionTab', AccordionTab)
    app.component('AvatarPrime', Avatar)
    app.component('ButtonPrime', Button)
    app.component('ButtonGroup', ButtonGroup)
    app.component('CardPrime', Card)
    app.component('ColumnPrime', Column)
    app.component('DataTable', DataTable)
    app.component('DatePicker', DatePicker)
    app.component('DialogPrime', Dialog)
    app.component('DividerPrime', Divider)
    app.component('DropdownPrime', Dropdown)
    app.component('InputNumber', InputNumber)
    app.component('InputSwitch', InputSwitch)
    app.component('InputText', InputText)
    app.component('MenuPrime', Menu)
    app.component('MessagePrime', Message)
    app.component('ProgressBar', ProgressBar)
    app.component('SkeletonPrime', Skeleton)
    app.component('SplitButton', SplitButton)
    app.component('TabPrime', Tab)
    app.component('TabList', TabList)
    app.component('TabPanel', TabPanel)
    app.component('TabPanels', TabPanels)
    app.component('TabsPrime', Tabs)
    app.component('TabView', TabView)
    app.component('TagPrime', Tag)
    app.component('TextareaPrime', Textarea)
    app.component('TimelinePrime', Timeline)
    app.component('ToastPrime', Toast)
    app.component('AutoComplete',AutoComplete)
  },
}

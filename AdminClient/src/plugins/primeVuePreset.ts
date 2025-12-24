// Кастомный пресет PrimeVue темы
// Можно взять из рабочего проекта или создать свой

export default {
  semantic: {
    colorScheme: {
      light: {
        primary: {
          50: '{blue.50}',
          100: '{blue.100}',
          200: '{blue.200}',
          300: '{blue.300}',
          400: '{blue.400}',
          500: '{blue.500}',
          600: '{blue.600}',
          700: '{blue.700}',
          800: '{blue.800}',
          900: '{blue.900}',
          950: '{blue.950}'
        },
        surface: {
          0: '{white}',
          50: '{gray.50}',
          100: '{gray.100}',
          200: '{gray.200}',
          300: '{gray.300}',
          400: '{gray.400}',
          500: '{gray.500}',
          600: '{gray.600}',
          700: '{gray.700}',
          800: '{gray.800}',
          900: '{gray.900}',
          950: '{gray.950}'
        }
      },
      dark: {
        primary: {
          50: '{blue.50}',
          100: '{blue.100}',
          200: '{blue.200}',
          300: '{blue.300}',
          400: '{blue.400}',
          500: '{blue.500}',
          600: '{blue.600}',
          700: '{blue.700}',
          800: '{blue.800}',
          900: '{blue.900}',
          950: '{blue.950}'
        },
        surface: {
          0: '{zinc.950}',
          50: '{zinc.900}',
          100: '{zinc.800}',
          200: '{zinc.700}',
          300: '{zinc.600}',
          400: '{zinc.500}',
          500: '{zinc.400}',
          600: '{zinc.300}',
          700: '{zinc.200}',
          800: '{zinc.100}',
          900: '{zinc.50}',
          950: '{white}'
        }
      }
    }
  },
  components: {
    card: {
      root: {
        borderRadius: '{border.radius.xl}',
        padding: '{spacing.5}',
        gap: '{spacing.5}'
      }
    },
    button: {
      root: {
        borderRadius: '{border.radius.xl}',
        fontWeight: '500'
      }
    },
    inputtext: {
      root: {
        borderRadius: '{border.radius.xl}'
      }
    }
  }
}

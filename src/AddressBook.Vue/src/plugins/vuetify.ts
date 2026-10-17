import '@mdi/font/css/materialdesignicons.css';
import { createVuetify } from 'vuetify';
import 'vuetify/styles';

export default createVuetify({
  icons: { defaultSet: 'mdi' },
  theme: {
    defaultTheme: 'light',
    themes: {
      // The default 0.6 leaves field labels below the WCAG AA contrast ratio of 4.5:1 on white.
      light: { variables: { 'medium-emphasis-opacity': 0.7 } },
    },
  },
});

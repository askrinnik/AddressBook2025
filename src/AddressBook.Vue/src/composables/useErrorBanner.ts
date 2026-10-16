import type { ClientProblemDetails } from '@/api/problemDetails';
import { inject, provide, readonly, ref, type InjectionKey, type Ref } from 'vue';

export interface ErrorBanner {
  /** The text shown in the banner; empty when no error is shown. */
  message: Readonly<Ref<string>>;
  /** Shows a plain error message. */
  processError: (errorMessage: string) => void;
  /** Shows the extension members of a problem as indented JSON; `null` or no problem shows `null`. */
  processProblem: (problem: ClientProblemDetails | null | undefined) => void;
  /** Hides the banner. */
  clear: () => void;
}

const errorBannerKey: InjectionKey<ErrorBanner> = Symbol('errorBanner');

/** Creates the banner state and makes it available to the descendants of the calling component. */
export function provideErrorBanner(): ErrorBanner {
  const message = ref('');
  const banner: ErrorBanner = {
    message: readonly(message),
    processError: (errorMessage) => {
      message.value = errorMessage;
    },
    processProblem: (problem) => {
      // JSON.stringify yields undefined for undefined; the banner shows `null` for no problem.
      message.value = JSON.stringify(problem?.extensions ?? null, null, 2);
    },
    clear: () => {
      message.value = '';
    },
  };
  provide(errorBannerKey, banner);
  return banner;
}

/** Returns the global error banner provided by the application root. */
export function useErrorBanner(): ErrorBanner {
  const banner = inject(errorBannerKey);
  if (!banner) {
    throw new Error('useErrorBanner() requires provideErrorBanner() in an ancestor component.');
  }
  return banner;
}

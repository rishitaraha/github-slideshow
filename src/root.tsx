import { ToastManager, TopLoadingBar } from '@aus-platform/design-system';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { App } from './app';
import { store } from './app/store';
import ErrorBoundary from './error-boundary';
import { setupSentry } from './config';
import { queryClient } from './shared/api';
import { history } from './shared/constants';
import { CustomRouter } from './shared/routes';

const Root = () => {
  return (
    <>
      <ToastManager />
      <TopLoadingBar />
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <CustomRouter history={history}>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </CustomRouter>
        </Provider>
        <div
          style={{
            fontSize: '20px',
            // Comment the below line to use React Query Dev Tools.
            display: 'none',
          }}
        >
          <ReactQueryDevtools initialIsOpen={false} />
        </div>
      </QueryClientProvider>
    </>
  );
};

export default Root;

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container); // createRoot(container!) if you use TypeScript
  root.render(<Root />);
}

setupSentry();

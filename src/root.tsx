import { createRoot } from 'react-dom/client';
import { ToastManager } from './atoms/toast';

const Root = () => {
  return (
    <>
      <ToastManager />
    </>
  );
};

export default Root;

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container); // createRoot(container!) if you use TypeScript
  root.render(<Root />);
}

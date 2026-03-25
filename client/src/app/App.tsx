import { RouterProvider } from 'react-router';
import { router } from './routes';
import { CalcProvider } from './context/CalcContext';

export default function App() {
  return (
    <CalcProvider>
      <RouterProvider router={router} />
    </CalcProvider>
  );
}

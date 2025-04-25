// App.tsx
import React, { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import router from './router';
import { userAccessToservice } from './utils/axios';

const queryClient = new QueryClient();

function App() {
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuthorization = async () => {
      const authorized = await userAccessToservice();
      setIsAuthorized(authorized);
    };

    checkAuthorization();
  }, []);

  if (!isAuthorized) {
    return <div>Unauthorized</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default App;

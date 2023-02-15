import 'remixicon/fonts/remixicon.css';
import './style/index.css';
import { PageRoute } from './component/route';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReAuthUser } from './component/layout/ReAuthUser';

const client = new QueryClient();
function App() {
  return (
    <>
      <QueryClientProvider client={client}>
        <ReAuthUser />
        <PageRoute />
      </QueryClientProvider>
    </>
  );
}

export default App;

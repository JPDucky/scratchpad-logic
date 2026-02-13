import { StoreProvider } from './store';
import { KeybindingProvider } from './keybindings';
import { Layout } from './components/Layout';
import { KeybindingStoreConnector } from './components/KeybindingStoreConnector';
import './index.css';

function App() {
  return (
    <StoreProvider>
      <KeybindingProvider>
        <KeybindingStoreConnector />
        <Layout />
      </KeybindingProvider>
    </StoreProvider>
  );
}

export default App;

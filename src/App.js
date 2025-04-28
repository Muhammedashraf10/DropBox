import { Amplify } from 'aws-amplify';
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import awsExports from './aws-exports';
import FileManager from './FileManager';
import './App.css';

Amplify.configure(awsExports);

function App() {
  return (
    <div className="App">
      <h1>Dropbox App</h1>
      <FileManager />
    </div>
  );
}

export default withAuthenticator(App);

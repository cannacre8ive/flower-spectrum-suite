import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/newsreader/400.css';
import '@fontsource/newsreader/400-italic.css';
import '@fontsource/newsreader/600.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/jetbrains-mono/400.css';
import App from './App.jsx';
import './styles.css';
class ErrorBoundary extends React.Component {state={error:false};static getDerivedStateFromError(){return {error:true}}render(){return this.state.error?<main className="provenance"><h1>This view could not open.</h1><p>Your original source files are safe. Reload the page to try again.</p><button onClick={()=>location.reload()}>Reload</button></main>:this.props.children}}
createRoot(document.getElementById('root')).render(<ErrorBoundary><App/></ErrorBoundary>);

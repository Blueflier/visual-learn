import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Layout />} />
          <Route path="/graph/:id" element={<Layout />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

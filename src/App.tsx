import { BrowserRouter, Route, Routes, Link } from 'react-router-dom';
import './App.css';
import CesiumViewerContainer from "./components/cesium-viewer/cesium-viewer";
import SplitViewerContainer from './components/cesium-viewer/split-viewer';

const App = () => {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CesiumViewerContainer />} />
        <Route path="/split-viewer" element={<SplitViewerContainer />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

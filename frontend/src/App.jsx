
import { BrowserRouter as Router } from 'react-router-dom';
import AppRouter from './router/AppRouter';
import "./App.css"
// import "antd/dist/antd.css"; 

const App = () => {
  return (
    <Router>
      <AppRouter />
    </Router>
  );
};

export default App;
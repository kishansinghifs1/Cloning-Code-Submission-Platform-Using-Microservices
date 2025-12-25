import { Route, Routes } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import SideBar from './components/SideBar';
import ProblemDescription from './pages/Description/ProblemDescription';
import ProblemList from './pages/ProblemList/ProblemList';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <div className='h-[100vh] overflow-hidden'>
        <Navbar />
        <SideBar />
        <Routes>
          <Route path='/' element={
            <div className="flex items-center justify-center h-[calc(100vh-57px)]">
              <div className="text-center">
                <h1 className="text-4xl font-bold mb-4">Welcome to AlgoCode</h1>
                <p className="text-lg text-gray-600 mb-4">Practice coding problems and improve your skills</p>
                <a href="/problems/list" className="btn btn-primary">Get Started</a>
              </div>
            </div>
          } />
          <Route path='/problems/list' element={
            <ProtectedRoute>
              <ProblemList />
            </ProtectedRoute>
          } />
          <Route path='/problems/:problemId' element={
            <ProtectedRoute>
              <ProblemDescription />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;


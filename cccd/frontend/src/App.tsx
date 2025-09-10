import React, { useState, useEffect } from 'react';
import { FileText, Settings, Shield, Users, MapPin, Calendar, Hash } from 'lucide-react';
import CCCDGenerator from './components/CCCDGenerator';
import CCCDAnalyzer from './components/CCCDAnalyzer';
import Header from './components/Header';
import Footer from './components/Footer';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import { AppState } from './types';
import CCCDApiService from './services/api';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    currentView: 'generator',
    isLoading: false,
    error: null,
    success: null
  });

  const [isServerOnline, setIsServerOnline] = useState<boolean>(false);

  useEffect(() => {
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    try {
      await CCCDApiService.healthCheck();
      setIsServerOnline(true);
    } catch (error) {
      setIsServerOnline(false);
      setState(prev => ({
        ...prev,
        error: 'Không thể kết nối với máy chủ. Vui lòng kiểm tra backend server.'
      }));
    }
  };

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error, success: null }));
  };

  const setSuccess = (success: string | null) => {
    setState(prev => ({ ...prev, success, error: null }));
  };

  const switchView = (view: 'generator' | 'analyzer') => {
    setState(prev => ({
      ...prev,
      currentView: view,
      error: null,
      success: null
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
          <div className="flex space-x-1">
            <button
              onClick={() => switchView('generator')}
              className={`flex-1 flex items-center justify-center px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                state.currentView === 'generator'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Hash className="w-4 h-4 mr-2" />
              Tạo CCCD
            </button>
            <button
              onClick={() => switchView('analyzer')}
              className={`flex-1 flex items-center justify-center px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                state.currentView === 'analyzer'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <FileText className="w-4 h-4 mr-2" />
              Phân tích CCCD
            </button>
          </div>
        </div>
      </div>

      {/* Server Status */}
      {!isServerOnline && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <Shield className="w-5 h-5 text-red-500 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  Máy chủ không khả dụng
                </h3>
                <p className="text-sm text-red-600 mt-1">
                  Vui lòng khởi động backend server trước khi sử dụng ứng dụng.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Loading Overlay */}
        {state.isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-xl">
              <LoadingSpinner />
              <p className="text-gray-600 mt-3">Đang xử lý...</p>
            </div>
          </div>
        )}

        {/* Error/Success Messages */}
        {state.error && (
          <ErrorMessage
            message={state.error}
            onClose={() => setError(null)}
          />
        )}

        {state.success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  {state.success}
                </p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setSuccess(null)}
                  className="inline-flex rounded-md p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
                >
                  <span className="sr-only">Đóng</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="animate-fade-in">
          {state.currentView === 'generator' ? (
            <CCCDGenerator
              isServerOnline={isServerOnline}
              onLoading={setLoading}
              onError={setError}
              onSuccess={setSuccess}
            />
          ) : (
            <CCCDAnalyzer
              isServerOnline={isServerOnline}
              onLoading={setLoading}
              onError={setError}
              onSuccess={setSuccess}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default App;
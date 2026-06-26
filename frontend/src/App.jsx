import { useState } from 'react';
import Sidebar from "./components/Sidebar/sidebar";
import Navbar from "./components/Navbar/navbar";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [currentTab, setCurrentTab] = useState('ajustes'); // Controla as abas internas do editor

  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex">
      {/* Menu Lateral Estático */}
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} handleLogout={() => console.log('Sair')} />
      
      {/* Painel do Conteúdo da Direita */}
      <div className="flex-1 ml-60 flex flex-col min-h-screen">
        <Navbar />
        
        {/* Renderizador de Telas Dinâmico */}
        <main className="p-8 flex-1">
          <AppRoutes currentPage={currentPage} currentTab={currentTab} setCurrentTab={setCurrentTab} />
        </main>
      </div>
    </div>
  );
}
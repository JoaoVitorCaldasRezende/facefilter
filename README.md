# FaceFilter 📸

> **Trabalho Final de Sistemas Multimídia**  
> Bacharelado em Sistemas de Informação — Universidade Federal de Mato Grosso (UFMT).

O **FaceFilter** é um editor de fotos web premium e interativo, projetado para oferecer uma experiência de edição de imagem fluida e de alto desempenho diretamente no navegador. O projeto combina manipulação de imagem de baixo nível no cliente (usando Canvas 2D/WebGL) com uma interface moderna e responsiva.

---

## 🚀 Funcionalidades Principais

*   **Painel de Ajustes de Luz e Cor**:
    *   Controles deslizantes de precisão para: *Exposição, Brilho, Contraste, Realces, Sombras, Brancos e Pretos*.
    *   Misturador HSL e ferramentas de *Color Grading* para controle tonal avançado.
*   **Curva de Tons Interativa (Tone Curve)**:
    *   Manipulação de curvas utilizando pontos de controle interativos.
    *   **Interpolação de Spline de Hermite** para garantir que a linha comece perfeitamente reta como padrão e se curve suavemente sob demanda.
    *   Suporte completo a telas de toque (Mobile) com capturas de ponteiro dedicadas e bloqueio de rolagem acidental da página durante o arrasto.
*   **Comparação Lado a Lado (Split View)**:
    *   Barra divisória interativa com puxador *glassmorphic* premium para comparar o "Antes" e o "Depois".
    *   Suporte completo a **Zoom** e **Arrasto (Pan)** no modo de comparação, com prevenção de conflitos de toque.
*   **Recorte de Imagem Profissional (Crop)**:
    *   Grade de regra dos terços dinâmica com transição de opacidade durante o redimensionamento.
    *   Guias de cantos em formato "L" espessas com sombras projetadas para melhor contraste em fotos claras/escuras.
    *   Várias proporções predefinidas (1:1, 4:3, 16:9, etc.).
*   **Galeria Integrada**:
    *   Salvamento, listagem e gerenciamento de fotos diretamente no aplicativo.
*   **Totalmente Responsivo**:
    *   Interface adaptada para celulares usando *Bottom Sheets* deslizantes que recalculam as dimensões do canvas dinamicamente, evitando o esmagamento da imagem.
    *   Controles otimizados no cabeçalho para telas de toque.

---

## 🛠️ Tecnologias Utilizadas

### Frontend
*   **React 19** + **Vite 8** (Processamento rápido e HMR ultra-eficiente)
*   **TailwindCSS v4** (Estilização moderna com design system otimizado)
*   **React Router DOM v7** (Roteamento de páginas da galeria e editor)
*   **Vitest** (Testes unitários automatizados para pipelines de renderização)

### Backend
*   **Flask (Python)** (API simples para armazenamento e serviços do sistema)

---

## ⚙️ Como Executar o Projeto

### Pré-requisitos
*   **Node.js** (v18 ou superior)
*   **pnpm** (ou npm/yarn)
*   **Python 3.x**

### 1. Servidor Backend (Flask)
Navegue até a pasta `backend` e execute a API:
```bash
# Entre na pasta
cd backend

# Crie um ambiente virtual (opcional, mas recomendado)
python -m venv venv
source venv/bin/activate # No Windows use: venv\Scripts\activate

# Instale as dependências
pip install flask flask-cors

# Inicie o servidor
python app.py
```
A API estará disponível em `http://localhost:5000`.

### 2. Frontend (React/Vite)
Navegue até a pasta `frontend` e inicie o servidor de desenvolvimento:
```bash
# Entre na pasta
cd frontend

# Instale as dependências
pnpm install

# Execute o servidor de desenvolvimento
pnpm dev
```
O aplicativo web estará disponível em `http://localhost:5173`.

---

## 🧪 Executando Testes e Qualidade

O projeto inclui testes automatizados para verificar a fidelidade matemática do pipeline de curvas de tons e manipulação de cores:

```bash
# Executa a suíte de testes (Vitest)
pnpm test

# Executa o linter para checagem de estilo de código (ESLint)
pnpm lint
```

---

## 📐 Pipeline de Renderização

O processamento das imagens no FaceFilter é feito em tempo real no lado do cliente utilizando operações de pixels de alta eficiência sobre o elemento HTML5 Canvas. A geração de curvas de cores (RGB) é otimizada por meio de Tabelas de Busca (LUT - *Lookup Tables*) de 256 entradas geradas pela spline matemática, evitando o recálculo redundante por pixel e permitindo taxas de quadro suaves de 60fps mesmo em imagens de alta resolução.

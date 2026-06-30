# FaceFilter — Editor Funcional: Design Spec

**Data:** 2026-06-29  
**Status:** Aprovado  
**Escopo:** Transformar o protótipo estático em um editor de fotos funcional no browser, sem backend.

---

## 1. Visão Geral

O FaceFilter passa de protótipo (dados hardcoded, canvas falso) para um editor de fotos real onde o usuário pode:

1. Fazer upload de uma foto (drag-and-drop ou seleção de arquivo)
2. Ajustar luz e cor via 7 sliders em tempo real
3. Recortar a foto (livre ou proporções fixas)
4. Exportar/baixar o resultado final
5. Acessar uma galeria persistida no localStorage com fotos exportadas anteriormente

**O que é removido nesta fase:**
- Dashboard/Home com métricas falsas
- Sidebar de navegação vertical
- Aba "Face IA" do editor (standby)
- Componentes vazios: `UploadArea`, `ImageCanvas`, `ImageService`, `FilterCard`, `ToolButton`

**O que fica em standby (não removido, mas não implementado):**
- Recursos de IA

---

## 2. Navegação

A sidebar vertical é removida. No lugar entra uma **TopBar** horizontal slim (altura 52px).

**Modo `idle` (sem foto carregada):**
- Esquerda: logo FaceFilter
- Direita: link "Galeria"

**Modo `editing` (foto carregada):**
- Esquerda: logo + nome do arquivo atual
- Centro: botões Desfazer / Refazer
- Direita: botão "Nova foto" + botão "Exportar" (destaque verde)

Rotas: `/` → Editor, `/galeria` → Gallery. Usar `react-router-dom` (já instalado).

---

## 3. Editor

### 3.1 Estado idle (sem foto)

Layout: TopBar + área central com `DropZone`.

`DropZone` ocupa a maior parte da viewport com:
- Ícone de upload estilizado
- Texto "Arraste sua foto aqui"
- Botão "Selecionar arquivo" (abre file picker)
- Texto de suporte: "JPG, PNG ou WebP — até 20MB"

Validações:
- Tipo: `image/jpeg`, `image/png`, `image/webp`
- Tamanho máximo: 20MB
- Erro exibido inline na DropZone (sem alert/modal)

### 3.2 Estado editing (foto carregada)

Layout: TopBar + `EditorCanvas` (flex-1) + `AdjustmentsPanel` (320px fixo à direita).

**EditorCanvas:**
- Renderiza `<img>` centralizada com `object-fit: contain`
- CSS `filter` string aplicada em tempo real via style inline
- Overlay de vinheta: `<div>` absoluto com `radial-gradient` sobre a imagem
- Quando modo recorte ativo: exibe `CropOverlay` sobre a imagem

**AdjustmentsPanel (painel direito):**
Duas abas: **Ajustes** | **Recortar**

Aba Ajustes — 7 sliders:

| Label | CSS target | Padrão | Min | Max |
|---|---|---|---|---|
| Brilho | `brightness()` | 1.0 | 0.0 | 2.0 |
| Contraste | `contrast()` | 1.0 | 0.0 | 2.0 |
| Saturação | `saturate()` | 1.0 | 0.0 | 3.0 |
| Exposição | `brightness()` multiplicado | 1.0 | 0.5 | 1.5 |
| Nitidez | SVG `<feConvolveMatrix>` via `url(#sharpen)` | 0 | 0 | 3 |
| Temperatura | `sepia() hue-rotate()` composto | 0 | -100 | 100 |
| Vinheta | Intensidade do `radial-gradient` overlay | 0 | 0 | 1 |

Botão "Resetar tudo" abaixo dos sliders.

Aba Recortar:
- Botões de proporção: Livre, 1:1, 4:3, 16:9, 9:16
- Botão "Confirmar recorte" (aplica cropBox ao estado)
- Botão "Cancelar"

### 3.3 CSS Filter String

Calculada em `useEditor` a partir do objeto `adjustments`:

```
filter: brightness({brilho * exposicao}) contrast({contraste}) saturate({saturacao}) sepia({tempSepia}) hue-rotate({tempHue}deg) url(#sharpen-{nitidez})
```

- `brilho` e `exposicao` são **multiplicados** em um único valor `brightness()`. Ex: brilho=1.2, exposição=1.1 → `brightness(1.32)`.
- `tempSepia` e `tempHue` são derivados do slider de temperatura: temperatura positiva (quente) aumenta sepia e aplica hue negativo; temperatura negativa (fria) aplica hue positivo sem sepia.
- `url(#sharpen-N)` referencia um `<svg>` inline com `<feConvolveMatrix>` inserido no DOM pelo `EditorCanvas`. Apenas para o preview CSS — no export, a nitidez é aplicada via convolução manual no Canvas.

A vinheta **não** entra no CSS `filter` — é um `<div>` overlay separado com opacidade controlada.

### 3.4 CropOverlay

Componente absoluto sobre a imagem com:
- Box semitransparente mostrando área selecionada
- 8 handles arrastáveis (4 cantos + 4 bordas)
- Área fora do crop escurecida
- Ao arrastar handle: atualiza `cropBox` em tempo real
- Ao escolher proporção fixa: recalcula `cropBox` mantendo centro

Estado `cropBox`: `{ x, y, width, height }` em pixels relativos à imagem original.

---

## 4. Exportação

Fluxo em `useExport(imageURL, adjustments, cropBox)`:

1. Criar `<canvas>` offscreen com dimensões do `cropBox`
2. `ctx.filter` = CSS filter string com brightness/contrast/saturate/sepia/hue-rotate (**sem** nitidez — `ctx.filter` não suporta SVG filters)
3. `ctx.drawImage(img, cropBox.x, cropBox.y, cropBox.width, cropBox.height, 0, 0, canvas.width, canvas.height)`
4. Se nitidez > 0: ler pixels com `ctx.getImageData`, aplicar kernel de sharpen 3×3 via convolução manual, escrever de volta com `ctx.putImageData`
5. Se vinheta > 0: `ctx.filter = 'none'`, depois desenhar radial-gradient escuro sobre o canvas via `ctx.fillStyle` + `ctx.fillRect`
6. `canvas.toDataURL("image/jpeg", 0.92)` → gera `dataURL`
7. Trigger download automático (`<a download>`)
8. Chamar `useGallery.savePhoto(dataURL, fileName)`

---

## 5. Galeria

Página `/galeria` com grid de fotos salvas no localStorage.

**Schema localStorage** (`facefilter_gallery`):
```json
[
  {
    "id": "nanoid()",
    "name": "foto_original.jpg",
    "dataURL": "data:image/jpeg;base64,...",
    "savedAt": "2026-06-29T14:00:00Z"
  }
]
```

**Por item no grid:**
- Thumbnail (da dataURL)
- Nome do arquivo
- Data de salvamento
- Botão "Abrir no Editor" → chama `navigate('/', { state: { galleryId: id } })` via react-router; o Editor lê `location.state` e chama `useGallery.loadPhotoToEditor(id)` para carregar a dataURL
- Botão "Baixar"
- Botão "Remover" (remove do localStorage)

**Estado vazio:** Mensagem "Nenhuma foto salva ainda" com CTA para o editor.

---

## 6. Hooks

### `useEditor`

```
state: {
  imageFile: File | null,
  imageURL: string | null,
  adjustments: Adjustments,
  cropBox: CropBox | null,
  history: Adjustments[],
  historyIndex: number,
  mode: 'idle' | 'editing' | 'cropping'
}

actions: loadImage(file), applyAdjustment(key, value),
         setCrop(cropBox), confirmCrop(), cancelCrop(),
         undo(), redo(), reset(), clearImage()
```

Undo/redo máximo: 20 snapshots de `adjustments`.

### `useGallery`

```
actions: savePhoto(dataURL, name) → id,
         getPhotos() → GalleryItem[],
         deletePhoto(id),
         loadPhotoToEditor(id) → dataURL
```

Lê/escreve diretamente no `localStorage` via JSON.

### `useExport`

```
exportImage(imageURL, adjustments, cropBox, fileName) → Promise<void>
```

Retorna após disparar o download e salvar na galeria.

---

## 7. Estrutura de Arquivos (após refactor)

```
frontend/src/
  components/
    TopBar/           (novo)
    DropZone/         (novo — substitui UploadArea)
    EditorCanvas/     (novo — substitui ImageCanvas)
    CropOverlay/      (novo)
    AdjustmentsPanel/ (novo — usa SliderControl como filho para cada slider)
    SliderControl/    (mantido, redesenhado visualmente)
  hooks/
    useEditor.js      (novo)
    useGallery.js     (novo)
    useExport.js      (novo)
  pages/
    Editor/           (reescrito)
    Gallery/          (atualizado com localStorage)
  routes/
    AppRoutes.jsx     (atualizado — usa react-router)
  styles/
    global.css        (mantido)
  index.css           (mantido)
  main.jsx            (mantido)
  App.jsx             (simplificado — sem Sidebar/Navbar)
```

**Deletados:** `Sidebar/`, `Navbar/`, `Home/`, `FilterCard/`, `ToolButton/`, `services/ImageService.js`

---

## 8. Design Visual

- **Tema:** Dark, mantendo as cores atuais (`bg-base: #111827`, azul/roxo)
- **Identidade:** Visual único e profissional, não genérico — a ser definido na implementação com a skill `frontend-design`
- **Fonte:** Sistema (sem Google Fonts para não adicionar dependência)
- **Animações:** Transições suaves via Tailwind (`transition-all`, `duration-200`)
- **Responsive:** Editor funciona em telas ≥ 1024px. Abaixo disso: mensagem "Use em desktop para melhor experiência"

---

## 9. O que está fora do escopo desta fase

- Autenticação / contas de usuário
- Backend ou armazenamento em nuvem
- IA / reconhecimento facial
- Filtros preset (P&B, Sépia, etc.) — podem ser adicionados depois
- Compartilhamento de fotos
- Edição de múltiplas fotos simultaneamente

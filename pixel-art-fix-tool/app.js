/**
 * 像素圖對齊工具
 * 用於將AI生成的"偽像素圖"轉換為真正的像素圖
 */

function PixelAligner() {
  const [image, setImage] = React.useState(null);
  const [zoom, setZoom] = React.useState(1);
  const [showGrid, setShowGrid] = React.useState(true);
  const [processedImage, setProcessedImage] = React.useState(null);
  const [uploadStatus, setUploadStatus] = React.useState('');
  
  // 網格參數
  const [gridSize, setGridSize] = React.useState(32);
  const [gridOffsetX, setGridOffsetX] = React.useState(0);
  const [gridOffsetY, setGridOffsetY] = React.useState(0);
  
  // 輸出尺寸
  const [outputWidth, setOutputWidth] = React.useState(32);
  const [outputHeight, setOutputHeight] = React.useState(32);
  
  // 最大網格和偏移值
  const [maxGridSize, setMaxGridSize] = React.useState(100);
  
  // 畫布引用
  const sourceCanvasRef = React.useRef(null);
  const previewCanvasRef = React.useRef(null);
  const imageRef = React.useRef(null);
  
  // 視窗寬度監聽
  const [windowWidth, setWindowWidth] = React.useState(window.innerWidth);

  React.useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 處理圖片上傳
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadStatus('正在載入圖片...');
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setImage({
            src: event.target.result,
            width: img.width,
            height: img.height
          });
          imageRef.current = img;
          
          // 重置狀態
          setProcessedImage(null);
          
          // 嘗試自動猜測網格大小
          guessGridSize(img.width, img.height);
          
          // 設置最大網格大小為圖片寬度的1/4，最小為4
          setMaxGridSize(Math.max(4, Math.ceil(img.width / 4)));
          
          // 繪製原始圖像到畫布
          drawSourceImage();
          setUploadStatus('');
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  // 猜測可能的網格大小
  const guessGridSize = (width, height) => {
    // 嘗試常見的像素藝術尺寸和倍數關係
    const commonSizes = [8, 16, 32, 64];
    const commonPixelCount = [8, 16, 32, 64, 128];
    
    // 尋找可能的偽像素尺寸
    for (const pixelCount of commonPixelCount) {
      // 如果寬高可以均勻地分為像素數量
      if (width % pixelCount === 0 && height % pixelCount === 0) {
        const cellSize = width / pixelCount;
        // 如果是一個整數，並且高度的比例也相同
        if (cellSize === Math.floor(cellSize) && cellSize === height / pixelCount) {
          setGridSize(cellSize);
          // 也更新輸出尺寸為猜測的原始像素數
          setOutputWidth(pixelCount);
          setOutputHeight(pixelCount);
          return;
        }
      }
    }
    
    // 如果沒有精確匹配，使用最佳猜測
    const bestGuess = Math.floor(width / 32); // 假設是32x32的像素藝術
    setGridSize(bestGuess > 0 ? bestGuess : 32);
  };

  // 繪製源圖像到畫布
  const drawSourceImage = () => {
    if (!imageRef.current || !sourceCanvasRef.current) return;
    
    const canvas = sourceCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // 設置畫布尺寸，但考慮到容器的最大寬度限制
    const containerWidth = windowWidth > 1200 ? 1200 : windowWidth - 80;
    const maxDisplayWidth = Math.min(containerWidth / 2 - 50, imageRef.current.width);
    
    // 如果圖片太大，按比例縮小顯示
    let displayWidth = imageRef.current.width;
    let displayHeight = imageRef.current.height;
    
    if (displayWidth > maxDisplayWidth) {
      const scale = maxDisplayWidth / displayWidth;
      displayWidth = maxDisplayWidth;
      displayHeight = imageRef.current.height * scale;
    }
    
    canvas.width = imageRef.current.width;
    canvas.height = imageRef.current.height;
    
    // 設置畫布顯示尺寸（CSS樣式）
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageRef.current, 0, 0);
    
    // 繪製網格
    drawGrid();
  };
  
  // 繪製網格
  const drawGrid = () => {
    if (!sourceCanvasRef.current || !imageRef.current) return;
    
    const canvas = sourceCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // 如果顯示網格且網格大小有效
    if (showGrid && gridSize > 0) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1;
      
      // 計算列數和行數
      const cols = Math.ceil(canvas.width / gridSize);
      const rows = Math.ceil(canvas.height / gridSize);
      
      // 繪製垂直網格線
      for (let i = 0; i <= cols; i++) {
        const x = i * gridSize + gridOffsetX;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      
      // 繪製水平網格線
      for (let i = 0; i <= rows; i++) {
        const y = i * gridSize + gridOffsetY;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      
      // 顯示網格信息和輸出尺寸
      ctx.fillStyle = '#fff';
      ctx.font = '14px Arial';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      
      // 計算實際網格數量
      const effectiveWidth = Math.floor((canvas.width - gridOffsetX) / gridSize);
      const effectiveHeight = Math.floor((canvas.height - gridOffsetY) / gridSize);
      
      ctx.fillText(
        `當前網格: ${gridSize}x${gridSize}像素, 共${effectiveWidth}x${effectiveHeight}個網格`, 
        10, 
        30
      );
      
      ctx.fillText(
        `將輸出為: ${outputWidth}x${outputHeight}像素圖`, 
        10, 
        50
      );
      
      // 重置陰影設置
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
  };
  
  // 處理網格大小變化
  const handleGridSizeChange = (value) => {
    const size = parseInt(value) || 32;
    setGridSize(Math.max(1, size));
    // 當網格大小改變時，重置偏移值以避免超出範圍
    setGridOffsetX(gridOffsetX >= size ? size - 1 : gridOffsetX);
    setGridOffsetY(gridOffsetY >= size ? size - 1 : gridOffsetY);
  };
  
  // 處理網格偏移變化
  const handleGridOffsetChange = (axis, value) => {
    const offsetValue = parseInt(value) || 0;
    if (axis === 'x') {
      setGridOffsetX(Math.min(offsetValue, gridSize - 1));
    } else {
      setGridOffsetY(Math.min(offsetValue, gridSize - 1));
    }
  };
  
  // 處理輸出圖像
  const processImage = () => {
    if (!imageRef.current) return;
    
    setUploadStatus('正在處理圖像...');
    
    // 創建結果畫布
    const resultCanvas = document.createElement('canvas');
    resultCanvas.width = outputWidth;
    resultCanvas.height = outputHeight;
    const resultCtx = resultCanvas.getContext('2d');
    
    // 禁用平滑處理以保持像素清晰
    resultCtx.imageSmoothingEnabled = false;
    
    // 計算源圖像的有效區域（從偏移開始的整數個網格）
    const effectiveWidth = Math.floor((imageRef.current.width - gridOffsetX) / gridSize);
    const effectiveHeight = Math.floor((imageRef.current.height - gridOffsetY) / gridSize);
    
    // 創建臨時畫布來處理原始圖像
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = imageRef.current.width;
    tempCanvas.height = imageRef.current.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(imageRef.current, 0, 0);
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imageData.data;
    
    // 對每個輸出像素，從原始"偽像素"區域採樣顏色
    for (let y = 0; y < outputHeight; y++) {
      for (let x = 0; x < outputWidth; x++) {
        // 如果超出了有效區域，跳過或設為透明
        if (x >= effectiveWidth || y >= effectiveHeight) {
          continue;
        }
        
        // 計算對應的原始圖像中的偽像素區域
        const srcX = Math.floor(x * gridSize + gridOffsetX + gridSize / 2);
        const srcY = Math.floor(y * gridSize + gridOffsetY + gridSize / 2);
        
        // 確保取樣點在圖像範圍內
        if (srcX < imageRef.current.width && srcY < imageRef.current.height) {
          // 獲取取樣點的顏色
          const dataIndex = (srcY * imageRef.current.width + srcX) * 4;
          const r = data[dataIndex];
          const g = data[dataIndex + 1];
          const b = data[dataIndex + 2];
          const a = data[dataIndex + 3];
          
          // 設置輸出像素顏色
          resultCtx.fillStyle = `rgba(${r},${g},${b},${a/255})`;
          resultCtx.fillRect(x, y, 1, 1);
        }
      }
    }
    
    // 保存處理後的圖像
    setProcessedImage({
      src: resultCanvas.toDataURL('image/png'),
      width: outputWidth,
      height: outputHeight
    });
    
    // 繪製到預覽畫布
    drawPreview(resultCanvas);
    
    setUploadStatus('圖像處理完成');
    setTimeout(() => setUploadStatus(''), 2000);
  };

  // 繪製預覽
  const drawPreview = (sourceCanvas) => {
    if (!previewCanvasRef.current) return;
    
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // 根據視窗大小調整預覽畫布尺寸
    const containerWidth = windowWidth > 1200 ? 1200 : windowWidth - 80;
    const maxDisplayWidth = Math.min(containerWidth / 2 - 50, outputWidth * 15);
    
    // 確定適當的縮放因子，讓圖像良好顯示
    const previewScale = Math.max(5, Math.min(15, Math.floor(maxDisplayWidth / outputWidth)));
    const displayWidth = outputWidth * zoom * previewScale;
    const displayHeight = outputHeight * zoom * previewScale;
    
    canvas.width = displayWidth;
    canvas.height = displayHeight;
    
    // 關閉平滑處理以保持像素清晰
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(sourceCanvas, 0, 0, displayWidth, displayHeight);
    
    // 繪製網格，根據縮放級別調整網格線
    if (showGrid) {
      ctx.strokeStyle = `rgba(0, 0, 0, 0.3)`;
      ctx.lineWidth = 0.5;
      
      // 繪製垂直線
      for (let x = 0; x <= outputWidth; x++) {
        ctx.beginPath();
        ctx.moveTo(x * zoom * previewScale, 0);
        ctx.lineTo(x * zoom * previewScale, displayHeight);
        ctx.stroke();
      }
      
      // 繪製水平線
      for (let y = 0; y <= outputHeight; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * zoom * previewScale);
        ctx.lineTo(displayWidth, y * zoom * previewScale);
        ctx.stroke();
      }
    }
  };

  // 下載處理後的圖像
  const downloadImage = () => {
    if (!processedImage) return;
    
    // 創建链接并下載
    const link = document.createElement('a');
    link.download = '像素圖.png';
    link.href = processedImage.src;
    link.click();
  };

  // 放大/縮小預覽
  const handleZoomChange = (newZoom) => {
    setZoom(Math.max(0.1, Math.min(10, newZoom)));
  };

  // 監聽各種參數變化，更新畫布
  React.useEffect(() => {
    if (image && imageRef.current) {
      drawSourceImage();
    }
  }, [image, gridSize, gridOffsetX, gridOffsetY, showGrid, windowWidth]);
  
  // 當有處理後的圖像時更新預覽
  React.useEffect(() => {
    if (processedImage) {
      const img = new Image();
      img.onload = () => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = outputWidth;
        tempCanvas.height = outputHeight;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(img, 0, 0);
        drawPreview(tempCanvas);
      };
      img.src = processedImage.src;
    }
  }, [zoom, showGrid, processedImage, outputWidth, outputHeight, windowWidth]);

  return (
    <div className="container">
      <header className="app-header">
        <h1>像素圖對齊與縮放工具</h1>
        <p>將AI生成的偽像素圖轉換為真正的像素圖，解決偏移和不對齊問題</p>
      </header>
      
      <div className="controls">
        <div className="upload-section">
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageUpload} 
            id="image-upload"
          />
          <label htmlFor="image-upload" className="upload-button">選擇圖片</label>
        
          {uploadStatus && (
            <div className="status-message">
              {uploadStatus}
            </div>
          )}
        </div>
        
        {image && (
          <div className="grid-controls">
            <div className="slider-group">
              <label htmlFor="grid-size">網格大小: {gridSize}px</label>
              <div className="slider-with-input">
                <input
                  type="range"
                  id="grid-size"
                  min="1"
                  max={maxGridSize}
                  value={gridSize}
                  onChange={(e) => handleGridSizeChange(e.target.value)}
                  className="slider"
                />
                <input
                  type="number"
                  min="1"
                  max={maxGridSize}
                  value={gridSize}
                  onChange={(e) => handleGridSizeChange(e.target.value)}
                  className="number-input"
                />
              </div>
            </div>
            
            <div className="slider-group">
              <label htmlFor="offset-x">X偏移: {gridOffsetX}px</label>
              <div className="slider-with-input">
                <input
                  type="range"
                  id="offset-x"
                  min="0"
                  max={gridSize - 1}
                  value={gridOffsetX}
                  onChange={(e) => handleGridOffsetChange('x', e.target.value)}
                  className="slider"
                />
                <input
                  type="number"
                  min="0"
                  max={gridSize - 1}
                  value={gridOffsetX}
                  onChange={(e) => handleGridOffsetChange('x', e.target.value)}
                  className="number-input"
                />
              </div>
            </div>
            
            <div className="slider-group">
              <label htmlFor="offset-y">Y偏移: {gridOffsetY}px</label>
              <div className="slider-with-input">
                <input
                  type="range"
                  id="offset-y"
                  min="0"
                  max={gridSize - 1}
                  value={gridOffsetY}
                  onChange={(e) => handleGridOffsetChange('y', e.target.value)}
                  className="slider"
                />
                <input
                  type="number"
                  min="0"
                  max={gridSize - 1}
                  value={gridOffsetY}
                  onChange={(e) => handleGridOffsetChange('y', e.target.value)}
                  className="number-input"
                />
              </div>
            </div>
            
            <div className="control-group">
              <label>
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={() => setShowGrid(!showGrid)}
                />
                顯示網格
              </label>
            </div>
            
            <div className="export-controls">
              <div className="slider-group">
                <label htmlFor="output-width">輸出寬度: {outputWidth}px</label>
                <div className="slider-with-input">
                  <input
                    type="range"
                    id="output-width"
                    min="1"
                    max="256"
                    value={outputWidth}
                    onChange={(e) => setOutputWidth(parseInt(e.target.value) || 32)}
                    className="slider"
                  />
                  <input
                    type="number"
                    min="1"
                    max="256"
                    value={outputWidth}
                    onChange={(e) => setOutputWidth(parseInt(e.target.value) || 32)}
                    className="number-input"
                  />
                </div>
              </div>
              
              <div className="slider-group">
                <label htmlFor="output-height">輸出高度: {outputHeight}px</label>
                <div className="slider-with-input">
                  <input
                    type="range"
                    id="output-height"
                    min="1"
                    max="256"
                    value={outputHeight}
                    onChange={(e) => setOutputHeight(parseInt(e.target.value) || 32)}
                    className="slider"
                  />
                  <input
                    type="number"
                    min="1"
                    max="256"
                    value={outputHeight}
                    onChange={(e) => setOutputHeight(parseInt(e.target.value) || 32)}
                    className="number-input"
                  />
                </div>
              </div>
              
              <button onClick={processImage} className="process-button">處理圖像</button>
            </div>
          </div>
        )}
        
        {processedImage && (
          <div className="preview-controls">
            <div className="zoom-controls">
              <button onClick={() => handleZoomChange(zoom - 0.5)}>縮小</button>
              <span>預覽縮放: {zoom.toFixed(1)}x</span>
              <button onClick={() => handleZoomChange(zoom + 0.5)}>放大</button>
            </div>
            
            <button onClick={downloadImage} className="download-button">下載圖像</button>
          </div>
        )}
      </div>
      
      <div className="preview-container">
        {!image && (
          <div className="upload-prompt">
            <p>👆 請先點擊上方的"選擇圖片"按鈕上傳一張偽像素圖</p>
            <div className="upload-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19M12 5L6 11M12 5L18 11" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        )}
      
        <div className="image-container">
          {image && (
            <div className="source-image-container">
              <h3>原始偽像素圖 ({image.width}x{image.height})</h3>
              <div className="canvas-container">
                <canvas
                  ref={sourceCanvasRef}
                  style={{
                    maxWidth: '100%',
                    border: '1px solid #ddd'
                  }}
                />
              </div>
              <p className="usage-instructions">
                調整網格大小和偏移，使網格線精確對齊偽像素邊界，然後點擊「處理圖像」
              </p>
            </div>
          )}
          
          {processedImage && (
            <div className="processed-image">
              <h3>輸出的真實像素圖 ({processedImage.width}x{processedImage.height})</h3>
              <div className="preview-canvas-container">
                <canvas
                  ref={previewCanvasRef}
                  style={{ 
                    display: 'block',
                    margin: '0 auto',
                    maxWidth: '100%',
                    border: '1px solid #ddd',
                    imageRendering: 'pixelated'
                  }}
                />
              </div>
              <div className="info">
                <p>已轉換為 {processedImage.width}x{processedImage.height} 像素圖</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <footer className="app-footer">
        <p>© 2023 像素藝術工具 | 製作者：Pixel Artist</p>
      </footer>
    </div>
  );
}

// 渲染React應用
const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);
root.render(<PixelAligner />); 
const modulURL = location.origin + "/api/js/";

// Sayfa yüklendiğinde temel modülleri yükle
document.addEventListener("DOMContentLoaded", async () => {
  // Temel modülleri yükle
  const temelModuller = await Promise.all([
    import(`${modulURL}temaModulu.js`),
    import(`${modulURL}alertModulu.js`),
    import(`${modulURL}cacheModulu.js`)
  ]);
  
  // Global fonksiyonları ata
  window.showAlert = temelModuller[1].showAlert;
  window.hideAlert = temelModuller[1].hideAlert;
  
  // Tema ayarlarını yükle
  const currentTheme = localStorage.getItem('theme') || 'light';
  temelModuller[0].applyTheme(currentTheme);
  
  // API komut işleyicisini ayarla
  window.komutuIsle = async function(komut) {
    try {
      switch (komut) {
        case 'info':
          const infoModul = await import(`${modulURL}infoModulu.js`);
          await infoModul.loadAndDisplayInfo();
          break;
          
        case 'il':
        case 'ilce':
        case 'mahalle':
        case 'koy':
        case 'belde':
        case 'sokak':
        case 'ara':
        case 'hepsi':
        case 'adres':
          const apiModul = await import(`${modulURL}apiModulu.js`);
          await apiModul.processCommand(komut);
          break;
          
        case 'dark':
        case 'light':
        case 'system':
        case 'auto':
          await temelModuller[0].applyTheme(komut);
          showAlert(`Tema değiştirildi: ${komut}`, komut);
          break;
          
        default:
          if (komut.startsWith('il/') || komut.startsWith('ilce/') || komut.startsWith('mahalle/') || 
              komut.startsWith('koy/') || komut.startsWith('belde/') || komut.startsWith('sokak/')) {
            const apiModul = await import(`${modulURL}apiModulu.js`);
            await apiModul.processCommand(komut);
          } else {
            showAlert("Bilinmeyen komut: " + komut, "error");
          }
      }
    } catch (error) {
      showAlert(`Komut işlenirken hata: ${error.message}`, "error");
      console.error(error);
    }
  };

  // Input event listener
  const endpointInput = document.getElementById('endpoint');
  if (endpointInput) {
    let searchTimeout;
    endpointInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      if (endpointInput.value.trim()) {
        searchTimeout = setTimeout(() => {
          window.komutuIsle(endpointInput.value.trim());
        }, 500);
      }
    });
    
    // URL'den komut al
    const urlParams = new URLSearchParams(window.location.search);
    const jsonParam = urlParams.get('json');
    if (jsonParam) {
      endpointInput.value = jsonParam;
      window.komutuIsle(jsonParam);
    } else {
      window.komutuIsle('info');
    }
  }
});

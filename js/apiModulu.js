import { getCache, setCache } from './cacheModulu.js';
import { showAlert } from './alertModulu.js';

const GITHUB_USER = 'ckoglu';
const GITHUB_REPO = 'adres-api';
const GITHUB_BRANCH = 'refs/heads/main';

const DATA_URLS = {
  il: `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/data/il.json`,
  ilce: `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/data/ilce.json`,
  mahalle: `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/data/mahalle.json`,
  koy: `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/data/koy.json`,
  belde: `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/data/belde.json`,
  sokak: ilKodu => `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/data/sokak/sokak_${ilKodu}.json`
};

// Global data variables
let tumIller = [];
let tumIlceler = [];
let tumMahalleler = [];
let tumKoyler = [];
let tumBeldeler = [];
let tumSokaklar = {};

// Initialize data
async function loadData() {
  [tumIller, tumIlceler, tumMahalleler, tumKoyler, tumBeldeler] = await Promise.all([
    fetchJSONWithCache('il', DATA_URLS.il),
    fetchJSONWithCache('ilce', DATA_URLS.ilce),
    fetchJSONWithCache('mahalle', DATA_URLS.mahalle),
    fetchJSONWithCache('koy', DATA_URLS.koy),
    fetchJSONWithCache('belde', DATA_URLS.belde)
  ]);

  // Preload street data for first 5 cities
  const ilkIller = tumIller.slice(0, 5).map(il => String(il.no).padStart(2, '0'));
  await Promise.all(ilkIller.map(async ilKodu => {
    tumSokaklar[ilKodu] = await fetchJSONWithCache(`sokak_${ilKodu}`, DATA_URLS.sokak(ilKodu));
  }));
}

async function fetchJSONWithCache(cacheKey, url) {
  const cachedData = getCache(cacheKey);
  if (cachedData) {
    console.log(`Using cache: ${cacheKey}`);
    return cachedData;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const text = await response.text();
    if (!text.trim()) {
      console.warn(`Warning: ${url} dosyası boş. Boş dizi döndürüldü.`);
      setCache(cacheKey, []);
      return [];
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (jsonError) {
      showAlert(`Hata: ${url} dosyası bozuk JSON içeriyor!`, "error");
      throw new Error(`JSON parse hatası: ${url}`);
    }

    setCache(cacheKey, data);
    console.log(`Cache updated: ${cacheKey}`);
    return data;
  } catch (error) {
    console.error(`Failed to fetch data, trying cache: ${cacheKey}`, error);
    const fallbackData = getCache(cacheKey);
    if (fallbackData) {
      console.warn(`Using fallback cache data: ${cacheKey}`);
      return fallbackData;
    }
    throw error;
  }
}

// API command processor
export async function processCommand(cmd) {
  // Ensure data is loaded
  if (tumIller.length === 0) {
    await loadData();
  }

  const jsonElement = document.getElementById('json');
  if (jsonElement) jsonElement.textContent = 'veriler yükleniyor...';

  const [path, queryString] = cmd.split('?');
  const queryParams = new URLSearchParams(queryString || '');

  try {
    if (path === 'il') {
      if (queryParams.toString()) {
        await advancedSearch({ tip: 'il', ...Object.fromEntries(queryParams.entries()) });
      } else {
        await getIller();
      }
    }
    else if (path.match(/^il\/\d{1,3}$/)) {
      const no = path.split('/')[1];
      await getIl(no);
    }
    else if (path === 'ilce') {
      if (queryParams.toString()) {
        await advancedSearch({ tip: 'ilce', ...Object.fromEntries(queryParams.entries()) });
      } else {
        await getIlceler();
      }
    }
    else if (path.match(/^ilce\/\d+$/)) {
      const no = path.split('/')[1];
      await getIlce(no);
    }
    else if (path === 'mahalle') {
      if (queryParams.toString()) {
        await advancedSearch({ tip: 'mahalle', ...Object.fromEntries(queryParams.entries()) });
      } else {
        await getMahalleler();
      }
    }
    else if (path.match(/^mahalle\/\d+$/)) {
      const no = path.split('/')[1];
      await getMahalle(no);
    }
    else if (path.match(/^mahalle\/\d+\/sokak$/)) {
      const no = path.split('/')[1];
      await getMahalleSokaklar(no);
    }
    else if (path === 'koy') {
      if (queryParams.toString()) {
        await advancedSearch({ tip: 'koy', ...Object.fromEntries(queryParams.entries()) });
      } else {
        displayjson(tumKoyler);
      }
    }
    else if (path.match(/^koy\/\d+$/)) {
      const no = path.split('/')[1];
      const koy = tumKoyler.find(k => k.no == no);
      displayjson(koy || { error: 'Village not found' }, koy ? 200 : 404);
    }
    else if (path === 'belde') {
      if (queryParams.toString()) {
        await advancedSearch({ tip: 'belde', ...Object.fromEntries(queryParams.entries()) });
      } else {
        displayjson(tumBeldeler);
      }
    }
    else if (path.match(/^belde\/\d+$/)) {
      const no = path.split('/')[1];
      const belde = tumBeldeler.find(b => b.no == no);
      displayjson(belde || { error: 'Town not found' }, belde ? 200 : 404);
    }
    else if (path === 'ara' || path === 'hepsi' || path === 'adres') {
      await advancedSearch(Object.fromEntries(queryParams.entries()));
    }
    else if (path.match(/^sokak\/\d+$/)) {
      const no = path.split('/')[1];
      await getSokak(no);
    }
    else {
      displayjson({ error: 'Invalid API command' }, 400);
    }
  } catch (error) {
    displayjson({ error: 'Error during processing', details: error.message }, 500);
  }
}

// Helper functions for API operations
async function getIller() {
  const json = veriFiltrele(tumIller, {}, 'il');
  displayjson(json);
}

async function getIl(ilNo) {
  const il = tumIller.find(p => p.no == ilNo);
  if (!il) {
    displayjson({ error: 'İl bulunamadı' }, 404);
    return;
  }

  let json = { ...il };
  const bolum = new URLSearchParams(window.location.search).get('bolum');
  if (bolum) {
    const filtered = alanlariSec([json], bolum);
    json = filtered.length > 0 ? filtered[0] : {};
  }

  displayjson(json);
}

async function filterIller() {
        const filterText = document.getElementById('ilFiltre')?.value || '';
        const filtered = tumIller.filter(il =>
            il.isim.toLocaleLowerCase('tr').includes(filterText.toLocaleLowerCase('tr'))
        );
        displayjson(filtered);
    }

    async function getIlceler() {
        const json = tumIlceler.map(ilce => {
            const il = iliskiliVeriGetir(ilce.ilno, 'il');
            return { ...ilce, il };
        });
        displayjson(json);
    }

    async function getIlce(ilceNo) {
        const ilce = tumIlceler.find(d => d.no == ilceNo);
        if (!ilce) {
            displayjson({ error: 'İlçe bulunamadı' }, 404);
            return;
        }

        let json = { ...ilce, il: iliskiliVeriGetir(ilce.ilno, 'il') };

        const urlParams = new URLSearchParams(window.location.search);
        const bolum = urlParams.get('bolum');

        if (bolum) {
            const filtered = alanlariSec([json], bolum);
            json = filtered.length > 0 ? filtered[0] : {};
        }

        displayjson(json);
    }

    async function filterIlceler() {
        const filterText = document.getElementById('ilceFiltre')?.value || '';
        const filtered = tumIlceler.filter(ilce =>
            ilce.isim.toLocaleLowerCase('tr').includes(filterText.toLocaleLowerCase('tr'))
        ).map(ilce => {
            const il = iliskiliVeriGetir(ilce.ilno, 'il');
            return { ...ilce, il };
        });
        displayjson(filtered);
    }

    async function getMahalleler() {
        const json = tumMahalleler.map(mahalle => {
            const ilce = iliskiliVeriGetir(mahalle.ilceno, 'ilce');
            const il = ilce ? iliskiliVeriGetir(ilce.ilno, 'il') : null;
            return { ...mahalle, ilce, il };
        });
        displayjson(json);
    }

    async function getMahalle(mahalleNo) {
        const mahalle = tumMahalleler.find(m => m.no == mahalleNo);
        if (!mahalle) {
            displayjson({ error: 'Mahalle bulunamadı' }, 404);
            return;
        }

        let json = { ...mahalle };
        json.ilce = iliskiliVeriGetir(mahalle.ilceno, 'ilce');

        if (json.ilce) {
            json.il = iliskiliVeriGetir(json.ilce.ilno, 'il');
        }

        if (document.getElementById('sokaklar')?.checked) {
            const ilKodu = String(mahalle.no).padStart(5, '0').substring(0, 2);
            const sokaklar = await getSokaklar(ilKodu);
            json.sokaklar = sokaklar.filter(s => s.QuarterId == mahalleNo);
        }

        const urlParams = new URLSearchParams(window.location.search);
        const bolum = urlParams.get('bolum');

        if (bolum) {
            const filtered = alanlariSec([json], bolum);
            json = filtered.length > 0 ? filtered[0] : {};
        }

        displayjson(json);
    }

    async function getMahalleSokaklar(mahalleNo) {
        const mahalle = tumMahalleler.find(m => m.no == mahalleNo);
        if (!mahalle) {
            displayjson({ error: 'Neighborhood not found' }, 404);
            return;
        }

        const ilKodu = String(mahalle.no).padStart(5, '0').substring(0, 2);
        const sokaklar = await getSokaklar(ilKodu);
        const filtered = sokaklar.filter(s => s.QuarterId == mahalleNo);

        displayjson({
            mahalle: { no: mahalle.no, isim: mahalle.isim },
            sokaklar: filtered
        });
    }

    async function getSokak(sokakNo) {
        // Since streets are organized by city, we need to search all cities
        for (const ilKodu in tumSokaklar) {
            const sokak = tumSokaklar[ilKodu].find(s => s.Id == sokakNo);
            if (sokak) {
                const mahalle = tumMahalleler.find(m => m.no == sokak.QuarterId);
                const ilce = mahalle ? tumIlceler.find(i => i.no == mahalle.ilceno) : null;
                const il = ilce ? tumIller.find(c => c.no == ilce.ilno) : null;
                
                displayjson({
                    sokak: sokak,
                    mahalle: mahalle,
                    ilce: ilce,
                    il: il
                });
                return;
            }
        }
        
        // If not found in cache, try to load from all cities (expensive operation)
        for (const il of tumIller) {
            const ilKodu = String(il.no).padStart(2, '0');
            try {
                const sokaklar = await getSokaklar(ilKodu);
                const sokak = sokaklar.find(s => s.Id == sokakNo);
                if (sokak) {
                    const mahalle = tumMahalleler.find(m => m.no == sokak.QuarterId);
                    const ilce = mahalle ? tumIlceler.find(i => i.no == mahalle.ilceno) : null;
                    const il = ilce ? tumIller.find(c => c.no == ilce.ilno) : null;
                    
                    displayjson({
                        sokak: sokak,
                        mahalle: mahalle,
                        ilce: ilce,
                        il: il
                    });
                    return;
                }
            } catch (error) {
                console.error(`Error loading streets for city ${ilKodu}:`, error);
            }
        }
        
        displayjson({ error: 'Street not found' }, 404);
    }

    async function advancedSearch(params) {
        params = girdiDogrula(params);

        // Handle "hepsi" endpoint which searches across all types
        if (params.q) {
            const query = params.q;
            const addressResults = await searchAddress(query);
            
            if (addressResults) {
                displayjson(addressResults);
                return;
            }
            
            // If not found as address, search across all types
            const allResults = [];
            
            // Search cities
            const cityResults = tumIller.filter(il => 
                il.isim.toLocaleLowerCase('tr').includes(query.toLocaleLowerCase('tr')) || 
                String(il.no).padStart(2, '0') === query
            );
            if (cityResults.length > 0) {
                allResults.push({
                    type: 'il',
                    data: cityResults
                });
            }
            
            // Search districts
            const districtResults = tumIlceler.filter(ilce => 
                ilce.isim.toLocaleLowerCase('tr').includes(query.toLocaleLowerCase('tr'))
            ).map(ilce => {
                const il = tumIller.find(c => c.no == ilce.ilno);
                return { ...ilce, il };
            });
            if (districtResults.length > 0) {
                allResults.push({
                    type: 'ilce',
                    data: districtResults
                });
            }
            
            // Search neighborhoods
            const neighborhoodResults = tumMahalleler.filter(mahalle => 
                mahalle.isim.toLocaleLowerCase('tr').includes(query.toLocaleLowerCase('tr'))
            ).map(mahalle => {
                const ilce = tumIlceler.find(d => d.no == mahalle.ilceno);
                const il = ilce ? tumIller.find(c => c.no == ilce.ilno) : null;
                return { ...mahalle, ilce, il };
            });
            if (neighborhoodResults.length > 0) {
                allResults.push({
                    type: 'mahalle',
                    data: neighborhoodResults
                });
            }
            
            // Search villages
            const villageResults = tumKoyler.filter(koy => 
                koy.isim.toLocaleLowerCase('tr').includes(query.toLocaleLowerCase('tr'))
            ).map(koy => {
                const il = tumIller.find(c => c.no == koy.ilno);
                return { ...koy, il };
            });
            if (villageResults.length > 0) {
                allResults.push({
                    type: 'koy',
                    data: villageResults
                });
            }
            
            // Search towns
            const townResults = tumBeldeler.filter(belde => 
                belde.isim.toLocaleLowerCase('tr').includes(query.toLocaleLowerCase('tr'))
            ).map(belde => {
                const il = tumIller.find(c => c.no == belde.ilno);
                return { ...belde, il };
            });
            if (townResults.length > 0) {
                allResults.push({
                    type: 'belde',
                    data: townResults
                });
            }
            
            if (allResults.length > 0) {
                displayjson(allResults);
                return;
            }
            
            displayjson({ error: 'No results found' }, 404);
            return;
        }

        // Handle filtered search (il, ilce, mahalle)
        if (params.filtre) {
            const filters = params.filtre.split(',');
            const results = [];
            
            if (filters.includes('il')) {
                const filteredIller = veriFiltrele(tumIller, params, 'il');
                results.push({
                    type: 'il',
                    data: filteredIller
                });
            }
            
            if (filters.includes('ilce')) {
                const filteredIlceler = veriFiltrele(tumIlceler, params, 'ilce');
                results.push({
                    type: 'ilce',
                    data: filteredIlceler.map(ilce => {
                        const il = tumIller.find(c => c.no == ilce.ilno);
                        return { ...ilce, il };
                    })
                });
            }
            
            if (filters.includes('mahalle')) {
                const filteredMahalleler = veriFiltrele(tumMahalleler, params, 'mahalle');
                results.push({
                    type: 'mahalle',
                    data: filteredMahalleler.map(mahalle => {
                        const ilce = tumIlceler.find(d => d.no == mahalle.ilceno);
                        const il = ilce ? tumIller.find(c => c.no == ilce.ilno) : null;
                        return { ...mahalle, ilce, il };
                    })
                });
            }
            
            if (filters.includes('koy')) {
                const filteredKoyler = veriFiltrele(tumKoyler, params, 'koy');
                results.push({
                    type: 'koy',
                    data: filteredKoyler.map(koy => {
                        const il = tumIller.find(c => c.no == koy.ilno);
                        return { ...koy, il };
                    })
                });
            }
            
            if (filters.includes('belde')) {
                const filteredBeldeler = veriFiltrele(tumBeldeler, params, 'belde');
                results.push({
                    type: 'belde',
                    data: filteredBeldeler.map(belde => {
                        const il = tumIller.find(c => c.no == belde.ilno);
                        return { ...belde, il };
                    })
                });
            }
            
            if (results.length > 0) {
                displayjson(results);
                return;
            }
        }

        // Normal advanced search for specific type
        let data = [];
        switch (params.tip) {
            case 'il':
                data = tumIller;
                break;
            case 'ilce':
                data = tumIlceler;
                break;
            case 'mahalle':
                data = tumMahalleler;
                break;
            case 'koy':
                data = tumKoyler;
                break;
            case 'belde':
                data = tumBeldeler;
                break;
            default:
                displayjson({ error: 'Geçersiz tip parametresi' }, 400);
                return;
        }

        let filteredData = veriFiltrele(data, params, params.tip);

        if (params.sirala) {
            filteredData = verileriSirala(filteredData, params.sirala);
        }

        if (params.bolum) {
            filteredData = alanlariSec(filteredData, params.bolum);
        }

        // Start and limit parameters
        if (!isNaN(params.baslangic)) {
            filteredData = filteredData.slice(parseInt(params.baslangic));
        }
        if (!isNaN(params.adet)) {
            filteredData = filteredData.slice(0, parseInt(params.adet));
        }

        displayjson(filteredData);
    }

    // Display results
function displayjson(data, statusCode = 200) {
  const output = document.getElementById('json');
  if (!output) return;
  
  if (statusCode >= 400) {
    output.innerHTML = `<div class="error"><pre>${syntaxHighlight(data)}</pre></div>`;
  } else {
    const highlightedJson = syntaxHighlight(data);
    output.innerHTML = `<pre>${highlightedJson}</pre>`;
  }
}

function syntaxHighlight(json) {
        if (typeof json != 'string') {
            json = JSON.stringify(json, undefined, 2);
        }
        urlConnect(document.getElementById('endpoint').value);
        // HTML entity encoding
        json = json
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        return json.replace(
            /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
            function(match) {
                let cls = 'json-number';
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = 'json-key';
                    } else {
                        cls = 'json-string';
                    }
                } else if (/true|false/.test(match)) {
                    cls = 'json-boolean';
                } else if (/null/.test(match)) {
                    cls = 'json-null';
                }
                return '<span class="' + cls + '">' + match + '</span>';
            }
        )
        // Special characters coloring based on JSON structure
        .replace(/([{}])/g, '<span class="json-brace">$1</span>')
        .replace(/([\[\]])/g, '<span class="json-bracket">$1</span>')
        .replace(/(:)/g, '<span class="json-colon">:</span>');
    }
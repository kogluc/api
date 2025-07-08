import { showAlert } from './alertModulu.js';

export async function loadAndDisplayInfo() {
  try {
    const response = await fetch('https://raw.githubusercontent.com/ckoglu/adres-api/refs/heads/main/data/info.json');
    if (!response.ok) throw new Error('info dosyası yüklenemedi: ' + response.status);
    
    const data = await response.json();
    const highlighted = syntaxHighlight(data);
    document.getElementById('json').innerHTML = `\n${highlighted}`;
    document.getElementById('endpoint').value = "info";
    urlConnect("info");
  } catch (error) {
    document.getElementById('json').innerHTML = ``;
    showAlert(`info yüklenirken hata: ${error.message}`, 'error');
  }
}

function syntaxHighlight(json) {
  if (typeof json != 'string') {
    json = JSON.stringify(json, undefined, 2);
  }
  
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
  .replace(/([{}])/g, '<span class="json-brace">$1</span>')
  .replace(/([\[\]])/g, '<span class="json-bracket">$1</span>')
  .replace(/(:)/g, '<span class="json-colon">:</span>');
}

function urlConnect(newId) {
  let currentUrl = new URL(window.location.href);
  let jsonParam = currentUrl.searchParams.get('json');
  let id = jsonParam ? jsonParam : null;

  if (newId !== id) {
    id = newId;
    if (currentUrl.searchParams.get('json') !== id) {
      currentUrl.searchParams.set('json', id);
      window.history.pushState({}, '', currentUrl);
    }
  }
}
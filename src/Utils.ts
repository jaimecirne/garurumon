export function getDynamicContent(): string {
  // Retorna um HTML simples com uma animação de carregamento
  return `
      <html>
      <head>
          <style>
              @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
              }

              .loading {
                  border: 16px solid #f3f3f3;
                  border-top: 16px solid #3498db;
                  border-radius: 50%;
                  width: 120px;
                  height: 120px;
                  animation: spin 2s linear infinite;
              }
          </style>
      </head>
      <body>
          <div class="loading"></div>
      </div>
      </body>
      </html>
  `;
}

export async function fetchRealContent(): Promise<string> {
  // Simula uma chamada assíncrona (substitua por sua lógica real)
  return new Promise<string>((resolve) => {
      setTimeout(() => {
          resolve('Resposta do método assíncrono');
      }, 3000); // Simula um atraso de 3 segundos (ajuste conforme necessário)
  });
}

export function getRealContent(response: string): string {
  // Retorna o conteúdo real que você deseja exibir com base na resposta do método
  return `
      <html>
      <body>
          <h1>Conteúdo Carregado!</h1>
          <p>${response}</p>
      </body>
      </html>
  `;
}

export function getErrorContent(error: any): string {
  // Retorna o conteúdo de erro que você deseja exibir
  return `
      <html>
      <body>
          <h1>Erro ao Carregar Conteúdo!</h1>
          <p>${error}</p>
      </body>
      </html>
  `;
}

export function getFileContentHTML(content: string): string {
  // Retorna o HTML com o conteúdo do arquivo
  return `
      <html>
      <body>
          <pre>${content}</pre>
      </body>
      </html>
  `;
}
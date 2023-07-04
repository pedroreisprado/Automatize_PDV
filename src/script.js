const { webContents, BrowserWindow } = require("electron");

async function getAuthSheets(){
    const auth = new google.auth.GoogleAuth({
        keyFile: "credentials.json",
        scopes: "https://www.googleapis.com/auth/spreadsheets"
    })

    const client = await auth.getClient();

    const googleSheets = google.sheets({
        version: "v4",
        auth: client
    })

    const spreadsheetId = "11rOHkIQFQFDsKUCjQHL80JnAe4M7XzRiVesfBosBXzE";

    return{
        auth,
        client,
        googleSheets,
        spreadsheetId,
    };
}

async function Sheets(){
    const {googleSheets, auth, spreadsheetId} = await getAuthSheets();
    const response = await googleSheets.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range:"Contas",
    });
    const values = response.data.values;
    const searchValue = document.getElementById('login').value; // Valor que você deseja buscar
    const campo_login = document.getElementById('login'); 
    if(searchValue == ""){
        alert("Digite um usuario");
        campo_login.value = "";
        setTimeout(function() {
          campo_login.focus(); // Coloca o foco de volta no campo de login
        }, 0);
        return;
    }
    if (values && values.length) {
      for (let row of values) {
        const foundIndex = row.indexOf(searchValue);
        const rows = response.data.values;
        const rowIndex = rows.findIndex((row) => row[0] === searchValue)+1;
    
  
        if (foundIndex !== -1) {
          const foundCellAddress = `${String.fromCharCode(65 + foundIndex)}${values.indexOf(row) + 1}`;
          alert(`Bem-vindo ` + searchValue);
          const datavencimento = await DataVencimento(rowIndex);
          window.location.href = "./src/inicio/inicio.html"
          return; // Valor encontrado, encerra a função
        }
      }
    }
    campo_login.value = "";
    alert('Seu login é inválido ou ele não tem mais acesso ao PDV');
    setTimeout(function() {
      campo_login.focus(); // Coloca o foco de volta no campo de login
    }, 0);
    
    }

    async function DataVencimento(rowIndex){    
        const {googleSheets, auth, spreadsheetId} = await getAuthSheets();
        const response = await googleSheets.spreadsheets.values.get({
            auth,
            spreadsheetId,
            range:"Contas!B"+rowIndex,
        });
        const values = response.data.values;
        alert("Sua licença é válida até: " + values);
    }

    document.addEventListener('DOMContentLoaded', function() {
      
        document.addEventListener('keypress', function(event) {
          const path = require('path');
          const url = window.location.href;
          const fileName = path.basename(url, '.html');
          if (event.code === "KeyQ"){ //Q
            if(fileName === "vender"){
              sair();
            }
          }
          if (event.code === "KeyV"){ //V
            if(fileName === "inicio"){
              var button = document.getElementById("botao_vender");
              button.click();
            }
          }
          if (event.keyCode === 13) { //ENTER
            if(fileName === "index"){
              var button = document.getElementById("botao1");
              button.click(); // Aciona o evento de clique no botão
          }
          if(fileName === "vender"){
            var button = document.getElementById("adicionar");
            button.click();
          }
        }
        });
      });

      async function JanelaVender(){
        const resultado = await valorAtual();
        console.log("TESTE")
        if(resultado != "R$ 0,00"){
          const resposta = confirm("Consta uma sacola que não foi finalizada, gostaria de excluir?");
          if(resposta){
            await limparValores();
          }
        }
        window.location.href = "../vender/vender.html"
      }

      async function pesquisarProduto(codigo) {
        const {googleSheets, auth, spreadsheetId} = await getAuthSheets();
        const response = await googleSheets.spreadsheets.values.get({
            auth,
            spreadsheetId:"11h-FXuJ6F16KLGh-p28Pjtc2Tq8lAJrMrWC7APuPOG8",
            range:"Estoque",
        });
        const values = response.data.values;
      
        for (let i = 0; i < values.length; i++) {
          const row = values[i];
          if (row[0] === codigo) {
            const nome = row[1];
            const valor = row[2];
            return [nome, valor];
          }
        }
      
        return null; // Retorna null se o produto não for encontrado
      }

      async function adicionarProduto(){
        const codigo = document.getElementById("codigoprod").value;
        const resultado = await pesquisarProduto(codigo);

        if (resultado) {
          const [nome, valor] = resultado;
          console.log(`Produto adicionado: ${nome}`);
          console.log(`Valor: ${valor}`);
          await adicionarValores(resultado);
          document.getElementById("codigoprod").value = "";
          return
        } 
          console.log('Produto não encontrado');
      }

      function aguardarDesconto() {
        return new Promise(resolve => {
          const modeloInput = document.getElementById('valordesconto');
          const botaodesconto = document.getElementById('enviardesconto');
          modeloInput.value = ""
          botaodesconto.onclick = () => {
            resolve(modeloInput.value);
          };
        });
      }

      async function adicionarValores(resultado) {
        const {googleSheets, auth, spreadsheetId} = await getAuthSheets();
        const modeloContainer = document.getElementById('modeloContainer');
        const qtdProdutos = document.getElementById('qtdprodutos');
        var qtdProdutos_final = qtdProdutos.value;
        var valor = "=("+String(resultado[1])+"*"+qtdProdutos_final+")";
        var nome = String(resultado[0]);
        if(qtdProdutos.value == ""){
          var qtdProdutos_final = 1
          var valor = "=("+String(resultado[1])+"*"+qtdProdutos_final+")";
          const nome = String(resultado[0])+ " x "+ qtdProdutos_final;
        }     
        if(nome == "Desconto"){
          modeloContainer.style.display = 'block';
          var valor = "-" + String(await aguardarDesconto());
        }
        var nome = String(resultado[0])+ " x "+ qtdProdutos_final;
        const resource = {
          values: [[nome,valor]],
        };
        modeloContainer.style.display = 'none';
        const result = await googleSheets.spreadsheets.values.append({
          spreadsheetId: "1EHK9Otagd5pz8GouACeGtI1W9UfcYgy7qQHgcbcSWvg",
          range: "Sacola!A:A",
          valueInputOption: 'USER_ENTERED',
          resource: resource,
        });
        qtdProdutos.value = "";
        console.log('Valores adicionados com sucesso.')
        await itensSacola();
        await valorAtual();
      }

      async function itensSacola(){
        const sacola_atual = document.getElementById("sacola_atual");
        const {googleSheets, auth, spreadsheetId} = await getAuthSheets();
        const response = await googleSheets.spreadsheets.values.get({
            auth,
            spreadsheetId:"1EHK9Otagd5pz8GouACeGtI1W9UfcYgy7qQHgcbcSWvg",
            range:"Sacola",
        });
        const values = response.data.values.map((element) => {
          if (Array.isArray(element)) {
            return element.join("     R$");
          } else if (typeof element === "object") {
            return JSON.stringify(element).replace(/,/g, "           R$");
          } else {
            return element;
          }
        });
        sacola_atual.innerHTML = values.join("<br>");
      }

      async function valorAtual(){
        const valor_atual = document.getElementById("valor_atual");
        const {googleSheets, auth, spreadsheetId} = await getAuthSheets();
        const response = await googleSheets.spreadsheets.values.get({
            auth,
            spreadsheetId:"1EHK9Otagd5pz8GouACeGtI1W9UfcYgy7qQHgcbcSWvg",
            range:"Total",
        });
          const valorAtual_response = response.data.values;
          const path = require('path');
          const url = window.location.href;
          const fileName = path.basename(url, '.html');
            if(fileName === "inicio"){
              console.log(valorAtual_response);
              return valorAtual_response;
            }
        valor_atual.innerHTML ="Valor total: " + response.data.values; 
      }

      async function limparValores(){
        const { googleSheets, auth, spreadsheetId } = await getAuthSheets();
        // Enviar a solicitação de lote
        const response = await googleSheets.spreadsheets.values.clear({
          auth,
          spreadsheetId:"1EHK9Otagd5pz8GouACeGtI1W9UfcYgy7qQHgcbcSWvg",
          range:"Sacola",
      });
      
        console.log("Valores limpos com sucesso.");
      }

      async function sair(){
        const url = window.location.href;
        const rootPath = url.substring(0, url.lastIndexOf("/electron") + 1);
        window.location.href = (rootPath + "electron/index.html");
      }
      async function voltar(){
        const url = window.location.href;
        const rootPath = url.substring(0, url.lastIndexOf("/electron") + 1);
        window.location.href = (rootPath + "electron/src/inicio/inicio.html")
      }
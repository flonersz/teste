



const form = document.getElementById('form')
const required = document.querySelectorAll('.required')
const spans = document.querySelectorAll('.span-required')
const styleRequired = document.querySelectorAll('.input-style')
const valor = document.querySelectorAll('.valor')

const buttonBuy = document.getElementById('buySOL')
const modalConfirm = document.getElementById('modalConfirm')
const modalPayment = document.getElementById('modalPayment')
const modalLoading = document.getElementById('modalLoading')
const modalPaymentConfirm = document.getElementById('modalPaymentConfirm')
const buttonConfirm = document.getElementById('buttonConfirm')
const container = document.getElementById('container')

// modalPaymentConfirm.showModal()


for (var i = 0; i < required.length; i++) {
    const cryptoSelect = document.getElementById('crypto')

    const solImg = document.getElementById('solana')
    const usdtImg = document.getElementById('usdt')

    // pegar o token selecionado no select
    cryptoSelect.addEventListener('change', function() {
        const address = required[2].value
        required[0].value = ''
        required[1].value = ''
        required[2].value = ''
        if (cryptoSelect.value == 'USDT') {
            solImg.style.display = "none"
            usdtImg.style.display = "block"
            console.log('usdt')
        }

        else if (cryptoSelect.value == 'SOL') {
            usdtImg.style.display = "none"
            solImg.style.display = "block"
            console.log('solana')
        }

        
    })
    required[i].addEventListener("input", function() {
        const valorBRL = required[0].value
        const valorSOL = required[1]
        const address = required[2].value

        // request para pegar os valores da cotação do token
        fetch(`https://api-swap.api-pay.org/api/420f54df-4fda-4794-9ffa-94bf36154ef2/cotacao?de_moeda=BRL&para_moeda=${cryptoSelect.value}&de_qtd=${valorBRL}&cotacao_req_id=${crypto.randomUUID()}`)
        .then((res) => res.json())
        .then((data) => {
            const cotacao = parseFloat(data.cotacao)
            const taxas = parseFloat(data.taxa)
            const taxa_rede = parseFloat(data.taxa_rede)  
            const total = parseFloat(data.total)  
            const totalSOL =  valorBRL / cotacao
            const firstNumbers = address.substring(0, 4)
            
            const lastNumbers = address.substring(address.length - 4);

            const format = firstNumbers + '...' + lastNumbers

            valorSOL.value = totalSOL.toFixed(3)

            // verificação se o valor for NaN
            if(isNaN(valorSOL.value)) {
                valorSOL.value = ''
            }

            // adicionar valores no modal de confirmação

            valor[0].innerText = `R$${cotacao.toFixed(2)}`
            valor[1].innerText = `R$${taxas.toFixed(2)}`
            valor[2].innerText = `R$${taxa_rede.toFixed(2)}`
            valor[3].innerText = `⊚${totalSOL.toFixed(2)}`
            valor[4].innerText = `${format}`   
            valor[5].innerText = `R$${total}`
        
            
        })
    })
}



// verificação do formulario

form.addEventListener('submit', event => {
    const cryptoSelect = document.getElementById('crypto')

    event.preventDefault();
    let numero = document.getElementById("limit").value
    let address = document.getElementById("address").value
    numero = parseFloat(numero);

    if (isNaN(numero) || numero < 15) {
        error(0)
        return false
    }
    
    else {
        // vericação solana value
        if (cryptoSelect.value == 'SOL') {
            const publicKey = new solanaWeb3.PublicKey(address);
            if (publicKey.toBase58() === address) {
                console.log(`O endereço ${address} é um endereço válido da Solana.`);
                removeError(2);
                removeError(0)
                postValidate(numero)
                container.style.display = "none"
                showModalLoading()
                return true;
            }
            else {
                error(2)
            }
          }
          // vericação usdt value
          else if (cryptoSelect.value == 'USDT') {
            // api para verificar se o endereço TRX é real
            const apiUrl = `https://api.trongrid.io/v1/accounts/${address}`; 
        
            fetch(apiUrl)
                .then(response => response.json())
                .then(data => {
                    if (data.success == true) {
                        console.log(`O endereço ${address} é um endereço válido da TRX.`);
                        removeError(0)
                        postValidate(numero)
                        container.style.display = "none"
                        showModalLoading()
                    } else {
                        console.log(`A carteira ${address} não foi encontrada.`);
                        error(2)
                    }
                })
                .catch(error => {
                console.error('Ocorreu um erro ao tentar verificar a carteira:', error);
                });
    }}
    
})

// função para abrir o modal de Payment Confirm
function paymentConfirm() {
    const modalPayment = document.getElementById('modalPayment')
    const modalPaymentConfirm = document.getElementById('modalPaymentConfirm')
    modalPayment.style.display = "none"
    modalPaymentConfirm.showModal()
}

let endereco = ""
let transaction_id = "";
buttonConfirm.addEventListener('click', function() {
  confirmValidate(transaction_id)
})

async function confirmValidate(id) {
  const token = await grecaptcha.execute("6Lfl59MlAAAAADsJshGwpPBsWceFJTH4Kzi9X33-", { action: "submit"})
//   request para emitir a cobrança
  fetch(`https://api-swap.api-pay.org/api/420f54df-4fda-4794-9ffa-94bf36154ef2/cotacao/emitir-cobranca`, {
  method: 'POST',
  headers: {
      'Content-Type': 'application/json'
  },
  body: JSON.stringify({
      cotacao_id: id,
      token: token,
  })})    
  .then((res) => res.json())
  .then((data) => {

    const detalhes_cobranca = setInterval(() => {
        const idInput = document.getElementById('hashTransaction')
        idInput.value = data.id
        const base64 = data.image_qr_code
        const imgTag = document.getElementById('qrcode');
        imgTag.src = base64;
        const buttonCopy = document.getElementById("button-copy")
        const chavePix = document.getElementById('chavePix')
        chavePix.value = data.endereco
        buttonCopy.addEventListener('click', function() {
            chavePix.select();
            navigator.clipboard.writeText(chavePix.value)
                .then(function() {
                    console.log('Texto copiado para a área de transferência');
                })
                .catch(function(err) {
                    console.error('Erro ao copiar o texto: ', err);
                });
        });

        // request para exibir os detalhes da cobrança(qr code, chavepix, etc)
        fetch(`https://api-swap.api-pay.org/api/420f54df-4fda-4794-9ffa-94bf36154ef2/cotacao/detalhes-cobranca?cobranca_id=${data.id}`)
            .then((res) => res.json())
            .then((data) => {

                // verifica se o pix está pago
                if (data.status == "Pago") {
                    const animationScript = document.getElementById('scriptAnimation')
                    animationScript.src = 'https://unpkg.com/@dotlottie/player-component@latest/dist/dotlottie-player.mjs'
                    paymentConfirm()
                    const jsConfetti = new JSConfetti()
                    jsConfetti.addConfetti()
                    const hashTransactionSol = document.getElementById('hashTransactionSol')
                    hashTransactionSol.value = data.hash
                }
                
                //verifica se o pix já foi expirado
                if(data.status == "Expirado") {
                    clearInterval(detalhes_cobranca)
                    console.log('pix expirado')
                    const modalPayment = document.getElementById('modalPayment')
                    const modalPaymentError = document.getElementById('modalPaymentError')
                    modalPayment.style.display = "none"
                    modalPaymentError.showModal()
                }
                async function getPix() {
                    const pricePix = document.getElementById('pricePix')
                    const total = parseFloat(data.cotacao.total)
                    pricePix.innerText = `R$${total.toFixed(2)}`
                    modalConfirm.close()
                    modalPayment.showModal()
                    modalLoading.close()
                }
                getPix()
                
            })
            
          
    }, 2000);
  })
}


function cleanInput() {
    const contador = document.getElementById('numeroContador');
    const inputBRL = document.getElementById('limit');
    const inputSOL = document.getElementById('recieve');

    function iniciarContagem() {
        let tempoRestante = 15;
        const interval = setInterval(function() {
            tempoRestante--;
            contador.textContent = tempoRestante;

            if (tempoRestante <= 0) {
                inputBRL.value = '';
                inputSOL.value = '';
                clearInterval(interval); 
                setTimeout(iniciarContagem, 0);
            }
        }, 1000); 
    }
    iniciarContagem();
}

cleanInput(); 


function closeConfirm() {
    const contador = document.getElementById('numeroContadorConfirm');
    const modalConfirm = document.getElementById('modalConfirm')
    const container = document.getElementById('container')
}


function iniciarContagemConfirm() {
    const contadorConfirm = document.getElementById('numeroContadorConfirm');
    const modalConfirm = document.getElementById('modalConfirm')
    const container = document.getElementById('container')

    let tempoRestanteConfirm = 15;

    const interval = setInterval(function() {
        tempoRestanteConfirm--;
        contadorConfirm.textContent = tempoRestanteConfirm;
        if (tempoRestanteConfirm <= 0) {
            modalConfirm.close()
            container.style.display = 'flex'
            clearInterval(interval)
        }

        
    }, 1000); 
    const buttonExit = document.querySelector('.buttonExit')
    buttonExit.addEventListener('click', function() {
        console.log('exit')
        clearInterval(interval)
    });

    const buttonContinue = document.getElementById('buttonConfirm')
    buttonContinue.addEventListener('click', function() {
        clearInterval(interval)
    });

}




async function postValidate(numero) {
  const cryptoSelect = document.getElementById('crypto')
  let address = document.getElementById("address").value
  const token = await grecaptcha.execute("6Lfl59MlAAAAADsJshGwpPBsWceFJTH4Kzi9X33-", { action: "submit"})

//   para enviar o address
  fetch(`https://api-swap.api-pay.org/api/420f54df-4fda-4794-9ffa-94bf36154ef2/cotacao?de_moeda=BRL&para_moeda=${cryptoSelect.value}&de_qtd=${numero}`, {
  method: 'POST',
  headers: {
      'Content-Type': 'application/json'
  },
  body: JSON.stringify({
      endereco: address,
      token: token,
  })})    
  .then((res) => res.json())
  .then((data) => {
    transaction_id = data.id

  })
}

// modal de loading
function showModalLoading() {
    const modalLoading = document.getElementById("modalLoading")
    modalLoading.showModal()
    setTimeout(function(){
        modalLoading.close()
    }, 3000)
    setTimeout(buttonBuySol, 3000)
}


function buttonBuySol() {
  modalConfirm.showModal()
  iniciarContagemConfirm()
}

// função alert copy
function showAlert() {
    const alerta = document.getElementById('alert');
    alerta.style.display = 'block'; 
    setTimeout(function(){
        alerta.style.display = 'none'; 
    }, 1000); 
}


function error(index){
  styleRequired[index].style.border = '1px solid red';
  spans[index].style.display = 'block'
}

function removeError(index){
  styleRequired[index].style.border = '';
  spans[index].style.display = 'none'
}

function valueValidation() {
  let numero = document.getElementById("limit").value
  let numeroSol = document.getElementById('recieve').value
  numero = parseFloat(numero);

  if (isNaN(numero) || numero < 15) {
      error(0)
      return false
  }

  else {
      removeError(0)
      return true

  }
}

// função para validar a wallet no input para verificar se é necessário aparecer o alert de error ou não

function walletValidation() {
    try {
        let address = document.getElementById("address").value

        const cryptoSelect = document.getElementById('crypto')
          
        if (cryptoSelect.value == 'SOL') {
          const publicKey = new solanaWeb3.PublicKey(address);
          if (publicKey.toBase58() === address) {
              console.log(`O endereço ${address} é um endereço válido da Solana.`);
              removeError(2);
              return true;
          }
      
          else {
            throw Error('Error')
          }
        }
      
        else if (cryptoSelect.value == 'USDT') {
          const apiUrl = `https://api.trongrid.io/v1/accounts/${address}`;
      
          fetch(apiUrl)
              .then(response => response.json())
              .then(data => {
                  if (data.success == true) {
                      console.log(`O endereço ${address} é um endereço válido da TRX.`);
                      removeError(2);
                  } else {
                      console.log(`A carteira ${address} não foi encontrada.`);
                      error(2)
                      throw Error('Error')
                  }
              })
        }
      
        else {
          throw Error('Error')
          console.log('Essa wallet não é existe')
        }
    }

    catch(error) {
        styleRequired[2].style.border = '1px solid red';
        spans[2].style.display = 'block'
    }
}




const backDark = document.getElementById('back-dark')
const backLight = document.getElementById('back-light')

const change = document.getElementById('change-theme')

const darkmode = document.getElementById('darkmode')
const lightmode = document.getElementById('lightmode')

const rootElement = document.documentElement

// variaveis darkmode / lightmode

const dark = {
    '--background-image': 'url(image/background-dark.png)',
    '--1background': '#111111',
    '--color': 'white',
    '--background': 'black',
    '--1color': 'white',
    '--box-shadow': '5px 5px 5px  rgb(30, 30, 30, 0.5)',
    '--2color': '#1F1F1F',
    '--border': '1px solid #6D07F1',
    '--backgroundSelect': '#1F1F1F',

}

const light = {
    '--background-image': 'url(image/background-main.png)',
    '--background': '#ffffff',
    '--1background': '#ffffff',
    '--color': 'black',
    '--1color': 'rgb(83, 83, 83)',
    '--box-shadow': '5px 5px 5px  rgb(109, 109, 109, 0.5)',
    '--2color': '#ffffff',
    '--border': 'none',
    '--backgroundSelect': 'white',
}


change.addEventListener('change', function() {
    if (change.checked == true) {
        changeMode(dark)
        backDark.style.display = 'flex'
        backLight.style.display = 'none'
        darkmode.style.display = ' none'
        lightmode.style.display = 'flex'
        
    }
    else {
        changeMode(light)
        lightmode.style.display = 'none'
        darkmode.style.display = ' flex'
        backLight.style.display = 'flex'
        backDark.style.display = 'none'
    }
})

function changeMode(theme) {
    for (let prop in theme) {
        changeProperty(prop, theme[prop])
    }
}

function changeProperty(property, value) {
    rootElement.style.setProperty(property, value)
}





const input = document.getElementById('hashTransaction')
const inputSol = document.getElementById('hashTransactionSol')



function copyPasteHash() {
    navigator.clipboard.writeText(inputSol.value)
}

function copyPaste() {
    navigator.clipboard.writeText(input.value)
}




backLight.onclick = function() {
    container.style.display = "flex"
    modalConfirm.close()
    required[2].value = ''
    required[1].value = ''
    required[0].value = ''
}


backDark.onclick = function() {
    container.style.display = "flex"
    modalConfirm.close()
    required[2].value = ''
    required[1].value = ''
    required[0].value = ''
}

buttonConfirm.onclick = function() {
    modalConfirm.close()
    // modalPayment.showModal()
    modalLoading.showModal()
    modalPayment.close()
}


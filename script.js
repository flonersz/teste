

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

for (var i = 0; i < required.length; i++) {
    required[i].addEventListener("input", function() {
        const valorBRL = required[0].value
        const valorSOL = required[1]
        const address = required[2].value
        
        fetch(`https://api-swap.api-pay.org/api/420f54df-4fda-4794-9ffa-94bf36154ef2/cotacao?de_moeda=BRL&para_moeda=SOL&de_qtd=${valorBRL}&cotacao_req_id=${crypto.randomUUID()}`)
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
            if(isNaN(valorSOL.value)) {
                valorSOL.value = ''
            }
            valor[0].innerText = `R$${cotacao.toFixed(2)}`
            valor[1].innerText = `R$${taxas.toFixed(2)}`
            valor[2].innerText = `R$${taxa_rede.toFixed(2)}`
            valor[3].innerText = `⊚${totalSOL.toFixed(2)}`
            valor[4].innerText = `${format}`   
            valor[5].innerText = `R$${total}`
        
            
        })
    })
}




form.addEventListener('submit', event => {
    event.preventDefault();
    let numero = document.getElementById("limit").value
    let address = document.getElementById("address").value
    numero = parseFloat(numero);

    if (isNaN(numero) || numero < 50) {
        error(0)
        return false
    }

    else if (address.length !== 44) {
        error(2)
        return false
    }

    else {
        removeError(0)
        postValidate(numero)
        container.style.display = "none"
        showModalLoading()
        return true
    }
})


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
        fetch(`https://api-swap.api-pay.org/api/420f54df-4fda-4794-9ffa-94bf36154ef2/cotacao/detalhes-cobranca?cobranca_id=${data.id}`)
            .then((res) => res.json())
            .then((data) => {

                if (data.status == "Pago") {
                    paymentConfirm()
                    const jsConfetti = new JSConfetti()
                    jsConfetti.addConfetti()
                    const hashTransactionSol = document.getElementById('hashTransactionSol')
                    hashTransactionSol.value = data.hash
                }
                
                if(data.status == "Expirado"){
                    clearInterval(detalhes_cobranca)
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


async function postValidate(numero) {
    let address = document.getElementById("address").value
  const token = await grecaptcha.execute("6Lfl59MlAAAAADsJshGwpPBsWceFJTH4Kzi9X33-", { action: "submit"})

  fetch(`https://api-swap.api-pay.org/api/420f54df-4fda-4794-9ffa-94bf36154ef2/cotacao?de_moeda=BRL&para_moeda=SOL&de_qtd=${numero}`, {
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
  
}


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

  if (isNaN(numero) || numero < 50) {
      error(0)
      return false
  }

  else {
      removeError(0)
      return true

  }
}

function walletValidation() {
  var address = document.getElementById("address").value
  
  if (address.length !== 44) {
      error(2)
      return false
  }
  else {
      removeError(2)
      return true

  }
}




const backDark = document.getElementById('back-dark')
const backLight = document.getElementById('back-light')

const change = document.getElementById('change-theme')

const darkmode = document.getElementById('darkmode')
const lightmode = document.getElementById('lightmode')

const rootElement = document.documentElement

const dark = {
    '--background-image': 'url(image/background-dark.png)',
    '--1background': '#111111',
    '--color': 'white',
    '--background': 'black',
    '--1color': 'white',
    '--box-shadow': '5px 5px 5px  rgb(30, 30, 30, 0.5)',
    '--2color': '#1F1F1F',
    '--border': '1px solid #6D07F1'

}

const light = {
    '--background-image': 'url(image/background-main.png)',
    '--background': '#ffffff',
    '--1background': '#ffffff',
    '--color': 'black',
    '--1color': 'rgb(83, 83, 83)',
    '--box-shadow': '5px 5px 5px  rgb(109, 109, 109, 0.5)',
    '--2color': '#ffffff',
    '--border': 'none'
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
    // modalConfirm.close()
    // modalPayment.showModal()
    modalLoading.showModal()
    modalPayment.close()
}

// criar uma função para quando o pagamento estiver tudo certo, adicionar "modalPaymentConfirm.showModal()" e "modalLoading.style.display = "none""

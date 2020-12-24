let Nightmare = require('nightmare')
    , vo = require('vo')
    , dataInicio = process.argv[2]
    , dataFim = process.argv[3]
    , account = require('./account.js')
    , matricula = account.ruufsm.matricula
    , senha = account.ruufsm.senha
    , moment = require('moment')
    , jimp = require('jimp')
    , axios = require('axios')
    , formData = require('form-data')
    , fs = require('fs')
    , rimraf = require("rimraf");

const screenshotSelector = require('nightmare-screenshot-selector');
Nightmare.action('screenshotSelector', screenshotSelector)
vo(run)(function (err, result) {
    if (err) throw err;
});

function* run() {
    if (dataInicio === undefined || dataFim === undefined) {
        if (moment().startOf('day').format("ddd") === "Sun") {
            console.log("Voce nao informou dois parametros de data e hoje e domingo");
            dataInicio = moment().startOf('day').add(1, 'd').format("DD/MM/YYYY");
            dataFim = moment().startOf('day').add(5, 'd').format("DD/MM/YYYY");
            console.log("Agendando de segunda (" + dataInicio + ") a sexta (" + dataFim + ")");
        } else {
            console.log("Voce deve informar duas datas no formato dd/mm/yyyy");
            return
        }
    } else {
        var dataAtual = moment().startOf('day');
        var dataInicioMoment = moment(dataInicio, 'DD/MM/YYYY');
        var dataFimMoment = moment(dataFim, 'DD/MM/YYYY');
        if (!dataInicioMoment.isValid() || !dataFimMoment.isValid()) {
            console.log('opa')
            console.log("Você deve informar duas datas validas")
            return
        }
        if (dataInicio !== dataFim) {
            if (!dataInicioMoment.isBefore(dataFimMoment) || !dataInicioMoment.isAfter(dataAtual)) {
                console.log('opa')
                console.log("Você deve informar duas datas validas")
                return
            }
        }
        if (dataInicioMoment.diff(dataAtual, 'days') > 5 || dataFimMoment.diff(dataAtual, 'days') > 5) {
            console.log("A data inicio e a data fim nao podem ter mais que 5 dias de diferenca com a data atual")
            return
        }
    }

    let nightmare = Nightmare({
        waitTimeout: 10000,
        show: true,
        frame: false,
        maxHeight: 16384,
        maxWidth: 16384,
        width: 1200,
        height: 1024
    });
    let data;
    var dimensoes = "";
    let campo;
    let dir = './tmp';
    try {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        console.log('Iniciando agendamento do RU');

        console.log("Preenchendo login")
        yield nightmare
            .goto('https://portal.ufsm.br/ru/')
            .wait('form')
            .type('input[id=login]', matricula)
            .type('input[id=senha]', senha)
            .click('form button[type=submit]')
            .wait('nav[class="band navbar gradient "] div[class="container mini-padding-v"] ul[class="nav responsive"] li:nth-child(3) div[class="btn-group block"] a')
        console.log("Indo para tela de agendamentos")
        yield nightmare
            .click('nav[class="band navbar gradient "] div ul li:nth-child(3) div a')
            .click('nav[class="band navbar gradient "] div ul li:nth-child(3) div ul li a')
            .wait('div[class="container"]')

        dimensoes = yield nightmare.evaluate(function () {
            var body = document.querySelector('body');
            return {
                width: body.scrollWidth,
                height: body.scrollHeight
            }
        });
        let tentativa = 1;
        let erro = false;
        do {
            let readFile;
            console.log("Preenchendo o formulário - tentativa " + tentativa);
            yield nightmare
                .select('select[id="restaurante"]', "41")
                .type('input[name="periodo.inicio"]', dataInicio)
                .wait('div[id="divRefeicoes"]')
                .type('input[name="periodo.fim"]', dataFim)
                .check('input[id="opcaoVegetariana_false"]')
                .check('input[id="checkTipoRefeicao2"]')
                .screenshotSelector({selector: 'img[id="imgCaptcha"]', path: dir + '/screen.png'})

            console.log("Imagem do captcha salva")
            yield jimp.read(dir + "/screen.png").then(image => {
                return image.normalize().greyscale().contrast(0.8).write(dir + '/text.png')
            });
            yield nightmare
                .wait(1000)
            readFile = fs.createReadStream(dir + '/text.png');
            data = new formData();
            data.append('language', 'por')
            data.append('isOverlayRequired', 'false');
            data.append('iscreatesearchablepdf', 'false');
            data.append('issearchablepdfhidetextlayer', 'false');
            data.append('filetype', 'png')
            data.append('OCREngine', '2');
            data.append('url', readFile);
            console.log('Buscando o texto da imagem')
            campo = yield axios({
                method: 'post',
                url: 'https://api.ocr.space/parse/image',
                headers: {
                    'apikey': 'API',
                    ...data.getHeaders()
                },
                data: data
            })
                .then(function (response) {
                    if (response.data.ParsedResults && response.data.ParsedResults[0] && response.data.ParsedResults[0].ParsedText) {
                        let text = response.data.ParsedResults[0].ParsedText
                        return text.replace(/\s/g, '').toUpperCase();
                    } else {
                        return "ERRO";
                    }
                })
            console.log("CAPTCHA: " + campo);
            console.log('Preenchendo o captcha e submetendo formulário')
            readFile.destroy();
            try {
                erro = yield nightmare
                    .type('input[id="captcha"]', '')
                    .type('input[id="captcha"]', campo)
                    .click('button[type="submit"]')
                    .wait('div[class="table-wrapper scrollable stroked margin-v"]')
                    .then(function () {
                        return false;
                    })
            } catch (e) {
                erro = yield nightmare.evaluate(function () {
                    let resultadoCaptcha = document.getElementById('_captcha').innerText;
                    if (resultadoCaptcha === 'Campo inválido') {
                        return true;
                    }
                });
            }
            tentativa++;
        } while (erro);
    } catch (e) {
        console.log("Ocorreu algum erro, visualize a imagem")
    }
    console.log("Salvando imagem");

    yield nightmare.viewport(dimensoes.width, dimensoes.height)
        .wait(1000)
        .screenshot('./images/ru.png');
    rimraf.sync(dir);

    yield nightmare.end();
}

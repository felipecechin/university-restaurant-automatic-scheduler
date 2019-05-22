var Nightmare  = require('nightmare')
    , vo         = require('vo')
    , dataInicio = process.argv[2]
    , dataFim = process.argv[3]
    , account    = require('./account.js')
    , matricula   = account.ruufsm.matricula
    , senha   = account.ruufsm.senha
    , moment = require('moment')
;

vo(run)(function(err, result) {
    if (err) throw err;
});

function *run() {
    if (dataInicio==undefined || dataFim==undefined) {
        if (moment().startOf('day').format("ddd") == "Sun") {
            console.log("Voce nao informou dois parametros de data e hoje e domingo");
            dataInicio = moment().startOf('day').add(1,'d').format("DD/MM/YYYY");
            dataFim =moment().startOf('day').add(5,'d').format("DD/MM/YYYY");
            console.log("Agendando de segunda (" + dataInicio + ") a sexta (" + dataFim +")");
        } else {
            console.log("Voce deve informar duas datas no formato dd/mm/yyyy");
            return
        }
    } else {
        var dataAtual = moment().startOf('day');
        var dataInicioMoment = moment(dataInicio, 'DD/MM/YYYY');
        var dataFimMoment = moment(dataFim, 'DD/MM/YYYY');
        if (!dataInicioMoment.isValid() || !dataFimMoment.isValid()) {
            console.log("Você deve informar duas datas validas")
            return
        }
        if (!dataInicioMoment.isBefore(dataFimMoment) || !dataInicioMoment.isAfter(dataAtual)) {
            console.log("Você deve informar duas datas validas")
            return
        }
        if (dataInicioMoment.diff(dataAtual, 'days')>5 || dataFimMoment.diff(dataAtual, 'days')>5) {
            console.log("A data inicio e a data fim nao podem ter mais que 5 dias de diferenca com a data atual")
            return
        }
    }

    let nightmare = Nightmare({show: false, waitTimeout: 10000});
    try {
        console.log('Iniciando agendamento do RU');

        console.log("Esperando tela de login");
        yield nightmare
            .goto('https://portal.ufsm.br/ru/')
            .wait()
            .wait(1000)

        console.log("Preenchendo login")
        yield nightmare
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

        console.log("Preenchendo as opções")
        yield nightmare
            .select('select[id="restaurante"]', "41")
            .check('input[id="tiposRefeicao_1"]')
            .type('input[id="periodo_inicio"]', dataInicio)
            .type('input[id="periodo_fim"]', dataFim)
            .click('button[type="submit"]')
            .wait('div[class="table-wrapper scrollable stroked margin-v"]')

        var currentHeight = yield nightmare.evaluate(function () {
            return document.body.scrollHeight;
        });
    } catch (e) {
        console.log("Ocorreu algum erro, visualize a imagem")
    }
    yield nightmare.scrollTo(currentHeight, 0)
    console.log("Salvando imagem")

    yield nightmare
        .screenshot('./images/ru.png')


    yield nightmare.end();
}

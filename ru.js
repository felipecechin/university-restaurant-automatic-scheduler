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
        console.log("Você deve informar duas datas")
        return
    } else {
        var dataInicioMoment = moment(dataInicio, 'DD/MM/YYYY');
        var dataFimMoment = moment(dataFim, 'DD/MM/YYYY');
        if (!dataInicioMoment.isValid() || !dataFimMoment.isValid()) {
            console.log("Você deve informar duas datas validas")
            return
        }
        if (!dataInicioMoment.isBefore(dataFimMoment) || !dataInicioMoment.isAfter(moment())) {
            console.log("Você deve informar duas datas validas")
            return
        }
    }



    console.log('Iniciando agendamento do RU');
    let nightmare = Nightmare({show: false});

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
        .type('input[id="periodo_inicio"', dataInicio)
        .type('input[id="periodo_fim"', dataFim)
        .click('button[type="submit"]')
        .wait('div[class="table-wrapper scrollable stroked margin-v"]')

    var currentHeight = yield nightmare.evaluate(function() {
        return document.body.scrollHeight;
    });
    yield nightmare.scrollTo(currentHeight, 0)
    console.log("Salvando imagem de sucesso")

    yield nightmare
        .screenshot('./images/ru.png')


    yield nightmare.end();
}

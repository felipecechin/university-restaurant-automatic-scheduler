Script em Node.js para agendar o Restaurante Universitário da UFSM de forma automática.

Para executar o script "ru.js", você deve ter instalado o Node.js e o NPM (gerenciador de dependências) na sua máquina.

Depois de instalados, clone o repositório para uma pasta. 

Ao clonar, entre na pasta que estão os arquivos e execute o comando para instalação das dependências via terminal:

`npm install --save`

Coloque sua matrícula e senha de acesso ao portal da UFSM no arquivo "account.js".

Execute o script "ru.js" via terminal informando as data início e fim do agendamento.

`node ru.js 29/04/2019 30/04/2019`

Caso as duas datas não sejam informadas e o script estiver rodando em um domingo, o agendamento será da próxima segunda-feira à próxima sexta-feira.

O script irá exibir algumas mensagens de andamento do processo.

Ao final, um print da tela será guardado na pasta images.

O script acusa erro caso as datas sejam inválidas.

**Obs.: O agendamento será de almoço no RU - Campus II.**


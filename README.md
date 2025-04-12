# Discord DM Sender Bot

Este é um bot para o Discord que permite o envio de mensagens diretas (DMs) para os membros de um servidor, com suporte a mensagens simples ou embutidas (embeds). O bot possui funcionalidades de controle de envio, como o limite de mensagens por minuto, e também realiza log das mensagens enviadas.

## Funcionalidades

- **Envio de Mensagens Simples:** Envia mensagens diretas simples para os membros do servidor.
- **Envio de Mensagens Embed:** Envia mensagens embutidas (embed) com imagens e conteúdo formatado.
- **Controle de Rate Limit:** Respeita o limite de mensagens enviadas por minuto (50 mensagens), com uma pausa automática quando esse limite é atingido.
- **Log de Envio:** Registra os status das mensagens enviadas (sucesso, erro, bloqueio de DM) em um arquivo de log.
- **Filtro de Cargos:** Permite o envio de mensagens apenas para membros com cargos específicos.
- **Reset da Lista de Enviados:** Permite a um administrador resetar a lista de usuários que já receberam a mensagem.

## Pré-requisitos

Antes de rodar este bot, você precisa ter os seguintes pré-requisitos:

- [Node.js](https://nodejs.org/) instalado.
- Uma conta no [Discord Developer Portal](https://discord.com/developers/docs/intro) e um token de bot válido.
- A biblioteca `discord.js` instalada no seu projeto.

## Instalação

1. Clone o repositório para o seu computador:

    ```bash
    git clone <URL_DO_REPOSITORIO>
    ```

2. Navegue até o diretório do projeto:

    ```bash
    cd <NOME_DO_DIRETORIO>
    ```

3. Instale as dependências:

    ```bash
    npm install
    ```

4. Crie um arquivo `.env` na raiz do projeto e adicione seu token do Discord:

    ```plaintext
    DISCORD_TOKEN=seu_token_aqui
    ```

## Comandos

O bot possui os seguintes comandos:

- **`!enviardmembed <cargo>`** - Envia uma mensagem embutida para os membros com o cargo especificado. Exemplo: `!enviardmembed membro visitante`.
- **`!enviardmsimples <cargo>`** - Envia uma mensagem simples para os membros com o cargo especificado. Exemplo: `!enviardmsimples membro visitante`.
- **`!resetarenviados`** - Reseta a lista de usuários que já receberam a mensagem. Apenas administradores podem usar este comando.

## Funcionalidade Detalhada

### Envio de Mensagens Embutidas (Embed)

Este comando permite que você envie mensagens formatadas com título, descrição e imagem para os membros do servidor que possuem um cargo específico.

    !enviardmembed <cargo1> <cargo2>

Exemplo:

    !enviardmembed membro visitante

O bot enviará uma mensagem embed com o conteúdo definido.

### Envio de Mensagens Simples

Este comando permite o envio de mensagens simples com texto e imagens para os membros que possuem um cargo específico.

    !enviardmsimples <cargo1> <cargo2>

Exemplo:

    !enviardmsimples membro visitante

### Reset da Lista de Enviados

O comando `!resetarenviados` permite que um administrador do servidor reinicie a lista de usuários que já receberam mensagens, útil para reenviar mensagens em campanhas futuras.

    !resetarenviados

## Arquivos de Log

- **`log_mensagens.txt`**: Contém o log das mensagens enviadas, registrando o status (sucesso, erro, bloqueio de DM) e a hora do envio.
- **`usuarios_enviados.json`**: Armazena os IDs dos usuários que já receberam mensagens, evitando o envio repetido.

## Personalização

- **Cargos Filtro:** É possível filtrar os cargos dos membros para enviar mensagens apenas a usuários específicos. Isso pode ser feito fornecendo o nome do cargo como argumento nos comandos `!enviardmembed` ou `!enviardmsimples`.
  
- **Imagens e Conteúdo:** Você pode adicionar links de imagens e personalizar o conteúdo das mensagens e embeds conforme necessário.

## Feito com 💖 por uma mente inquieta
Este bot nasceu na madrugada de uma mulher que, após horas tentando fazer as coisas funcionarem, mostrou que, quando se quer fazer algo, a única coisa que é preciso é querer.

require('dotenv').config();
const TOKEN = process.env.DISCORD_TOKEN;

const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder } = require('discord.js');
const fs = require('fs');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers, GatewayIntentBits.MessageContent]
});

const LOG_FILE = 'log_mensagens.txt';
const ENVIADOS_FILE = 'usuarios_enviados.json';

let enviados = [];
let mensagensEnviadasNoMinuto = 0;
const LIMITE_MENSAGENS_POR_MINUTO = 50; // Limite de mensagens por minuto
const TEMPO_REINICIO = 60000; // 60.000 milissegundos = 1 minuto

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function registrarLog(status, member, tipo, erro = '') {
  const log = `${new Date().toISOString()} | ${status.toUpperCase()} | ${member.user.tag} (${member.user.id}) | Tipo: ${tipo} ${erro ? '| Erro: ' + erro : ''}\n`;
  fs.appendFileSync(LOG_FILE, log);
}

// Função para carregar os IDs dos usuários que já receberam a mensagem
function carregarEnviados() {
  if (fs.existsSync(ENVIADOS_FILE)) {
    const data = fs.readFileSync(ENVIADOS_FILE, 'utf8');
    try {
      enviados = JSON.parse(data);
    } catch (error) {
      console.error('Erro ao ler o arquivo de enviados:', error);
      enviados = [];
    }
  }
}

// Função para salvar os IDs dos usuários no formato JSON
function salvarEnviados() {
  try {
    fs.writeFileSync(ENVIADOS_FILE, JSON.stringify(enviados, null, 2));
  } catch (error) {
    console.error('Erro ao salvar o arquivo de enviados:', error);
  }
}

// Função 1: Verificação de erros e envio de mensagens embed
async function enviarMensagemEmbed(member, embed, imageLink, tentativa = 1) {
  try {
    embed.setImage(imageLink);

    await member.send({
      embeds: [embed]
    });
    console.log(`✅ Mensagem enviada para ${member.user.tag}`);
    registrarLog('Sucesso', member, 'Embed');
    enviados.push(member.user.id);
    return 'sucesso';
  } catch (err) {
    if (err.code === 50007) {
      console.log(`⚠️ DM bloqueada para ${member.user.tag}`);
      registrarLog('Falha', member, 'Embed', 'DM bloqueada');
      return 'bloqueado';
    } else {
      console.log(`⚠️ Erro ao enviar para ${member.user.tag}: ${err.message}`);
      if (tentativa < 3) {
        await wait(5000);
        return await enviarMensagemEmbed(member, embed, imageLink, tentativa + 1);
      } else {
        console.log(`❌ Não foi possível enviar para ${member.user.tag}`);
        registrarLog('Falha', member, 'Embed', `Erro: ${err.message}`);
        return 'erro';
      }
    }
  }
}

// Função 2: Resetar lista de enviados
async function resetarEnviados(message) {
  if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return message.reply('❌ Apenas administradores podem usar este comando.');
  }

  enviados = [];
  salvarEnviados();
  console.log('✅ Lista de enviados resetada!');
  return message.reply('✅ A lista de enviados foi resetada com sucesso!');
}

// Função 3: Envio de mensagens simples
async function enviarMensagemSimples(member, messageContent, imageLinks, tentativa = 1) {
  try {
    await member.send({
      content: messageContent,
      files: imageLinks
    });
    console.log(`✅ Mensagem simples enviada para ${member.user.tag}`);
    registrarLog('Sucesso', member, 'Mensagem Simples');
    enviados.push(member.user.id);
    return 'sucesso';
  } catch (err) {
    if (err.code === 50007) {
      console.log(`⚠️ DM bloqueada para ${member.user.tag}`);
      registrarLog('Falha', member, 'Mensagem Simples', 'DM bloqueada');
      return 'bloqueado';
    } else {
      console.log(`⚠️ Erro ao enviar para ${member.user.tag}: ${err.message}`);
      if (tentativa < 3) {
        await wait(5000);
        return await enviarMensagemSimples(member, messageContent, imageLinks, tentativa + 1);
      } else {
        console.log(`❌ Não foi possível enviar para ${member.user.tag}`);
        registrarLog('Falha', member, 'Mensagem Simples', `Erro: ${err.message}`);
        return 'erro';
      }
    }
  }
}

// Função 4: Status de envio (resumo)
async function enviarResumoStatus(message, successCount, errorCount, blockedCount) {
  const resumo = `📨 **Resumo do envio**:\n\n✅ ${successCount} enviados com sucesso\n🚫 ${blockedCount} bloqueados\n❌ ${errorCount} com erro`;
  console.log(resumo);
  message.reply(resumo);
}

async function enviarMensagens(guild, embedOrMessage, imageLinkOrLinks, isEmbed, message, cargosFiltro = []) {
  const members = await guild.members.fetch();
  let successCount = 0;
  let errorCount = 0;
  let blockedCount = 0;

  for (const member of members.values()) {
    const temCargoValido = cargosFiltro.length === 0 || member.roles.cache.some(role => cargosFiltro.includes(role.name.toLowerCase()));

    if (!member.user.bot && !enviados.includes(member.user.id) && temCargoValido) {
      let resultado;
      if (isEmbed) {
        resultado = await enviarMensagemEmbed(member, embedOrMessage, imageLinkOrLinks);
      } else {
        resultado = await enviarMensagemSimples(member, embedOrMessage, imageLinkOrLinks);
      }

      if (resultado === 'sucesso') successCount++;
      else if (resultado === 'bloqueado') blockedCount++;
      else if (resultado === 'erro') errorCount++;

      mensagensEnviadasNoMinuto++;

      if (mensagensEnviadasNoMinuto >= LIMITE_MENSAGENS_POR_MINUTO) {
        console.log("Limite de 50 mensagens por minuto atingido. Aguardando reinício...");
        await wait(TEMPO_REINICIO);
        mensagensEnviadasNoMinuto = 0;
      }

      await wait(1200); // Pausa de 1,2 segundos entre as mensagens
    }
  }

  salvarEnviados();
  await enviarResumoStatus(message, successCount, errorCount, blockedCount);
}

client.on('messageCreate', async message => {
  if (message.author.bot) return;

  if (message.content.startsWith('!enviardmembed')) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply('❌ Apenas administradores podem usar este comando.');
    }

    const args = message.content.split(' ').slice(1);
    if (args.length === 0) {
      return message.reply('❌ Informe pelo menos um cargo. Exemplo: `!enviardmembed membro visitante`');
    }
  
    const cargosFiltro = args.map(c => c.toLowerCase());

    const embed = new EmbedBuilder()
      .setTitle('📢 Aviso importante!')
      .setDescription('Mensagem de evento mensal do servidor!')
      .setColor('#0099ff')
      .setFooter({ text: 'Equipe Warlords' });

    const imageLink = 'https://runescape.wiki/images/Pharaoh%27s_Folly_head_banner.jpg?c4cf1';

    await enviarMensagens(message.guild, embed, imageLink, true, message, cargosFiltro);
  }

  if (message.content.startsWith('!enviardmsimples')) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply('❌ Apenas administradores podem usar este comando.');
    }

    const args = message.content.split(' ').slice(1);
    if (args.length === 0) {
      return message.reply('❌ Informe pelo menos um cargo. Exemplo: `!enviardmsimples membro visitante`');
    }
  
    const cargosFiltro = args.map(c => c.toLowerCase());

    const messageContent = '🔔 Aviso importante: Não perca as atualizações do servidor!';
    const imageLinks = [
      'https://runescape.wiki/images/Pharaoh%27s_Folly_head_banner.jpg?c4cf1',
      'https://runescape.wiki/images/RS_Ahead_at_RuneFest_-_Havenhythe%2C_Leagues_and_More_Revealed%21_%2821%29_update_image.jpg?be215'
    ];

    await enviarMensagens(message.guild, messageContent, imageLinks, false, message, cargosFiltro);
  }

  // Comando para resetar a lista de enviados
  if (message.content.startsWith('!resetarenviados')) {
    await resetarEnviados(message);
  }
});

client.once('ready', () => {
  console.log(`🤖 Bot iniciado como ${client.user.tag}`);
  carregarEnviados();
});

client.login(TOKEN);

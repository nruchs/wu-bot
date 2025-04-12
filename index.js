require('dotenv').config();
const TOKEN = process.env.DISCORD_TOKEN;

const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder } = require('discord.js');
const fs = require('fs');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers, GatewayIntentBits.MessageContent]
});

const enviados = new Set();
const LOG_FILE = 'log_mensagens.txt';
const ENVIADOS_FILE = 'usuarios_enviados.txt';

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function registrarLog(status, member, tipo, erro = '') {
  const log = `${new Date().toISOString()} | ${status.toUpperCase()} | ${member.user.tag} (${member.user.id}) | Tipo: ${tipo} ${erro ? '| Erro: ' + erro : ''}\n`;
  fs.appendFileSync(LOG_FILE, log);
}

function carregarEnviados() {
  if (fs.existsSync(ENVIADOS_FILE)) {
    const data = fs.readFileSync(ENVIADOS_FILE, 'utf8');
    data.split('\n').filter(Boolean).forEach(id => enviados.add(id));
  }
}

function salvarEnviados() {
  fs.writeFileSync(ENVIADOS_FILE, Array.from(enviados).join('\n'));
}

async function enviarMensagemEmbed(member, embed, imageLink, tentativa = 1) {
  try {
    embed.setImage(imageLink);

    await member.send({
      embeds: [embed]
    });
    console.log(`✅ Mensagem enviada para ${member.user.tag}`);
    registrarLog('Sucesso', member, 'Embed');
    enviados.add(member.user.id);
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

async function enviarMensagemSimples(member, messageContent, imageLinks, tentativa = 1) {
  try {
    await member.send({
      content: messageContent,
      files: imageLinks
    });
    console.log(`✅ Mensagem simples enviada para ${member.user.tag}`);
    registrarLog('Sucesso', member, 'Mensagem Simples');
    enviados.add(member.user.id);
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

async function enviarMensagens(guild, embedOrMessage, imageLinkOrLinks, isEmbed, message) {
  const members = await guild.members.fetch();

  let successCount = 0;
  let errorCount = 0;
  let blockedCount = 0;

  for (const member of members.values()) {
    if (!member.user.bot && !enviados.has(member.user.id)) {
      let resultado;
      if (isEmbed) {
        resultado = await enviarMensagemEmbed(member, embedOrMessage, imageLinkOrLinks);
      } else {
        resultado = await enviarMensagemSimples(member, embedOrMessage, imageLinkOrLinks);
      }

      if (resultado === 'sucesso') successCount++;
      else if (resultado === 'bloqueado') blockedCount++;
      else if (resultado === 'erro') errorCount++;

      await wait(3000); // Espera 3 segundos entre envios
    }
  }

  salvarEnviados();

  const resumo = `📨 **Resumo do envio**:\n✅ ${successCount} enviados com sucesso\n🚫 ${blockedCount} bloqueados\n❌ ${errorCount} com erro`;
  console.log(resumo);
  message.reply(resumo);
}

client.on('messageCreate', async message => {
  if (message.author.bot) return;

  if (message.content.startsWith('!enviardmembed')) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply('❌ Apenas administradores podem usar este comando.');
    }

    const embed = new EmbedBuilder()
      .setTitle('📢 Aviso importante!')
      .setDescription('Mensagem de evento mensal do servidor!')
      .setColor('#0099ff')
      .setFooter({ text: 'Equipe Warlords' });

    const imageLink = 'https://runescape.wiki/images/Pharaoh%27s_Folly_head_banner.jpg?c4cf1';

    await enviarMensagens(message.guild, embed, imageLink, true, message);
  }

  if (message.content.startsWith('!enviardmsimples')) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply('❌ Apenas administradores podem usar este comando.');
    }

    const messageContent = '🔔 Aviso importante: Não perca as atualizações do servidor!';
    const imageLinks = [
      'https://runescape.wiki/images/Pharaoh%27s_Folly_head_banner.jpg?c4cf1',
      'https://runescape.wiki/images/RS_Ahead_at_RuneFest_-_Havenhythe%2C_Leagues_and_More_Revealed%21_%2821%29_update_image.jpg?be215'
    ];

    await enviarMensagens(message.guild, messageContent, imageLinks, false, message);
  }
});

client.once('ready', () => {
  console.log(`🤖 Bot iniciado como ${client.user.tag}`);
  carregarEnviados();
});

client.login(TOKEN);

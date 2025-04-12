const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: ['CHANNEL']
});

const TOKEN = 'MTE5NjQ5NTA4NjY5NjAyNjEyMg.GujyBV.p5CciBWqGXano-qZXkyFXEFbFBMtwRcXKetVHQ'; // Troque pelo seu token real, com segurança

const arquivoEnviados = './jaEnviados.json';
let enviados = new Set();

if (fs.existsSync(arquivoEnviados)) {
  const dados = fs.readFileSync(arquivoEnviados, 'utf-8');
  enviados = new Set(JSON.parse(dados));
}

function salvarEnviados() {
  fs.writeFileSync(arquivoEnviados, JSON.stringify([...enviados], null, 2));
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function registrarLog(status, member, messageType, additionalInfo = '') {
  const logMessage = `${new Date().toISOString()} - [${status}] - Membro: ${member.user.tag} (ID: ${member.user.id}) - Tipo de mensagem: ${messageType} ${additionalInfo}\n`;
  fs.appendFileSync(path.join(__dirname, 'logs.txt'), logMessage);
}

async function enviarMensagemEmbed(member, embed, imageLink, tentativa = 1) {
  try {
    await member.send({
      embeds: [embed],
      files: [imageLink]
    });
    console.log(`✅ Mensagem enviada para ${member.user.tag}`);
    registrarLog('Sucesso', member, 'Embed');
    enviados.add(member.user.id);
  } catch (err) {
    if (err.code === 50007) {
      console.log(`⚠️ DM bloqueada para ${member.user.tag}.`);
      registrarLog('Falha', member, 'Embed', 'DM bloqueada');
    } else {
      console.log(`⚠️ Erro ao enviar para ${member.user.tag}: ${err.message}`);
      if (tentativa < 3) {
        await wait(5000);
        await enviarMensagemEmbed(member, embed, imageLink, tentativa + 1);
      } else {
        console.log(`❌ Não foi possível enviar para ${member.user.tag}`);
        registrarLog('Falha', member, 'Embed', `Erro: ${err.message}`);
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
  } catch (err) {
    if (err.code === 50007) {
      console.log(`⚠️ DM bloqueada para ${member.user.tag}.`);
      registrarLog('Falha', member, 'Mensagem Simples', 'DM bloqueada');
    } else {
      console.log(`⚠️ Erro ao enviar para ${member.user.tag}: ${err.message}`);
      if (tentativa < 3) {
        await wait(5000);
        await enviarMensagemSimples(member, messageContent, imageLinks, tentativa + 1);
      } else {
        console.log(`❌ Não foi possível enviar para ${member.user.tag}`);
        registrarLog('Falha', member, 'Mensagem Simples', `Erro: ${err.message}`);
      }
    }
  }
}

async function enviarMensagensComEmbed(guild, embed, imageLink) {
  const members = await guild.members.fetch();
  for (const member of members.values()) {
    if (!member.user.bot && !enviados.has(member.user.id)) {
      await enviarMensagemEmbed(member, embed, imageLink);
      await wait(3000);
    }
  }
  salvarEnviados();
}

async function enviarMensagensSimples(guild, messageContent, imageLinks) {
  const members = await guild.members.fetch();
  for (const member of members.values()) {
    if (!member.user.bot && !enviados.has(member.user.id)) {
      await enviarMensagemSimples(member, messageContent, imageLinks);
      await wait(3000);
    }
  }
  salvarEnviados();
}

client.once('ready', () => {
  console.log(`✅ Bot online como ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
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

    await enviarMensagensComEmbed(message.guild, embed, imageLink);
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

    await enviarMensagensSimples(message.guild, messageContent, imageLinks);
  }
});

client.login(TOKEN);
